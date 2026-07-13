import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, documentsTable, subjectsTable } from "@workspace/db";
import {
  ListDocumentsResponse,
  CreateDocumentBody,
  CreateDocumentResponse,
  DeleteDocumentParams,
  DeleteDocumentResponse,
} from "@workspace/api-zod";
import { requireAuth, getCurrentGuru } from "../lib/auth";

const router: IRouter = Router();

// Metadata-only column set -- excludes fileData so list/detail responses
// don't ship the full (base64) file content over the wire.
const documentMetadataColumns = {
  id: documentsTable.id,
  subjectId: documentsTable.subjectId,
  name: documentsTable.name,
  description: documentsTable.description,
  fileName: documentsTable.fileName,
  fileType: documentsTable.fileType,
  fileSize: documentsTable.fileSize,
  uploadedAt: documentsTable.uploadedAt,
};

async function isOwnSubject(subjectId: string, teacherId: string): Promise<boolean> {
  const [subject] = await db
    .select({ id: subjectsTable.id })
    .from(subjectsTable)
    .where(and(eq(subjectsTable.id, subjectId), eq(subjectsTable.teacherId, teacherId)));
  return !!subject;
}

router.get("/documents", requireAuth, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const subjectId =
    typeof req.query["subjectId"] === "string" ? req.query["subjectId"] : undefined;

  if (subjectId) {
    if (!(await isOwnSubject(subjectId, guru.id))) {
      res.json(ListDocumentsResponse.parse([]));
      return;
    }
    const documents = await db
      .select(documentMetadataColumns)
      .from(documentsTable)
      .where(eq(documentsTable.subjectId, subjectId));
    res.json(ListDocumentsResponse.parse(documents));
    return;
  }

  // No subjectId filter -- only return documents under subjects the caller owns.
  const documents = await db
    .select(documentMetadataColumns)
    .from(documentsTable)
    .innerJoin(subjectsTable, eq(subjectsTable.id, documentsTable.subjectId))
    .where(eq(subjectsTable.teacherId, guru.id));
  res.json(ListDocumentsResponse.parse(documents));
});

router.post("/documents", requireAuth, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = CreateDocumentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (!(await isOwnSubject(parsed.data.subjectId, guru.id))) {
    res.status(404).json({ error: "Subject not found" });
    return;
  }

  const [document] = await db
    .insert(documentsTable)
    .values(parsed.data)
    .returning(documentMetadataColumns);
  res.status(201).json(CreateDocumentResponse.parse(document));
});

router.delete("/documents/:id", requireAuth, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = DeleteDocumentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db
    .select({ subjectId: documentsTable.subjectId })
    .from(documentsTable)
    .where(eq(documentsTable.id, params.data.id));

  if (!existing || !(await isOwnSubject(existing.subjectId, guru.id))) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  const [document] = await db
    .delete(documentsTable)
    .where(eq(documentsTable.id, params.data.id))
    .returning();

  if (!document) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  res.json(DeleteDocumentResponse.parse({ success: true }));
});

router.get("/documents/:id/file", requireAuth, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = DeleteDocumentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db
    .select({
      subjectId: documentsTable.subjectId,
      fileData: documentsTable.fileData,
      fileName: documentsTable.fileName,
      fileType: documentsTable.fileType,
    })
    .from(documentsTable)
    .where(eq(documentsTable.id, params.data.id));

  if (!existing || !(await isOwnSubject(existing.subjectId, guru.id))) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  const buffer = Buffer.from(existing.fileData, "base64");
  res.setHeader("Content-Type", existing.fileType || "application/octet-stream");
  res.setHeader("Content-Length", String(buffer.length));
  res.setHeader(
    "Content-Disposition",
    `inline; filename="${encodeURIComponent(existing.fileName)}"`,
  );
  res.send(buffer);
});

export default router;
