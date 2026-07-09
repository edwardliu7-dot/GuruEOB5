import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, gradesTable } from "@workspace/db";
import { ListGradesResponse, CreateGradeBody, CreateGradeResponse } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/grades", requireAuth, async (req, res): Promise<void> => {
  const studentId =
    typeof req.query["studentId"] === "string" ? req.query["studentId"] : undefined;
  const grades = studentId
    ? await db.select().from(gradesTable).where(eq(gradesTable.studentId, studentId))
    : await db.select().from(gradesTable);
  res.json(ListGradesResponse.parse(grades));
});

router.post("/grades", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateGradeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [grade] = await db.insert(gradesTable).values(parsed.data).returning();
  res.status(201).json(CreateGradeResponse.parse(grade));
});

export default router;
