import { Router, type IRouter } from "express";
import { eq, and, inArray, type SQL } from "drizzle-orm";
import { db, gradesTable, studentsTable } from "@workspace/db";
import {
  ListGradesResponse,
  CreateGradeBody,
  CreateGradeResponse,
  BulkCreateGradesBody,
  BulkCreateGradesResponse,
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

  const conditions: SQL[] = [
    studentId ? eq(gradesTable.studentId, studentId) : inArray(gradesTable.studentId, [...allowed]),
  ];
  if (subjectId) conditions.push(eq(gradesTable.subjectId, subjectId));

  const grades = await db.select().from(gradesTable).where(and(...conditions));
  res.json(ListGradesResponse.parse(grades));
});

router.post("/grades", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateGradeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
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

  const [grade] = await db
    .insert(gradesTable)
    .values(parsed.data)
    .onConflictDoUpdate({
      target: [gradesTable.studentId, gradesTable.subjectId, gradesTable.jenis, gradesTable.tanggal],
      set: { nilai: parsed.data.nilai },
    })
    .returning();
  res.status(201).json(CreateGradeResponse.parse(grade));
});

router.post("/grades/bulk", requireAuth, async (req, res): Promise<void> => {
  const parsed = BulkCreateGradesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const allowed = await schoolStudentIds(req);
  if (allowed === null) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { studentIds, subjectId, jenis, nilai, tanggal } = parsed.data;
  const targets = [...new Set(studentIds)].filter((id) => allowed.has(id));

  if (targets.length === 0) {
    res.status(400).json({ error: "Tidak ada siswa valid yang dipilih" });
    return;
  }

  const inserted = await db
    .insert(gradesTable)
    .values(targets.map((studentId) => ({ studentId, subjectId, jenis, nilai, tanggal })))
    .onConflictDoUpdate({
      target: [gradesTable.studentId, gradesTable.subjectId, gradesTable.jenis, gradesTable.tanggal],
      set: { nilai },
    })
    .returning();
  res.json(BulkCreateGradesResponse.parse({ count: inserted.length }));
});

export default router;
