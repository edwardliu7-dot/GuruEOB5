import { pgTable, integer, text, timestamp } from "drizzle-orm/pg-core";

// Maps the shared Neon DB's "pesan_pribadi" table — owned by TOMAT/BLP.
// GuruEOB5 reads messages (inbox) and inserts reply messages.
// Field read_at is set by GuruEOB5 when the guru opens a thread.
export const pesanPribadiTable = pgTable("pesan_pribadi", {
  id: integer("id").primaryKey(),
  senderId: text("sender_id").notNull(),
  senderRole: text("sender_role").notNull(),   // 'guru' | 'siswa'
  recipientId: text("recipient_id").notNull(),
  recipientRole: text("recipient_role").notNull(), // 'guru' | 'siswa'
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  readAt: timestamp("read_at", { withTimezone: true }),
});
