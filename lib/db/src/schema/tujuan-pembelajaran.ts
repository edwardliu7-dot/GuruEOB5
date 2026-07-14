import { pgTable, text, timestamp, uuid, integer, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { subjectsTable } from "./subjects";
import { academicCalendarsTable } from "./academic-calendar";

// Tujuan Pembelajaran (TP) -- Kurikulum Merdeka learning objectives, grouped by
// Lingkup Materi (1-5), per subject + semester. tpNumber is a continuous sequence
// across the whole subject+semester (not reset per Lingkup Materi): e.g. if
// Lingkup Materi 1 has TP 1-2, Lingkup Materi 2 continues with TP 3, etc. It is
// assigned server-side, never by the client.
export const tujuanPembelajaranTable = pgTable(
  "tujuan_pembelajaran",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teacherId: text("teacher_id").notNull(),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjectsTable.id, { onDelete: "cascade" }),
    calendarId: uuid("calendar_id")
      .notNull()
      .references(() => academicCalendarsTable.id, { onDelete: "cascade" }),
    lingkupMateri: integer("lingkup_materi").notNull(),
    tpNumber: integer("tp_number").notNull(),
    description: text("description").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("tujuan_pembelajaran_unique").on(t.subjectId, t.calendarId, t.tpNumber),
  ],
);

export const insertTujuanPembelajaranSchema = createInsertSchema(tujuanPembelajaranTable).omit({
  id: true,
  teacherId: true,
  createdAt: true,
});
export type InsertTujuanPembelajaran = z.infer<typeof insertTujuanPembelajaranSchema>;
export type TujuanPembelajaran = typeof tujuanPembelajaranTable.$inferSelect;
