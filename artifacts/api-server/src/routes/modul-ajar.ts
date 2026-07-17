import { Router, type IRouter } from "express";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db, aiModulAjarTable, subjectsTable } from "@workspace/db";
import {
  ListModulAjarResponse,
  GenerateModulAjarBody,
  GenerateModulAjarResponse,
  GetModulAjarParams,
  GetModulAjarResponse,
  DeleteModulAjarParams,
  DeleteModulAjarResponse,
} from "@workspace/api-zod";
import { requireAuth, getCurrentGuru } from "../lib/auth";
import { generateModulAjar } from "../lib/gemini";
import { buildModulAjarDocx } from "../lib/docx-modul-ajar";

const router: IRouter = Router();

// Metadata-only column set -- excludes the full generated content so list
// responses stay small; the detail/docx endpoints fetch the full row.
const modulAjarMetadataColumns = {
  id: aiModulAjarTable.id,
  subjectId: aiModulAjarTable.subjectId,
  materi: aiModulAjarTable.materi,
  alokasiWaktu: aiModulAjarTable.alokasiWaktu,
  createdAt: aiModulAjarTable.createdAt,
};

async function getOwnSubject(subjectId: string, teacherId: string) {
  const [subject] = await db
    .select()
    .from(subjectsTable)
    .where(and(eq(subjectsTable.id, subjectId), eq(subjectsTable.teacherId, teacherId)));
  return subject;
}

router.get("/modul-ajar", requireAuth, async (req, res): Promise<void> => {
  const teacherId = req.session.teacherId as string;
  const subjectId =
    typeof req.query["subjectId"] === "string" ? req.query["subjectId"] : undefined;
  const rows = await db
    .select(modulAjarMetadataColumns)
    .from(aiModulAjarTable)
    .where(
      and(
        eq(aiModulAjarTable.teacherId, teacherId),
        subjectId ? eq(aiModulAjarTable.subjectId, subjectId) : undefined,
      ),
    )
    .orderBy(desc(aiModulAjarTable.createdAt));
  res.json(ListModulAjarResponse.parse(rows));
});

router.post("/modul-ajar/generate", requireAuth, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = GenerateModulAjarBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const subject = await getOwnSubject(parsed.data.subjectId, guru.id);
  if (!subject) {
    res.status(404).json({ error: "Mata pelajaran tidak ditemukan" });
    return;
  }

  try {
    const content = await generateModulAjar({
      mataPelajaran: subject.name,
      materi: parsed.data.materi,
      alokasiWaktu: parsed.data.alokasiWaktu,
      kelas: parsed.data.kelas ?? "-",
      namaPenyusun: guru.name,
      instansi: guru.school ?? "-",
    });

    const [row] = await db
      .insert(aiModulAjarTable)
      .values({
        teacherId: guru.id,
        subjectId: parsed.data.subjectId,
        materi: parsed.data.materi,
        alokasiWaktu: parsed.data.alokasiWaktu,
        content,
      })
      .returning();

    // Storage guard: keep only the 15 most recent modul ajar per teacher.
    // The oldest entries are silently pruned after each successful generation.
    const MAX_PER_TEACHER = 15;
    try {
      const allIds = await db
        .select({ id: aiModulAjarTable.id })
        .from(aiModulAjarTable)
        .where(eq(aiModulAjarTable.teacherId, guru.id))
        .orderBy(desc(aiModulAjarTable.createdAt));
      if (allIds.length > MAX_PER_TEACHER) {
        const toDelete = allIds.slice(MAX_PER_TEACHER).map((r) => r.id);
        await db
          .delete(aiModulAjarTable)
          .where(
            and(
              eq(aiModulAjarTable.teacherId, guru.id),
              inArray(aiModulAjarTable.id, toDelete),
            ),
          );
      }
    } catch (cleanupErr) {
      // Non-fatal — log but do not fail the request
      req.log.warn({ err: cleanupErr }, "Modul ajar cleanup failed");
    }

    res.status(201).json(GenerateModulAjarResponse.parse(row));
  } catch (err: any) {
    req.log.error({ err, errMsg: err?.message, errStatus: err?.status }, "Modul ajar generation failed");
    res.status(502).json({
      error: `Gagal membuat modul ajar: ${err?.message ?? "Coba lagi dalam beberapa saat."}`,
    });
  }
});

router.get("/modul-ajar/:id", requireAuth, async (req, res): Promise<void> => {
  const teacherId = req.session.teacherId as string;
  const params = GetModulAjarParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select()
    .from(aiModulAjarTable)
    .where(and(eq(aiModulAjarTable.id, params.data.id), eq(aiModulAjarTable.teacherId, teacherId)));

  if (!row) {
    res.status(404).json({ error: "Modul ajar tidak ditemukan" });
    return;
  }

  res.json(GetModulAjarResponse.parse(row));
});

router.delete("/modul-ajar/:id", requireAuth, async (req, res): Promise<void> => {
  const teacherId = req.session.teacherId as string;
  const params = DeleteModulAjarParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .delete(aiModulAjarTable)
    .where(and(eq(aiModulAjarTable.id, params.data.id), eq(aiModulAjarTable.teacherId, teacherId)))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Modul ajar tidak ditemukan" });
    return;
  }

  res.json(DeleteModulAjarResponse.parse({ success: true }));
});

router.get("/modul-ajar/:id/docx", requireAuth, async (req, res): Promise<void> => {
  const teacherId = req.session.teacherId as string;
  const params = GetModulAjarParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select({
      content: aiModulAjarTable.content,
      materi: aiModulAjarTable.materi,
      alokasiWaktu: aiModulAjarTable.alokasiWaktu,
      subjectName: subjectsTable.name,
    })
    .from(aiModulAjarTable)
    .innerJoin(subjectsTable, eq(subjectsTable.id, aiModulAjarTable.subjectId))
    .where(and(eq(aiModulAjarTable.id, params.data.id), eq(aiModulAjarTable.teacherId, teacherId)));

  if (!row) {
    res.status(404).json({ error: "Modul ajar tidak ditemukan" });
    return;
  }

  try {
    const buffer = await buildModulAjarDocx(row.content as never, {
      mataPelajaran: row.subjectName,
      alokasiWaktu: row.alokasiWaktu,
    });
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    const safeName = `Modul_Ajar_${row.subjectName}_${row.materi}`.replace(
      /[^a-zA-Z0-9._-]/g,
      "_",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${safeName}.docx"`);
    res.send(buffer);
  } catch (err) {
    req.log.error({ err }, "Modul ajar docx generation failed");
    res.status(500).json({ error: "Gagal membuat berkas docx" });
  }
});

export default router;
