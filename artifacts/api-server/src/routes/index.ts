import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import menuRouter from "./menu.js";
import ordersRouter from "./orders.js";
import tablesRouter from "./tables.js";
import inventoryRouter from "./inventory.js";
import shiftsRouter from "./shifts.js";
import employeesRouter from "./employees.js";
import attendanceRouter from "./attendance.js";
import analyticsRouter from "./analytics.js";
import paymentsRouter from "./payments.js";
import miscRouter from "./misc.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(menuRouter);
router.use(ordersRouter);
router.use(tablesRouter);
router.use(inventoryRouter);
router.use(shiftsRouter);
router.use(employeesRouter);
router.use(attendanceRouter);
router.use(analyticsRouter);
router.use(paymentsRouter);
router.use(miscRouter);

export default router;
