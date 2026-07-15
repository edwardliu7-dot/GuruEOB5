import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db, neonDb, studentAccountsTable, tomatStudentsTable, type Student } from "@workspace/db";

const USERNAME_BASE_LENGTH = 5;
const USERNAME_MAX_LENGTH = 7;

function alnumLower(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[^a-z0-9]/g, "");
}

/** Short 5-character base derived from the student's name, e.g. "Uji Siswa Alpha" -> "ujisi". */
function usernameBase(namaLengkap: string): string {
  const letters = alnumLower(namaLengkap) || "siswa";
  if (letters.length >= USERNAME_BASE_LENGTH) return letters.slice(0, USERNAME_BASE_LENGTH);
  return letters.padEnd(USERNAME_BASE_LENGTH, "x");
}

function randomAlnum(length: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
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
  const base = usernameBase(namaLengkap);

  // 1) Try the bare 5-char base.
  if (!(await usernameTaken(base))) return base;

  // 2) Try base + 1 digit (6 chars), then base + 2 digits (7 chars).
  for (let extraDigits = 1; extraDigits <= USERNAME_MAX_LENGTH - USERNAME_BASE_LENGTH; extraDigits++) {
    const max = 10 ** extraDigits;
    for (let n = extraDigits === 1 ? 2 : 10; n < max; n++) {
      const candidate = `${base}${n}`;
      if (!(await usernameTaken(candidate))) return candidate;
    }
  }

  // 3) Extremely unlikely fallback: fully random short alphanumeric handle.
  while (true) {
    const candidate = randomAlnum(USERNAME_MAX_LENGTH);
    if (!(await usernameTaken(candidate))) return candidate;
  }
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
 * username AND password are issued and the shared `students` row is updated
 * in place (same row id, so the student's TOMAT/BLP progress -- nilai,
 * daily_records, inventory, badges -- all of which are foreign-keyed to that
 * id, is preserved; only the login credentials change).
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
    const username = await uniqueUsername(student.namaLengkap);

    await neonDb
      .update(tomatStudentsTable)
      .set({ username, password: passwordHash })
      .where(eq(tomatStudentsTable.id, existing.tomatStudentId));
    const [updated] = await db
      .update(studentAccountsTable)
      .set({ username, password })
      .where(eq(studentAccountsTable.id, existing.id))
      .returning();
    return {
      studentId: student.id,
      username,
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
