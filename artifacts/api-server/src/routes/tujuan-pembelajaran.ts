import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import mammoth from "mammoth";
import { db, subjectsTable, tujuanPembelajaranTable } from "@workspace/db";
import {
  ListTujuanPembelajaranResponse,
  CreateTujuanPembelajaranBody,
  CreateTujuanPembelajaranResponse,
  UpdateTujuanPembelajaranParams,
  UpdateTujuanPembelajaranBody,
  UpdateTujuanPembelajaranResponse,
  DeleteTujuanPembelajaranParams,
  DeleteTujuanPembelajaranResponse,
  AnalyzeTPImportBody,
  AnalyzeTPImportResponse,
  BulkCreateTujuanPembelajaranBody,
  BulkCreateTujuanPembelajaranResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { mapRowsToTP, mapTextToTP, mapFileToTP } from "../lib/gemini";

const router: IRouter = Router();

// MIME types Gemini can read directly as inline file data.
const GEMINI_INLINE_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const DOCX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

async function isOwnSubject(subjectId: string, teacherId: string): Promise<boolean> {
  const [subject] = await db
    .select({ id: subjectsTable.id })
    .from(subjectsTable)
    .where(and(eq(subjectsTable.id, subjectId), eq(subjectsTable.teacherId, teacherId)));
  return !!subject;
}

// tpNumber is a continuous sequence across the whole subject+semester (never
// reset per Lingkup Materi): if Lingkup Materi 1 has TP 1-2, a TP added to
// Lingkup Materi 2 continues with TP 3, and so on. Always assigned server-side.
async function nextTpNumber(subjectId: string, calendarId: string): Promise<number> {
  const [last] = await db
    .select({ tpNumber: tujuanPembelajaranTable.tpNumber })
    .from(tujuanPembelajaranTable)
    .where(
      and(
        eq(tujuanPembelajaranTable.subjectId, subjectId),
        eq(tujuanPembelajaranTable.calendarId, calendarId),
      ),
    )
    .orderBy(desc(tujuanPembelajaranTable.tpNumber))
    .limit(1);
  return (last?.tpNumber ?? 0) + 1;
}

function normalizeDescription(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

router.get("/tp", requireAuth, async (req, res): Promise<void> => {
  const teacherId = req.session.teacherId as string;
  const subjectId =
    typeof req.query["subjectId"] === "string" ? req.query["subjectId"] : undefined;
  const calendarId =
    typeof req.query["calendarId"] === "string" ? req.query["calendarId"] : undefined;

  if (!subjectId || !(await isOwnSubject(subjectId, teacherId))) {
    res.json(ListTujuanPembelajaranResponse.parse([]));
    return;
  }

  const rows = await db
    .select()
    .from(tujuanPembelajaranTable)
    .where(
      and(
        eq(tujuanPembelajaranTable.subjectId, subjectId),
        calendarId ? eq(tujuanPembelajaranTable.calendarId, calendarId) : undefined,
      ),
    );
  res.json(ListTujuanPembelajaranResponse.parse(rows));
});

router.post("/tp", requireAuth, async (req, res): Promise<void> => {
  const teacherId = req.session.teacherId as string;
  const parsed = CreateTujuanPembelajaranBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (!(await isOwnSubject(parsed.data.subjectId, teacherId))) {
    res.status(404).json({ error: "Mata pelajaran tidak ditemukan" });
    return;
  }

  const existingForSubject = await db
    .select({ description: tujuanPembelajaranTable.description })
    .from(tujuanPembelajaranTable)
    .where(
      and(
        eq(tujuanPembelajaranTable.subjectId, parsed.data.subjectId),
        eq(tujuanPembelajaranTable.calendarId, parsed.data.calendarId),
        eq(tujuanPembelajaranTable.lingkupMateri, parsed.data.lingkupMateri),
      ),
    );
  const normalizedNew = normalizeDescription(parsed.data.description);
  if (existingForSubject.some((e) => normalizeDescription(e.description) === normalizedNew)) {
    res.status(409).json({
      error: `Tujuan Pembelajaran ini sudah ada di Lingkup Materi ${parsed.data.lingkupMateri}`,
    });
    return;
  }

  const tpNumber = await nextTpNumber(parsed.data.subjectId, parsed.data.calendarId);
  const [row] = await db
    .insert(tujuanPembelajaranTable)
    .values({ ...parsed.data, tpNumber, teacherId })
    .returning();
  res.status(201).json(CreateTujuanPembelajaranResponse.parse(row));
});

router.put("/tp/:id", requireAuth, async (req, res): Promise<void> => {
  const teacherId = req.session.teacherId as string;
  const params = UpdateTujuanPembelajaranParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateTujuanPembelajaranBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(tujuanPembelajaranTable)
    .where(eq(tujuanPembelajaranTable.id, params.data.id));
  if (!existing || existing.teacherId !== teacherId) {
    res.status(404).json({ error: "TP tidak ditemukan" });
    return;
  }
  if (!(await isOwnSubject(parsed.data.subjectId, teacherId))) {
    res.status(404).json({ error: "Mata pelajaran tidak ditemukan" });
    return;
  }

  const [row] = await db
    .update(tujuanPembelajaranTable)
    .set(parsed.data)
    .where(eq(tujuanPembelajaranTable.id, params.data.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "TP tidak ditemukan" });
    return;
  }
  res.json(UpdateTujuanPembelajaranResponse.parse(row));
});

router.delete("/tp/:id", requireAuth, async (req, res): Promise<void> => {
  const teacherId = req.session.teacherId as string;
  const params = DeleteTujuanPembelajaranParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .delete(tujuanPembelajaranTable)
    .where(
      and(
        eq(tujuanPembelajaranTable.id, params.data.id),
        eq(tujuanPembelajaranTable.teacherId, teacherId),
      ),
    )
    .returning();
  if (!row) {
    res.status(404).json({ error: "TP tidak ditemukan" });
    return;
  }
  res.json(DeleteTujuanPembelajaranResponse.parse({ success: true }));
});

router.post("/tp/import/analyze", requireAuth, async (req, res): Promise<void> => {
  const parsed = AnalyzeTPImportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { rows, fileData, fileName, fileType } = parsed.data;

  if (!rows && !fileData) {
    res.status(400).json({ error: "Sertakan data spreadsheet (rows) atau berkas (fileData)" });
    return;
  }

  try {
    let items;
    if (rows) {
      items = await mapRowsToTP(rows);
    } else {
      const mimeType = fileType || guessMimeFromName(fileName);
      const buffer = Buffer.from(fileData as string, "base64");

      if (mimeType === DOCX_MIME_TYPE) {
        const { value: text } = await mammoth.extractRawText({ buffer });
        items = await mapTextToTP(text);
      } else if (mimeType && GEMINI_INLINE_MIME_TYPES.has(mimeType)) {
        items = await mapFileToTP(fileData as string, mimeType);
      } else {
        // Fallback: treat as plain text (covers .txt and unrecognized types).
        items = await mapTextToTP(buffer.toString("utf-8"));
      }
    }
    res.json(AnalyzeTPImportResponse.parse({ items }));
  } catch (err) {
    res.status(422).json({
      error: err instanceof Error ? err.message : "Gagal menganalisis berkas dengan AI",
    });
  }
});

function guessMimeFromName(fileName?: string): string | undefined {
  const ext = fileName?.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf":
      return "application/pdf";
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "docx":
      return DOCX_MIME_TYPE;
    default:
      return undefined;
  }
}

router.post("/tp/bulk", requireAuth, async (req, res): Promise<void> => {
  const teacherId = req.session.teacherId as string;
  const parsed = BulkCreateTujuanPembelajaranBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { subjectId, calendarId, items } = parsed.data;

  try {
    if (!(await isOwnSubject(subjectId, teacherId))) {
      res.status(404).json({ error: "Mata pelajaran tidak ditemukan" });
      return;
    }

    const existing = await db
      .select({
        lingkupMateri: tujuanPembelajaranTable.lingkupMateri,
        description: tujuanPembelajaranTable.description,
        tpNumber: tujuanPembelajaranTable.tpNumber,
      })
      .from(tujuanPembelajaranTable)
      .where(
        and(
          eq(tujuanPembelajaranTable.subjectId, subjectId),
          eq(tujuanPembelajaranTable.calendarId, calendarId),
        ),
      );
    // Duplicates are detected by content (same Lingkup Materi + description),
    // not by tpNumber -- tpNumber is always (re)assigned by the server as a
    // continuous sequence across the whole subject+semester.
    const existingKeys = new Set(
      existing.map((e) => `${e.lingkupMateri}:${normalizeDescription(e.description)}`),
    );
    let nextNumber = (existing.reduce((max, e) => Math.max(max, e.tpNumber), 0)) + 1;

    // Preserve the AI's Lingkup Materi ordering (items already come grouped/sorted
    // by lingkupMateri then tpNumber from the extraction step) so the continuous
    // sequence reads naturally: LM1 TP1-2, LM2 TP3-4, etc.
    const ordered = [...items].sort((a, b) =>
      a.lingkupMateri !== b.lingkupMateri ? a.lingkupMateri - b.lingkupMateri : a.tpNumber - b.tpNumber,
    );

    const seen = new Set<string>();
    const toInsert: { lingkupMateri: number; description: string; tpNumber: number }[] = [];
    for (const item of ordered) {
      const key = `${item.lingkupMateri}:${normalizeDescription(item.description)}`;
      if (existingKeys.has(key) || seen.has(key)) continue;
      seen.add(key);
      toInsert.push({ lingkupMateri: item.lingkupMateri, description: item.description, tpNumber: nextNumber });
      nextNumber += 1;
    }

    let count = 0;
    if (toInsert.length > 0) {
      const inserted = await db
        .insert(tujuanPembelajaranTable)
        .values(toInsert.map((item) => ({ ...item, subjectId, calendarId, teacherId })))
        .returning({ id: tujuanPembelajaranTable.id });
      count = inserted.length;
    }

    res.json(
      BulkCreateTujuanPembelajaranResponse.parse({ count, skipped: items.length - count }),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal menyimpan ke database";
    res.status(500).json({ error: message });
  }
});

export default router;
