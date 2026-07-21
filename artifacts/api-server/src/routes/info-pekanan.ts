import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import {
  db,
  academicCalendarsTable,
  academicWeeksTable,
  prosemTable,
  prosemItemsTable,
  subjectsTable,
  journalEntriesTable,
  schedulesTable,
} from "@workspace/db";
import { GetInfoPekananResponse } from "@workspace/api-zod";
import { requireAuth, getCurrentGuru } from "../lib/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

type InfoItem = {
  prosemItemId: string | null;
  subjectId: string;
  subjectName: string;
  kelas: string;
  kd: string | null;
  materi: string;
  jp: number | null;
  status: string;
  journalEntryId: string | null;
};

router.get("/info-pekanan", requireAuth, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const teacherId = guru.id;
  const calendarId =
    typeof req.query["calendarId"] === "string" ? req.query["calendarId"] : undefined;
  const weekId = typeof req.query["weekId"] === "string" ? req.query["weekId"] : undefined;

  const empty = {
    weekId: null,
    pekanKe: null,
    tanggalMulai: null,
    tanggalSelesai: null,
    jenis: null,
    totalRencana: 0,
    totalSesuai: 0,
    totalTertinggal: 0,
    totalDiDepan: 0,
    items: [] as InfoItem[],
  };

  if (!calendarId || !weekId) {
    res.json(GetInfoPekananResponse.parse(empty));
    return;
  }

  const [calendar] = await db
    .select()
    .from(academicCalendarsTable)
    .where(eq(academicCalendarsTable.id, calendarId));
  if (!calendar) {
    res.json(GetInfoPekananResponse.parse(empty));
    return;
  }
  // Only enforce school-scoped calendar ownership when the teacher has a school
  // assigned. Teachers without a school set can still view their own prosem data.
  if (guru.school && calendar.school !== guru.school) {
    res.json(GetInfoPekananResponse.parse(empty));
    return;
  }

  const [week] = await db
    .select()
    .from(academicWeeksTable)
    .where(
      and(eq(academicWeeksTable.id, weekId), eq(academicWeeksTable.calendarId, calendarId)),
    );
  if (!week) {
    res.json(GetInfoPekananResponse.parse(empty));
    return;
  }

  const [subjectRows, scheduleRows] = await Promise.all([
    db.select().from(subjectsTable).where(eq(subjectsTable.teacherId, teacherId)),
    db
      .select({
        subjectId: schedulesTable.subjectId,
        kelas: schedulesTable.kelas,
        hari: schedulesTable.hari,
      })
      .from(schedulesTable)
      .where(eq(schedulesTable.teacherId, teacherId)),
  ]);

  const subjectName = new Map(subjectRows.map((s) => [s.id, s.name]));

  // Build a lookup: "subjectId|||normKelas" → set of hari names for this teacher.
  // Used later to determine whether a prosem item still has an upcoming scheduled
  // teaching slot within the current week before marking it as "tertinggal".
  const normKelas = (k: string) => k.trim().toLowerCase();
  const scheduleByKey = new Map<string, Set<string>>();
  for (const s of scheduleRows) {
    const key = `${s.subjectId}|||${normKelas(s.kelas)}`;
    if (!scheduleByKey.has(key)) scheduleByKey.set(key, new Set());
    scheduleByKey.get(key)!.add(s.hari);
  }

  // Map day-of-week names to their ISO date within the academic week.
  // We assume tanggalMulai is always Monday (Senin) as is standard for school weeks.
  const HARI_OFFSET: Record<string, number> = {
    Senin: 0, Selasa: 1, Rabu: 2, Kamis: 3, Jumat: 4, Sabtu: 5,
  };
  /** Returns the ISO date (YYYY-MM-DD) of a given day name within this week, or null.
   *  Uses pure UTC date arithmetic so day-boundary shifts don't cause off-by-one errors. */
  function hariToDate(hari: string): string | null {
    const offset = HARI_OFFSET[hari];
    if (offset === undefined) return null;
    const base = new Date(week.tanggalMulai.slice(0, 10) + "T00:00:00Z");
    base.setUTCDate(base.getUTCDate() + offset);
    return base.toISOString().slice(0, 10);
  }

  // Fetch journal entries with explicit column selection.
  // We use CUMULATIVE matching: include all journals written on or before the
  // selected week's end date. This means:
  //   - A topic planned for week 3 shows "sesuai" if the teacher taught it in
  //     week 1, 2, or 3 (early teaching still counts).
  //   - Avoids the common failure where today falls outside any defined week's
  //     date range, causing the system to show week 1 with no journals.
  const weekEnd = week.tanggalSelesai.slice(0, 10);
  let weekJournals: Array<{
    id: string;
    subjectId: string;
    kelas: string;
    tanggal: string;
    materi: string;
    prosemItemId: string | null;
  }> = [];
  try {
    const journalRows = await db
      .select({
        id: journalEntriesTable.id,
        subjectId: journalEntriesTable.subjectId,
        kelas: journalEntriesTable.kelas,
        tanggal: journalEntriesTable.tanggal,
        materi: journalEntriesTable.materi,
        prosemItemId: journalEntriesTable.prosemItemId,
      })
      .from(journalEntriesTable)
      .where(eq(journalEntriesTable.teacherId, teacherId));
    // Include all journals up to (and including) the end of the selected week.
    weekJournals = journalRows.filter((j) => j.tanggal.slice(0, 10) <= weekEnd);
  } catch (journalErr) {
    // Column prosem_item_id doesn't exist yet in the production DB.
    // Fall back to fetching without it so the page still renders.
    logger.warn({ err: journalErr }, "prosem_item_id column missing — fetching journals without it");
    const journalRows = await db
      .select({
        id: journalEntriesTable.id,
        subjectId: journalEntriesTable.subjectId,
        kelas: journalEntriesTable.kelas,
        tanggal: journalEntriesTable.tanggal,
        materi: journalEntriesTable.materi,
      })
      .from(journalEntriesTable)
      .where(eq(journalEntriesTable.teacherId, teacherId));
    weekJournals = journalRows
      .filter((j) => j.tanggal.slice(0, 10) <= weekEnd)
      .map((j) => ({ ...j, prosemItemId: null }));
  }

  // Join prosem_items → prosem → academic_weeks and match by the active week's
  // date range (tanggalMulai + tanggalSelesai) rather than an exact weekId UUID.
  //
  // This is more robust than UUID matching: if the admin ever deleted and recreated
  // the academic calendar (producing new week UUIDs), prosem items that were saved
  // against the old UUIDs would still surface here as long as the date range matches.
  const planRows = await db
    .select({
      prosemItemId: prosemItemsTable.id,
      weekId: prosemItemsTable.weekId,
      kd: prosemItemsTable.kd,
      materi: prosemItemsTable.materi,
      jp: prosemItemsTable.jp,
      subjectId: prosemTable.subjectId,
      kelas: prosemTable.kelas,
    })
    .from(prosemItemsTable)
    .innerJoin(prosemTable, eq(prosemItemsTable.prosemId, prosemTable.id))
    .innerJoin(academicWeeksTable, eq(prosemItemsTable.weekId, academicWeeksTable.id))
    .where(
      and(
        eq(prosemTable.teacherId, teacherId),
        eq(academicWeeksTable.tanggalMulai, week.tanggalMulai),
        eq(academicWeeksTable.tanggalSelesai, week.tanggalSelesai),
      ),
    );

  logger.info(
    { teacherId, weekTanggalMulai: week.tanggalMulai, weekTanggalSelesai: week.tanggalSelesai, planRowsCount: planRows.length, weekJournalsCount: weekJournals.length },
    "info-pekanan query results",
  );

  const items: InfoItem[] = [];
  const matchedJournalIds = new Set<string>();

  // Use Jakarta time (WIB = UTC+7) for all "today" comparisons so the
  // status boundary flips at midnight Jakarta, not midnight UTC.
  const todayJakarta = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const today = todayJakarta;
  const isWeekOver = week.tanggalSelesai.slice(0, 10) < today;

  for (const pi of planRows) {
    // Prefer an explicit link to this exact topic (set when the teacher picks
    // it from the Prosem while writing the journal entry). Fall back to the
    // subject+kelas heuristic for entries that don't have a prosemItemId link.
    const linked = weekJournals.find(
      (j) => j.prosemItemId != null && j.prosemItemId === pi.prosemItemId && !matchedJournalIds.has(j.id),
    );
    const match =
      linked ??
      weekJournals.find(
        (j) =>
          j.prosemItemId == null &&
          j.subjectId === pi.subjectId &&
          normKelas(j.kelas) === normKelas(pi.kelas) &&
          !matchedJournalIds.has(j.id),
      );
    if (match) matchedJournalIds.add(match.id);

    // Determine status using schedule-aware logic:
    // 1. If there is a matching journal → "sesuai".
    // 2. Otherwise, look up the teacher's scheduled days for this subject+kelas.
    //    - Find the latest scheduled teaching date within this week.
    //    - If that date is today or in the future → "belum" (still has time to teach).
    //    - If all scheduled dates have passed → "tertinggal".
    // 3. If no schedule is recorded for this subject+kelas, fall back to
    //    checking whether the whole week has ended.
    let status: string;
    if (match) {
      status = "sesuai";
    } else {
      const schedKey = `${pi.subjectId}|||${normKelas(pi.kelas)}`;
      const haris = scheduleByKey.get(schedKey);
      if (haris && haris.size > 0) {
        const scheduledDates = [...haris].map(hariToDate).filter(Boolean) as string[];
        const lastDate = scheduledDates.sort().at(-1)!;
        status = lastDate >= today ? "belum" : "tertinggal";
      } else {
        // No schedule data for this subject+class — fall back to week-end check.
        status = isWeekOver ? "tertinggal" : "belum";
      }
    }

    items.push({
      prosemItemId: pi.prosemItemId,
      subjectId: pi.subjectId,
      subjectName: subjectName.get(pi.subjectId) ?? "-",
      kelas: pi.kelas,
      kd: pi.kd,
      materi: pi.materi,
      jp: pi.jp,
      status,
      journalEntryId: match ? match.id : null,
    });
  }

  // "di_depan" entries (journal without a prosem plan) only apply when the
  // week has started. For a future week, those journals don't exist yet.
  const weekStarted = week.tanggalMulai.slice(0, 10) <= today;
  if (weekStarted) {
    for (const j of weekJournals) {
      if (matchedJournalIds.has(j.id)) continue;
      items.push({
        prosemItemId: null,
        subjectId: j.subjectId,
        subjectName: subjectName.get(j.subjectId) ?? "-",
        kelas: j.kelas,
        kd: null,
        materi: j.materi,
        jp: null,
        status: "di_depan",
        journalEntryId: j.id,
      });
    }
  }

  const payload = {
    weekId: week.id,
    pekanKe: week.pekanKe,
    tanggalMulai: week.tanggalMulai,
    tanggalSelesai: week.tanggalSelesai,
    jenis: week.jenis,
    totalRencana: items.filter((i) => i.prosemItemId !== null).length,
    totalSesuai: items.filter((i) => i.status === "sesuai").length,
    // "belum" items (future weeks) are excluded from "tertinggal" count.
    totalTertinggal: items.filter((i) => i.status === "tertinggal").length,
    totalDiDepan: items.filter((i) => i.status === "di_depan").length,
    items,
  };

  res.json(GetInfoPekananResponse.parse(payload));
});

export default router;
