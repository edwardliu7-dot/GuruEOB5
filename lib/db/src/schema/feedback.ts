import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const feedbackTable = pgTable("feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  teacherId: text("teacher_id").notNull(),
  teacherName: text("teacher_name").notNull(),
  kategori: text("kategori", { enum: ["saran", "kritik", "bug"] }).notNull(),
  pesan: text("pesan").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFeedbackSchema = createInsertSchema(feedbackTable).omit({
  id: true,
  teacherId: true,
  teacherName: true,
  isRead: true,
  createdAt: true,
});
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type Feedback = typeof feedbackTable.$inferSelect;
