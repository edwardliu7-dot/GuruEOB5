import { pgTable, text, timestamp, uuid, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { z } from "zod/v4";

// NOTE: table is named "guru_eob5_students" (not "students") because the shared
// Neon DB already has an unrelated app's "students" table with a completely
// different, incompatible schema. See .agents/memory/shared-db-naming-collisions.md
export const studentsTable = pgTable(
  "guru_eob5_students",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nisn: text("nisn"),
    namaLengkap: text("nama_lengkap").notNull(),
    kelas: text("kelas").notNull(),
    jenisKelamin: text("jenis_kelamin", { enum: ["L", "P"] }).notNull(),
    school: text("school").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("guru_eob5_students_school_nisn_unique")
      .on(t.school, t.nisn)
      .where(sql`${t.nisn} IS NOT NULL AND ${t.nisn} <> ''`),
  ],
);

export const insertStudentSchema = createInsertSchema(studentsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof studentsTable.$inferSelect;
