import type { Request, Response, NextFunction } from "express";
import { eq, type SQL } from "drizzle-orm";
import { neonDb, gurusTable, type Guru } from "@workspace/db";

declare module "express-session" {
  interface SessionData {
    teacherId?: string;
  }
}

const ADMIN_USERNAMES = ["edwardliu7"];

export function isAdminGuru(guru: Guru): boolean {
  return ADMIN_USERNAMES.includes(guru.username);
}

// School-level admin: the platform admin, or a "kepala_sekolah" (principal) managing
// their own school's data (students, teachers, teaching materials, academic calendar).
export function isSchoolAdmin(guru: Guru): boolean {
  return isAdminGuru(guru) || guru.jabatan.includes("kepala_sekolah");
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.teacherId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const guru = await getCurrentGuru(req);
  if (!guru) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (!isAdminGuru(guru)) {
    res.status(403).json({ error: "Hanya admin yang boleh mengakses fitur ini" });
    return;
  }
  next();
}

// For school-scoped resources (students, teachers, teaching materials, academic
// calendar): platform admin OR the school's own kepala sekolah may manage them.
export async function requireSchoolAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const guru = await getCurrentGuru(req);
  if (!guru) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (!isSchoolAdmin(guru)) {
    res.status(403).json({ error: "Hanya kepala sekolah atau admin yang boleh mengakses fitur ini" });
    return;
  }
  next();
}

export async function getCurrentGuru(req: Request): Promise<Guru | undefined> {
  if (!req.session.teacherId) return undefined;
  const [guru] = await neonDb
    .select()
    .from(gurusTable)
    .where(eq(gurusTable.id, req.session.teacherId));
  return guru;
}

export function sameSchoolFilter(guru: Guru): SQL {
  return guru.school ? eq(gurusTable.school, guru.school) : eq(gurusTable.id, guru.id);
}

export function guruToTeacher(guru: Guru): Record<string, unknown> {
  return {
    id: guru.id,
    username: guru.username,
    name: guru.name,
    jabatan: guru.jabatan,
    mapel: guru.mapel,
    wakasekBidang: guru.wakasekBidang,
    waliKelasKelas: guru.waliKelasKelas,
    kelasDiampu: guru.kelasDiampu,
    school: guru.school,
    photoUrl: guru.photoUrl,
    bio: guru.bio,
    sebutan: guru.sebutan,
    createdAt: guru.createdAt,
    isAdmin: isSchoolAdmin(guru),
  };
}
