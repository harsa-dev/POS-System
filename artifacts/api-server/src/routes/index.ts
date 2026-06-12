import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import menuRouter from "./menu.js";
import ordersStatusRouter from "./orders-status.js";
import ordersRouter from "./orders.js";
import tablesRouter from "./tables.js";
import inventoryRouter from "./inventory.js";
import shiftsRouter from "./shifts.js";
import paymentsRouter from "./payments.js";
import invoicesRouter from "./invoices.js";
import miscBusinessRouter from "./misc-business.js";
import miscRouter from "./misc.js";
import eventsRouter from "./events.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(menuRouter);
router.use(ordersStatusRouter);
router.use(ordersRouter);
router.use(tablesRouter);
router.use(inventoryRouter);
router.use(shiftsRouter);
router.use(paymentsRouter);
router.use(invoicesRouter);
router.use(miscBusinessRouter);
router.use(miscRouter);
router.use(eventsRouter);

export default router;
