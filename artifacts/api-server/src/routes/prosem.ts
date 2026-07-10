import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, prosemTable, prosemItemsTable } from "@workspace/db";
import {
  ListProsemResponse,
  CreateProsemBody,
  CreateProsemResponse,
  DeleteProsemParams,
  DeleteProsemResponse,
  ListProsemItemsResponse,
  CreateProsemItemBody,
  CreateProsemItemResponse,
  UpdateProsemItemParams,
  UpdateProsemItemBody,
  UpdateProsemItemResponse,
  DeleteProsemItemParams,
  DeleteProsemItemResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/prosem", requireAuth, async (req, res): Promise<void> => {
  const teacherId = req.session.teacherId as string;
  const calendarId =
    typeof req.query["calendarId"] === "string" ? req.query["calendarId"] : undefined;
  const subjectId =
    typeof req.query["subjectId"] === "string" ? req.query["subjectId"] : undefined;
  const rows = await db
    .select()
    .from(prosemTable)
    .where(
      and(
        eq(prosemTable.teacherId, teacherId),
        calendarId ? eq(prosemTable.calendarId, calendarId) : undefined,
        subjectId ? eq(prosemTable.subjectId, subjectId) : undefined,
      ),
    );
  res.json(ListProsemResponse.parse(rows));
});

router.post("/prosem", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateProsemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .insert(prosemTable)
    .values({ ...parsed.data, teacherId: req.session.teacherId as string })
    .returning();
  res.status(201).json(CreateProsemResponse.parse(row));
});

router.delete("/prosem/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteProsemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db
    .delete(prosemTable)
    .where(
      and(
        eq(prosemTable.id, params.data.id),
        eq(prosemTable.teacherId, req.session.teacherId as string),
      ),
    )
    .returning();
  if (!row) {
    res.status(404).json({ error: "Prosem tidak ditemukan" });
    return;
  }
  res.json(DeleteProsemResponse.parse({ success: true }));
});

async function ownsProsem(prosemId: string, teacherId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: prosemTable.id })
    .from(prosemTable)
    .where(and(eq(prosemTable.id, prosemId), eq(prosemTable.teacherId, teacherId)));
  return Boolean(row);
}

router.get("/prosem-items", requireAuth, async (req, res): Promise<void> => {
  const teacherId = req.session.teacherId as string;
  const prosemId =
    typeof req.query["prosemId"] === "string" ? req.query["prosemId"] : undefined;
  if (!prosemId || !(await ownsProsem(prosemId, teacherId))) {
    res.json(ListProsemItemsResponse.parse([]));
    return;
  }
  const items = await db
    .select()
    .from(prosemItemsTable)
    .where(eq(prosemItemsTable.prosemId, prosemId));
  res.json(ListProsemItemsResponse.parse(items));
});

router.post("/prosem-items", requireAuth, async (req, res): Promise<void> => {
  const teacherId = req.session.teacherId as string;
  const parsed = CreateProsemItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (!(await ownsProsem(parsed.data.prosemId, teacherId))) {
    res.status(404).json({ error: "Prosem tidak ditemukan" });
    return;
  }
  const [item] = await db.insert(prosemItemsTable).values(parsed.data).returning();
  res.status(201).json(CreateProsemItemResponse.parse(item));
});

router.put("/prosem-items/:id", requireAuth, async (req, res): Promise<void> => {
  const teacherId = req.session.teacherId as string;
  const params = UpdateProsemItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateProsemItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [existing] = await db
    .select()
    .from(prosemItemsTable)
    .where(eq(prosemItemsTable.id, params.data.id));
  if (!existing || !(await ownsProsem(existing.prosemId, teacherId))) {
    res.status(404).json({ error: "Item tidak ditemukan" });
    return;
  }
  if (!(await ownsProsem(parsed.data.prosemId, teacherId))) {
    res.status(404).json({ error: "Prosem tidak ditemukan" });
    return;
  }
  const [item] = await db
    .update(prosemItemsTable)
    .set(parsed.data)
    .where(eq(prosemItemsTable.id, params.data.id))
    .returning();
  if (!item) {
    res.status(404).json({ error: "Item tidak ditemukan" });
    return;
  }
  res.json(UpdateProsemItemResponse.parse(item));
});

router.delete("/prosem-items/:id", requireAuth, async (req, res): Promise<void> => {
  const teacherId = req.session.teacherId as string;
  const params = DeleteProsemItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [item] = await db
    .select()
    .from(prosemItemsTable)
    .where(eq(prosemItemsTable.id, params.data.id));
  if (!item || !(await ownsProsem(item.prosemId, teacherId))) {
    res.status(404).json({ error: "Item tidak ditemukan" });
    return;
  }
  await db.delete(prosemItemsTable).where(eq(prosemItemsTable.id, params.data.id));
  res.json(DeleteProsemItemResponse.parse({ success: true }));
});

export default router;
