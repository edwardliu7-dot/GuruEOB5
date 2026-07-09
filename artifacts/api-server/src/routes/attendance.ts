import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, attendanceTable } from "@workspace/db";
import {
  ListAttendanceResponse,
  CreateAttendanceRecordBody,
  CreateAttendanceRecordResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/attendance", requireAuth, async (req, res): Promise<void> => {
  const studentId =
    typeof req.query["studentId"] === "string" ? req.query["studentId"] : undefined;
  const records = studentId
    ? await db.select().from(attendanceTable).where(eq(attendanceTable.studentId, studentId))
    : await db.select().from(attendanceTable);
  res.json(ListAttendanceResponse.parse(records));
});

router.post("/attendance", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateAttendanceRecordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [record] = await db.insert(attendanceTable).values(parsed.data).returning();
  res.status(201).json(CreateAttendanceRecordResponse.parse(record));
});

export default router;
