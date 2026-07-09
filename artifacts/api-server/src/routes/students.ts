import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, studentsTable } from "@workspace/db";
import {
  ListStudentsResponse,
  CreateStudentBody,
  CreateStudentResponse,
  GetStudentParams,
  GetStudentResponse,
  UpdateStudentParams,
  UpdateStudentBody,
  UpdateStudentResponse,
  DeleteStudentParams,
  DeleteStudentResponse,
  AnalyzeStudentImportBody,
  AnalyzeStudentImportResponse,
  BulkCreateStudentsBody,
  BulkCreateStudentsResponse,
} from "@workspace/api-zod";
import { requireAuth, requireAdmin, getCurrentGuru } from "../lib/auth";
import { mapRowsToStudents } from "../lib/gemini";

const router: IRouter = Router();

router.get("/students", requireAuth, async (req, res): Promise<void> => {
  const kelas = typeof req.query["kelas"] === "string" ? req.query["kelas"] : undefined;
  const students = await db.select().from(studentsTable);
  const filtered = kelas ? students.filter((s) => s.kelas === kelas) : students;
  res.json(ListStudentsResponse.parse(filtered));
});

router.post("/students", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateStudentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [student] = await db.insert(studentsTable).values(parsed.data).returning();
  res.status(201).json(CreateStudentResponse.parse(student));
});

router.post("/students/import/analyze", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const parsed = AnalyzeStudentImportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const nonEmptyRows = parsed.data.rows.filter((row) => row.some((cell) => cell.trim() !== ""));
  if (nonEmptyRows.length === 0) {
    res.status(400).json({ error: "File tidak berisi data" });
    return;
  }

  const guru = await getCurrentGuru(req);
  try {
    const students = await mapRowsToStudents(nonEmptyRows, guru?.school ?? null);
    res.json(AnalyzeStudentImportResponse.parse({ students }));
  } catch (err) {
    req.log.error({ err }, "AI import analysis failed");
    res.status(502).json({ error: "Gagal menganalisis data dengan AI. Coba lagi." });
  }
});

router.post("/students/bulk", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const parsed = BulkCreateStudentsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const inserted = await db.insert(studentsTable).values(parsed.data.students).returning();
  res.json(BulkCreateStudentsResponse.parse({ count: inserted.length }));
});

router.get("/students/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetStudentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [student] = await db
    .select()
    .from(studentsTable)
    .where(eq(studentsTable.id, params.data.id));

  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  res.json(GetStudentResponse.parse(student));
});

router.patch("/students/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateStudentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateStudentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [student] = await db
    .update(studentsTable)
    .set(parsed.data)
    .where(eq(studentsTable.id, params.data.id))
    .returning();

  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  res.json(UpdateStudentResponse.parse(student));
});

router.delete("/students/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteStudentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [student] = await db
    .delete(studentsTable)
    .where(eq(studentsTable.id, params.data.id))
    .returning();

  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  res.json(DeleteStudentResponse.parse({ success: true }));
});

export default router;
