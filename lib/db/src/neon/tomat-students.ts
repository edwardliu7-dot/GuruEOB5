import { pgTable, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

// Maps the shared Neon DB's "students" table -- owned by the TOMAT app, used
// for student login there and in BLP. GuruEOB5 does NOT own this table and
// must not add/rename/drop columns on it; see
// .agents/memory/shared-neon-accounts.md. This app only inserts new rows here
// so a wali kelas can generate TOMAT/BLP-ready accounts for their students
// without those students needing to self-register.
//
// Only a subset of columns is modeled -- enough to insert a new row and read
// back identity fields. Gamification columns (coins, level, exp, etc.) all
// have DB-side defaults and are intentionally omitted from inserts.
export const tomatStudentsTable = pgTable("students", {
  id: text("id").primaryKey(),
  username: text("username").notNull(),
  name: text("name").notNull(),
  password: text("password").notNull(),
  kelas: text("kelas").notNull(),
  email: text("email").notNull(),
  whatsapp: text("whatsapp").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  photoUrl: text("photo_url"),
  bio: text("bio"),
  quranBookmark: jsonb("quran_bookmark"),
  coins: integer("coins"),
  level: integer("level"),
  exp: integer("exp"),
  totalCoinsEarned: integer("total_coins_earned"),
  bestSurvivalStreak: integer("best_survival_streak"),
  equippedBingkai: text("equipped_bingkai"),
  equippedSpanduk: text("equipped_spanduk"),
  equippedTema: text("equipped_tema"),
  equippedStiker: text("equipped_stiker"),
});

export type TomatStudent = typeof tomatStudentsTable.$inferSelect;
export type InsertTomatStudent = typeof tomatStudentsTable.$inferInsert;
void z;
