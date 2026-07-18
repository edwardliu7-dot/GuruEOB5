import { Router, type IRouter } from "express";
import { eq, and, inArray, type SQL } from "drizzle-orm";
import { db, attendanceTable, studentsTable, subjectsTable } from "@workspace/db";
import {
  ListAttendanceResponse,
  CreateAttendanceRecordBody,
  CreateAttendanceRecordResponse,
  BulkCreateAttendanceBody,
  BulkCreateAttendanceResponse,
  BulkMixedCreateAttendanceBody,
  BulkMixedCreateAttendanceResponse,
  UpdateAttendanceRecordParams,
  UpdateAttendanceRecordBody,
  UpdateAttendanceRecordResponse,
  DeleteAttendanceRecordParams,
  DeleteAttendanceRecordResponse,
  GetAttendanceRekapResponse,
  BulkDeleteAttendanceByKelasBody,
  BulkDeleteAttendanceByKelasResponse,
} from "@workspace/api-zod";
import { requireAuth, getCurrentGuru } from "../lib/auth";
import type { Request } from "express";

const router: IRouter = Router();

async function schoolStudentIds(req: Request, kelas?: string): Promise<Set<string> | null> {
  const guru = await getCurrentGuru(req);
  if (!guru) return null;
  if (!guru.school) return new Set();
  const conditions: SQL[] = [eq(studentsTable.school, guru.school)];
  if (kelas) conditions.push(eq(studentsTable.kelas, kelas));
  const rows = await db
    .select({ id: studentsTable.id })
    .from(studentsTable)
    .where(and(...conditions));
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

router.get("/attendance", requireAuth, async (req, res): Promise<void> => {
  const kelas = typeof req.query["kelas"] === "string" ? req.query["kelas"] : undefined;
  const allowed = await schoolStudentIds(req, kelas);
  if (allowed === null) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (allowed.size === 0) {
    res.json(ListAttendanceResponse.parse([]));
    return;
  }

  const subjectId =
    typeof req.query["subjectId"] === "string" ? req.query["subjectId"] : undefined;
  const date = typeof req.query["date"] === "string" ? req.query["date"] : undefined;

  const conditions: SQL[] = [inArray(attendanceTable.studentId, [...allowed])];
  if (subjectId) conditions.push(eq(attendanceTable.subjectId, subjectId));
  if (date) conditions.push(eq(attendanceTable.tanggal, date));

  const records = await db.select().from(attendanceTable).where(and(...conditions));
  res.json(ListAttendanceResponse.parse(records));
});

router.post("/attendance", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateAttendanceRecordBody.safeParse(req.body);
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

  const [record] = await db
    .insert(attendanceTable)
    .values(parsed.data)
    .onConflictDoUpdate({
      target: [attendanceTable.studentId, attendanceTable.subjectId, attendanceTable.tanggal],
      set: { status: parsed.data.status },
    })
    .returning();
  res.status(201).json(CreateAttendanceRecordResponse.parse(record));
});

router.patch("/attendance/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateAttendanceRecordParams.safeParse(req.params);
  const body = UpdateAttendanceRecordBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: (params.error ?? body.error)!.message });
    return;
  }

  const allowed = await schoolStudentIds(req);
  if (allowed === null) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (allowed.size === 0) {
    res.status(404).json({ error: "Attendance record not found" });
    return;
  }

  const [record] = await db
    .update(attendanceTable)
    .set({ status: body.data.status })
    .where(
      and(
        eq(attendanceTable.id, params.data.id),
        inArray(attendanceTable.studentId, [...allowed]),
      ),
    )
    .returning();

  if (!record) {
    res.status(404).json({ error: "Attendance record not found" });
    return;
  }

  res.json(UpdateAttendanceRecordResponse.parse(record));
});

router.delete("/attendance/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteAttendanceRecordParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const allowed = await schoolStudentIds(req);
  if (allowed === null) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (allowed.size === 0) {
    res.status(404).json({ error: "Attendance record not found" });
    return;
  }

  const [record] = await db
    .delete(attendanceTable)
    .where(
      and(
        eq(attendanceTable.id, params.data.id),
        inArray(attendanceTable.studentId, [...allowed]),
      ),
    )
    .returning();

  if (!record) {
    res.status(404).json({ error: "Attendance record not found" });
    return;
  }

  res.json(DeleteAttendanceRecordResponse.parse({ success: true }));
});

router.post("/attendance/bulk", requireAuth, async (req, res): Promise<void> => {
  const parsed = BulkCreateAttendanceBody.safeParse(req.body);
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

  const { studentIds, subjectId, tanggal, status } = parsed.data;
  const targets = [...new Set(studentIds)].filter((id) => allowed.has(id));

  if (targets.length === 0) {
    res.status(400).json({ error: "Tidak ada siswa valid yang dipilih" });
    return;
  }
  if (!(await ownsSubject(subjectId, guru.id))) {
    res.status(404).json({ error: "Mata pelajaran tidak ditemukan" });
    return;
  }

  const inserted = await db
    .insert(attendanceTable)
    .values(targets.map((studentId) => ({ studentId, subjectId, tanggal, status })))
    .onConflictDoUpdate({
      target: [attendanceTable.studentId, attendanceTable.subjectId, attendanceTable.tanggal],
      set: { status },
    })
    .returning();
  res.json(BulkCreateAttendanceResponse.parse({ count: inserted.length }));
});

/**
 * Daily input: one subject/date, a different status per student. Powers the
 * "isi sekaligus semua siswa" roster table so a teacher doesn't have to open
 * a dialog per student.
 */
router.post("/attendance/bulk-mixed", requireAuth, async (req, res): Promise<void> => {
  const parsed = BulkMixedCreateAttendanceBody.safeParse(req.body);
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

  const { subjectId, tanggal, entries } = parsed.data;
  const byStudent = new Map(entries.map((e) => [e.studentId, e.status]));
  const targets = [...byStudent.keys()].filter((id) => allowed.has(id));

  if (targets.length === 0) {
    res.status(400).json({ error: "Tidak ada siswa valid yang dipilih" });
    return;
  }
  if (!(await ownsSubject(subjectId, guru.id))) {
    res.status(404).json({ error: "Mata pelajaran tidak ditemukan" });
    return;
  }

  let count = 0;
  for (const studentId of targets) {
    const status = byStudent.get(studentId)!;
    await db
      .insert(attendanceTable)
      .values({ studentId, subjectId, tanggal, status })
      .onConflictDoUpdate({
        target: [attendanceTable.studentId, attendanceTable.subjectId, attendanceTable.tanggal],
        set: { status },
      });
    count++;
  }
  res.json(BulkMixedCreateAttendanceResponse.parse({ count }));
});

/**
 * Rekap absensi: aggregated by (tanggal, kelas, subject), so a teacher can
 * see "Sabtu 18 Juli 2026 · Matematika · Kelas 7A → 21 hadir, 2 izin" at a glance.
 * Only returns data for the calling teacher's own subjects (so they see only the
 * classes they actually taught, not other teachers' attendance records).
 */
router.get("/attendance/rekap", requireAuth, async (req, res): Promise<void> => {
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
  if (allowed.size === 0) {
    res.json(GetAttendanceRekapResponse.parse({ groups: [] }));
    return;
  }

  // Fetch all subjects the calling teacher owns.
  const ownSubjects = await db
    .select({ id: subjectsTable.id, name: subjectsTable.name })
    .from(subjectsTable)
    .where(eq(subjectsTable.teacherId, guru.id));

  if (ownSubjects.length === 0) {
    res.json(GetAttendanceRekapResponse.parse({ groups: [] }));
    return;
  }

  const ownSubjectIds = new Set(ownSubjects.map((s) => s.id));
  const subjectNameById = new Map(ownSubjects.map((s) => [s.id, s.name]));

  // All students in scope for school, keyed by id → kelas.
  const studentsInScope = await db
    .select({ id: studentsTable.id, kelas: studentsTable.kelas })
    .from(studentsTable)
    .where(inArray(studentsTable.id, [...allowed]));
  const kelasById = new Map(studentsInScope.map((s) => [s.id, s.kelas]));

  // All attendance records for own subjects.
  const conditions: SQL[] = [
    inArray(attendanceTable.studentId, [...allowed]),
    inArray(attendanceTable.subjectId, [...ownSubjectIds]),
  ];
  const records = await db
    .select()
    .from(attendanceTable)
    .where(and(...conditions));

  // Aggregate: key = tanggal|kelas|subjectId
  type GroupKey = string;
  type GroupAcc = { tanggal: string; kelas: string; subjectId: string; hadir: number; izin: number; sakit: number; alpa: number; total: number };
  const grouped = new Map<GroupKey, GroupAcc>();

  for (const rec of records) {
    const kelas = kelasById.get(rec.studentId);
    if (!kelas || !ownSubjectIds.has(rec.subjectId)) continue;
    const key: GroupKey = `${rec.tanggal}|${kelas}|${rec.subjectId}`;
    const acc = grouped.get(key) ?? { tanggal: rec.tanggal, kelas, subjectId: rec.subjectId, hadir: 0, izin: 0, sakit: 0, alpa: 0, total: 0 };
    acc[rec.status as keyof Pick<GroupAcc, "hadir" | "izin" | "sakit" | "alpa">] += 1;
    acc.total += 1;
    grouped.set(key, acc);
  }

  const groups = [...grouped.values()]
    .map((g) => ({ ...g, subjectName: subjectNameById.get(g.subjectId) ?? g.subjectId }))
    .sort((a, b) => (a.tanggal < b.tanggal ? 1 : a.tanggal > b.tanggal ? -1 : 0));

  res.json(GetAttendanceRekapResponse.parse({ groups }));
});

/**
 * Hapus semua catatan kehadiran untuk satu kelas + mata pelajaran + tanggal.
 * Berguna ketika guru ingin mengulang input absensi dari awal untuk sesi tertentu.
 */
router.delete("/attendance/bulk-kelas", requireAuth, async (req, res): Promise<void> => {
  const parsed = BulkDeleteAttendanceByKelasBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const guru = await getCurrentGuru(req);
  if (!guru) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (!(await ownsSubject(parsed.data.subjectId, guru.id))) {
    res.status(404).json({ error: "Mata pelajaran tidak ditemukan" });
    return;
  }

  const allowed = await schoolStudentIds(req, parsed.data.kelas);
  if (allowed === null) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (allowed.size === 0) {
    res.json(BulkDeleteAttendanceByKelasResponse.parse({ count: 0 }));
    return;
  }

  const deleted = await db
    .delete(attendanceTable)
    .where(
      and(
        inArray(attendanceTable.studentId, [...allowed]),
        eq(attendanceTable.subjectId, parsed.data.subjectId),
        eq(attendanceTable.tanggal, parsed.data.tanggal),
      ),
    )
    .returning({ id: attendanceTable.id });

  res.json(BulkDeleteAttendanceByKelasResponse.parse({ count: deleted.length }));
});

export default router;
