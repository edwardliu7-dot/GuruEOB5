import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, studentsTable, type Guru } from "@workspace/db";
import {
  ListStudentAccountsResponse,
  GenerateStudentAccountParams,
  GenerateStudentAccountBody,
  GenerateStudentAccountResponse,
  GetStudentAccountParams,
  GetStudentAccountResponse,
  GenerateAllStudentAccountsResponse,
} from "@workspace/api-zod";
import { requireAuth, getCurrentGuru } from "../lib/auth";
import {
  getOrCreateStudentAccount,
  getStudentAccount,
  type GeneratedAccount,
} from "../lib/student-accounts";
import { buildSingleAccountCardPdf, buildBulkAccountCardsPdf } from "../lib/student-account-card-pdf";

const router: IRouter = Router();

function hasRole(guru: Guru, role: string): boolean {
  return guru.jabatan.includes(role);
}

async function requireWaliKelas(req: Parameters<typeof getCurrentGuru>[0]): Promise<Guru | null> {
  const guru = await getCurrentGuru(req);
  if (!guru || !hasRole(guru, "wali_kelas") || !guru.waliKelasKelas) return null;
  return guru;
}

async function ownClassStudent(guru: Guru, studentId: string) {
  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, studentId));
  if (!student) return null;
  if (student.kelas !== guru.waliKelasKelas) return null;
  if (guru.school && student.school !== guru.school) return null;
  return student;
}

async function ownClassStudents(guru: Guru) {
  const kelas = guru.waliKelasKelas as string;
  return db
    .select()
    .from(studentsTable)
    .where(
      guru.school
        ? and(eq(studentsTable.kelas, kelas), eq(studentsTable.school, guru.school))
        : eq(studentsTable.kelas, kelas),
    );
}

router.get("/walikelas/akun-siswa", requireAuth, async (req, res): Promise<void> => {
  const guru = await requireWaliKelas(req);
  if (!guru) {
    res.status(403).json({ error: "Hanya wali kelas yang dapat mengakses fitur ini" });
    return;
  }

  const students = await ownClassStudents(guru);
  const result = await Promise.all(
    students.map(async (student) => {
      const account = await getStudentAccount(student.id);
      return {
        studentId: student.id,
        namaLengkap: student.namaLengkap,
        hasAccount: !!account,
        username: account?.username ?? null,
        password: account?.password ?? null,
      };
    }),
  );

  res.json(ListStudentAccountsResponse.parse(result));
});

router.post(
  "/walikelas/akun-siswa/:id/generate",
  requireAuth,
  async (req, res): Promise<void> => {
    const guru = await requireWaliKelas(req);
    if (!guru) {
      res.status(403).json({ error: "Hanya wali kelas yang dapat mengakses fitur ini" });
      return;
    }
    const params = GenerateStudentAccountParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const student = await ownClassStudent(guru, params.data.id);
    if (!student) {
      res.status(404).json({ error: "Siswa tidak ditemukan di kelas Anda" });
      return;
    }

    const body = GenerateStudentAccountBody.safeParse(req.body ?? {});
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }
    const regenerate = body.data.regenerate ?? false;
    try {
      const account = await getOrCreateStudentAccount(student, { regenerate });
      res.status(201).json(GenerateStudentAccountResponse.parse(account));
    } catch (err) {
      req.log.error({ err }, "Gagal membuat akun siswa");
      res.status(500).json({ error: "Gagal membuat akun siswa" });
    }
  },
);

router.post(
  "/walikelas/akun-siswa/generate-all",
  requireAuth,
  async (req, res): Promise<void> => {
    const guru = await requireWaliKelas(req);
    if (!guru) {
      res.status(403).json({ error: "Hanya wali kelas yang dapat mengakses fitur ini" });
      return;
    }

    const students = await ownClassStudents(guru);
    let generated = 0;
    let alreadyExisted = 0;
    const accounts: GeneratedAccount[] = [];
    for (const student of students) {
      const existing = await getStudentAccount(student.id);
      const account = await getOrCreateStudentAccount(student);
      accounts.push(account);
      if (existing) alreadyExisted++;
      else generated++;
    }

    res.json(
      GenerateAllStudentAccountsResponse.parse({ generated, alreadyExisted, accounts }),
    );
  },
);

router.get("/walikelas/akun-siswa/cards", requireAuth, async (req, res): Promise<void> => {
  const guru = await requireWaliKelas(req);
  if (!guru) {
    res.status(403).json({ error: "Hanya wali kelas yang dapat mengakses fitur ini" });
    return;
  }

  const students = await ownClassStudents(guru);
  const cardData = [];
  for (const student of students) {
    const account = await getStudentAccount(student.id);
    if (!account) continue;
    cardData.push({
      namaLengkap: student.namaLengkap,
      kelas: student.kelas,
      username: account.username,
      password: account.password,
    });
  }

  try {
    const buffer = await buildBulkAccountCardsPdf(guru.school ?? "-", cardData);
    const safeName = `Kartu_Akun_Siswa_${guru.waliKelasKelas}`.replace(/[^a-zA-Z0-9._-]/g, "_");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${safeName}.pdf"`);
    res.send(buffer);
  } catch (err) {
    req.log.error({ err }, "Gagal membuat kartu akun massal");
    res.status(500).json({ error: "Gagal membuat kartu akun massal" });
  }
});

router.get("/walikelas/akun-siswa/:id", requireAuth, async (req, res): Promise<void> => {
  const guru = await requireWaliKelas(req);
  if (!guru) {
    res.status(403).json({ error: "Hanya wali kelas yang dapat mengakses fitur ini" });
    return;
  }
  const params = GetStudentAccountParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const student = await ownClassStudent(guru, params.data.id);
  if (!student) {
    res.status(404).json({ error: "Siswa tidak ditemukan di kelas Anda" });
    return;
  }

  const account = await getStudentAccount(student.id);
  if (!account) {
    res.status(404).json({ error: "Akun belum digenerate" });
    return;
  }
  res.json(GetStudentAccountResponse.parse(account));
});

router.get("/walikelas/akun-siswa/:id/card", requireAuth, async (req, res): Promise<void> => {
  const guru = await requireWaliKelas(req);
  if (!guru) {
    res.status(403).json({ error: "Hanya wali kelas yang dapat mengakses fitur ini" });
    return;
  }
  const params = GetStudentAccountParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const student = await ownClassStudent(guru, params.data.id);
  if (!student) {
    res.status(404).json({ error: "Siswa tidak ditemukan di kelas Anda" });
    return;
  }
  const account = await getStudentAccount(student.id);
  if (!account) {
    res.status(404).json({ error: "Akun belum digenerate" });
    return;
  }

  try {
    const buffer = await buildSingleAccountCardPdf(guru.school ?? "-", {
      namaLengkap: student.namaLengkap,
      kelas: student.kelas,
      username: account.username,
      password: account.password,
    });
    const safeName = `Kartu_Akun_${student.namaLengkap}`.replace(/[^a-zA-Z0-9._-]/g, "_");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${safeName}.pdf"`);
    res.send(buffer);
  } catch (err) {
    req.log.error({ err }, "Gagal membuat kartu akun");
    res.status(500).json({ error: "Gagal membuat kartu akun" });
  }
});

export default router;
