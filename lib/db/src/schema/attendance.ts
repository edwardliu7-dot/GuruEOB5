import { pgTable, text, timestamp, integer, date, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const attendanceTable = pgTable(
  // This table predates GuruEOB5's UUID roster. Keep using it so the existing
  // attendance history remains the source of truth.
  "absensi",
  {
    id: integer("id").primaryKey().default(sql`nextval('eob5_absensi_id_seq')`),
    // This is the legacy TOMAT student username, not guru_eob5_students.id.
    studentId: text("student_id").notNull(),
    guruId: text("guru_id").notNull(),
    tanggal: date("tanggal", { mode: "string" }).notNull(),
    status: text("status", { enum: ["hadir", "izin", "sakit", "alpa"] }).notNull(),
    keterangan: text("keterangan"),
    createdAt: timestamp("created_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("eob5_absensi_student_id_tanggal_key").on(t.studentId, t.tanggal),
  ],
);

export const insertAttendanceSchema = createInsertSchema(attendanceTable).omit({
  id: true,
  createdAt: true,
});
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendanceTable.$inferSelect;
