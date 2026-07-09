import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, teachersTable } from "@workspace/db";
import {
  RegisterBody,
  RegisterResponse,
  LoginBody,
  LoginResponse,
  LogoutResponse,
  GetMeResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password, name, school } = parsed.data;

  const [existing] = await db
    .select()
    .from(teachersTable)
    .where(eq(teachersTable.username, username));

  if (existing) {
    res.status(400).json({ error: "Username sudah digunakan" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [teacher] = await db
    .insert(teachersTable)
    .values({ username, passwordHash, name, school, role: "guru" })
    .returning();

  if (!teacher) {
    res.status(500).json({ error: "Failed to create teacher" });
    return;
  }

  req.session.teacherId = teacher.id;
  res.status(201).json(RegisterResponse.parse(teacher));
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password } = parsed.data;

  const [teacher] = await db
    .select()
    .from(teachersTable)
    .where(eq(teachersTable.username, username));

  if (!teacher) {
    res.status(401).json({ error: "Username atau password salah" });
    return;
  }

  const valid = await bcrypt.compare(password, teacher.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Username atau password salah" });
    return;
  }

  req.session.teacherId = teacher.id;
  res.json(LoginResponse.parse(teacher));
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
  const [teacher] = await db
    .select()
    .from(teachersTable)
    .where(eq(teachersTable.id, req.session.teacherId as string));

  if (!teacher) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  res.json(GetMeResponse.parse(teacher));
});

export default router;
