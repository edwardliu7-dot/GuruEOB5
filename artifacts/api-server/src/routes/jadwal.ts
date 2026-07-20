import { Router, type IRouter } from "express";
import { and, eq, inArray } from "drizzle-orm";
import { db, schedulesTable, subjectsTable, neonDb, gurusTable } from "@workspace/db";
import {
  ListJadwalQueryParams,
  ListJadwalResponse,
  CreateJadwalBody,
  CreateJadwalResponse,
  UpdateJadwalParams,
  UpdateJadwalBody,
  UpdateJadwalResponse,
  DeleteJadwalParams,
  DeleteJadwalResponse,
} from "@workspace/api-zod";
import { requireAuth, getCurrentGuru, isSchoolAdmin } from "../lib/auth";

const router: IRouter = Router();

router.get("/jadwal", requireAuth, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru) { res.status(401).json({ error: "Unauthorized" }); return; }

  const params = ListJadwalQueryParams.safeParse(req.query);
  const filterTeacherId =
    params.success && params.data.teacherId && isSchoolAdmin(guru)
      ? params.data.teacherId
      : guru.id;

  const rows = await db
    .select()
    .from(schedulesTable)
    .where(eq(schedulesTable.teacherId, filterTeacherId));

  if (rows.length === 0) {
    res.json(ListJadwalResponse.parse([]));
    return;
  }

  const subjectIds = [...new Set(rows.map((r) => r.subjectId))];
  const subjects = await db
    .select({ id: subjectsTable.id, name: subjectsTable.name })
    .from(subjectsTable)
    .where(inArray(subjectsTable.id, subjectIds));
  const subjectNameById = new Map(subjects.map((s) => [s.id, s.name]));

  const [guruRow] = await neonDb
    .select({ id: gurusTable.id, name: gurusTable.name })
    .from(gurusTable)
    .where(eq(gurusTable.id, filterTeacherId));

  const entries = rows.map((r) => ({
    id: r.id,
    teacherId: r.teacherId,
    teacherName: guruRow?.name ?? r.teacherId,
    subjectId: r.subjectId,
    subjectName: subjectNameById.get(r.subjectId) ?? r.subjectId,
    kelas: r.kelas,
    hari: r.hari,
    jamMulai: r.jamMulai,
    jamSelesai: r.jamSelesai,
    createdAt: r.createdAt,
  }));

  res.json(ListJadwalResponse.parse(entries));
});

router.post("/jadwal", requireAuth, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru) { res.status(401).json({ error: "Unauthorized" }); return; }

  const parsed = CreateJadwalBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [row] = await db
    .insert(schedulesTable)
    .values({
      teacherId: guru.id,
      subjectId: parsed.data.subjectId,
      kelas: parsed.data.kelas,
      hari: parsed.data.hari as any,
      jamMulai: parsed.data.jamMulai,
      jamSelesai: parsed.data.jamSelesai,
      school: guru.school ?? null,
    })
    .returning();

  const [subject] = await db
    .select({ id: subjectsTable.id, name: subjectsTable.name })
    .from(subjectsTable)
    .where(eq(subjectsTable.id, row.subjectId));

  res.status(201).json(
    CreateJadwalResponse.parse({
      ...row,
      teacherName: guru.name,
      subjectName: subject?.name ?? row.subjectId,
    }),
  );
});

router.patch("/jadwal/:id", requireAuth, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru) { res.status(401).json({ error: "Unauthorized" }); return; }

  const params = UpdateJadwalParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const body = UpdateJadwalBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  const [row] = await db
    .update(schedulesTable)
    .set({ ...body.data, hari: body.data.hari as any })
    .where(
      and(
        eq(schedulesTable.id, params.data.id),
        eq(schedulesTable.teacherId, guru.id),
      ),
    )
    .returning();

  if (!row) { res.status(404).json({ error: "Jadwal tidak ditemukan" }); return; }

  const [subject] = await db
    .select({ id: subjectsTable.id, name: subjectsTable.name })
    .from(subjectsTable)
    .where(eq(subjectsTable.id, row.subjectId));

  res.json(
    UpdateJadwalResponse.parse({
      ...row,
      teacherName: guru.name,
      subjectName: subject?.name ?? row.subjectId,
    }),
  );
});

router.delete("/jadwal/:id", requireAuth, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru) { res.status(401).json({ error: "Unauthorized" }); return; }

  const params = DeleteJadwalParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [row] = await db
    .delete(schedulesTable)
    .where(
      and(
        eq(schedulesTable.id, params.data.id),
        eq(schedulesTable.teacherId, guru.id),
      ),
    )
    .returning();

  if (!row) { res.status(404).json({ error: "Jadwal tidak ditemukan" }); return; }

  res.json(DeleteJadwalResponse.parse({ success: true }));
});

export default router;
