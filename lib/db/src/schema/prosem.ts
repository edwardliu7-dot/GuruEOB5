import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { subjectsTable } from "./subjects";
import { academicCalendarsTable, academicWeeksTable } from "./academic-calendar";

export const prosemTable = pgTable("prosem", {
  id: uuid("id").primaryKey().defaultRandom(),
  teacherId: text("teacher_id").notNull(),
  subjectId: uuid("subject_id")
    .notNull()
    .references(() => subjectsTable.id, { onDelete: "cascade" }),
  calendarId: uuid("calendar_id")
    .notNull()
    .references(() => academicCalendarsTable.id, { onDelete: "cascade" }),
  kelas: text("kelas").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const prosemItemsTable = pgTable("prosem_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  prosemId: uuid("prosem_id")
    .notNull()
    .references(() => prosemTable.id, { onDelete: "cascade" }),
  weekId: uuid("week_id")
    .notNull()
    .references(() => academicWeeksTable.id, { onDelete: "cascade" }),
  kd: text("kd"),
  materi: text("materi").notNull(),
  jp: integer("jp"),
  catatan: text("catatan"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertProsemSchema = createInsertSchema(prosemTable).omit({
  id: true,
  teacherId: true,
  createdAt: true,
});
export type InsertProsem = z.infer<typeof insertProsemSchema>;
export type Prosem = typeof prosemTable.$inferSelect;

export const insertProsemItemSchema = createInsertSchema(prosemItemsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertProsemItem = z.infer<typeof insertProsemItemSchema>;
export type ProsemItem = typeof prosemItemsTable.$inferSelect;
