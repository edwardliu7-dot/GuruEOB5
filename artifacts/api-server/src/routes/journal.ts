import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, journalEntriesTable, subjectsTable } from "@workspace/db";
import {
  ListJournalEntriesResponse,
  CreateJournalEntryBody,
  CreateJournalEntryResponse,
  UpdateJournalEntryParams,
  UpdateJournalEntryBody,
  UpdateJournalEntryResponse,
  DeleteJournalEntryParams,
  DeleteJournalEntryResponse,
} from "@workspace/api-zod";
import { requireAuth, getCurrentGuru } from "../lib/auth";

const router: IRouter = Router();

router.get("/journal", requireAuth, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const subjectId =
    typeof req.query["subjectId"] === "string" ? req.query["subjectId"] : undefined;
  const entries = subjectId
    ? await db
        .select()
        .from(journalEntriesTable)
        .where(
          and(
            eq(journalEntriesTable.subjectId, subjectId),
            eq(journalEntriesTable.teacherId, guru.id),
          ),
        )
    : await db
        .select()
        .from(journalEntriesTable)
        .where(eq(journalEntriesTable.teacherId, guru.id));
  res.json(ListJournalEntriesResponse.parse(entries));
});

router.post("/journal", requireAuth, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = CreateJournalEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [subject] = await db
    .select({ id: subjectsTable.id })
    .from(subjectsTable)
    .where(and(eq(subjectsTable.id, parsed.data.subjectId), eq(subjectsTable.teacherId, guru.id)));
  if (!subject) {
    res.status(404).json({ error: "Subject not found" });
    return;
  }

  const [entry] = await db
    .insert(journalEntriesTable)
    .values({ ...parsed.data, teacherId: guru.id })
    .returning();
  res.status(201).json(CreateJournalEntryResponse.parse(entry));
});

router.patch("/journal/:id", requireAuth, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = UpdateJournalEntryParams.safeParse(req.params);
  const body = UpdateJournalEntryBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: (params.error ?? body.error)!.message });
    return;
  }

  const [subject] = await db
    .select({ id: subjectsTable.id })
    .from(subjectsTable)
    .where(and(eq(subjectsTable.id, body.data.subjectId), eq(subjectsTable.teacherId, guru.id)));
  if (!subject) {
    res.status(404).json({ error: "Subject not found" });
    return;
  }

  const [entry] = await db
    .update(journalEntriesTable)
    .set(body.data)
    .where(
      and(eq(journalEntriesTable.id, params.data.id), eq(journalEntriesTable.teacherId, guru.id)),
    )
    .returning();

  if (!entry) {
    res.status(404).json({ error: "Journal entry not found" });
    return;
  }

  res.json(UpdateJournalEntryResponse.parse(entry));
});

router.delete("/journal/:id", requireAuth, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = DeleteJournalEntryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [entry] = await db
    .delete(journalEntriesTable)
    .where(
      and(eq(journalEntriesTable.id, params.data.id), eq(journalEntriesTable.teacherId, guru.id)),
    )
    .returning();

  if (!entry) {
    res.status(404).json({ error: "Journal entry not found" });
    return;
  }

  res.json(DeleteJournalEntryResponse.parse({ success: true }));
});

export default router;
