import { Router, type IRouter } from "express";
import { count, eq, gte } from "drizzle-orm";
import {
  db,
  studentsTable,
  teachersTable,
  documentsTable,
  journalEntriesTable,
} from "@workspace/db";
import { GetDashboardSummaryResponse } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/dashboard/summary", requireAuth, async (req, res): Promise<void> => {
  const [teacher] = await db
    .select()
    .from(teachersTable)
    .where(eq(teachersTable.id, req.session.teacherId as string));

  if (!teacher) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [[{ totalSiswa = 0 } = { totalSiswa: 0 }], [{ totalGuru = 0 } = { totalGuru: 0 }], [
    { totalDokumen = 0 } = { totalDokumen: 0 },
  ]] = await Promise.all([
    db
      .select({ totalSiswa: count() })
      .from(studentsTable)
      .where(eq(studentsTable.school, teacher.school)),
    db
      .select({ totalGuru: count() })
      .from(teachersTable)
      .where(eq(teachersTable.school, teacher.school)),
    db.select({ totalDokumen: count() }).from(documentsTable),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const [{ jurnalHariIni = 0 } = { jurnalHariIni: 0 }] = await db
    .select({ jurnalHariIni: count() })
    .from(journalEntriesTable)
    .where(eq(journalEntriesTable.tanggal, today));

  const monthStart = new Date();
  monthStart.setDate(1);
  const monthStartStr = monthStart.toISOString().slice(0, 10);

  const entriesThisMonth = await db
    .select()
    .from(journalEntriesTable)
    .where(gte(journalEntriesTable.tanggal, monthStartStr));

  const weekBuckets = new Map<number, number>();
  for (const entry of entriesThisMonth) {
    const day = new Date(entry.tanggal).getDate();
    const week = Math.min(4, Math.ceil(day / 7));
    weekBuckets.set(week, (weekBuckets.get(week) ?? 0) + 1);
  }

  const progresJurnalBulanIni = Array.from({ length: 4 }, (_, i) => ({
    minggu: `Minggu ${i + 1}`,
    jumlah: weekBuckets.get(i + 1) ?? 0,
  }));

  const totalPossibleDocs = totalGuru * 5;
  const kelengkapanAdministrasiPersen =
    totalPossibleDocs > 0 ? Math.min(100, Math.round((totalDokumen / totalPossibleDocs) * 100)) : 0;

  const now = new Date();
  const tahunAjaran =
    now.getMonth() >= 6
      ? `${now.getFullYear()}/${now.getFullYear() + 1}`
      : `${now.getFullYear() - 1}/${now.getFullYear()}`;
  const semester = now.getMonth() >= 6 ? "Ganjil" : "Genap";

  res.json(
    GetDashboardSummaryResponse.parse({
      totalSiswa,
      totalGuru,
      totalDokumen,
      jurnalHariIniTerisi: jurnalHariIni > 0,
      progresJurnalBulanIni,
      kelengkapanAdministrasiPersen,
      schoolName: teacher.school,
      tahunAjaran,
      semester,
    }),
  );
});

export default router;
