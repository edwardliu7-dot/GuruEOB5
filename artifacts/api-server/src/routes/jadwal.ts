import { Router, type IRouter } from "express";
import { and, eq, inArray } from "drizzle-orm";
import { db, schedulesTable, subjectsTable, neonDb, gurusTable } from "@workspace/db";
import { extractJadwalFromPDF } from "../lib/gemini";
import { createRequire } from "node:module";
const _require = createRequire(import.meta.url);
const pdfParse: (buf: Buffer) => Promise<{ text: string }> = _require("pdf-parse");
import {
  ListJadwalQueryParams,
  ListJadwalResponse,
  CreateJadwalBody,
  CreateJadwalResponse,
  UpdateJadwalParams,
  UpdateJadwalBody,
  UpdateJadwalResponse,
  DeleteJadwalParams,
  DeleteJadwalResponse,
} from "@workspace/api-zod";
import { requireAuth, getCurrentGuru, isSchoolAdmin } from "../lib/auth";

const router: IRouter = Router();

router.get("/jadwal", requireAuth, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru) { res.status(401).json({ error: "Unauthorized" }); return; }

  const params = ListJadwalQueryParams.safeParse(req.query);
  const filterTeacherId =
    params.success && params.data.teacherId && isSchoolAdmin(guru)
      ? params.data.teacherId
      : guru.id;

  const rows = await db
    .select()
    .from(schedulesTable)
    .where(eq(schedulesTable.teacherId, filterTeacherId));

  if (rows.length === 0) {
    res.json(ListJadwalResponse.parse([]));
    return;
  }

  const subjectIds = [...new Set(rows.map((r) => r.subjectId))];
  const subjects = await db
    .select({ id: subjectsTable.id, name: subjectsTable.name })
    .from(subjectsTable)
    .where(inArray(subjectsTable.id, subjectIds));
  const subjectNameById = new Map(subjects.map((s) => [s.id, s.name]));

  const [guruRow] = await neonDb
    .select({ id: gurusTable.id, name: gurusTable.name })
    .from(gurusTable)
    .where(eq(gurusTable.id, filterTeacherId));

  const entries = rows.map((r) => ({
    id: r.id,
    teacherId: r.teacherId,
    teacherName: guruRow?.name ?? r.teacherId,
    subjectId: r.subjectId,
    subjectName: subjectNameById.get(r.subjectId) ?? r.subjectId,
    kelas: r.kelas,
    hari: r.hari,
    jamMulai: r.jamMulai,
    jamSelesai: r.jamSelesai,
    createdAt: r.createdAt,
  }));

  res.json(ListJadwalResponse.parse(entries));
});

router.post("/jadwal", requireAuth, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru) { res.status(401).json({ error: "Unauthorized" }); return; }

  const parsed = CreateJadwalBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [row] = await db
    .insert(schedulesTable)
    .values({
      teacherId: guru.id,
      subjectId: parsed.data.subjectId,
      kelas: parsed.data.kelas,
      hari: parsed.data.hari as any,
      jamMulai: parsed.data.jamMulai,
      jamSelesai: parsed.data.jamSelesai,
      school: guru.school ?? null,
    })
    .returning();

  const [subject] = await db
    .select({ id: subjectsTable.id, name: subjectsTable.name })
    .from(subjectsTable)
    .where(eq(subjectsTable.id, row.subjectId));

  res.status(201).json(
    CreateJadwalResponse.parse({
      ...row,
      teacherName: guru.name,
      subjectName: subject?.name ?? row.subjectId,
    }),
  );
});

router.patch("/jadwal/:id", requireAuth, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru) { res.status(401).json({ error: "Unauthorized" }); return; }

  const params = UpdateJadwalParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const body = UpdateJadwalBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  const [row] = await db
    .update(schedulesTable)
    .set({ ...body.data, hari: body.data.hari as any })
    .where(
      and(
        eq(schedulesTable.id, params.data.id),
        eq(schedulesTable.teacherId, guru.id),
      ),
    )
    .returning();

  if (!row) { res.status(404).json({ error: "Jadwal tidak ditemukan" }); return; }

  const [subject] = await db
    .select({ id: subjectsTable.id, name: subjectsTable.name })
    .from(subjectsTable)
    .where(eq(subjectsTable.id, row.subjectId));

  res.json(
    UpdateJadwalResponse.parse({
      ...row,
      teacherName: guru.name,
      subjectName: subject?.name ?? row.subjectId,
    }),
  );
});

router.delete("/jadwal/:id", requireAuth, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru) { res.status(401).json({ error: "Unauthorized" }); return; }

  const params = DeleteJadwalParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [row] = await db
    .delete(schedulesTable)
    .where(
      and(
        eq(schedulesTable.id, params.data.id),
        eq(schedulesTable.teacherId, guru.id),
      ),
    )
    .returning();

  if (!row) { res.status(404).json({ error: "Jadwal tidak ditemukan" }); return; }

  res.json(DeleteJadwalResponse.parse({ success: true }));
});

// ─── POST /jadwal/import-preview ─────────────────────────────────────────────
// Accepts a base64-encoded PDF, extracts the schedule with AI, then tries to
// match each mapel to an existing subject in the school's DB.
// Returns a preview list for the user to review before saving.
router.post("/jadwal/import-preview", requireAuth, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { fileBase64 } = req.body as { fileBase64?: string };
  if (!fileBase64) { res.status(400).json({ error: "fileBase64 wajib diisi" }); return; }

  // Extract text from PDF
  let text: string;
  try {
    const buffer = Buffer.from(fileBase64, "base64");
    const result = await pdfParse(buffer);
    text = result.text;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(422).json({ error: `Gagal membaca PDF: ${msg}` });
    return;
  }

  if (!text?.trim()) {
    res.status(422).json({ error: "PDF tidak mengandung teks yang dapat dibaca (mungkin berupa gambar scan)" });
    return;
  }

  // AI: parse schedule from text
  let extracted: Awaited<ReturnType<typeof extractJadwalFromPDF>>;
  try {
    extracted = await extractJadwalFromPDF(text);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(502).json({ error: `Gagal mengekstrak jadwal dengan AI: ${msg}` });
    return;
  }

  // Load all subjects in this school to match by name
  const allSubjects = await db
    .select({ id: subjectsTable.id, name: subjectsTable.name, teacherId: subjectsTable.teacherId })
    .from(subjectsTable)
    .where(eq(subjectsTable.school, guru.school ?? ""));

  // Fuzzy match: normalize names for comparison
  function normalize(s: string) {
    return s.toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  const subjectMap = new Map(allSubjects.map((s) => [normalize(s.name), s]));

  // Build teacher name map
  const teacherIds = [...new Set(allSubjects.map((s) => s.teacherId))];
  const teachers = teacherIds.length
    ? await neonDb
        .select({ id: gurusTable.id, name: gurusTable.name })
        .from(gurusTable)
        .where(inArray(gurusTable.id, teacherIds))
    : [];
  const teacherNameById = new Map(teachers.map((t) => [t.id, t.name]));

  // Map each extracted entry to a subject
  const preview = extracted.map((entry) => {
    const key = normalize(entry.mapel);
    // Try exact match first, then prefix match
    let subject = subjectMap.get(key);
    if (!subject) {
      for (const [k, v] of subjectMap) {
        if (k.startsWith(key) || key.startsWith(k)) { subject = v; break; }
      }
    }
    return {
      kelas: entry.kelas,
      hari: entry.hari,
      jamMulai: entry.jamMulai,
      jamSelesai: entry.jamSelesai,
      mapelRaw: entry.mapel,
      subjectId: subject?.id ?? null,
      subjectName: subject?.name ?? null,
      teacherName: subject ? (teacherNameById.get(subject.teacherId) ?? null) : null,
      matched: !!subject,
    };
  });

  res.json({ preview });
});

// ─── POST /jadwal/bulk ────────────────────────────────────────────────────────
// Saves confirmed jadwal entries in bulk. Each entry must have a subjectId.
// teacherId is resolved from the subject row to ensure correct ownership.
router.post("/jadwal/bulk", requireAuth, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru) { res.status(401).json({ error: "Unauthorized" }); return; }
  if (!isSchoolAdmin(guru)) { res.status(403).json({ error: "Hanya admin sekolah" }); return; }

  const { entries } = req.body as {
    entries?: { subjectId: string; kelas: string; hari: string; jamMulai: string; jamSelesai: string }[];
  };
  if (!Array.isArray(entries) || entries.length === 0) {
    res.status(400).json({ error: "entries wajib diisi" });
    return;
  }

  // Resolve teacherIds from subject rows
  const subjectIds = [...new Set(entries.map((e) => e.subjectId))];
  const subjects = await db
    .select({ id: subjectsTable.id, teacherId: subjectsTable.teacherId })
    .from(subjectsTable)
    .where(inArray(subjectsTable.id, subjectIds));
  const teacherBySubjectId = new Map(subjects.map((s) => [s.id, s.teacherId]));

  const rows = entries
    .map((e) => {
      const teacherId = teacherBySubjectId.get(e.subjectId);
      if (!teacherId) return null;
      return {
        teacherId,
        subjectId: e.subjectId,
        kelas: e.kelas,
        hari: e.hari as any,
        jamMulai: e.jamMulai,
        jamSelesai: e.jamSelesai,
        school: guru.school ?? null,
      };
    })
    .filter(Boolean) as NonNullable<ReturnType<typeof entries.map>[number]>[];

  if (rows.length === 0) {
    res.status(400).json({ error: "Tidak ada entry valid" });
    return;
  }

  await db.insert(schedulesTable).values(rows);
  res.json({ inserted: rows.length });
});

export default router;
