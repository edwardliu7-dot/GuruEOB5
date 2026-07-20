import { Router, type IRouter } from "express";
import { and, eq, isNull } from "drizzle-orm";
import { db, subjectsTable, type Guru } from "@workspace/db";
import {
  ListSubjectsResponse,
  CreateSubjectBody,
  CreateSubjectResponse,
  UpdateSubjectParams,
  UpdateSubjectBody,
  UpdateSubjectResponse,
  DeleteSubjectParams,
  DeleteSubjectResponse,
} from "@workspace/api-zod";
import { requireAuth, getCurrentGuru } from "../lib/auth";

const router: IRouter = Router();

async function syncSubjectFolders(guru: Guru): Promise<void> {
  const mapel = guru.mapel ?? [];
  const kelasDiampu = guru.kelasDiampu ?? [];
  if (mapel.length === 0 || kelasDiampu.length === 0) return;

  // Fetch ALL rows for this teacher — including soft-deleted ones — so we never
  // recreate a subject the teacher intentionally deleted.
  const existing = await db
    .select({ name: subjectsTable.name })
    .from(subjectsTable)
    .where(eq(subjectsTable.teacherId, guru.id));

  const existingNames = new Set(existing.map((s) => s.name));

  const missing: { name: string; teacherId: string }[] = [];
  for (const m of mapel) {
    for (const k of kelasDiampu) {
      const name = `${m} - ${k}`;
      if (!existingNames.has(name)) {
        missing.push({ name, teacherId: guru.id });
      }
    }
  }

  if (missing.length > 0) {
    await db.insert(subjectsTable).values(missing).onConflictDoNothing();
  }
}

router.get("/subjects", requireAuth, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  await syncSubjectFolders(guru);

  // Only return subjects that have NOT been soft-deleted.
  const subjects = await db
    .select()
    .from(subjectsTable)
    .where(and(eq(subjectsTable.teacherId, guru.id), isNull(subjectsTable.deletedAt)));
  res.json(ListSubjectsResponse.parse(subjects));
});

router.post("/subjects", requireAuth, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = CreateSubjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Never trust a client-supplied teacherId -- always bind to the caller.
  const [subject] = await db
    .insert(subjectsTable)
    .values({ ...parsed.data, teacherId: guru.id })
    .returning();
  res.status(201).json(CreateSubjectResponse.parse(subject));
});

router.patch("/subjects/:id", requireAuth, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = UpdateSubjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateSubjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Never trust a client-supplied teacherId -- keep ownership bound to the caller,
  // and only allow updating subjects the caller already owns (and haven't deleted).
  const [subject] = await db
    .update(subjectsTable)
    .set({ ...parsed.data, teacherId: guru.id })
    .where(
      and(
        eq(subjectsTable.id, params.data.id),
        eq(subjectsTable.teacherId, guru.id),
        isNull(subjectsTable.deletedAt),
      ),
    )
    .returning();

  if (!subject) {
    res.status(404).json({ error: "Subject not found" });
    return;
  }

  res.json(UpdateSubjectResponse.parse(subject));
});

router.delete("/subjects/:id", requireAuth, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = DeleteSubjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  // Soft-delete: set deleted_at so syncSubjectFolders never recreates this subject.
  const [subject] = await db
    .update(subjectsTable)
    .set({ deletedAt: new Date() })
    .where(
      and(
        eq(subjectsTable.id, params.data.id),
        eq(subjectsTable.teacherId, guru.id),
        isNull(subjectsTable.deletedAt),
      ),
    )
    .returning();

  if (!subject) {
    res.status(404).json({ error: "Subject not found" });
    return;
  }

  res.json(DeleteSubjectResponse.parse({ success: true }));
});

export default router;
