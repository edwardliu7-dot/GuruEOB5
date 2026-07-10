import { Router, type IRouter } from "express";
import { eq, and, type SQL } from "drizzle-orm";
import { db, gradesTable } from "@workspace/db";
import { ListGradesResponse, CreateGradeBody, CreateGradeResponse } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/grades", requireAuth, async (req, res): Promise<void> => {
  const studentId =
    typeof req.query["studentId"] === "string" ? req.query["studentId"] : undefined;
  const subjectId =
    typeof req.query["subjectId"] === "string" ? req.query["subjectId"] : undefined;

  const conditions: SQL[] = [];
  if (studentId) conditions.push(eq(gradesTable.studentId, studentId));
  if (subjectId) conditions.push(eq(gradesTable.subjectId, subjectId));

  const grades =
    conditions.length > 0
      ? await db.select().from(gradesTable).where(and(...conditions))
      : await db.select().from(gradesTable);
  res.json(ListGradesResponse.parse(grades));
});

router.post("/grades", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateGradeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [grade] = await db
    .insert(gradesTable)
    .values(parsed.data)
    .onConflictDoUpdate({
      target: [gradesTable.studentId, gradesTable.subjectId, gradesTable.jenis, gradesTable.tanggal],
      set: { nilai: parsed.data.nilai },
    })
    .returning();
  res.status(201).json(CreateGradeResponse.parse(grade));
});

export default router;
