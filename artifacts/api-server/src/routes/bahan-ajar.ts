import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, bahanAjarTable } from "@workspace/db";
import { requireAuth, isSchoolAdmin, getCurrentGuru } from "../lib/auth";

const router: IRouter = Router();

// GET /bahan-ajar — all authenticated teachers can list (no fileData)
router.get("/bahan-ajar", requireAuth, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru) { res.status(401).json({ error: "Unauthorized" }); return; }

  const rows = await db
    .select({
      id: bahanAjarTable.id,
      school: bahanAjarTable.school,
      judul: bahanAjarTable.judul,
      mataPelajaran: bahanAjarTable.mataPelajaran,
      kelas: bahanAjarTable.kelas,
      deskripsi: bahanAjarTable.deskripsi,
      fileName: bahanAjarTable.fileName,
      fileType: bahanAjarTable.fileType,
      fileSize: bahanAjarTable.fileSize,
      linkUrl: bahanAjarTable.linkUrl,
      createdBy: bahanAjarTable.createdBy,
      createdByName: bahanAjarTable.createdByName,
      createdAt: bahanAjarTable.createdAt,
    })
    .from(bahanAjarTable)
    .where(guru.school ? eq(bahanAjarTable.school, guru.school) : eq(bahanAjarTable.school, ""))
    .orderBy(bahanAjarTable.createdAt);

  res.json(rows);
});

// GET /bahan-ajar/:id/file — download file
router.get("/bahan-ajar/:id/file", requireAuth, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru) { res.status(401).json({ error: "Unauthorized" }); return; }

  const [row] = await db
    .select()
    .from(bahanAjarTable)
    .where(
      and(
        eq(bahanAjarTable.id, req.params.id),
        guru.school ? eq(bahanAjarTable.school, guru.school) : eq(bahanAjarTable.school, ""),
      ),
    );

  if (!row || !row.fileData) { res.status(404).json({ error: "File tidak ditemukan" }); return; }

  const buf = Buffer.from(row.fileData, "base64");
  res.setHeader("Content-Type", row.fileType ?? "application/octet-stream");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${encodeURIComponent(row.fileName ?? "file")}"`,
  );
  res.send(buf);
});

// POST /bahan-ajar — semua guru yang sudah login bisa upload
router.post("/bahan-ajar", requireAuth, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { judul, mataPelajaran, kelas, deskripsi, fileName, fileType, fileSize, fileData, linkUrl } = req.body;

  if (!judul || typeof judul !== "string") {
    res.status(400).json({ error: "Judul harus diisi" });
    return;
  }

  const [row] = await db
    .insert(bahanAjarTable)
    .values({
      school: guru.school ?? "",
      judul,
      mataPelajaran: mataPelajaran || null,
      kelas: kelas || null,
      deskripsi: deskripsi || null,
      fileName: fileName || null,
      fileType: fileType || null,
      fileSize: fileSize || null,
      fileData: fileData || null,
      linkUrl: linkUrl || null,
      createdBy: guru.id,
      createdByName: guru.name,
    })
    .returning({
      id: bahanAjarTable.id,
      judul: bahanAjarTable.judul,
      mataPelajaran: bahanAjarTable.mataPelajaran,
      kelas: bahanAjarTable.kelas,
      deskripsi: bahanAjarTable.deskripsi,
      fileName: bahanAjarTable.fileName,
      fileType: bahanAjarTable.fileType,
      fileSize: bahanAjarTable.fileSize,
      linkUrl: bahanAjarTable.linkUrl,
      createdBy: bahanAjarTable.createdBy,
      createdByName: bahanAjarTable.createdByName,
      createdAt: bahanAjarTable.createdAt,
    });

  res.status(201).json(row);
});

// DELETE /bahan-ajar/:id — pembuat atau school admin
router.delete("/bahan-ajar/:id", requireAuth, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru) { res.status(401).json({ error: "Unauthorized" }); return; }

  // Ambil dulu data untuk cek kepemilikan
  const [item] = await db
    .select({ id: bahanAjarTable.id, createdBy: bahanAjarTable.createdBy, school: bahanAjarTable.school })
    .from(bahanAjarTable)
    .where(eq(bahanAjarTable.id, req.params.id));

  if (!item) { res.status(404).json({ error: "Bahan ajar tidak ditemukan" }); return; }

  // Hanya pembuat atau school admin yang boleh hapus
  const isOwner = item.createdBy === guru.id;
  const canDelete = isOwner || isSchoolAdmin(guru);
  if (!canDelete) {
    res.status(403).json({ error: "Hanya pembuat atau admin yang dapat menghapus bahan ajar ini" });
    return;
  }

  await db.delete(bahanAjarTable).where(eq(bahanAjarTable.id, req.params.id));
  res.json({ success: true });
});

export default router;
