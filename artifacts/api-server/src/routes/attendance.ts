import { Router, type IRouter } from "express";
import { eq, and, inArray, or, type SQL } from "drizzle-orm";
import {
  db,
  neonDb,
  attendanceTable,
  studentsTable,
  studentAccountsTable,
  gurusTable,
  type Guru,
  type Attendance,
} from "@workspace/db";
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

type AttendanceRow = {
  attendance: Attendance;
  rosterStudentId: string;
  kelas: string;
};

async function scopedAttendance(
  guru: Guru,
  options: { kelas?: string; tanggal?: string } = {},
): Promise<AttendanceRow[]> {
  if (!guru.school) return [];

  const conditions: SQL[] = [eq(studentsTable.school, guru.school)];
  if (options.kelas) conditions.push(eq(studentsTable.kelas, options.kelas));
  if (options.tanggal) conditions.push(eq(attendanceTable.tanggal, options.tanggal));

  return db
    .select({
      attendance: attendanceTable,
      rosterStudentId: studentAccountsTable.studentId,
      kelas: studentsTable.kelas,
    })
    .from(attendanceTable)
    .innerJoin(
      studentAccountsTable,
      eq(studentAccountsTable.tomatStudentId, attendanceTable.studentId),
    )
    .innerJoin(studentsTable, eq(studentsTable.id, studentAccountsTable.studentId))
    .where(and(...conditions));
}

async function guruNamesFor(guru: Guru, rows: AttendanceRow[]): Promise<Map<string, string>> {
  const ids = [...new Set(rows.map((row) => row.attendance.guruId).filter(Boolean))];
  if (ids.length === 0) return new Map();

  const identityCondition = guru.school
    ? and(or(inArray(gurusTable.id, ids), inArray(gurusTable.username, ids)), eq(gurusTable.school, guru.school))
    : eq(gurusTable.id, guru.id);
  const gurus = await neonDb
    .select({ id: gurusTable.id, username: gurusTable.username, name: gurusTable.name })
    .from(gurusTable)
    .where(identityCondition);

  return new Map(
    gurus.flatMap((guru) => [
      [guru.id, guru.name] as const,
      [guru.username, guru.name] as const,
    ]),
  );
}

function toApiRecord(
  row: AttendanceRow,
  guruNames: Map<string, string>,
): Record<string, unknown> {
  return {
    id: String(row.attendance.id),
    studentId: row.rosterStudentId,
    tanggal: row.attendance.tanggal,
    status: row.attendance.status,
    filledByTeacherId: row.attendance.guruId,
    filledByTeacherName: guruNames.get(row.attendance.guruId) ?? row.attendance.guruId,
    createdAt: row.attendance.createdAt ?? new Date(0),
  };
}

async function legacyStudentIds(
  rosterStudentIds: string[],
): Promise<Map<string, string>> {
  if (rosterStudentIds.length === 0) return new Map();
  const accounts = await db
    .select({
      studentId: studentAccountsTable.studentId,
      tomatStudentId: studentAccountsTable.tomatStudentId,
    })
    .from(studentAccountsTable)
    .where(inArray(studentAccountsTable.studentId, rosterStudentIds));
  return new Map(accounts.map((account) => [account.studentId, account.tomatStudentId]));
}

router.get("/attendance", requireAuth, async (req, res): Promise<void> => {
  const kelas = typeof req.query["kelas"] === "string" ? req.query["kelas"] : undefined;
  const guru = await getCurrentGuru(req);
  if (!guru) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const date = typeof req.query["date"] === "string" ? req.query["date"] : undefined;
  const rows = await scopedAttendance(guru, { kelas, tanggal: date });
  const guruNames = await guruNamesFor(guru, rows);
  res.json(ListAttendanceResponse.parse(rows.map((row) => toApiRecord(row, guruNames))));
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

  const legacyIds = await legacyStudentIds([parsed.data.studentId]);
  const legacyStudentId = legacyIds.get(parsed.data.studentId);
  if (!legacyStudentId) {
    res.status(404).json({ error: "Akun siswa belum terhubung ke data absensi lama" });
    return;
  }
  const [saved] = await db
    .insert(attendanceTable)
    .values({
      studentId: legacyStudentId,
      guruId: guru.username,
      tanggal: parsed.data.tanggal,
      status: parsed.data.status,
    })
    .onConflictDoUpdate({
      target: [attendanceTable.studentId, attendanceTable.tanggal],
      set: { status: parsed.data.status, guruId: guru.username },
    })
    .returning();
  const rows = await scopedAttendance(guru, { tanggal: saved.tanggal });
  const row = rows.find((item) => item.attendance.id === saved.id);
  if (!row) {
    res.status(500).json({ error: "Catatan absensi tersimpan tetapi gagal dibaca kembali" });
    return;
  }
  const guruNames = await guruNamesFor(guru, [row]);
  res.status(201).json(CreateAttendanceRecordResponse.parse(toApiRecord(row, guruNames)));
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

  const guru = await getCurrentGuru(req);
  if (!guru) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const scopedRows = await scopedAttendance(guru);
  const target = scopedRows.find((row) => String(row.attendance.id) === params.data.id);
  if (!target) {
    res.status(404).json({ error: "Attendance record not found" });
    return;
  }
  const [record] = await db
    .update(attendanceTable)
    .set({ status: body.data.status })
    .where(eq(attendanceTable.id, target.attendance.id))
    .returning();

  if (!record) {
    res.status(404).json({ error: "Attendance record not found" });
    return;
  }

  const updatedRows = await scopedAttendance(guru, {
    tanggal: record.tanggal,
  });
  const updated = updatedRows.find((row) => row.attendance.id === record.id);
  const guruNames = await guruNamesFor(guru, updated ? [updated] : []);
  res.json(UpdateAttendanceRecordResponse.parse(updated ? toApiRecord(updated, guruNames) : record));
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

  const guru = await getCurrentGuru(req);
  if (!guru) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const scopedRows = await scopedAttendance(guru);
  const target = scopedRows.find((row) => String(row.attendance.id) === params.data.id);
  const [record] = target
    ? await db.delete(attendanceTable).where(eq(attendanceTable.id, target.attendance.id)).returning()
    : [];

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

  const { studentIds, tanggal, status } = parsed.data;
  const targets = [...new Set(studentIds)].filter((id) => allowed.has(id));

  if (targets.length === 0) {
    res.status(400).json({ error: "Tidak ada siswa valid yang dipilih" });
    return;
  }

  const legacyIds = await legacyStudentIds(targets);
  const mappedTargets = targets.filter((studentId) => legacyIds.has(studentId));
  if (mappedTargets.length === 0) {
    res.status(400).json({ error: "Siswa belum terhubung ke data absensi lama" });
    return;
  }
  const inserted = await db
    .insert(attendanceTable)
    .values(mappedTargets.flatMap((studentId) => {
      const legacyStudentId = legacyIds.get(studentId);
      return legacyStudentId ? [{ studentId: legacyStudentId, tanggal, status, guruId: guru.username }] : [];
    }))
    .onConflictDoUpdate({
      target: [attendanceTable.studentId, attendanceTable.tanggal],
      set: { status, guruId: guru.username },
    })
    .returning();
  res.json(BulkCreateAttendanceResponse.parse({ count: inserted.length }));
});

/**
 * Daily input: one date, a different status per student.
 * Any teacher can fill — one attendance record per student per day across the whole school.
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

  const { tanggal, entries } = parsed.data;
  const byStudent = new Map(entries.map((e) => [e.studentId, e.status]));
  const targets = [...byStudent.keys()].filter((id) => allowed.has(id));

  if (targets.length === 0) {
    res.status(400).json({ error: "Tidak ada siswa valid yang dipilih" });
    return;
  }

  const legacyIds = await legacyStudentIds(targets);
  let count = 0;
  for (const studentId of targets) {
    const legacyStudentId = legacyIds.get(studentId);
    if (!legacyStudentId) continue;
    const status = byStudent.get(studentId)!;
    await db
      .insert(attendanceTable)
      .values({
        studentId: legacyStudentId,
        tanggal,
        status,
        guruId: guru.username,
      })
      .onConflictDoUpdate({
        target: [attendanceTable.studentId, attendanceTable.tanggal],
        set: { status, guruId: guru.username },
      });
    count++;
  }
  res.json(BulkMixedCreateAttendanceResponse.parse({ count }));
});

/**
 * Rekap absensi: aggregated by (tanggal, kelas) — school-wide, any teacher can see all.
 */
router.get("/attendance/rekap", requireAuth, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const scopedRows = await scopedAttendance(guru);
  const guruNames = await guruNamesFor(guru, scopedRows);

  // Aggregate: key = tanggal|kelas
  type GroupKey = string;
  type GroupAcc = {
    tanggal: string;
    kelas: string;
    hadir: number;
    izin: number;
    sakit: number;
    alpa: number;
    total: number;
    filledByTeacherName: string | null;
  };
  const grouped = new Map<GroupKey, GroupAcc>();

  for (const row of scopedRows) {
    const rec = row.attendance;
    const key: GroupKey = `${rec.tanggal}|${row.kelas}`;
    const acc = grouped.get(key) ?? {
      tanggal: rec.tanggal,
      kelas: row.kelas,
      hadir: 0,
      izin: 0,
      sakit: 0,
      alpa: 0,
      total: 0,
      filledByTeacherName: guruNames.get(rec.guruId) ?? rec.guruId ?? null,
    };
    acc[rec.status as keyof Pick<GroupAcc, "hadir" | "izin" | "sakit" | "alpa">] += 1;
    acc.total += 1;
    grouped.set(key, acc);
  }

  const groups = [...grouped.values()]
    .sort((a, b) => (a.tanggal < b.tanggal ? 1 : a.tanggal > b.tanggal ? -1 : 0));

  res.json(GetAttendanceRekapResponse.parse({ groups }));
});

/**
 * Hapus semua catatan kehadiran untuk satu kelas + tanggal.
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
  const scopedRows = await scopedAttendance(guru, {
    kelas: parsed.data.kelas,
    tanggal: parsed.data.tanggal,
  });
  if (scopedRows.length === 0) {
    res.json(BulkDeleteAttendanceByKelasResponse.parse({ count: 0 }));
    return;
  }

  const deleted = await db
    .delete(attendanceTable)
    .where(
      and(
        inArray(attendanceTable.id, scopedRows.map((row) => row.attendance.id)),
        eq(attendanceTable.tanggal, parsed.data.tanggal),
      ),
    )
    .returning({ id: attendanceTable.id });

  res.json(BulkDeleteAttendanceByKelasResponse.parse({ count: deleted.length }));
});

export default router;
