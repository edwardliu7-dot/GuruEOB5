import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
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

  const subjects = await db
    .select()
    .from(subjectsTable)
    .where(eq(subjectsTable.teacherId, guru.id));
  res.json(ListSubjectsResponse.parse(subjects));
});

router.post("/subjects", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateSubjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [subject] = await db.insert(subjectsTable).values(parsed.data).returning();
  res.status(201).json(CreateSubjectResponse.parse(subject));
});

router.patch("/subjects/:id", requireAuth, async (req, res): Promise<void> => {
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

  const [subject] = await db
    .update(subjectsTable)
    .set(parsed.data)
    .where(eq(subjectsTable.id, params.data.id))
    .returning();

  if (!subject) {
    res.status(404).json({ error: "Subject not found" });
    return;
  }

  res.json(UpdateSubjectResponse.parse(subject));
});

router.delete("/subjects/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteSubjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [subject] = await db
    .delete(subjectsTable)
    .where(eq(subjectsTable.id, params.data.id))
    .returning();

  if (!subject) {
    res.status(404).json({ error: "Subject not found" });
    return;
  }

  res.json(DeleteSubjectResponse.parse({ success: true }));
});

export default router;
