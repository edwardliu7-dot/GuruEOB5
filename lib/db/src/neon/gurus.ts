import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const JABATAN_OPTIONS = [
  "kepala_sekolah",
  "wakasek",
  "guru",
  "wali_kelas",
] as const;

export const WAKASEK_BIDANG_OPTIONS = ["Kurikulum", "Kesiswaan"] as const;

export const KELAS_OPTIONS = [
  "VII Ibnu Battutah",
  "VIII Ibnu Sina",
  "IX Al Khawarizmi",
] as const;

export const MAPEL_OPTIONS = [
  "B. Indonesia",
  "IPA",
  "IPS",
  "PKN",
  "Matematika",
  "Seni Teater",
  "TIK",
  "PJOK",
  "SKI",
  "Do'a dan Hadits",
  "B. Arab",
  "B. Sunda",
  "English",
  "PAI",
  "Bimbingan Konseling",
] as const;

export const gurusTable = pgTable("gurus", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  kelasDiampu: text("kelas_diampu").array().notNull().default([]),
  password: text("password").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  username: text("username").notNull(),
  photoUrl: text("photo_url"),
  bio: text("bio"),
  jabatan: text("jabatan").array().notNull().default([]),
  mapel: text("mapel").array(),
  wakasekBidang: text("wakasek_bidang"),
  waliKelasKelas: text("wali_kelas_kelas"),
  school: text("school"),
  sebutan: text("sebutan"),
});

export const insertGuruSchema = createInsertSchema(gurusTable).omit({
  createdAt: true,
});
export type InsertGuru = z.infer<typeof insertGuruSchema>;
export type Guru = typeof gurusTable.$inferSelect;
