import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, academicCalendarsTable, academicWeeksTable } from "@workspace/db";
import {
  ListAcademicCalendarsResponse,
  CreateAcademicCalendarBody,
  CreateAcademicCalendarResponse,
  DeleteAcademicCalendarParams,
  DeleteAcademicCalendarResponse,
  ListAcademicWeeksResponse,
  CreateAcademicWeekBody,
  CreateAcademicWeekResponse,
  UpdateAcademicWeekParams,
  UpdateAcademicWeekBody,
  UpdateAcademicWeekResponse,
  DeleteAcademicWeekParams,
  DeleteAcademicWeekResponse,
} from "@workspace/api-zod";
import { requireAuth, requireSchoolAdmin, getCurrentGuru } from "../lib/auth";

const router: IRouter = Router();

async function calendarInSchool(calendarId: string, school: string): Promise<boolean> {
  const [calendar] = await db
    .select({ school: academicCalendarsTable.school })
    .from(academicCalendarsTable)
    .where(eq(academicCalendarsTable.id, calendarId));
  return Boolean(calendar && calendar.school === school);
}

async function weekInSchool(weekId: string, school: string): Promise<boolean> {
  const [row] = await db
    .select({ school: academicCalendarsTable.school })
    .from(academicWeeksTable)
    .innerJoin(
      academicCalendarsTable,
      eq(academicWeeksTable.calendarId, academicCalendarsTable.id),
    )
    .where(eq(academicWeeksTable.id, weekId));
  return Boolean(row && row.school === school);
}

router.get("/academic-calendars", requireAuth, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const calendars = guru.school
    ? await db
        .select()
        .from(academicCalendarsTable)
        .where(eq(academicCalendarsTable.school, guru.school))
    : [];
  res.json(ListAcademicCalendarsResponse.parse(calendars));
});

router.post("/academic-calendars", requireSchoolAdmin, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (!guru.school) {
    res.status(400).json({ error: "Guru belum memiliki sekolah" });
    return;
  }
  const parsed = CreateAcademicCalendarBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [calendar] = await db
    .insert(academicCalendarsTable)
    .values({ ...parsed.data, school: guru.school, createdBy: guru.id })
    .returning();
  res.status(201).json(CreateAcademicCalendarResponse.parse(calendar));
});

router.delete("/academic-calendars/:id", requireSchoolAdmin, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const params = DeleteAcademicCalendarParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!guru.school) {
    res.status(404).json({ error: "Kalender tidak ditemukan" });
    return;
  }
  const [calendar] = await db
    .delete(academicCalendarsTable)
    .where(
      and(
        eq(academicCalendarsTable.id, params.data.id),
        eq(academicCalendarsTable.school, guru.school),
      ),
    )
    .returning();
  if (!calendar) {
    res.status(404).json({ error: "Kalender tidak ditemukan" });
    return;
  }
  res.json(DeleteAcademicCalendarResponse.parse({ success: true }));
});

router.get("/academic-weeks", requireAuth, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const calendarId =
    typeof req.query["calendarId"] === "string" ? req.query["calendarId"] : undefined;
  if (!calendarId || !guru.school || !(await calendarInSchool(calendarId, guru.school))) {
    res.json(ListAcademicWeeksResponse.parse([]));
    return;
  }
  const weeks = await db
    .select()
    .from(academicWeeksTable)
    .where(eq(academicWeeksTable.calendarId, calendarId))
    .orderBy(academicWeeksTable.pekanKe);
  res.json(ListAcademicWeeksResponse.parse(weeks));
});

router.post("/academic-weeks", requireSchoolAdmin, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = CreateAcademicWeekBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (!guru.school || !(await calendarInSchool(parsed.data.calendarId, guru.school))) {
    res.status(404).json({ error: "Kalender tidak ditemukan" });
    return;
  }
  const [week] = await db.insert(academicWeeksTable).values(parsed.data).returning();
  res.status(201).json(CreateAcademicWeekResponse.parse(week));
});

router.put("/academic-weeks/:id", requireSchoolAdmin, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const params = UpdateAcademicWeekParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateAcademicWeekBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (!guru.school || !(await weekInSchool(params.data.id, guru.school))) {
    res.status(404).json({ error: "Pekan tidak ditemukan" });
    return;
  }
  if (!(await calendarInSchool(parsed.data.calendarId, guru.school))) {
    res.status(404).json({ error: "Kalender tidak ditemukan" });
    return;
  }
  const [week] = await db
    .update(academicWeeksTable)
    .set(parsed.data)
    .where(eq(academicWeeksTable.id, params.data.id))
    .returning();
  if (!week) {
    res.status(404).json({ error: "Pekan tidak ditemukan" });
    return;
  }
  res.json(UpdateAcademicWeekResponse.parse(week));
});

router.delete("/academic-weeks/:id", requireSchoolAdmin, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const params = DeleteAcademicWeekParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!guru.school || !(await weekInSchool(params.data.id, guru.school))) {
    res.status(404).json({ error: "Pekan tidak ditemukan" });
    return;
  }
  const [week] = await db
    .delete(academicWeeksTable)
    .where(eq(academicWeeksTable.id, params.data.id))
    .returning();
  if (!week) {
    res.status(404).json({ error: "Pekan tidak ditemukan" });
    return;
  }
  res.json(DeleteAcademicWeekResponse.parse({ success: true }));
});

export default router;
