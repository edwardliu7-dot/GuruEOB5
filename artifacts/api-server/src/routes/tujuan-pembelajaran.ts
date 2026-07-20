import { Router, type IRouter } from "express";
import { and, asc, desc, eq, gt, gte, sql } from "drizzle-orm";
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

// MIME types the AI can process directly as file data (images via vision, PDFs via text extraction).
const AI_INLINE_MIME_TYPES = new Set([
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

// Shift all TPs in a subject+calendar with tpNumber >= shiftFrom up by shiftBy.
// We use a two-step UPDATE with a large temporary offset (100000) to avoid
// transient unique-constraint violations: PostgreSQL checks (subject_id,
// calendar_id, tp_number) per-row, so directly incrementing a contiguous
// range causes TP N+1 to collide with the existing TP N+1 before that row
// is updated. Jumping to 100000+ first puts all affected rows safely out of
// range of the unaffected rows, then the second UPDATE brings them to their
// final positions with no conflicts.
async function shiftTpNumbers(
  subjectId: string,
  calendarId: string,
  shiftFrom: number,
  shiftBy: number,
): Promise<void> {
  if (shiftBy <= 0) return;
  const OFFSET = 100_000;
  const where = and(
    eq(tujuanPembelajaranTable.subjectId, subjectId),
    eq(tujuanPembelajaranTable.calendarId, calendarId),
    gte(tujuanPembelajaranTable.tpNumber, shiftFrom),
  );
  // Step 1: jump to a safe range far above any real tp_number
  await db
    .update(tujuanPembelajaranTable)
    .set({ tpNumber: sql`${tujuanPembelajaranTable.tpNumber} + ${OFFSET}` })
    .where(where);
  // Step 2: land at the intended final value
  await db
    .update(tujuanPembelajaranTable)
    .set({ tpNumber: sql`${tujuanPembelajaranTable.tpNumber} - ${OFFSET} + ${shiftBy}` })
    .where(
      and(
        eq(tujuanPembelajaranTable.subjectId, subjectId),
        eq(tujuanPembelajaranTable.calendarId, calendarId),
        gte(tujuanPembelajaranTable.tpNumber, shiftFrom + OFFSET),
      ),
    );
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
    )
    .orderBy(asc(tujuanPembelajaranTable.tpNumber));
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

  const { subjectId, calendarId, lingkupMateri } = parsed.data;

  // Find the last TP number in this LM — new TP slots in right after it.
  const [lastInLm] = await db
    .select({ tpNumber: tujuanPembelajaranTable.tpNumber })
    .from(tujuanPembelajaranTable)
    .where(
      and(
        eq(tujuanPembelajaranTable.subjectId, subjectId),
        eq(tujuanPembelajaranTable.calendarId, calendarId),
        eq(tujuanPembelajaranTable.lingkupMateri, lingkupMateri),
      ),
    )
    .orderBy(desc(tujuanPembelajaranTable.tpNumber))
    .limit(1);

  const insertAt = (lastInLm?.tpNumber ?? 0) + 1;

  // Push every TP that comes after this insertion point up by 1 so the
  // global sequence stays gap-free (LM 2's TP 8 becomes TP 9, etc.).
  await shiftTpNumbers(subjectId, calendarId, insertAt, 1);

  const [row] = await db
    .insert(tujuanPembelajaranTable)
    .values({ ...parsed.data, tpNumber: insertAt, teacherId })
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

  // If lingkupMateri didn't change, just update description in-place (tpNumber stays).
  if (parsed.data.lingkupMateri === existing.lingkupMateri) {
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
    return;
  }

  // lingkupMateri changed — we need to move this TP to the correct position
  // inside the new LM, keeping the global tpNumber sequence gap-free.
  //
  // Algorithm:
  //  1. Park the TP at a large temp number (999 999) to vacate its slot.
  //  2. Compact the gap: shift every TP after the old position down by 1.
  //  3. Find the last tpNumber in the target LM (post-compaction).
  //  4. Open a slot right after it: shiftTpNumbers from insertAt by 1.
  //  5. Land the TP at insertAt with the new lingkupMateri.
  const { subjectId, calendarId, lingkupMateri: newLm, description } = parsed.data;
  const TEMP_TP = 999_999;

  // Step 1: park
  await db
    .update(tujuanPembelajaranTable)
    .set({ tpNumber: TEMP_TP })
    .where(eq(tujuanPembelajaranTable.id, params.data.id));

  // Step 2: compact — decrement all TPs that came after the old slot.
  // Single-pass decrement is safe here because we are filling an existing gap
  // (the parked TP at TEMP_TP is far above any real number, so no collision).
  await db
    .update(tujuanPembelajaranTable)
    .set({ tpNumber: sql`${tujuanPembelajaranTable.tpNumber} - 1` })
    .where(
      and(
        eq(tujuanPembelajaranTable.subjectId, subjectId),
        eq(tujuanPembelajaranTable.calendarId, calendarId),
        gt(tujuanPembelajaranTable.tpNumber, existing.tpNumber),
      ),
    );

  // Step 3: where does the target LM end now (after compaction)?
  // Our parked TP still carries the OLD lingkupMateri, so the query for
  // newLm naturally excludes it.
  const [lastInNewLm] = await db
    .select({ tpNumber: tujuanPembelajaranTable.tpNumber })
    .from(tujuanPembelajaranTable)
    .where(
      and(
        eq(tujuanPembelajaranTable.subjectId, subjectId),
        eq(tujuanPembelajaranTable.calendarId, calendarId),
        eq(tujuanPembelajaranTable.lingkupMateri, newLm),
      ),
    )
    .orderBy(desc(tujuanPembelajaranTable.tpNumber))
    .limit(1);

  const insertAt = (lastInNewLm?.tpNumber ?? 0) + 1;

  // Step 4: open a slot (shiftTpNumbers also shifts the parked TEMP_TP, but
  // we unconditionally overwrite it in step 5 so the exact temp value is
  // irrelevant).
  await shiftTpNumbers(subjectId, calendarId, insertAt, 1);

  // Step 5: land
  const [row] = await db
    .update(tujuanPembelajaranTable)
    .set({ lingkupMateri: newLm, description, tpNumber: insertAt })
    .where(eq(tujuanPembelajaranTable.id, params.data.id))
    .returning();

  if (!row) {
    res.status(500).json({ error: "Terjadi kesalahan saat memindahkan TP" });
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

  // Compact: shift all TPs that came after the deleted one down by 1 so the
  // sequence stays contiguous (e.g. deleting TP 8 makes former TP 9 become TP 8).
  // Decrementing is safe to do in a single UPDATE because we are filling the
  // gap left by the deleted row — no unique-constraint collision can occur.
  await db
    .update(tujuanPembelajaranTable)
    .set({ tpNumber: sql`${tujuanPembelajaranTable.tpNumber} - 1` })
    .where(
      and(
        eq(tujuanPembelajaranTable.subjectId, row.subjectId),
        eq(tujuanPembelajaranTable.calendarId, row.calendarId),
        gt(tujuanPembelajaranTable.tpNumber, row.tpNumber),
      ),
    );

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
      } else if (mimeType && AI_INLINE_MIME_TYPES.has(mimeType)) {
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
    // Duplicates detected by content (LM + description), not by tpNumber.
    const existingKeys = new Set(
      existing.map((e) => `${e.lingkupMateri}:${normalizeDescription(e.description)}`),
    );

    // Sort AI items by LM asc, then by their suggested tpNumber within each LM.
    const ordered = [...items].sort((a, b) =>
      a.lingkupMateri !== b.lingkupMateri ? a.lingkupMateri - b.lingkupMateri : a.tpNumber - b.tpNumber,
    );

    // Group unique new items by LM (preserving order within each LM).
    const seen = new Set<string>();
    const byLm = new Map<number, string[]>();
    for (const item of ordered) {
      const key = `${item.lingkupMateri}:${normalizeDescription(item.description)}`;
      if (existingKeys.has(key) || seen.has(key)) continue;
      seen.add(key);
      if (!byLm.has(item.lingkupMateri)) byLm.set(item.lingkupMateri, []);
      byLm.get(item.lingkupMateri)!.push(item.description);
    }

    // Track each existing row's current tpNumber in memory so we can compute
    // correct insertion points as we shift LM by LM (lowest LM first).
    const tracked = existing.map((e) => ({ lm: e.lingkupMateri, tp: e.tpNumber }));

    const toInsert: { lingkupMateri: number; description: string; tpNumber: number }[] = [];

    // globalLastUsed tracks the highest tpNumber claimed so far (either by
    // an existing row in the DB or by items already queued in toInsert).
    // Without this, two LMs with no existing rows both compute insertAt=1
    // and produce duplicate (subjectId, calendarId, tpNumber) tuples.
    let globalLastUsed = existing.reduce((m, e) => Math.max(m, e.tpNumber), 0);

    for (const [lm, descs] of [...byLm.entries()].sort((a, b) => a[0] - b[0])) {
      const maxInLm = tracked
        .filter((t) => t.lm === lm)
        .reduce((m, t) => Math.max(m, t.tp), 0);
      // insertAt must be strictly after BOTH the last item in this LM AND
      // the last tpNumber already claimed by any previous LM's new items.
      const insertAt = Math.max(maxInLm, globalLastUsed) + 1;
      const newCount = descs.length;

      // Shift subsequent TPs in DB and in our in-memory tracker.
      await shiftTpNumbers(subjectId, calendarId, insertAt, newCount);
      for (const t of tracked) {
        if (t.tp >= insertAt) t.tp += newCount;
      }

      descs.forEach((desc, i) => {
        toInsert.push({ lingkupMateri: lm, description: desc, tpNumber: insertAt + i });
      });

      // Advance the high-water mark so the next LM starts after these items.
      globalLastUsed = insertAt + newCount - 1;
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
