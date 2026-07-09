import type { Request, Response, NextFunction } from "express";
import { eq, type SQL } from "drizzle-orm";
import { neonDb, gurusTable, type Guru } from "@workspace/db";

declare module "express-session" {
  interface SessionData {
    teacherId?: string;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.teacherId) {
    res.status(401).json({ error: "Unauthorized" });
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
    createdAt: guru.createdAt,
  };
}
