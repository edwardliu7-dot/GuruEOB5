import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { neonDb, gurusTable } from "@workspace/db";
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
import { requireAuth, requireAdmin, getCurrentGuru, guruToTeacher, sameSchoolFilter, isAdminGuru } from "../lib/auth";

const router: IRouter = Router();

router.get("/teachers", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const current = await getCurrentGuru(req);
  if (!current) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const gurus = await neonDb.select().from(gurusTable).where(sameSchoolFilter(current));
  res.json(ListTeachersResponse.parse(gurus.map(guruToTeacher)));
});

router.get("/teachers/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetTeacherParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const current = await getCurrentGuru(req);
  if (!current) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [guru] = await neonDb
    .select()
    .from(gurusTable)
    .where(and(eq(gurusTable.id, params.data.id), sameSchoolFilter(current)));

  if (!guru) {
    res.status(404).json({ error: "Teacher not found" });
    return;
  }

  res.json(GetTeacherResponse.parse(guruToTeacher(guru)));
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

  const current = await getCurrentGuru(req);
  if (!current) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const isSelf = req.session.teacherId === params.data.id;
  if (!isSelf && !isAdminGuru(current)) {
    res.status(403).json({ error: "Hanya boleh mengubah profil sendiri" });
    return;
  }

  const [guru] = await neonDb
    .update(gurusTable)
    .set(parsed.data)
    .where(
      isSelf
        ? eq(gurusTable.id, params.data.id)
        : and(eq(gurusTable.id, params.data.id), sameSchoolFilter(current)),
    )
    .returning();

  if (!guru) {
    res.status(404).json({ error: "Teacher not found" });
    return;
  }

  res.json(UpdateTeacherResponse.parse(guruToTeacher(guru)));
});

router.delete("/teachers/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteTeacherParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const current = await getCurrentGuru(req);
  if (!current) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const isSelf = req.session.teacherId === params.data.id;
  if (!isSelf && !isAdminGuru(current)) {
    res.status(403).json({ error: "Hanya boleh menghapus akun sendiri" });
    return;
  }

  const [guru] = await neonDb
    .delete(gurusTable)
    .where(
      isSelf
        ? eq(gurusTable.id, params.data.id)
        : and(eq(gurusTable.id, params.data.id), sameSchoolFilter(current)),
    )
    .returning();

  if (!guru) {
    res.status(404).json({ error: "Teacher not found" });
    return;
  }

  res.json(DeleteTeacherResponse.parse({ success: true }));
});

export default router;
