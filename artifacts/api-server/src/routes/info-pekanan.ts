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

  if (!guru.school) {
    res.json(GetInfoPekananResponse.parse(empty));
    return;
  }
  const [calendar] = await db
    .select()
    .from(academicCalendarsTable)
    .where(eq(academicCalendarsTable.id, calendarId));
  if (!calendar || calendar.school !== guru.school) {
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

  const prosemRows = await db
    .select({
      prosemId: prosemTable.id,
      subjectId: prosemTable.subjectId,
      kelas: prosemTable.kelas,
    })
    .from(prosemTable)
    .where(
      and(eq(prosemTable.teacherId, teacherId), eq(prosemTable.calendarId, calendarId)),
    );

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

  const items: InfoItem[] = [];
  const matchedJournalIds = new Set<string>();

  for (const p of prosemRows) {
    const planItems = await db
      .select()
      .from(prosemItemsTable)
      .where(
        and(eq(prosemItemsTable.prosemId, p.prosemId), eq(prosemItemsTable.weekId, weekId)),
      );
    for (const pi of planItems) {
      // Prefer an explicit link to this exact topic (set when the teacher picks
      // it from the Prosem while writing the journal entry). Fall back to the
      // old subject+kelas heuristic for entries that don't reference a topic.
      const linked = weekJournals.find(
        (j) => j.prosemItemId === pi.id && !matchedJournalIds.has(j.id),
      );
      const match =
        linked ??
        weekJournals.find(
          (j) =>
            !j.prosemItemId &&
            j.subjectId === p.subjectId &&
            j.kelas === p.kelas &&
            !matchedJournalIds.has(j.id),
        );
      if (match) matchedJournalIds.add(match.id);
      items.push({
        prosemItemId: pi.id,
        subjectId: p.subjectId,
        subjectName: subjectName.get(p.subjectId) ?? "-",
        kelas: p.kelas,
        kd: pi.kd,
        materi: pi.materi,
        jp: pi.jp,
        status: match ? "sesuai" : "tertinggal",
        journalEntryId: match ? match.id : null,
      });
    }
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
