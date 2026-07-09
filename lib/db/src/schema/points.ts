import { pgTable, text, timestamp, uuid, date, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { studentsTable } from "./students";

export const pointsTable = pgTable("point_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .notNull()
    .references(() => studentsTable.id, { onDelete: "cascade" }),
  jenis: text("jenis", { enum: ["positif", "negatif"] }).notNull(),
  poin: numeric("poin", { mode: "number" }).notNull(),
  keterangan: text("keterangan").notNull(),
  tanggal: date("tanggal", { mode: "string" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPointSchema = createInsertSchema(pointsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertPoint = z.infer<typeof insertPointSchema>;
export type Point = typeof pointsTable.$inferSelect;
