import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, aiSoalOtomatisTable, subjectsTable } from "@workspace/db";
import {
  ListSoalOtomatisResponse,
  GenerateSoalOtomatisBody,
  GenerateSoalOtomatisResponse,
  GetSoalOtomatisParams,
  GetSoalOtomatisResponse,
  DeleteSoalOtomatisParams,
  DeleteSoalOtomatisResponse,
} from "@workspace/api-zod";
import { requireAuth, getCurrentGuru } from "../lib/auth";
import { generateSoal } from "../lib/gemini";
import { buildSoalDocx } from "../lib/docx-soal";

const router: IRouter = Router();

const soalMetadataColumns = {
  id: aiSoalOtomatisTable.id,
  subjectId: aiSoalOtomatisTable.subjectId,
  materi: aiSoalOtomatisTable.materi,
  jumlahSoal: aiSoalOtomatisTable.jumlahSoal,
  jenisSoal: aiSoalOtomatisTable.jenisSoal,
  tingkatKesulitan: aiSoalOtomatisTable.tingkatKesulitan,
  createdAt: aiSoalOtomatisTable.createdAt,
};

async function getOwnSubject(subjectId: string, teacherId: string) {
  const [subject] = await db
    .select()
    .from(subjectsTable)
    .where(and(eq(subjectsTable.id, subjectId), eq(subjectsTable.teacherId, teacherId)));
  return subject;
}

router.get("/soal-otomatis", requireAuth, async (req, res): Promise<void> => {
  const teacherId = req.session.teacherId as string;
  const subjectId =
    typeof req.query["subjectId"] === "string" ? req.query["subjectId"] : undefined;
  const rows = await db
    .select(soalMetadataColumns)
    .from(aiSoalOtomatisTable)
    .where(
      and(
        eq(aiSoalOtomatisTable.teacherId, teacherId),
        subjectId ? eq(aiSoalOtomatisTable.subjectId, subjectId) : undefined,
      ),
    )
    .orderBy(desc(aiSoalOtomatisTable.createdAt));
  res.json(ListSoalOtomatisResponse.parse(rows));
});

router.post("/soal-otomatis/generate", requireAuth, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = GenerateSoalOtomatisBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const subject = await getOwnSubject(parsed.data.subjectId, guru.id);
  if (!subject) {
    res.status(404).json({ error: "Mata pelajaran tidak ditemukan" });
    return;
  }

  try {
    const content = await generateSoal({
      mataPelajaran: subject.name,
      materi: parsed.data.materi,
      jumlahSoal: parsed.data.jumlahSoal,
      jenisSoal: parsed.data.jenisSoal,
      tingkatKesulitan: parsed.data.tingkatKesulitan,
    });

    const [row] = await db
      .insert(aiSoalOtomatisTable)
      .values({
        teacherId: guru.id,
        subjectId: parsed.data.subjectId,
        materi: parsed.data.materi,
        jumlahSoal: parsed.data.jumlahSoal,
        jenisSoal: parsed.data.jenisSoal,
        tingkatKesulitan: parsed.data.tingkatKesulitan,
        content,
      })
      .returning();

    res.status(201).json(GenerateSoalOtomatisResponse.parse(row));
  } catch (err) {
    req.log.error({ err }, "Soal otomatis generation failed");
    res.status(502).json({ error: "Gagal membuat soal dengan AI. Coba lagi." });
  }
});

router.get("/soal-otomatis/:id", requireAuth, async (req, res): Promise<void> => {
  const teacherId = req.session.teacherId as string;
  const params = GetSoalOtomatisParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select()
    .from(aiSoalOtomatisTable)
    .where(and(eq(aiSoalOtomatisTable.id, params.data.id), eq(aiSoalOtomatisTable.teacherId, teacherId)));

  if (!row) {
    res.status(404).json({ error: "Soal tidak ditemukan" });
    return;
  }

  res.json(GetSoalOtomatisResponse.parse(row));
});

router.delete("/soal-otomatis/:id", requireAuth, async (req, res): Promise<void> => {
  const teacherId = req.session.teacherId as string;
  const params = DeleteSoalOtomatisParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .delete(aiSoalOtomatisTable)
    .where(and(eq(aiSoalOtomatisTable.id, params.data.id), eq(aiSoalOtomatisTable.teacherId, teacherId)))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Soal tidak ditemukan" });
    return;
  }

  res.json(DeleteSoalOtomatisResponse.parse({ success: true }));
});

router.get("/soal-otomatis/:id/docx", requireAuth, async (req, res): Promise<void> => {
  const teacherId = req.session.teacherId as string;
  const params = GetSoalOtomatisParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select({
      content: aiSoalOtomatisTable.content,
      materi: aiSoalOtomatisTable.materi,
      subjectName: subjectsTable.name,
    })
    .from(aiSoalOtomatisTable)
    .innerJoin(subjectsTable, eq(subjectsTable.id, aiSoalOtomatisTable.subjectId))
    .where(and(eq(aiSoalOtomatisTable.id, params.data.id), eq(aiSoalOtomatisTable.teacherId, teacherId)));

  if (!row) {
    res.status(404).json({ error: "Soal tidak ditemukan" });
    return;
  }

  try {
    const buffer = await buildSoalDocx(row.content as never, {
      mataPelajaran: row.subjectName,
      materi: row.materi,
    });
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    const safeName = `Soal_${row.subjectName}_${row.materi}`.replace(/[^a-zA-Z0-9._-]/g, "_");
    res.setHeader("Content-Disposition", `attachment; filename="${safeName}.docx"`);
    res.send(buffer);
  } catch (err) {
    req.log.error({ err }, "Soal docx generation failed");
    res.status(500).json({ error: "Gagal membuat berkas docx" });
  }
});

export default router;
