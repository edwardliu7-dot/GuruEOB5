import { Router, type IRouter } from "express";
import { and, eq, gte, inArray } from "drizzle-orm";
import {
  db,
  subjectsTable,
  studentsTable,
  attendanceTable,
  gradesTable,
  prosemTable,
} from "@workspace/db";
import { GetRekapAbsensiResponse, GetRekapNilaiResponse } from "@workspace/api-zod";
import { requireAuth, getCurrentGuru } from "../lib/auth";

const router: IRouter = Router();

// ─── GET /rekap/absensi ───────────────────────────────────────────────────────
// Monthly attendance breakdown (last 6 months) across the teacher's subjects.
// Filter by kelas if provided.
router.get("/rekap/absensi", requireAuth, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru) { res.status(401).json({ error: "Unauthorized" }); return; }

  const kelasFilter = typeof req.query.kelas === "string" ? req.query.kelas : null;

  // Get teacher's subjects
  const subjects = await db
    .select({ id: subjectsTable.id })
    .from(subjectsTable)
    .where(eq(subjectsTable.teacherId, guru.id));

  const subjectIds = subjects.map((s) => s.id);

  if (subjectIds.length === 0) {
    res.json(GetRekapAbsensiResponse.parse({ kelasOptions: [], data: [] }));
    return;
  }

  // 6 months ago
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  const cutoff = sixMonthsAgo.toISOString().slice(0, 10);

  // Get attendance with student kelas
  const rows = await db
    .select({
      tanggal: attendanceTable.tanggal,
      status: attendanceTable.status,
      kelas: studentsTable.kelas,
    })
    .from(attendanceTable)
    .innerJoin(studentsTable, eq(studentsTable.id, attendanceTable.studentId))
    .where(
      and(
        inArray(attendanceTable.subjectId, subjectIds),
        gte(attendanceTable.tanggal, cutoff),
        ...(kelasFilter ? [eq(studentsTable.kelas, kelasFilter)] : []),
      ),
    );

  // Collect kelas options
  const kelasSet = new Set(rows.map((r) => r.kelas));
  const kelasOptions = [...kelasSet].sort();

  // Aggregate by (bulan, kelas)
  type Key = string;
  const agg = new Map<Key, { bulan: string; kelas: string; hadir: number; izin: number; sakit: number; alpa: number }>();

  for (const row of rows) {
    const bulan = row.tanggal.slice(0, 7); // "YYYY-MM"
    const key = `${bulan}__${row.kelas}`;
    if (!agg.has(key)) {
      agg.set(key, { bulan, kelas: row.kelas, hadir: 0, izin: 0, sakit: 0, alpa: 0 });
    }
    const entry = agg.get(key)!;
    if (row.status === "hadir") entry.hadir++;
    else if (row.status === "izin") entry.izin++;
    else if (row.status === "sakit") entry.sakit++;
    else if (row.status === "alpa") entry.alpa++;
  }

  const data = [...agg.values()]
    .map((e) => ({ ...e, total: e.hadir + e.izin + e.sakit + e.alpa }))
    .sort((a, b) => a.bulan.localeCompare(b.bulan) || a.kelas.localeCompare(b.kelas));

  res.json(GetRekapAbsensiResponse.parse({ kelasOptions, data }));
});

// ─── GET /rekap/nilai ─────────────────────────────────────────────────────────
// Grades summary per subject — average, min, max, and distribution buckets.
// Filter by kelas if provided.
router.get("/rekap/nilai", requireAuth, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru) { res.status(401).json({ error: "Unauthorized" }); return; }

  const kelasFilter = typeof req.query.kelas === "string" ? req.query.kelas : null;

  const subjects = await db
    .select({ id: subjectsTable.id, name: subjectsTable.name })
    .from(subjectsTable)
    .where(eq(subjectsTable.teacherId, guru.id));

  const subjectIds = subjects.map((s) => s.id);

  if (subjectIds.length === 0) {
    res.json(GetRekapNilaiResponse.parse({ kelasOptions: [], subjects: [] }));
    return;
  }

  // Get kelas for each subject from prosem
  const prosemRows = await db
    .select({ subjectId: prosemTable.subjectId, kelas: prosemTable.kelas })
    .from(prosemTable)
    .where(inArray(prosemTable.subjectId, subjectIds));

  const kelasBySubjectId = new Map<string, string>();
  for (const p of prosemRows) {
    if (!kelasBySubjectId.has(p.subjectId)) kelasBySubjectId.set(p.subjectId, p.kelas);
  }

  const kelasOptions = [...new Set([...kelasBySubjectId.values()])].sort();

  // Filter subjects by kelas if requested
  const filteredSubjectIds = kelasFilter
    ? subjectIds.filter((id) => kelasBySubjectId.get(id) === kelasFilter)
    : subjectIds;

  if (filteredSubjectIds.length === 0) {
    res.json(GetRekapNilaiResponse.parse({ kelasOptions, subjects: [] }));
    return;
  }

  const grades = await db
    .select({ subjectId: gradesTable.subjectId, nilai: gradesTable.nilai })
    .from(gradesTable)
    .where(inArray(gradesTable.subjectId, filteredSubjectIds));

  // Group by subjectId
  const bySubject = new Map<string, number[]>();
  for (const g of grades) {
    const list = bySubject.get(g.subjectId) ?? [];
    list.push(g.nilai);
    bySubject.set(g.subjectId, list);
  }

  const RANGES = [
    { label: "0-39", min: 0, max: 39 },
    { label: "40-54", min: 40, max: 54 },
    { label: "55-69", min: 55, max: 69 },
    { label: "70-79", min: 70, max: 79 },
    { label: "80-89", min: 80, max: 89 },
    { label: "90-100", min: 90, max: 100 },
  ];

  const result = filteredSubjectIds.map((subjectId) => {
    const subj = subjects.find((s) => s.id === subjectId)!;
    const nilaiList = bySubject.get(subjectId) ?? [];
    const kelas = kelasBySubjectId.get(subjectId) ?? "-";

    const rataRata = nilaiList.length
      ? Math.round((nilaiList.reduce((a, b) => a + b, 0) / nilaiList.length) * 10) / 10
      : null;
    const nilaiMin = nilaiList.length ? Math.min(...nilaiList) : null;
    const nilaiMax = nilaiList.length ? Math.max(...nilaiList) : null;

    const distribusi = RANGES.map(({ label, min, max }) => ({
      range: label,
      jumlah: nilaiList.filter((n) => n >= min && n <= max).length,
    }));

    return {
      subjectId,
      subjectName: subj.name,
      kelas,
      rataRata,
      nilaiMin,
      nilaiMax,
      jumlahNilai: nilaiList.length,
      distribusi,
    };
  });

  res.json(GetRekapNilaiResponse.parse({ kelasOptions, subjects: result }));
});

export default router;
