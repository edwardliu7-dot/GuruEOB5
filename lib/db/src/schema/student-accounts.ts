import { pgTable, text, timestamp, uuid, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { studentsTable } from "./students";

// Records a TOMAT/BLP account generated on behalf of a roster student
// (guru_eob5_students). The password is intentionally stored in plaintext
// here (mirroring the `gurus` table convention -- see
// .agents/memory/shared-neon-accounts.md) so a wali kelas can re-download a
// student's account card later; the shared `students` row itself stores only
// the bcrypt hash.
export const studentAccountsTable = pgTable(
  "student_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => studentsTable.id, { onDelete: "cascade" }),
    tomatStudentId: text("tomat_student_id").notNull(),
    username: text("username").notNull(),
    password: text("password").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("student_accounts_student_id_unique").on(t.studentId)],
);

export const insertStudentAccountSchema = createInsertSchema(studentAccountsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertStudentAccount = z.infer<typeof insertStudentAccountSchema>;
export type StudentAccount = typeof studentAccountsTable.$inferSelect;
