import { Router, type IRouter } from "express";
import { eq, or } from "drizzle-orm";
import { neonDb, gurusTable } from "@workspace/db";
import {
  RegisterBody,
  RegisterResponse,
  LoginBody,
  LoginResponse,
  LogoutResponse,
  GetMeResponse,
} from "@workspace/api-zod";
import { requireAuth, getCurrentGuru, guruToTeacher } from "../lib/auth";

const router: IRouter = Router();

function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const {
    name,
    jabatan,
    mapel,
    wakasekBidang,
    waliKelasKelas,
    kelasDiampu,
    school,
    username,
    password,
  } = parsed.data;

  if (jabatan.includes("guru") && (!mapel || mapel.length === 0)) {
    res.status(400).json({ error: "Pilih minimal satu mata pelajaran untuk jabatan Guru" });
    return;
  }
  if (jabatan.includes("wakasek") && !wakasekBidang) {
    res.status(400).json({ error: "Pilih bidang untuk jabatan Wakasek" });
    return;
  }
  if (jabatan.includes("wali_kelas") && !waliKelasKelas) {
    res.status(400).json({ error: "Pilih kelas untuk jabatan Wali Kelas" });
    return;
  }

  const id = slugify(username);

  const [existing] = await neonDb
    .select()
    .from(gurusTable)
    .where(or(eq(gurusTable.id, id), eq(gurusTable.username, username)));

  if (existing) {
    res.status(400).json({ error: "Username sudah digunakan" });
    return;
  }

  const [guru] = await neonDb
    .insert(gurusTable)
    .values({
      id,
      username,
      password,
      name,
      jabatan,
      mapel: jabatan.includes("guru") ? (mapel ?? []) : null,
      wakasekBidang: jabatan.includes("wakasek") ? (wakasekBidang ?? null) : null,
      waliKelasKelas: jabatan.includes("wali_kelas") ? (waliKelasKelas ?? null) : null,
      kelasDiampu,
      school,
    })
    .returning();

  if (!guru) {
    res.status(500).json({ error: "Gagal membuat akun" });
    return;
  }

  req.session.teacherId = guru.id;
  res.json(RegisterResponse.parse(guruToTeacher(guru)));
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password } = parsed.data;

  const [guru] = await neonDb
    .select()
    .from(gurusTable)
    .where(or(eq(gurusTable.username, username), eq(gurusTable.id, slugify(username))));

  if (!guru || guru.password !== password) {
    res.status(401).json({ error: "Username atau password salah" });
    return;
  }

  req.session.teacherId = guru.id;
  res.json(LoginResponse.parse(guruToTeacher(guru)));
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy((err) => {
    if (err) {
      req.log.error({ err }, "Failed to destroy session");
      res.status(500).json({ error: "Failed to logout" });
      return;
    }
    res.clearCookie("connect.sid");
    res.json(LogoutResponse.parse({ success: true }));
  });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);

  if (!guru) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  res.json(GetMeResponse.parse(guruToTeacher(guru)));
});

export default router;
