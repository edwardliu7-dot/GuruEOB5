import { pgTable, text, timestamp, uuid, integer, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const academicCalendarsTable = pgTable("academic_calendars", {
  id: uuid("id").primaryKey().defaultRandom(),
  school: text("school").notNull(),
  createdBy: text("created_by").notNull(),
  tahunAjaran: text("tahun_ajaran").notNull(),
  semester: text("semester").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const academicWeeksTable = pgTable("academic_weeks", {
  id: uuid("id").primaryKey().defaultRandom(),
  calendarId: uuid("calendar_id")
    .notNull()
    .references(() => academicCalendarsTable.id, { onDelete: "cascade" }),
  pekanKe: integer("pekan_ke").notNull(),
  tanggalMulai: date("tanggal_mulai", { mode: "string" }).notNull(),
  tanggalSelesai: date("tanggal_selesai", { mode: "string" }).notNull(),
  jenis: text("jenis").notNull(),
  keterangan: text("keterangan"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAcademicCalendarSchema = createInsertSchema(academicCalendarsTable).omit({
  id: true,
  school: true,
  createdBy: true,
  createdAt: true,
});
export type InsertAcademicCalendar = z.infer<typeof insertAcademicCalendarSchema>;
export type AcademicCalendar = typeof academicCalendarsTable.$inferSelect;

export const insertAcademicWeekSchema = createInsertSchema(academicWeeksTable).omit({
  id: true,
  createdAt: true,
});
export type InsertAcademicWeek = z.infer<typeof insertAcademicWeekSchema>;
export type AcademicWeek = typeof academicWeeksTable.$inferSelect;
