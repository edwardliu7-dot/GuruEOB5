import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, teachersTable } from "@workspace/db";
import {
  ListTeachersResponse,
  GetTeacherParams,
  GetTeacherResponse,
  UpdateTeacherParams,
  UpdateTeacherBody,
  UpdateTeacherResponse,
  DeleteTeacherParams,
  DeleteTeacherResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/teachers", requireAuth, async (_req, res): Promise<void> => {
  const teachers = await db.select().from(teachersTable);
  res.json(ListTeachersResponse.parse(teachers));
});

router.get("/teachers/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetTeacherParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [teacher] = await db
    .select()
    .from(teachersTable)
    .where(eq(teachersTable.id, params.data.id));

  if (!teacher) {
    res.status(404).json({ error: "Teacher not found" });
    return;
  }

  res.json(GetTeacherResponse.parse(teacher));
});

router.patch("/teachers/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateTeacherParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateTeacherBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [teacher] = await db
    .update(teachersTable)
    .set(parsed.data)
    .where(eq(teachersTable.id, params.data.id))
    .returning();

  if (!teacher) {
    res.status(404).json({ error: "Teacher not found" });
    return;
  }

  res.json(UpdateTeacherResponse.parse(teacher));
});

router.delete("/teachers/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteTeacherParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [teacher] = await db
    .delete(teachersTable)
    .where(eq(teachersTable.id, params.data.id))
    .returning();

  if (!teacher) {
    res.status(404).json({ error: "Teacher not found" });
    return;
  }

  res.json(DeleteTeacherResponse.parse({ success: true }));
});

export default router;
