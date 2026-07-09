import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, documentsTable } from "@workspace/db";
import {
  ListDocumentsResponse,
  CreateDocumentBody,
  CreateDocumentResponse,
  DeleteDocumentParams,
  DeleteDocumentResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/documents", requireAuth, async (req, res): Promise<void> => {
  const subjectId =
    typeof req.query["subjectId"] === "string" ? req.query["subjectId"] : undefined;
  const documents = subjectId
    ? await db.select().from(documentsTable).where(eq(documentsTable.subjectId, subjectId))
    : await db.select().from(documentsTable);
  res.json(ListDocumentsResponse.parse(documents));
});

router.post("/documents", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateDocumentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [document] = await db.insert(documentsTable).values(parsed.data).returning();
  res.status(201).json(CreateDocumentResponse.parse(document));
});

router.delete("/documents/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteDocumentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
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

export default router;
