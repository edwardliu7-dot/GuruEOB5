import { pgTable, text, timestamp, uuid, integer, numeric, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { z } from "zod/v4";
import { studentsTable } from "./students";
import { subjectsTable } from "./subjects";
import { academicCalendarsTable } from "./academic-calendar";

// Kurikulum Merdeka grade model:
// - "formatif": one score per Lingkup Materi (1-5) x Tujuan Pembelajaran/TP (1-4)
// - "sumatif_lm": one score per Lingkup Materi (1-5)
// - "sumatif_akhir": a single end-of-semester score (lingkupMateri/tpNumber are null)
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
    calendarId: uuid("calendar_id")
      .notNull()
      .references(() => academicCalendarsTable.id, { onDelete: "cascade" }),
    jenis: text("jenis", { enum: ["formatif", "sumatif_lm", "sumatif_akhir"] }).notNull(),
    lingkupMateri: integer("lingkup_materi"),
    tpNumber: integer("tp_number"),
    nilai: numeric("nilai", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("grades_formatif_unique")
      .on(t.studentId, t.subjectId, t.calendarId, t.lingkupMateri, t.tpNumber)
      .where(sql`${t.jenis} = 'formatif'`),
    uniqueIndex("grades_sumatif_lm_unique")
      .on(t.studentId, t.subjectId, t.calendarId, t.lingkupMateri)
      .where(sql`${t.jenis} = 'sumatif_lm'`),
    uniqueIndex("grades_sumatif_akhir_unique")
      .on(t.studentId, t.subjectId, t.calendarId)
      .where(sql`${t.jenis} = 'sumatif_akhir'`),
  ],
);

export const insertGradeSchema = createInsertSchema(gradesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertGrade = z.infer<typeof insertGradeSchema>;
export type Grade = typeof gradesTable.$inferSelect;
