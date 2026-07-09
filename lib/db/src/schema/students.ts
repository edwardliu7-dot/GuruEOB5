import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const studentsTable = pgTable("students", {
  id: uuid("id").primaryKey().defaultRandom(),
  nisn: text("nisn"),
  namaLengkap: text("nama_lengkap").notNull(),
  kelas: text("kelas").notNull(),
  jenisKelamin: text("jenis_kelamin", { enum: ["L", "P"] }).notNull(),
  school: text("school").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertStudentSchema = createInsertSchema(studentsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof studentsTable.$inferSelect;
