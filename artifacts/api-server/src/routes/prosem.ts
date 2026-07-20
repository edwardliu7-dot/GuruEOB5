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
import { mapMarkedToProsemItems } from "../lib/gemini";

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

// POST /api/prosem/import-ai
// Accepts structured materi list (parsed client-side) + available weeks.
// If hasMarks=true (week columns were marked in spreadsheet) → call AI.
// If hasMarks=false → deterministic sequential distribution to KBM weeks.
router.post("/prosem/import-ai", requireAuth, async (req, res): Promise<void> => {
  const teacherId = req.session.teacherId as string;
  const { materiList, hasMarks, weeks, prosemId } = req.body as {
    materiList: { bab: string; materi: string; weekSlot?: number }[];
    hasMarks: boolean;
    weeks: { id: string; pekanKe: number; jenis: string }[];
    prosemId: string;
  };

  if (!Array.isArray(materiList) || !Array.isArray(weeks) || !prosemId) {
    res.status(400).json({ error: "materiList, weeks, dan prosemId wajib diisi" });
    return;
  }

  if (!(await ownsProsem(prosemId, teacherId))) {
    res.status(404).json({ error: "Prosem tidak ditemukan" });
    return;
  }

  try {
    let items: { pekanKe: number; bab: string; materi: string; jp?: number }[];

    if (hasMarks) {
      // AI maps explicit week-column marks to calendar pekanKe
      const marked = materiList.filter(
        (m): m is { bab: string; materi: string; weekSlot: number } =>
          typeof m.weekSlot === "number",
      );
      items = await mapMarkedToProsemItems(marked, weeks);
    } else {
      // Deterministic sequential distribution: 1 materi → 1 KBM week
      const kbmWeeks = weeks
        .filter((w) => w.jenis.toLowerCase() === "kbm")
        .sort((a, b) => a.pekanKe - b.pekanKe);

      items = materiList.map((item, idx) => ({
        pekanKe:
          kbmWeeks[Math.min(idx, kbmWeeks.length - 1)]?.pekanKe ??
          weeks[0]?.pekanKe ??
          1,
        bab: item.bab,
        materi: item.materi,
        jp: 2,
      }));
    }

    res.json({ items });
  } catch (err) {
    res.status(422).json({
      error: err instanceof Error ? err.message : "Gagal menganalisis berkas dengan AI",
    });
  }
});

// POST /api/prosem-items/bulk
// Bulk create prosem items after AI import verification
router.post("/prosem-items/bulk", requireAuth, async (req, res): Promise<void> => {
  const teacherId = req.session.teacherId as string;
  const { prosemId, items } = req.body as {
    prosemId: string;
    items: { weekId: string; materi: string; kd?: string; jp?: number; catatan?: string }[];
  };

  if (!prosemId || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: "prosemId dan items wajib diisi" });
    return;
  }

  if (!(await ownsProsem(prosemId, teacherId))) {
    res.status(404).json({ error: "Prosem tidak ditemukan" });
    return;
  }

  const inserted = await db
    .insert(prosemItemsTable)
    .values(
      items.map((item) => ({
        prosemId,
        weekId: item.weekId,
        kd: item.kd || null,
        materi: item.materi,
        jp: item.jp ?? null,
        catatan: item.catatan || null,
      })),
    )
    .returning();

  res.status(201).json({ inserted: inserted.length });
});

export default router;
