import { Router, type IRouter } from "express";
import { count, eq, gte, and } from "drizzle-orm";
import {
  db,
  studentsTable,
  documentsTable,
  subjectsTable,
  journalEntriesTable,
  neonDb,
  gurusTable,
} from "@workspace/db";
import { GetDashboardSummaryResponse } from "@workspace/api-zod";
import { requireAuth, getCurrentGuru, sameSchoolFilter } from "../lib/auth";

const router: IRouter = Router();

router.get("/dashboard/summary", requireAuth, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);

  if (!guru) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [
    [{ totalSiswa = 0 } = { totalSiswa: 0 }],
    [{ totalGuru = 0 } = { totalGuru: 0 }],
    [{ totalDokumen = 0 } = { totalDokumen: 0 }],
  ] = await Promise.all([
    guru.school
      ? db.select({ totalSiswa: count() }).from(studentsTable).where(eq(studentsTable.school, guru.school))
      : db.select({ totalSiswa: count() }).from(studentsTable),
    neonDb.select({ totalGuru: count() }).from(gurusTable).where(sameSchoolFilter(guru)),
    // Only count this teacher's own documents (documents hang off their subjects,
    // which are always owned by a single teacher) -- otherwise every teacher sees
    // the whole DB's document count, leaking other teachers'/schools' data.
    db
      .select({ totalDokumen: count() })
      .from(documentsTable)
      .innerJoin(subjectsTable, eq(subjectsTable.id, documentsTable.subjectId))
      .where(eq(subjectsTable.teacherId, guru.id)),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const [{ jurnalHariIni = 0 } = { jurnalHariIni: 0 }] = await db
    .select({ jurnalHariIni: count() })
    .from(journalEntriesTable)
    .where(and(eq(journalEntriesTable.tanggal, today), eq(journalEntriesTable.teacherId, guru.id)));

  const monthStart = new Date();
  monthStart.setDate(1);
  const monthStartStr = monthStart.toISOString().slice(0, 10);

  // Only select tanggal — avoids crashing if prosem_item_id column hasn't been
  // added to the production DB yet (schema drift).
  const entriesThisMonth = await db
    .select({ tanggal: journalEntriesTable.tanggal })
    .from(journalEntriesTable)
    .where(
      and(
        gte(journalEntriesTable.tanggal, monthStartStr),
        eq(journalEntriesTable.teacherId, guru.id),
      ),
    );

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
      schoolName: guru.school ?? "Sekolah",
      tahunAjaran,
      semester,
    }),
  );
});

export default router;
