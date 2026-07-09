import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, journalEntriesTable } from "@workspace/db";
import {
  ListJournalEntriesResponse,
  CreateJournalEntryBody,
  CreateJournalEntryResponse,
  DeleteJournalEntryParams,
  DeleteJournalEntryResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/journal", requireAuth, async (req, res): Promise<void> => {
  const subjectId =
    typeof req.query["subjectId"] === "string" ? req.query["subjectId"] : undefined;
  const entries = subjectId
    ? await db
        .select()
        .from(journalEntriesTable)
        .where(eq(journalEntriesTable.subjectId, subjectId))
    : await db.select().from(journalEntriesTable);
  res.json(ListJournalEntriesResponse.parse(entries));
});

router.post("/journal", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateJournalEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [entry] = await db
    .insert(journalEntriesTable)
    .values({ ...parsed.data, teacherId: req.session.teacherId as string })
    .returning();
  res.status(201).json(CreateJournalEntryResponse.parse(entry));
});

router.delete("/journal/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteJournalEntryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [entry] = await db
    .delete(journalEntriesTable)
    .where(eq(journalEntriesTable.id, params.data.id))
    .returning();

  if (!entry) {
    res.status(404).json({ error: "Journal entry not found" });
    return;
  }

  res.json(DeleteJournalEntryResponse.parse({ success: true }));
});

export default router;
