/**
 * TEMPORARY DEBUG ENDPOINT — remove after diagnosis is complete.
 *
 * GET /api/debug/prosem-check?calendarId=<uuid>&weekId=<uuid>
 *
 * Returns raw prosem + prosem_items data for the logged-in teacher so we
 * can see exactly what is (or isn't) in the production DB.
 */
import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import {
  db,
  prosemTable,
  prosemItemsTable,
  academicWeeksTable,
  academicCalendarsTable,
} from "@workspace/db";
import { requireAuth, getCurrentGuru } from "../lib/auth";

const router: IRouter = Router();

router.get("/debug/prosem-check", requireAuth, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const teacherId = guru.id;
  const calendarId =
    typeof req.query["calendarId"] === "string" ? req.query["calendarId"] : undefined;
  const weekId =
    typeof req.query["weekId"] === "string" ? req.query["weekId"] : undefined;

  // 1. All prosem for this teacher
  const allProsem = await db
    .select()
    .from(prosemTable)
    .where(eq(prosemTable.teacherId, teacherId));

  // 2. All prosem_items for this teacher (via join to prosem)
  const allItems = await db
    .select({
      itemId: prosemItemsTable.id,
      prosemId: prosemItemsTable.prosemId,
      weekId: prosemItemsTable.weekId,
      materi: prosemItemsTable.materi,
      jp: prosemItemsTable.jp,
      weekTanggalMulai: academicWeeksTable.tanggalMulai,
      weekTanggalSelesai: academicWeeksTable.tanggalSelesai,
      weekPekanKe: academicWeeksTable.pekanKe,
      weekCalendarId: academicWeeksTable.calendarId,
    })
    .from(prosemItemsTable)
    .innerJoin(prosemTable, eq(prosemItemsTable.prosemId, prosemTable.id))
    .innerJoin(academicWeeksTable, eq(prosemItemsTable.weekId, academicWeeksTable.id))
    .where(eq(prosemTable.teacherId, teacherId));

  // 3. The currently selected week (if calendarId + weekId provided)
  let selectedWeek = null;
  if (calendarId && weekId) {
    const [w] = await db
      .select()
      .from(academicWeeksTable)
      .where(
        and(
          eq(academicWeeksTable.id, weekId),
          eq(academicWeeksTable.calendarId, calendarId),
        ),
      );
    selectedWeek = w ?? null;
  }

  // 4. All weeks in the selected calendar
  let calendarWeeks: typeof allItems = [];
  if (calendarId) {
    const rows = await db
      .select()
      .from(academicWeeksTable)
      .where(eq(academicWeeksTable.calendarId, calendarId))
      .orderBy(academicWeeksTable.pekanKe);
    // reuse shape for convenience
    calendarWeeks = rows.map((w) => ({
      itemId: w.id,
      prosemId: "",
      weekId: w.id,
      materi: "",
      jp: null,
      weekTanggalMulai: w.tanggalMulai,
      weekTanggalSelesai: w.tanggalSelesai,
      weekPekanKe: w.pekanKe,
      weekCalendarId: w.calendarId,
    }));
  }

  // 5. What the new date-range query actually returns
  let dateRangeMatches: typeof allItems = [];
  if (selectedWeek) {
    dateRangeMatches = await db
      .select({
        itemId: prosemItemsTable.id,
        prosemId: prosemItemsTable.prosemId,
        weekId: prosemItemsTable.weekId,
        materi: prosemItemsTable.materi,
        jp: prosemItemsTable.jp,
        weekTanggalMulai: academicWeeksTable.tanggalMulai,
        weekTanggalSelesai: academicWeeksTable.tanggalSelesai,
        weekPekanKe: academicWeeksTable.pekanKe,
        weekCalendarId: academicWeeksTable.calendarId,
      })
      .from(prosemItemsTable)
      .innerJoin(prosemTable, eq(prosemItemsTable.prosemId, prosemTable.id))
      .innerJoin(academicWeeksTable, eq(prosemItemsTable.weekId, academicWeeksTable.id))
      .where(
        and(
          eq(prosemTable.teacherId, teacherId),
          eq(academicWeeksTable.tanggalMulai, selectedWeek.tanggalMulai),
          eq(academicWeeksTable.tanggalSelesai, selectedWeek.tanggalSelesai),
        ),
      );
  }

  res.json({
    teacher: { id: guru.id, name: guru.name, school: guru.school },
    selectedWeek,
    allProsem,
    allProsemItems: allItems,
    calendarWeeks,
    dateRangeQueryResult: dateRangeMatches,
    summary: {
      totalProsem: allProsem.length,
      totalProsemItems: allItems.length,
      itemsMatchingSelectedWeek: dateRangeMatches.length,
    },
  });
});

export default router;
