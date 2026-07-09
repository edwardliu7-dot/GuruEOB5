import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import dashboardRouter from "./dashboard";
import rolesRouter from "./roles";
import teachersRouter from "./teachers";
import studentsRouter from "./students";
import subjectsRouter from "./subjects";
import documentsRouter from "./documents";
import journalRouter from "./journal";
import attendanceRouter from "./attendance";
import gradesRouter from "./grades";
import pointsRouter from "./points";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(dashboardRouter);
router.use(rolesRouter);
router.use(teachersRouter);
router.use(studentsRouter);
router.use(subjectsRouter);
router.use(documentsRouter);
router.use(journalRouter);
router.use(attendanceRouter);
router.use(gradesRouter);
router.use(pointsRouter);

export default router;
