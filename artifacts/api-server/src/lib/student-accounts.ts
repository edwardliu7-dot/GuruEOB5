import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db, neonDb, studentAccountsTable, tomatStudentsTable, type Student } from "@workspace/db";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function randomPassword(): string {
  // 6-digit numeric PIN -- easy for students to read off a printed card and
  // type on a keyboard or on-screen keypad.
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function usernameTaken(username: string): Promise<boolean> {
  const [row] = await neonDb
    .select({ id: tomatStudentsTable.id })
    .from(tomatStudentsTable)
    .where(eq(tomatStudentsTable.username, username));
  return !!row;
}

async function uniqueUsername(namaLengkap: string): Promise<string> {
  const base = slugify(namaLengkap) || "siswa";
  let candidate = base;
  let suffix = 1;
  while (await usernameTaken(candidate)) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}

async function uniqueTomatId(username: string): Promise<string> {
  let candidate = username;
  let suffix = 1;
  // The shared `students` table's id is also its own identifier space; reuse
  // the same collision-avoidance loop against it directly.
  while (true) {
    const [row] = await neonDb
      .select({ id: tomatStudentsTable.id })
      .from(tomatStudentsTable)
      .where(eq(tomatStudentsTable.id, candidate));
    if (!row) return candidate;
    suffix += 1;
    candidate = `${username}-${suffix}`;
  }
}

export type GeneratedAccount = {
  studentId: string;
  username: string;
  password: string;
  createdAt: Date;
};

/**
 * Creates (or returns the existing) TOMAT/BLP-ready account for a roster
 * student. Idempotent unless `regenerate` is set, in which case a fresh
 * password is issued and the shared `students` row is updated in place.
 */
export async function getOrCreateStudentAccount(
  student: Student,
  options: { regenerate?: boolean } = {},
): Promise<GeneratedAccount> {
  const [existing] = await db
    .select()
    .from(studentAccountsTable)
    .where(eq(studentAccountsTable.studentId, student.id));

  if (existing && !options.regenerate) {
    return {
      studentId: student.id,
      username: existing.username,
      password: existing.password,
      createdAt: existing.createdAt,
    };
  }

  const password = randomPassword();
  const passwordHash = await bcrypt.hash(password, 10);

  if (existing) {
    await neonDb
      .update(tomatStudentsTable)
      .set({ password: passwordHash })
      .where(eq(tomatStudentsTable.id, existing.tomatStudentId));
    const [updated] = await db
      .update(studentAccountsTable)
      .set({ password })
      .where(eq(studentAccountsTable.id, existing.id))
      .returning();
    return {
      studentId: student.id,
      username: existing.username,
      password,
      createdAt: updated?.createdAt ?? existing.createdAt,
    };
  }

  const username = await uniqueUsername(student.namaLengkap);
  const tomatId = await uniqueTomatId(username);

  await neonDb.insert(tomatStudentsTable).values({
    id: tomatId,
    username,
    name: student.namaLengkap,
    password: passwordHash,
    kelas: student.kelas,
    email: `${username}@murid.local`,
    whatsapp: "-",
  });

  const [row] = await db
    .insert(studentAccountsTable)
    .values({
      studentId: student.id,
      tomatStudentId: tomatId,
      username,
      password,
    })
    .returning();

  return {
    studentId: student.id,
    username,
    password,
    createdAt: row.createdAt,
  };
}

export async function getStudentAccount(studentId: string): Promise<GeneratedAccount | null> {
  const [row] = await db
    .select()
    .from(studentAccountsTable)
    .where(eq(studentAccountsTable.studentId, studentId));
  if (!row) return null;
  return {
    studentId,
    username: row.username,
    password: row.password,
    createdAt: row.createdAt,
  };
}
