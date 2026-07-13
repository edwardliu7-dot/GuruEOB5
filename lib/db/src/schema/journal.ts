import { pgTable, text, timestamp, uuid, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { subjectsTable } from "./subjects";
import { prosemItemsTable } from "./prosem";

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
  // Optional link to the Prosem (semester plan) topic this entry realizes.
  // Nullable: entries can still be logged free-form without a matching plan item.
  prosemItemId: uuid("prosem_item_id").references(() => prosemItemsTable.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertJournalEntrySchema = createInsertSchema(journalEntriesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type JournalEntry = typeof journalEntriesTable.$inferSelect;
