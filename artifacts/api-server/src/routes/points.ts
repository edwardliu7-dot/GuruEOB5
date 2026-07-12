import { Router, type IRouter } from "express";
import { and, eq, inArray } from "drizzle-orm";
import { db, pointsTable, studentsTable } from "@workspace/db";
import {
  ListPointsResponse,
  CreatePointBody,
  CreatePointResponse,
  UpdatePointParams,
  UpdatePointBody,
  UpdatePointResponse,
  DeletePointParams,
  DeletePointResponse,
  BulkCreatePointsBody,
  BulkCreatePointsResponse,
} from "@workspace/api-zod";
import { requireAuth, getCurrentGuru } from "../lib/auth";
import type { Request } from "express";

const router: IRouter = Router();

async function schoolStudentIds(req: Request): Promise<Set<string> | null> {
  const guru = await getCurrentGuru(req);
  if (!guru) return null;
  if (!guru.school) return new Set();
  const rows = await db
    .select({ id: studentsTable.id })
    .from(studentsTable)
    .where(eq(studentsTable.school, guru.school));
  return new Set(rows.map((r) => r.id));
}

router.get("/points", requireAuth, async (req, res): Promise<void> => {
  const allowed = await schoolStudentIds(req);
  if (allowed === null) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const studentId =
    typeof req.query["studentId"] === "string" ? req.query["studentId"] : undefined;
  if (studentId && !allowed.has(studentId)) {
    res.json(ListPointsResponse.parse([]));
    return;
  }
  const points = studentId
    ? await db.select().from(pointsTable).where(eq(pointsTable.studentId, studentId))
    : allowed.size > 0
      ? await db
          .select()
          .from(pointsTable)
          .where(inArray(pointsTable.studentId, [...allowed]))
      : [];
  res.json(ListPointsResponse.parse(points));
});

router.post("/points", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreatePointBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const allowed = await schoolStudentIds(req);
  if (allowed === null) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (!allowed.has(parsed.data.studentId)) {
    res.status(404).json({ error: "Siswa tidak ditemukan" });
    return;
  }

  const [point] = await db.insert(pointsTable).values(parsed.data).returning();
  res.status(201).json(CreatePointResponse.parse(point));
});

router.patch("/points/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdatePointParams.safeParse(req.params);
  const body = UpdatePointBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: (params.error ?? body.error)!.message });
    return;
  }

  const allowed = await schoolStudentIds(req);
  if (allowed === null) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (allowed.size === 0) {
    res.status(404).json({ error: "Point record not found" });
    return;
  }

  const [point] = await db
    .update(pointsTable)
    .set(body.data)
    .where(and(eq(pointsTable.id, params.data.id), inArray(pointsTable.studentId, [...allowed])))
    .returning();

  if (!point) {
    res.status(404).json({ error: "Point record not found" });
    return;
  }

  res.json(UpdatePointResponse.parse(point));
});

router.delete("/points/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeletePointParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const allowed = await schoolStudentIds(req);
  if (allowed === null) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (allowed.size === 0) {
    res.status(404).json({ error: "Point record not found" });
    return;
  }

  const [point] = await db
    .delete(pointsTable)
    .where(and(eq(pointsTable.id, params.data.id), inArray(pointsTable.studentId, [...allowed])))
    .returning();

  if (!point) {
    res.status(404).json({ error: "Point record not found" });
    return;
  }

  res.json(DeletePointResponse.parse({ success: true }));
});

router.post("/points/bulk", requireAuth, async (req, res): Promise<void> => {
  const parsed = BulkCreatePointsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const allowed = await schoolStudentIds(req);
  if (allowed === null) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { studentIds, jenis, poin, keterangan, tanggal } = parsed.data;
  const targets = [...new Set(studentIds)].filter((id) => allowed.has(id));

  if (targets.length === 0) {
    res.status(400).json({ error: "Tidak ada siswa valid yang dipilih" });
    return;
  }

  const inserted = await db
    .insert(pointsTable)
    .values(targets.map((studentId) => ({ studentId, jenis, poin, keterangan, tanggal })))
    .returning();
  res.json(BulkCreatePointsResponse.parse({ count: inserted.length }));
});

export default router;
