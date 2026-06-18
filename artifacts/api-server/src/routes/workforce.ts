import { Router, type IRouter } from "express";

import { requireRole } from "../lib/auth.js";
import { requireBusinessContextForUser } from "../lib/business-context/index.js";
import { MANAGEMENT_ROLES } from "../lib/constants.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { prisma } from "../lib/prisma.js";
import { successResponse } from "../lib/responses/success-response.js";

const router: IRouter = Router();

function getTodayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

router.get("/workforce/employees", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const { start: todayStart, end: todayEnd } = getTodayRange();

    const [users, todayAttendances] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            { businessId: businessContext.businessId },
            { ownedBusinesses: { some: { id: businessContext.businessId } } },
          ],
        },
        orderBy: [{ role: "asc" }, { name: "asc" }],
        select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
      }),
      prisma.attendance.findMany({
        where: {
          businessId: businessContext.businessId,
          clockInAt: { gte: todayStart, lt: todayEnd },
        },
        select: { userId: true, clockInAt: true, clockOutAt: true, status: true },
      }),
    ]);

    const attendanceByUserId = new Map(todayAttendances.map((a) => [a.userId, a]));

    const employees = users.map((u) => {
      const attendance = attendanceByUserId.get(u.id);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.isActive ? "Active" : "Inactive",
        clockInAt: attendance?.clockInAt?.toISOString() ?? null,
        clockOutAt: attendance?.clockOutAt?.toISOString() ?? null,
        attendanceStatus: attendance?.status ?? null,
        joinedAt: u.createdAt.toISOString(),
      };
    });

    const activeCount = employees.filter((e) => e.status === "Active").length;
    const presentToday = todayAttendances.length;
    const clockedOut = todayAttendances.filter((a) => a.clockOutAt !== null).length;

    return successResponse(res, {
      data: {
        employees,
        stats: {
          total: employees.length,
          active: activeCount,
          presentToday,
          clockedOut,
        },
      },
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/workforce/attendance", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);

    const limitParam = typeof req.query.limit === "string" ? parseInt(req.query.limit, 10) : 50;
    const limit = isNaN(limitParam) || limitParam < 1 ? 50 : Math.min(limitParam, 200);

    const dateParam = typeof req.query.date === "string" ? req.query.date : null;
    let clockInFilter: { gte: Date; lt: Date } | undefined;

    if (dateParam) {
      const parsed = new Date(dateParam);
      if (!isNaN(parsed.getTime())) {
        const dayStart = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
        clockInFilter = { gte: dayStart, lt: new Date(dayStart.getTime() + 24 * 60 * 60 * 1000) };
      }
    }

    const records = await prisma.attendance.findMany({
      where: {
        businessId: businessContext.businessId,
        ...(clockInFilter ? { clockInAt: clockInFilter } : {}),
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { clockInAt: "desc" },
      take: limit,
    });

    const { start: todayStart, end: todayEnd } = getTodayRange();

    const todayRecords = records.filter(
      (r) => r.clockInAt >= todayStart && r.clockInAt < todayEnd,
    );

    const presentToday = todayRecords.filter((r) => r.status === "PRESENT" || r.status === "LATE").length;
    const lateToday = todayRecords.filter((r) => r.status === "LATE").length;
    const activeShift = todayRecords.filter((r) => !r.clockOutAt).length;

    return successResponse(res, {
      data: {
        records: records.map((r) => ({
          id: r.id,
          employeeId: r.user.id,
          employeeName: r.user.name,
          employeeRole: r.user.role,
          date: r.clockInAt.toISOString().split("T")[0],
          clockInAt: r.clockInAt.toISOString(),
          clockOutAt: r.clockOutAt?.toISOString() ?? null,
          workDurationMinutes: r.workDurationMinutes,
          overtimeMinutes: r.overtimeMinutes,
          status: r.status,
          note: r.note ?? null,
        })),
        stats: {
          presentToday,
          lateToday,
          activeShift,
          totalRecords: records.length,
        },
      },
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/workforce/shift-summary", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);

    const limitParam = typeof req.query.limit === "string" ? parseInt(req.query.limit, 10) : 20;
    const limit = isNaN(limitParam) || limitParam < 1 ? 20 : Math.min(limitParam, 100);

    const shifts = await prisma.shift.findMany({
      where: { businessId: businessContext.businessId },
      include: {
        user: { select: { id: true, name: true, role: true } },
        orders: {
          where: { status: "PAID" },
          select: { total: true },
        },
      },
      orderBy: { openedAt: "desc" },
      take: limit,
    });

    const mapped = shifts.map((s) => {
      const revenue = s.orders.reduce((sum, o) => sum + o.total, 0);
      const variance = s.cashDifference ?? 0;
      return {
        id: s.id,
        pic: s.user.name,
        role: s.user.role,
        openedAt: s.openedAt.toISOString(),
        closedAt: s.closedAt?.toISOString() ?? null,
        status: s.status,
        revenue,
        variance,
        orderCount: s.orders.length,
        openingCash: s.openingCash,
        closingCash: s.closingCash ?? null,
      };
    });

    const closedShifts = mapped.filter((s) => s.status === "CLOSED");
    const totalRevenue = closedShifts.reduce((sum, s) => sum + s.revenue, 0);
    const totalVariance = closedShifts.reduce((sum, s) => sum + s.variance, 0);
    const needsReview = mapped.filter((s) => Math.abs(s.variance) > 0).length;

    return successResponse(res, {
      data: {
        shifts: mapped,
        stats: {
          total: mapped.length,
          closed: closedShifts.length,
          open: mapped.length - closedShifts.length,
          totalRevenue,
          totalVariance,
          needsReview,
        },
      },
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/workforce/audit-log", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);

    const limitParam = typeof req.query.limit === "string" ? parseInt(req.query.limit, 10) : 30;
    const limit = isNaN(limitParam) || limitParam < 1 ? 30 : Math.min(limitParam, 100);

    const { start: todayStart } = getTodayRange();

    const [logs, eventsToday] = await Promise.all([
      prisma.auditLog.findMany({
        where: { businessId: businessContext.businessId },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.auditLog.count({
        where: {
          businessId: businessContext.businessId,
          createdAt: { gte: todayStart },
        },
      }),
    ]);

    const entityModuleMap: Record<string, string> = {
      User: "Team",
      MenuItem: "Menu",
      Order: "Orders",
      Shift: "Operations",
      InventoryItem: "Inventory",
      StockMovement: "Inventory",
      Business: "Settings",
      Invoice: "Finance",
      CashflowEntry: "Cashflow",
      RawMaterial: "Production",
      RetailProduct: "Retail",
      RetailSale: "Retail",
    };

    const mapped = logs.map((log) => ({
      id: log.id,
      event: `${log.action.charAt(0) + log.action.slice(1).toLowerCase()} ${log.entityType}`,
      actor: log.user.name || log.user.email,
      actorRole: log.user.role,
      module: entityModuleMap[log.entityType] ?? log.entityType,
      entityType: log.entityType,
      entityId: log.entityId,
      action: log.action,
      createdAt: log.createdAt.toISOString(),
    }));

    const uniqueModules = [...new Set(mapped.map((l) => l.module))];

    return successResponse(res, {
      data: {
        logs: mapped,
        stats: {
          totalRecords: logs.length,
          eventsToday,
          uniqueModules: uniqueModules.length,
          moduleList: uniqueModules,
        },
      },
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
