import { Router, type IRouter } from "express";
import { and, eq, inArray } from "drizzle-orm";
import { db, pointsTable, studentsTable } from "@workspace/db";
import {
  ListPointsResponse,
  CreatePointBody,
  CreatePointResponse,
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
