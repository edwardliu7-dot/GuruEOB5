import { Router, type IRouter } from "express";
import { and, desc, eq, gte, inArray } from "drizzle-orm";
import {
  db,
  studentsTable,
  subjectsTable,
  documentsTable,
  journalEntriesTable,
  attendanceTable,
  gradesTable,
  pointsTable,
  prosemTable,
  neonDb,
  gurusTable,
  type Guru,
} from "@workspace/db";
import {
  GetKepsekOverviewResponse,
  GetKurikulumOverviewResponse,
  GetKesiswaanOverviewResponse,
  GetWaliKelasRekapResponse,
  GetKepsekJurnalResponse,
  GetKurikulumJurnalResponse,
  GetWaliKelasJurnalResponse,
} from "@workspace/api-zod";
import { requireAuth, getCurrentGuru, sameSchoolFilter } from "../lib/auth";

function schoolStudentsFilter(guru: Guru) {
  return guru.school ? eq(studentsTable.school, guru.school) : undefined;
}

const router: IRouter = Router();

const DOCS_PER_SUBJECT = 5;

function hasRole(guru: Guru, role: string): boolean {
  return guru.jabatan.includes(role);
}

function isKepsek(guru: Guru): boolean {
  return hasRole(guru, "kepala_sekolah");
}

function isWakasek(guru: Guru, bidang: string): boolean {
  return hasRole(guru, "wakasek") && guru.wakasekBidang === bidang;
}

router.get("/kepsek/overview", requireAuth, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (!isKepsek(guru)) {
    res.status(403).json({ error: "Hanya kepala sekolah yang dapat mengakses halaman ini" });
    return;
  }

  const monthStart = new Date();
  monthStart.setDate(1);
  const monthStartStr = monthStart.toISOString().slice(0, 10);

  const schoolWhere = guru.school ? eq(gurusTable.school, guru.school) : undefined;
  const [gurus, subjects, documents, journalThisMonth] = await Promise.all([
    schoolWhere
      ? neonDb.select().from(gurusTable).where(schoolWhere)
      : neonDb.select().from(gurusTable),
    db.select().from(subjectsTable),
    db.select().from(documentsTable),
    db
      .select()
      .from(journalEntriesTable)
      .where(gte(journalEntriesTable.tanggal, monthStartStr)),
  ]);

  const docsBySubject = new Map<string, number>();
  for (const doc of documents) {
    docsBySubject.set(doc.subjectId, (docsBySubject.get(doc.subjectId) ?? 0) + 1);
  }

  const teachers = gurus.map((g) => {
    const guruSubjects = subjects.filter((s) => s.teacherId === g.id);
    const dokumenSelesai = guruSubjects.reduce(
      (sum, s) => sum + (docsBySubject.get(s.id) ?? 0),
      0,
    );
    const dokumenTotal = guruSubjects.length * DOCS_PER_SUBJECT;
    const jurnalBulanIni = journalThisMonth.filter((j) => j.teacherId === g.id).length;
    const kelengkapanPersen =
      dokumenTotal > 0 ? Math.min(100, Math.round((dokumenSelesai / dokumenTotal) * 100)) : 0;

    return {
      username: g.username,
      name: g.name,
      jabatan: g.jabatan,
      mapel: g.mapel,
      jurnalBulanIni,
      dokumenTotal,
      dokumenSelesai,
      kelengkapanPersen,
    };
  });

  res.json(GetKepsekOverviewResponse.parse({ teachers }));
});

router.get("/kurikulum/overview", requireAuth, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (!isKepsek(guru) && !isWakasek(guru, "Kurikulum")) {
    res.status(403).json({ error: "Hanya wakasek kurikulum yang dapat mengakses halaman ini" });
    return;
  }

  const kurikulumSchoolWhere = guru.school ? eq(gurusTable.school, guru.school) : undefined;
  const [gurus, subjects, documents] = await Promise.all([
    kurikulumSchoolWhere
      ? neonDb.select().from(gurusTable).where(kurikulumSchoolWhere)
      : neonDb.select().from(gurusTable),
    db.select().from(subjectsTable),
    db.select().from(documentsTable),
  ]);

  const docsBySubject = new Map<string, typeof documents>();
  for (const doc of documents) {
    const list = docsBySubject.get(doc.subjectId) ?? [];
    list.push(doc);
    docsBySubject.set(doc.subjectId, list);
  }

  const teachers = gurus.map((g) => ({
    username: g.username,
    name: g.name,
    mapel: g.mapel,
    subjects: subjects
      .filter((s) => s.teacherId === g.id)
      .map((s) => ({
        subjectId: s.id,
        subjectName: s.name,
        documents: docsBySubject.get(s.id) ?? [],
      })),
  }));

  res.json(GetKurikulumOverviewResponse.parse({ teachers }));
});

router.get("/kesiswaan/overview", requireAuth, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (!isKepsek(guru) && !isWakasek(guru, "Kesiswaan")) {
    res.status(403).json({ error: "Hanya wakasek kesiswaan yang dapat mengakses halaman ini" });
    return;
  }

  const studentFilter = schoolStudentsFilter(guru);
  const students = studentFilter
    ? await db.select().from(studentsTable).where(studentFilter)
    : await db.select().from(studentsTable);
  const scopedStudentIds = students.map((s) => s.id);

  const [attendance, points] =
    scopedStudentIds.length > 0
      ? await Promise.all([
          db
            .select()
            .from(attendanceTable)
            .where(inArray(attendanceTable.studentId, scopedStudentIds)),
          db.select().from(pointsTable).where(inArray(pointsTable.studentId, scopedStudentIds)),
        ])
      : [[], []];

  const studentById = new Map(students.map((s) => [s.id, s]));
  const kelasSet = [...new Set(students.map((s) => s.kelas))].sort();

  const perKelas = kelasSet.map((kelas) => {
    const kelasStudents = students.filter((s) => s.kelas === kelas);
    const kelasStudentIds = new Set(kelasStudents.map((s) => s.id));
    const kelasAttendance = attendance.filter((a) => kelasStudentIds.has(a.studentId));
    const kelasPoints = points.filter((p) => kelasStudentIds.has(p.studentId));

    return {
      kelas,
      totalSiswa: kelasStudents.length,
      hadir: kelasAttendance.filter((a) => a.status === "hadir").length,
      izin: kelasAttendance.filter((a) => a.status === "izin").length,
      sakit: kelasAttendance.filter((a) => a.status === "sakit").length,
      alpa: kelasAttendance.filter((a) => a.status === "alpa").length,
      totalPoinPositif: kelasPoints
        .filter((p) => p.jenis === "positif")
        .reduce((sum, p) => sum + p.poin, 0),
      totalPoinNegatif: kelasPoints
        .filter((p) => p.jenis === "negatif")
        .reduce((sum, p) => sum + p.poin, 0),
    };
  });

  const poinByStudent = new Map<string, number>();
  for (const p of points) {
    if (p.jenis !== "negatif") continue;
    poinByStudent.set(p.studentId, (poinByStudent.get(p.studentId) ?? 0) + p.poin);
  }

  const siswaPoinTerbanyak = [...poinByStudent.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .flatMap(([studentId, totalPoin]) => {
      const student = studentById.get(studentId);
      if (!student) return [];
      return [
        {
          studentId,
          namaLengkap: student.namaLengkap,
          kelas: student.kelas,
          totalPoin,
        },
      ];
    });

  res.json(GetKesiswaanOverviewResponse.parse({ perKelas, siswaPoinTerbanyak }));
});

router.get("/walikelas/rekap", requireAuth, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (!hasRole(guru, "wali_kelas") || !guru.waliKelasKelas) {
    res.status(403).json({ error: "Hanya wali kelas yang dapat mengakses halaman ini" });
    return;
  }

  const kelas = guru.waliKelasKelas;
  const studentFilter = schoolStudentsFilter(guru);
  const students = await db
    .select()
    .from(studentsTable)
    .where(studentFilter ? and(eq(studentsTable.kelas, kelas), studentFilter) : eq(studentsTable.kelas, kelas));
  const studentIds = students.map((s) => s.id);

  const [attendance, grades, points] =
    studentIds.length > 0
      ? await Promise.all([
          db.select().from(attendanceTable).where(inArray(attendanceTable.studentId, studentIds)),
          db.select().from(gradesTable).where(inArray(gradesTable.studentId, studentIds)),
          db.select().from(pointsTable).where(inArray(pointsTable.studentId, studentIds)),
        ])
      : [[], [], []];

  const siswa = students.map((s) => {
    const att = attendance.filter((a) => a.studentId === s.id);
    const studentGrades = grades.filter((g) => g.studentId === s.id);
    const studentPoints = points.filter((p) => p.studentId === s.id);

    const rataNilai =
      studentGrades.length > 0
        ? Math.round(
            (studentGrades.reduce((sum, g) => sum + g.nilai, 0) / studentGrades.length) * 10,
          ) / 10
        : null;

    const totalPoin = studentPoints.reduce(
      (sum, p) => sum + (p.jenis === "negatif" ? p.poin : -p.poin),
      0,
    );

    return {
      studentId: s.id,
      nisn: s.nisn ?? "",
      namaLengkap: s.namaLengkap,
      jenisKelamin: s.jenisKelamin,
      hadir: att.filter((a) => a.status === "hadir").length,
      izin: att.filter((a) => a.status === "izin").length,
      sakit: att.filter((a) => a.status === "sakit").length,
      alpa: att.filter((a) => a.status === "alpa").length,
      rataNilai,
      totalPoin,
    };
  });

  res.json(GetWaliKelasRekapResponse.parse({ kelas, siswa }));
});

// ─── Helper: Build RoleJurnalEntry list ──────────────────────────────────────
async function buildJurnalEntries(
  journals: { id: string; teacherId: string; subjectId: string; tanggal: string; materi: string; catatan: string | null; [key: string]: unknown }[],
  teacherIds: string[],
): Promise<{ id: string; teacherName: string; subjectName: string; kelas: string; tanggal: string; materi: string; catatan: string | null }[]> {
  if (journals.length === 0) return [];

  // Fetch teacher names from Neon (shared gurus table)
  const guruRows = teacherIds.length
    ? await neonDb.select({ id: gurusTable.id, name: gurusTable.name })
        .from(gurusTable)
        .where(inArray(gurusTable.id, teacherIds))
    : [];
  const teacherNameById = new Map(guruRows.map((g) => [g.id, g.name]));

  // Fetch subject names
  const subjectIds = [...new Set(journals.map((j: any) => j.subjectId as string))];
  const subjectRows = subjectIds.length
    ? await db.select({ id: subjectsTable.id, name: subjectsTable.name }).from(subjectsTable)
        .where(inArray(subjectsTable.id, subjectIds))
    : [];
  const subjectNameById = new Map(subjectRows.map((s) => [s.id, s.name]));

  // Fetch kelas from prosem (first match per subjectId)
  const prosemRows = subjectIds.length
    ? await db.select({ subjectId: prosemTable.subjectId, kelas: prosemTable.kelas })
        .from(prosemTable)
        .where(inArray(prosemTable.subjectId, subjectIds))
    : [];
  const kelasBySubjectId = new Map<string, string>();
  for (const p of prosemRows) {
    if (!kelasBySubjectId.has(p.subjectId)) kelasBySubjectId.set(p.subjectId, p.kelas);
  }

  return journals.map((j: any) => ({
    id: j.id,
    teacherName: teacherNameById.get(j.teacherId) ?? j.teacherId,
    subjectName: subjectNameById.get(j.subjectId) ?? j.subjectId,
    kelas: kelasBySubjectId.get(j.subjectId) ?? "-",
    tanggal: j.tanggal,
    materi: j.materi,
    catatan: j.catatan ?? null,
  }));
}

// ─── Kepala Sekolah: lihat semua jurnal guru ─────────────────────────────────
router.get("/kepsek/jurnal", requireAuth, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru) { res.status(401).json({ error: "Unauthorized" }); return; }
  if (!isKepsek(guru)) {
    res.status(403).json({ error: "Hanya kepala sekolah yang dapat mengakses halaman ini" });
    return;
  }

  const schoolFilter = guru.school ? eq(gurusTable.school, guru.school) : undefined;
  const guruRows = schoolFilter
    ? await neonDb.select({ id: gurusTable.id }).from(gurusTable).where(schoolFilter)
    : await neonDb.select({ id: gurusTable.id }).from(gurusTable);
  const guruIds = guruRows.map((g) => g.id);

  const journals = guruIds.length
    ? await db.select().from(journalEntriesTable)
        .where(inArray(journalEntriesTable.teacherId, guruIds))
        .orderBy(desc(journalEntriesTable.tanggal))
    : [];

  const entries = await buildJurnalEntries(journals, guruIds);
  res.json(GetKepsekJurnalResponse.parse({ entries }));
});

// ─── Wakasek Kurikulum: lihat semua jurnal guru ──────────────────────────────
router.get("/kurikulum/jurnal", requireAuth, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru) { res.status(401).json({ error: "Unauthorized" }); return; }
  if (!isKepsek(guru) && !isWakasek(guru, "Kurikulum")) {
    res.status(403).json({ error: "Hanya wakasek kurikulum yang dapat mengakses halaman ini" });
    return;
  }

  const schoolFilter = guru.school ? eq(gurusTable.school, guru.school) : undefined;
  const guruRows = schoolFilter
    ? await neonDb.select({ id: gurusTable.id }).from(gurusTable).where(schoolFilter)
    : await neonDb.select({ id: gurusTable.id }).from(gurusTable);
  const guruIds = guruRows.map((g) => g.id);

  const journals = guruIds.length
    ? await db.select().from(journalEntriesTable)
        .where(inArray(journalEntriesTable.teacherId, guruIds))
        .orderBy(desc(journalEntriesTable.tanggal))
    : [];

  const entries = await buildJurnalEntries(journals, guruIds);
  res.json(GetKurikulumJurnalResponse.parse({ entries }));
});

// ─── Wali Kelas: lihat jurnal untuk kelasnya ─────────────────────────────────
router.get("/walikelas/jurnal", requireAuth, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru) { res.status(401).json({ error: "Unauthorized" }); return; }
  if (!hasRole(guru, "wali_kelas") || !guru.waliKelasKelas) {
    res.status(403).json({ error: "Hanya wali kelas yang dapat mengakses halaman ini" });
    return;
  }

  const kelas = guru.waliKelasKelas;

  // Get subjects that have prosem for this kelas
  const prosemRows = await db
    .select({ subjectId: prosemTable.subjectId })
    .from(prosemTable)
    .where(eq(prosemTable.kelas, kelas));
  const subjectIds = [...new Set(prosemRows.map((p) => p.subjectId))];

  const journals = subjectIds.length
    ? await db.select().from(journalEntriesTable)
        .where(inArray(journalEntriesTable.subjectId, subjectIds))
        .orderBy(desc(journalEntriesTable.tanggal))
    : [];

  const allTeacherIds = [...new Set(journals.map((j) => j.teacherId))];
  const entries = await buildJurnalEntries(journals, allTeacherIds);
  res.json(GetWaliKelasJurnalResponse.parse({ entries }));
});

export default router;
