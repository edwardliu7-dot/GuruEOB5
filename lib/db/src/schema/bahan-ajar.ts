import { pgTable, text, timestamp, integer, uuid } from "drizzle-orm/pg-core";

export const bahanAjarTable = pgTable("bahan_ajar", {
  id: uuid("id").primaryKey().defaultRandom(),
  school: text("school").notNull(),
  judul: text("judul").notNull(),
  mataPelajaran: text("mata_pelajaran"),
  kelas: text("kelas"),
  deskripsi: text("deskripsi"),
  fileName: text("file_name"),
  fileType: text("file_type"),
  fileSize: integer("file_size"),
  // base64 payload — excluded from list queries, fetched separately via /file
  fileData: text("file_data"),
  linkUrl: text("link_url"),
  createdBy: text("created_by").notNull(),
  createdByName: text("created_by_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type BahanAjar = typeof bahanAjarTable.$inferSelect;
export type InsertBahanAjar = typeof bahanAjarTable.$inferInsert;
