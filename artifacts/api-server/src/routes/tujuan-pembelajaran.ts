import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
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

  const [existing] = await db
    .select({ id: tujuanPembelajaranTable.id })
    .from(tujuanPembelajaranTable)
    .where(
      and(
        eq(tujuanPembelajaranTable.subjectId, parsed.data.subjectId),
        eq(tujuanPembelajaranTable.calendarId, parsed.data.calendarId),
        eq(tujuanPembelajaranTable.lingkupMateri, parsed.data.lingkupMateri),
        eq(tujuanPembelajaranTable.tpNumber, parsed.data.tpNumber),
      ),
    );
  if (existing) {
    res.status(409).json({
      error: `TP nomor ${parsed.data.tpNumber} pada Lingkup Materi ${parsed.data.lingkupMateri} sudah ada`,
    });
    return;
  }

  const [row] = await db
    .insert(tujuanPembelajaranTable)
    .values({ ...parsed.data, teacherId })
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

  if (!(await isOwnSubject(subjectId, teacherId))) {
    res.status(404).json({ error: "Mata pelajaran tidak ditemukan" });
    return;
  }

  const existing = await db
    .select({ lingkupMateri: tujuanPembelajaranTable.lingkupMateri, tpNumber: tujuanPembelajaranTable.tpNumber })
    .from(tujuanPembelajaranTable)
    .where(
      and(
        eq(tujuanPembelajaranTable.subjectId, subjectId),
        eq(tujuanPembelajaranTable.calendarId, calendarId),
      ),
    );
  const existingKeys = new Set(existing.map((e) => `${e.lingkupMateri}:${e.tpNumber}`));

  const seen = new Set<string>();
  const toInsert = items.filter((item) => {
    const key = `${item.lingkupMateri}:${item.tpNumber}`;
    if (existingKeys.has(key) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

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
});

export default router;
