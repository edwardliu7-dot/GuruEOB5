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
} from "@workspace/db";
import { GetInfoPekananResponse } from "@workspace/api-zod";
import { requireAuth, getCurrentGuru } from "../lib/auth";

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

  const subjectRows = await db
    .select()
    .from(subjectsTable)
    .where(eq(subjectsTable.teacherId, teacherId));
  const subjectName = new Map(subjectRows.map((s) => [s.id, s.name]));

  const journalRows = await db
    .select()
    .from(journalEntriesTable)
    .where(eq(journalEntriesTable.teacherId, teacherId));
  const weekJournals = journalRows.filter(
    (j) => j.tanggal >= week.tanggalMulai && j.tanggal <= week.tanggalSelesai,
  );

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

  const items: InfoItem[] = [];
  const matchedJournalIds = new Set<string>();

  for (const pi of planRows) {
    // Prefer an explicit link to this exact topic (set when the teacher picks
    // it from the Prosem while writing the journal entry). Fall back to the
    // old subject+kelas heuristic for entries that don't reference a topic.
    const linked = weekJournals.find(
      (j) => j.prosemItemId === pi.prosemItemId && !matchedJournalIds.has(j.id),
    );
    const match =
      linked ??
      weekJournals.find(
        (j) =>
          !j.prosemItemId &&
          j.subjectId === pi.subjectId &&
          j.kelas === pi.kelas &&
          !matchedJournalIds.has(j.id),
      );
    if (match) matchedJournalIds.add(match.id);
    items.push({
      prosemItemId: pi.prosemItemId,
      subjectId: pi.subjectId,
      subjectName: subjectName.get(pi.subjectId) ?? "-",
      kelas: pi.kelas,
      kd: pi.kd,
      materi: pi.materi,
      jp: pi.jp,
      status: match ? "sesuai" : "tertinggal",
      journalEntryId: match ? match.id : null,
    });
  }

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

  const payload = {
    weekId: week.id,
    pekanKe: week.pekanKe,
    tanggalMulai: week.tanggalMulai,
    tanggalSelesai: week.tanggalSelesai,
    jenis: week.jenis,
    totalRencana: items.filter((i) => i.prosemItemId !== null).length,
    totalSesuai: items.filter((i) => i.status === "sesuai").length,
    totalTertinggal: items.filter((i) => i.status === "tertinggal").length,
    totalDiDepan: items.filter((i) => i.status === "di_depan").length,
    items,
  };

  res.json(GetInfoPekananResponse.parse(payload));
});

export default router;
