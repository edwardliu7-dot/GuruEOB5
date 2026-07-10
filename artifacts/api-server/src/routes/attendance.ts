import { Router, type IRouter } from "express";
import { eq, and, inArray, type SQL } from "drizzle-orm";
import { db, attendanceTable, studentsTable } from "@workspace/db";
import {
  ListAttendanceResponse,
  CreateAttendanceRecordBody,
  CreateAttendanceRecordResponse,
  BulkCreateAttendanceBody,
  BulkCreateAttendanceResponse,
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

router.get("/attendance", requireAuth, async (req, res): Promise<void> => {
  const allowed = await schoolStudentIds(req);
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

  const allowed = await schoolStudentIds(req);
  if (allowed === null) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (!allowed.has(parsed.data.studentId)) {
    res.status(404).json({ error: "Siswa tidak ditemukan" });
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

router.post("/attendance/bulk", requireAuth, async (req, res): Promise<void> => {
  const parsed = BulkCreateAttendanceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
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

export default router;
