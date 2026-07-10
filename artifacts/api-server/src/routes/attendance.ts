import { Router, type IRouter } from "express";
import { eq, and, type SQL } from "drizzle-orm";
import { db, attendanceTable } from "@workspace/db";
import {
  ListAttendanceResponse,
  CreateAttendanceRecordBody,
  CreateAttendanceRecordResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/attendance", requireAuth, async (req, res): Promise<void> => {
  const subjectId =
    typeof req.query["subjectId"] === "string" ? req.query["subjectId"] : undefined;
  const date = typeof req.query["date"] === "string" ? req.query["date"] : undefined;

  const conditions: SQL[] = [];
  if (subjectId) conditions.push(eq(attendanceTable.subjectId, subjectId));
  if (date) conditions.push(eq(attendanceTable.tanggal, date));

  const records =
    conditions.length > 0
      ? await db.select().from(attendanceTable).where(and(...conditions))
      : await db.select().from(attendanceTable);
  res.json(ListAttendanceResponse.parse(records));
});

router.post("/attendance", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateAttendanceRecordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
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

export default router;
