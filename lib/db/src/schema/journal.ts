import { pgTable, text, timestamp, uuid, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { subjectsTable } from "./subjects";

export const journalEntriesTable = pgTable("journal_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  subjectId: uuid("subject_id")
    .notNull()
    .references(() => subjectsTable.id, { onDelete: "cascade" }),
  teacherId: text("teacher_id").notNull(),
  tanggal: date("tanggal", { mode: "string" }).notNull(),
  kelas: text("kelas").notNull(),
  materi: text("materi").notNull(),
  catatan: text("catatan"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertJournalEntrySchema = createInsertSchema(journalEntriesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type JournalEntry = typeof journalEntriesTable.$inferSelect;
