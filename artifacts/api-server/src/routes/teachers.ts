import { Router, type IRouter } from "express";
import { and, count, eq, gte, inArray } from "drizzle-orm";
import { neonDb, gurusTable, db, subjectsTable, documentsTable, journalEntriesTable } from "@workspace/db";
import {
  ListTeachersResponse,
  ListTeachersProgressResponse,
  GetTeacherParams,
  GetTeacherResponse,
  UpdateTeacherParams,
  UpdateTeacherBody,
  UpdateTeacherResponse,
  DeleteTeacherParams,
  DeleteTeacherResponse,
} from "@workspace/api-zod";
import { requireAuth, requireSchoolAdmin, getCurrentGuru, guruToTeacher, sameSchoolFilter, isSchoolAdmin } from "../lib/auth";

const router: IRouter = Router();

const DOCS_PER_SUBJECT = 5;

router.get("/teachers/progress", requireAuth, requireSchoolAdmin, async (req, res): Promise<void> => {
  const current = await getCurrentGuru(req);
  if (!current) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const monthStart = new Date();
  monthStart.setDate(1);
  const monthStartStr = monthStart.toISOString().slice(0, 10);

  const schoolWhere = current.school ? eq(gurusTable.school, current.school) : undefined;
  const gurus = schoolWhere
    ? await neonDb.select().from(gurusTable).where(schoolWhere)
    : await neonDb.select().from(gurusTable);

  const guruIds = gurus.map((g) => g.id);

  if (guruIds.length === 0) {
    res.json(ListTeachersProgressResponse.parse([]));
    return;
  }

  const [subjects, documents, journals] = await Promise.all([
    db.select({ id: subjectsTable.id, teacherId: subjectsTable.teacherId }).from(subjectsTable)
      .where(inArray(subjectsTable.teacherId, guruIds)),
    db.select({ subjectId: documentsTable.subjectId }).from(documentsTable),
    db.select({ teacherId: journalEntriesTable.teacherId })
      .from(journalEntriesTable)
      .where(and(gte(journalEntriesTable.tanggal, monthStartStr), inArray(journalEntriesTable.teacherId, guruIds))),
  ]);

  const docsBySubject = new Map<string, number>();
  for (const d of documents) {
    docsBySubject.set(d.subjectId, (docsBySubject.get(d.subjectId) ?? 0) + 1);
  }

  const journalsByTeacher = new Map<string, number>();
  for (const j of journals) {
    journalsByTeacher.set(j.teacherId, (journalsByTeacher.get(j.teacherId) ?? 0) + 1);
  }

  const result = gurus.map((g) => {
    const guruSubjects = subjects.filter((s) => s.teacherId === g.id);
    const dokumenSelesai = guruSubjects.reduce((sum, s) => sum + (docsBySubject.get(s.id) ?? 0), 0);
    const dokumenTotal = guruSubjects.length * DOCS_PER_SUBJECT;
    const jurnalBulanIni = journalsByTeacher.get(g.id) ?? 0;
    const kelengkapanPersen = dokumenTotal > 0 ? Math.min(100, Math.round((dokumenSelesai / dokumenTotal) * 100)) : 0;
    return { teacherId: g.id, jurnalBulanIni, dokumenTotal, dokumenSelesai, kelengkapanPersen };
  });

  res.json(ListTeachersProgressResponse.parse(result));
});

router.get("/teachers", requireAuth, requireSchoolAdmin, async (req, res): Promise<void> => {
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
  if (!isSelf && !isSchoolAdmin(current)) {
    res.status(403).json({ error: "Hanya boleh mengubah profil sendiri" });
    return;
  }

  const updates: Partial<typeof gurusTable.$inferInsert> = { ...parsed.data };
  if (parsed.data.photoUrl === "") updates.photoUrl = null;

  const [guru] = await neonDb
    .update(gurusTable)
    .set(updates)
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
  if (!isSelf && !isSchoolAdmin(current)) {
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
