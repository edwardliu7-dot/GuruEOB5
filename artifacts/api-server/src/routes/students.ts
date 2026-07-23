import { Router, type IRouter } from "express";
import { eq, inArray } from "drizzle-orm";
import { db, neonDb, studentsTable, studentAccountsTable, tomatStudentsTable, type InsertStudent, type Student } from "@workspace/db";
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
import { requireAuth, requireSchoolAdmin, getCurrentGuru } from "../lib/auth";
import { mapRowsToStudents } from "../lib/gemini";

const router: IRouter = Router();

function normalizeStudent<T extends { nisn?: string | null; namaLengkap: string; kelas: string }>(
  s: T,
): T {
  return {
    ...s,
    nisn: s.nisn?.trim() ? s.nisn.trim() : null,
    namaLengkap: s.namaLengkap.trim(),
    kelas: s.kelas.trim(),
  };
}

function dedupKey(s: { nisn?: string | null; namaLengkap: string; kelas: string; school: string }): string {
  return s.nisn
    ? `nisn:${s.school}:${s.nisn}`
    : `nama:${s.school}:${s.namaLengkap.toLowerCase()}:${s.kelas.toLowerCase()}`;
}

async function listSchoolStudents(req: Parameters<typeof getCurrentGuru>[0]): Promise<Student[] | null> {
  const guru = await getCurrentGuru(req);
  if (!guru) return null;
  if (!guru.school) return [];
  return db.select().from(studentsTable).where(eq(studentsTable.school, guru.school));
}

router.get("/students", requireAuth, async (req, res): Promise<void> => {
  const students = await listSchoolStudents(req);
  if (students === null) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const kelas = typeof req.query["kelas"] === "string" ? req.query["kelas"] : undefined;
  const filtered = kelas ? students.filter((s) => s.kelas === kelas) : students;
  res.json(ListStudentsResponse.parse(filtered));
});

router.post("/students", requireAuth, requireSchoolAdmin, async (req, res): Promise<void> => {
  const parsed = CreateStudentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const guru = await getCurrentGuru(req);
  if (!guru?.school) {
    res.status(400).json({ error: "Akun Anda belum memiliki sekolah" });
    return;
  }

  const data = normalizeStudent({ ...parsed.data, school: guru.school });
  const existing = await db.select().from(studentsTable).where(eq(studentsTable.school, data.school));
  const keys = new Set(existing.map((s) => dedupKey(s)));
  if (keys.has(dedupKey(data))) {
    res.status(409).json({
      error: data.nisn
        ? `Siswa dengan NISN ${data.nisn} sudah terdaftar`
        : `Siswa "${data.namaLengkap}" di kelas ${data.kelas} sudah terdaftar`,
    });
    return;
  }

  const [student] = await db.insert(studentsTable).values(data).returning();
  res.status(201).json(CreateStudentResponse.parse(student));
});

router.post("/students/import/analyze", requireAuth, requireSchoolAdmin, async (req, res): Promise<void> => {
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

router.post("/students/bulk", requireAuth, requireSchoolAdmin, async (req, res): Promise<void> => {
  const parsed = BulkCreateStudentsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const guru = await getCurrentGuru(req);
  if (!guru?.school) {
    res.status(400).json({ error: "Akun Anda belum memiliki sekolah" });
    return;
  }

  const normalized = parsed.data.students.map((s) =>
    normalizeStudent({ ...s, school: guru.school as string }),
  );
  const existing = await db
    .select()
    .from(studentsTable)
    .where(eq(studentsTable.school, guru.school));
  const seen = new Set(existing.map((s) => dedupKey(s)));

  const toInsert: InsertStudent[] = [];
  let skipped = 0;
  for (const s of normalized) {
    const key = dedupKey(s);
    if (seen.has(key)) {
      skipped++;
      continue;
    }
    seen.add(key);
    toInsert.push(s);
  }

  const inserted =
    toInsert.length > 0
      ? await db.insert(studentsTable).values(toInsert).onConflictDoNothing().returning()
      : [];
  skipped += toInsert.length - inserted.length;
  res.json(BulkCreateStudentsResponse.parse({ count: inserted.length, skipped }));
});

// ── Direktori Siswa ──────────────────────────────────────────────────────────
// Returns all students in the school enriched with account status and
// BLP/Tomat progress (level, coins, exp) from the shared Neon DB.
// Must be registered BEFORE /students/:id so "directory" is not treated as an id.
router.get("/students/directory", requireAuth, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (!guru.school) {
    res.json([]);
    return;
  }

  // 1. All students in the school (local DB), ordered by kelas then name
  const students = await db
    .select()
    .from(studentsTable)
    .where(eq(studentsTable.school, guru.school));

  if (students.length === 0) {
    res.json([]);
    return;
  }

  // 2. Student accounts that have been generated (local DB)
  const studentIds = students.map((s) => s.id);
  const accounts = await db
    .select()
    .from(studentAccountsTable)
    .where(inArray(studentAccountsTable.studentId, studentIds));

  const accountByStudentId = new Map(accounts.map((a) => [a.studentId, a]));

  // 3. BLP/Tomat progress from shared Neon DB (only for students with accounts)
  const tomatIds = accounts.map((a) => a.tomatStudentId);
  const tomatRows =
    tomatIds.length > 0
      ? await neonDb
          .select({
            id: tomatStudentsTable.id,
            coins: tomatStudentsTable.coins,
            level: tomatStudentsTable.level,
            exp: tomatStudentsTable.exp,
            totalCoinsEarned: tomatStudentsTable.totalCoinsEarned,
            bestSurvivalStreak: tomatStudentsTable.bestSurvivalStreak,
          })
          .from(tomatStudentsTable)
          .where(inArray(tomatStudentsTable.id, tomatIds))
      : [];
  const tomatById = new Map(tomatRows.map((r) => [r.id, r]));

  const result = students.map((s) => {
    const account = accountByStudentId.get(s.id);
    const tomat = account ? tomatById.get(account.tomatStudentId) : undefined;
    return {
      id: s.id,
      namaLengkap: s.namaLengkap,
      kelas: s.kelas,
      nisn: s.nisn ?? null,
      jenisKelamin: s.jenisKelamin,
      hasAccount: !!account,
      username: account?.username ?? null,
      coins: tomat?.coins ?? null,
      level: tomat?.level ?? null,
      exp: tomat?.exp ?? null,
      totalCoinsEarned: tomat?.totalCoinsEarned ?? null,
      bestSurvivalStreak: tomat?.bestSurvivalStreak ?? null,
    };
  });

  res.json(result);
});

router.get("/students/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetStudentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const guru = await getCurrentGuru(req);
  const [student] = await db
    .select()
    .from(studentsTable)
    .where(eq(studentsTable.id, params.data.id));

  if (!student || !guru?.school || student.school !== guru.school) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  res.json(GetStudentResponse.parse(student));
});

router.patch("/students/:id", requireAuth, requireSchoolAdmin, async (req, res): Promise<void> => {
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

  const guru = await getCurrentGuru(req);
  const [existing] = await db
    .select()
    .from(studentsTable)
    .where(eq(studentsTable.id, params.data.id));
  if (!existing || !guru?.school || existing.school !== guru.school) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  const { school: _ignored, ...updates } = parsed.data;
  const [student] = await db
    .update(studentsTable)
    .set(updates)
    .where(eq(studentsTable.id, params.data.id))
    .returning();

  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  res.json(UpdateStudentResponse.parse(student));
});

router.delete("/students/:id", requireAuth, requireSchoolAdmin, async (req, res): Promise<void> => {
  const params = DeleteStudentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const guru = await getCurrentGuru(req);
  const [existing] = await db
    .select()
    .from(studentsTable)
    .where(eq(studentsTable.id, params.data.id));
  if (!existing || !guru?.school || existing.school !== guru.school) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  await db.delete(studentsTable).where(eq(studentsTable.id, params.data.id));
  res.json(DeleteStudentResponse.parse({ success: true }));
});

export default router;
