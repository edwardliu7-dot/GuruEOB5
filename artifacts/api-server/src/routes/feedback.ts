import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { feedbackTable } from "@workspace/db";
import { requireAuth, getCurrentGuru, isAdminGuru } from "../lib/auth";

const router: IRouter = Router();

// POST /api/feedback — any authenticated guru submits feedback
router.post("/feedback", requireAuth, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { kategori, pesan } = req.body as { kategori?: string; pesan?: string };

  if (!kategori || !["saran", "kritik", "bug"].includes(kategori)) {
    res.status(400).json({ error: "Kategori tidak valid. Pilih saran, kritik, atau bug." });
    return;
  }
  if (!pesan || typeof pesan !== "string" || pesan.trim().length === 0) {
    res.status(400).json({ error: "Pesan tidak boleh kosong." });
    return;
  }
  if (pesan.trim().length > 2000) {
    res.status(400).json({ error: "Pesan terlalu panjang (maks. 2000 karakter)." });
    return;
  }

  const [row] = await db
    .insert(feedbackTable)
    .values({
      teacherId: guru.id,
      teacherName: guru.name,
      kategori: kategori as "saran" | "kritik" | "bug",
      pesan: pesan.trim(),
    })
    .returning();

  res.status(201).json({ id: row.id, message: "Feedback berhasil dikirim. Terima kasih!" });
});

// GET /api/feedback — admin only, list all (newest first)
router.get("/feedback", requireAuth, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru || !isAdminGuru(guru)) {
    res.status(403).json({ error: "Hanya admin yang dapat melihat feedback." });
    return;
  }

  const rows = await db
    .select()
    .from(feedbackTable)
    .orderBy(desc(feedbackTable.createdAt));

  res.json(rows);
});

// GET /api/feedback/unread-count — admin only, badge count
router.get("/feedback/unread-count", requireAuth, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru || !isAdminGuru(guru)) {
    res.json({ count: 0 });
    return;
  }

  const rows = await db
    .select({ id: feedbackTable.id })
    .from(feedbackTable)
    .where(eq(feedbackTable.isRead, false));

  res.json({ count: rows.length });
});

// PATCH /api/feedback/:id/read — admin marks a message as read
router.patch("/feedback/:id/read", requireAuth, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru || !isAdminGuru(guru)) {
    res.status(403).json({ error: "Hanya admin yang dapat menandai feedback." });
    return;
  }

  const { id } = req.params;
  await db.update(feedbackTable).set({ isRead: true }).where(eq(feedbackTable.id, id));
  res.json({ ok: true });
});

// DELETE /api/feedback/:id — admin deletes a message
router.delete("/feedback/:id", requireAuth, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru || !isAdminGuru(guru)) {
    res.status(403).json({ error: "Hanya admin yang dapat menghapus feedback." });
    return;
  }

  const { id } = req.params;
  await db.delete(feedbackTable).where(eq(feedbackTable.id, id));
  res.json({ ok: true });
});

export default router;
