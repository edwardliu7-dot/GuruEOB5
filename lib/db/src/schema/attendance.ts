import { pgTable, text, timestamp, uuid, date, uniqueIndex } from "drizzle-orm/pg-core";import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { studentsTable } from "./students";

export const attendanceTable = pgTable(
  "attendance_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => studentsTable.id, { onDelete: "cascade" }),
    // subjectId removed — attendance is now per day per student, not per subject
    tanggal: date("tanggal", { mode: "string" }).notNull(),
    status: text("status", { enum: ["hadir", "izin", "sakit", "alpa"] }).notNull(),
    filledByTeacherId: text("filled_by_teacher_id"),
    filledByTeacherName: text("filled_by_teacher_name"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("attendance_student_tanggal_unique").on(t.studentId, t.tanggal),
  ],
);

export const insertAttendanceSchema = createInsertSchema(attendanceTable).omit({
  id: true,
  createdAt: true,
});
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendanceTable.$inferSelect;
