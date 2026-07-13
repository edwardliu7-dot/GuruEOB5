import { Router, type IRouter } from "express";
import { eq, and, inArray, isNull, type SQL } from "drizzle-orm";
import { db, gradesTable, studentsTable, subjectsTable, academicCalendarsTable } from "@workspace/db";
import {
  ListGradesResponse,
  CreateGradeBody,
  CreateGradeResponse,
  UpdateGradeParams,
  UpdateGradeBody,
  UpdateGradeResponse,
  DeleteGradeParams,
  DeleteGradeResponse,
} from "@workspace/api-zod";
import { requireAuth, getCurrentGuru } from "../lib/auth";
import type { Request } from "express";

const router: IRouter = Router();

async function schoolStudentIds(req: Request): Promise<Set<string> | null> {
  const guru = await getCurrentGuru(req);
  if (!guru) return null;
  if (!guru.school) return new Set();
  const rows = await db
    .select({ id: studentsTable.id })
    .from(studentsTable)
    .where(eq(studentsTable.school, guru.school));
  return new Set(rows.map((r) => r.id));
}

/** A subjectId in the request body must belong to the caller's own subjects. */
async function ownsSubject(subjectId: string, teacherId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: subjectsTable.id })
    .from(subjectsTable)
    .where(and(eq(subjectsTable.id, subjectId), eq(subjectsTable.teacherId, teacherId)));
  return Boolean(row);
}

/** A calendarId in the request body must belong to the caller's own school. */
async function calendarInSchool(calendarId: string, school: string): Promise<boolean> {
  const [row] = await db
    .select({ school: academicCalendarsTable.school })
    .from(academicCalendarsTable)
    .where(eq(academicCalendarsTable.id, calendarId));
  return Boolean(row && row.school === school);
}

router.get("/grades", requireAuth, async (req, res): Promise<void> => {
  const allowed = await schoolStudentIds(req);
  if (allowed === null) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const studentId =
    typeof req.query["studentId"] === "string" ? req.query["studentId"] : undefined;
  if (studentId && !allowed.has(studentId)) {
    res.json(ListGradesResponse.parse([]));
    return;
  }
  if (allowed.size === 0) {
    res.json(ListGradesResponse.parse([]));
    return;
  }
  const subjectId =
    typeof req.query["subjectId"] === "string" ? req.query["subjectId"] : undefined;
  const calendarId =
    typeof req.query["calendarId"] === "string" ? req.query["calendarId"] : undefined;

  const conditions: SQL[] = [
    studentId ? eq(gradesTable.studentId, studentId) : inArray(gradesTable.studentId, [...allowed]),
  ];
  if (subjectId) conditions.push(eq(gradesTable.subjectId, subjectId));
  if (calendarId) conditions.push(eq(gradesTable.calendarId, calendarId));

  const grades = await db.select().from(gradesTable).where(and(...conditions));
  res.json(ListGradesResponse.parse(grades));
});

router.post("/grades", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateGradeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const guru = await getCurrentGuru(req);
  if (!guru) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const allowed = await schoolStudentIds(req);
  if (allowed === null) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (!allowed.has(parsed.data.studentId)) {
    res.status(404).json({ error: "Siswa tidak ditemukan" });
    return;
  }
  if (!(await ownsSubject(parsed.data.subjectId, guru.id))) {
    res.status(404).json({ error: "Mata pelajaran tidak ditemukan" });
    return;
  }
  if (!guru.school || !(await calendarInSchool(parsed.data.calendarId, guru.school))) {
    res.status(404).json({ error: "Kalender tidak ditemukan" });
    return;
  }

  const { studentId, subjectId, calendarId, jenis, nilai } = parsed.data;
  const lingkupMateri = jenis === "sumatif_akhir" ? null : (parsed.data.lingkupMateri ?? null);
  const tpNumber = jenis === "formatif" ? (parsed.data.tpNumber ?? null) : null;

  if (jenis === "formatif" && (lingkupMateri == null || tpNumber == null)) {
    res.status(400).json({ error: "Nilai formatif memerlukan lingkupMateri dan tpNumber" });
    return;
  }
  if (jenis === "sumatif_lm" && lingkupMateri == null) {
    res.status(400).json({ error: "Nilai sumatif lingkup materi memerlukan lingkupMateri" });
    return;
  }

  // Matching by the appropriate partial-unique key per jenis (nullable columns
  // can't be targeted by a single ON CONFLICT clause), so upsert manually.
  const matchConditions: SQL[] = [
    eq(gradesTable.studentId, studentId),
    eq(gradesTable.subjectId, subjectId),
    eq(gradesTable.calendarId, calendarId),
    eq(gradesTable.jenis, jenis),
    lingkupMateri == null ? isNull(gradesTable.lingkupMateri) : eq(gradesTable.lingkupMateri, lingkupMateri),
    tpNumber == null ? isNull(gradesTable.tpNumber) : eq(gradesTable.tpNumber, tpNumber),
  ];

  const [existing] = await db.select().from(gradesTable).where(and(...matchConditions));

  let grade;
  if (existing) {
    [grade] = await db
      .update(gradesTable)
      .set({ nilai })
      .where(eq(gradesTable.id, existing.id))
      .returning();
  } else {
    [grade] = await db
      .insert(gradesTable)
      .values({ studentId, subjectId, calendarId, jenis, lingkupMateri, tpNumber, nilai })
      .returning();
  }

  res.status(201).json(CreateGradeResponse.parse(grade));
});

router.patch("/grades/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateGradeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateGradeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const allowed = await schoolStudentIds(req);
  if (allowed === null) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [existing] = await db
    .select()
    .from(gradesTable)
    .where(eq(gradesTable.id, params.data.id));
  if (!existing || !allowed.has(existing.studentId)) {
    res.status(404).json({ error: "Nilai tidak ditemukan" });
    return;
  }

  const [grade] = await db
    .update(gradesTable)
    .set({ nilai: parsed.data.nilai })
    .where(eq(gradesTable.id, params.data.id))
    .returning();

  res.json(UpdateGradeResponse.parse(grade));
});

router.delete("/grades/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteGradeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const allowed = await schoolStudentIds(req);
  if (allowed === null) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [existing] = await db
    .select()
    .from(gradesTable)
    .where(eq(gradesTable.id, params.data.id));
  if (!existing || !allowed.has(existing.studentId)) {
    res.status(404).json({ error: "Nilai tidak ditemukan" });
    return;
  }

  await db.delete(gradesTable).where(eq(gradesTable.id, params.data.id));
  res.json(DeleteGradeResponse.parse({ success: true }));
});

export default router;
