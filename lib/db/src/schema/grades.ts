import { pgTable, text, timestamp, uuid, date, numeric, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { studentsTable } from "./students";
import { subjectsTable } from "./subjects";

export const gradesTable = pgTable(
  "grades",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => studentsTable.id, { onDelete: "cascade" }),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjectsTable.id, { onDelete: "cascade" }),
    jenis: text("jenis", { enum: ["tugas", "uts", "uas"] }).notNull(),
    nilai: numeric("nilai", { mode: "number" }).notNull(),
    tanggal: date("tanggal", { mode: "string" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("grades_student_subject_jenis_tanggal_unique").on(
      t.studentId,
      t.subjectId,
      t.jenis,
      t.tanggal,
    ),
  ],
);

export const insertGradeSchema = createInsertSchema(gradesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertGrade = z.infer<typeof insertGradeSchema>;
export type Grade = typeof gradesTable.$inferSelect;
