import { pgTable, text, timestamp, integer, date } from "drizzle-orm/pg-core";

// Maps the shared Neon DB's "daily_records" table -- owned by the BLP app.
// GuruEOB5 does NOT write to this table; reads are for progress display only.
// Each row = one student's record for one day, with an array of completed activity codes.
export const blpDailyRecordsTable = pgTable("daily_records", {
  id: integer("id").primaryKey(),
  studentId: text("student_id").notNull(),
  recordDate: date("record_date").notNull(),
  completedActivities: text("completed_activities").array(),
  score: integer("score"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});
