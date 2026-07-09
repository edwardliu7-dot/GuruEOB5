import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, pointsTable } from "@workspace/db";
import { ListPointsResponse, CreatePointBody, CreatePointResponse } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/points", requireAuth, async (req, res): Promise<void> => {
  const studentId =
    typeof req.query["studentId"] === "string" ? req.query["studentId"] : undefined;
  const points = studentId
    ? await db.select().from(pointsTable).where(eq(pointsTable.studentId, studentId))
    : await db.select().from(pointsTable);
  res.json(ListPointsResponse.parse(points));
});

router.post("/points", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreatePointBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [point] = await db.insert(pointsTable).values(parsed.data).returning();
  res.status(201).json(CreatePointResponse.parse(point));
});

export default router;
