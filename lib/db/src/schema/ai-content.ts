import { pgTable, text, timestamp, uuid, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { subjectsTable } from "./subjects";

// Namespaced table names ("ai_" prefix) to avoid any collision risk on the
// shared Neon DB -- see .agents/memory/shared-db-naming-collisions.md.

export const aiModulAjarTable = pgTable("ai_modul_ajar", {
  id: uuid("id").primaryKey().defaultRandom(),
  teacherId: text("teacher_id").notNull(),
  subjectId: uuid("subject_id")
    .notNull()
    .references(() => subjectsTable.id, { onDelete: "cascade" }),
  materi: text("materi").notNull(),
  alokasiWaktu: text("alokasi_waktu").notNull(),
  // Full structured draft returned by Gemini -- see ModulAjarContent in
  // api-server/src/lib/gemini.ts for the shape.
  content: jsonb("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertModulAjarSchema = createInsertSchema(aiModulAjarTable).omit({
  id: true,
  teacherId: true,
  content: true,
  createdAt: true,
});
export type InsertModulAjar = z.infer<typeof insertModulAjarSchema>;
export type ModulAjar = typeof aiModulAjarTable.$inferSelect;

export const aiSoalOtomatisTable = pgTable("ai_soal_otomatis", {
  id: uuid("id").primaryKey().defaultRandom(),
  teacherId: text("teacher_id").notNull(),
  subjectId: uuid("subject_id")
    .notNull()
    .references(() => subjectsTable.id, { onDelete: "cascade" }),
  materi: text("materi").notNull(),
  jumlahSoal: integer("jumlah_soal").notNull(),
  jenisSoal: text("jenis_soal", { enum: ["pilihan_ganda", "esai"] }).notNull(),
  tingkatKesulitan: text("tingkat_kesulitan", { enum: ["mudah", "sedang", "sulit"] }).notNull(),
  // Full structured draft returned by Gemini -- see SoalContent in
  // api-server/src/lib/gemini.ts for the shape.
  content: jsonb("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSoalOtomatisSchema = createInsertSchema(aiSoalOtomatisTable).omit({
  id: true,
  teacherId: true,
  content: true,
  createdAt: true,
});
export type InsertSoalOtomatis = z.infer<typeof insertSoalOtomatisSchema>;
export type SoalOtomatis = typeof aiSoalOtomatisTable.$inferSelect;
