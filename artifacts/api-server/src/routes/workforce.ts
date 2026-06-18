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

function getMonthRange(monthParam: string | null) {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();

  if (monthParam) {
    const parts = monthParam.split("-").map(Number);
    const y = parts[0];
    const m = parts[1];
    if (y && m && !isNaN(y) && !isNaN(m) && m >= 1 && m <= 12) {
      year = y;
      month = m - 1;
    }
  }

  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);
  const label = `${year}-${String(month + 1).padStart(2, "0")}`;
  return { start, end, label };
}

function deriveContractType(role: string): string {
  if (role === "OWNER" || role === "MANAGER") return "Permanent";
  if (role === "ADMIN") return "Back Office";
  if (role === "OPERATOR" || role === "STAFF") return "Regular";
  return "Observer";
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
        stats: { total: employees.length, active: activeCount, presentToday, clockedOut },
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
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { clockInAt: "desc" },
      take: limit,
    });

    const { start: todayStart, end: todayEnd } = getTodayRange();
    const todayRecords = records.filter((r) => r.clockInAt >= todayStart && r.clockInAt < todayEnd);
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
        stats: { presentToday, lateToday, activeShift, totalRecords: records.length },
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
        orders: { where: { status: "PAID" }, select: { total: true } },
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
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
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

router.get("/workforce/payroll-preview", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);

    const monthParam = typeof req.query.month === "string" ? req.query.month : null;
    const { start: periodStart, end: periodEnd, label: period } = getMonthRange(monthParam);

    const [users, attendances] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            { businessId: businessContext.businessId },
            { ownedBusinesses: { some: { id: businessContext.businessId } } },
          ],
          isActive: true,
        },
        select: { id: true, name: true, role: true },
        orderBy: [{ role: "asc" }, { name: "asc" }],
      }),
      prisma.attendance.findMany({
        where: {
          businessId: businessContext.businessId,
          clockInAt: { gte: periodStart, lt: periodEnd },
        },
        select: { userId: true, status: true, workDurationMinutes: true, overtimeMinutes: true },
      }),
    ]);

    const byUser = new Map<string, {
      attendanceDays: number;
      presentDays: number;
      lateDays: number;
      workMinutes: number;
      overtimeMinutes: number;
    }>();

    for (const a of attendances) {
      const prev = byUser.get(a.userId) ?? {
        attendanceDays: 0, presentDays: 0, lateDays: 0, workMinutes: 0, overtimeMinutes: 0,
      };
      prev.attendanceDays += 1;
      if (a.status === "PRESENT" || a.status === "LATE") prev.presentDays += 1;
      if (a.status === "LATE") prev.lateDays += 1;
      prev.workMinutes += a.workDurationMinutes;
      prev.overtimeMinutes += a.overtimeMinutes;
      byUser.set(a.userId, prev);
    }

    const employees = users.map((u) => {
      const agg = byUser.get(u.id) ?? {
        attendanceDays: 0, presentDays: 0, lateDays: 0, workMinutes: 0, overtimeMinutes: 0,
      };
      return {
        userId: u.id,
        name: u.name,
        role: u.role,
        attendanceDays: agg.attendanceDays,
        presentDays: agg.presentDays,
        lateDays: agg.lateDays,
        totalWorkMinutes: agg.workMinutes,
        overtimeMinutes: agg.overtimeMinutes,
      };
    });

    const totalAttendanceDays = employees.reduce((s, e) => s + e.attendanceDays, 0);
    const totalOvertimeMinutes = employees.reduce((s, e) => s + e.overtimeMinutes, 0);
    const withRecords = employees.filter((e) => e.attendanceDays > 0);
    const avgPresentRate =
      withRecords.length > 0
        ? Math.round(
            (withRecords.reduce((s, e) => s + e.presentDays / e.attendanceDays, 0) /
              withRecords.length) *
              100,
          ) / 100
        : 0;

    return successResponse(res, {
      data: {
        period,
        employees,
        stats: { totalEmployees: employees.length, totalAttendanceDays, avgPresentRate, totalOvertimeMinutes },
      },
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/workforce/roster-summary", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);

    const daysParam = typeof req.query.days === "string" ? parseInt(req.query.days, 10) : 14;
    const days = isNaN(daysParam) || daysParam < 1 ? 14 : Math.min(daysParam, 60);

    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const shifts = await prisma.shift.findMany({
      where: { businessId: businessContext.businessId, openedAt: { gte: since } },
      include: { orders: { where: { status: "PAID" }, select: { total: true } } },
      orderBy: { openedAt: "desc" },
    });

    const byDate = new Map<string, {
      staffIds: Set<string>;
      openShifts: number;
      closedShifts: number;
      revenue: number;
    }>();

    for (const shift of shifts) {
      const dateKey = shift.openedAt.toISOString().split("T")[0];
      const prev = byDate.get(dateKey) ?? {
        staffIds: new Set<string>(), openShifts: 0, closedShifts: 0, revenue: 0,
      };
      prev.staffIds.add(shift.userId);
      if (shift.status === "CLOSED") prev.closedShifts += 1;
      else prev.openShifts += 1;
      prev.revenue += shift.orders.reduce((s, o) => s + o.total, 0);
      byDate.set(dateKey, prev);
    }

    const dayRows = Array.from(byDate.entries())
      .map(([date, d]) => ({
        date,
        staffCount: d.staffIds.size,
        openShifts: d.openShifts,
        closedShifts: d.closedShifts,
        revenue: d.revenue,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));

    const totalRevenue = dayRows.reduce((s, d) => s + d.revenue, 0);
    const totalOpenShifts = dayRows.reduce((s, d) => s + d.openShifts, 0);
    const avgStaff =
      dayRows.length > 0
        ? Math.round((dayRows.reduce((s, d) => s + d.staffCount, 0) / dayRows.length) * 10) / 10
        : 0;

    return successResponse(res, {
      data: {
        days: dayRows,
        stats: { totalDays: dayRows.length, avgStaff, totalRevenue, openShifts: totalOpenShifts },
      },
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/workforce/performance-summary", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);

    const periodDays = 30;
    const since = new Date();
    since.setDate(since.getDate() - periodDays);
    since.setHours(0, 0, 0, 0);
    const workingDays = Math.round(periodDays * (5 / 7));

    const [users, attendances] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            { businessId: businessContext.businessId },
            { ownedBusinesses: { some: { id: businessContext.businessId } } },
          ],
          isActive: true,
        },
        select: { id: true, name: true, role: true },
        orderBy: [{ role: "asc" }, { name: "asc" }],
      }),
      prisma.attendance.findMany({
        where: {
          businessId: businessContext.businessId,
          clockInAt: { gte: since },
        },
        select: { userId: true, status: true, workDurationMinutes: true, overtimeMinutes: true },
      }),
    ]);

    const byUser = new Map<string, {
      presentDays: number;
      lateDays: number;
      workMinutes: number;
      overtimeMinutes: number;
    }>();

    for (const a of attendances) {
      const prev = byUser.get(a.userId) ?? {
        presentDays: 0, lateDays: 0, workMinutes: 0, overtimeMinutes: 0,
      };
      if (a.status === "PRESENT" || a.status === "LATE") prev.presentDays += 1;
      if (a.status === "LATE") prev.lateDays += 1;
      prev.workMinutes += a.workDurationMinutes;
      prev.overtimeMinutes += a.overtimeMinutes;
      byUser.set(a.userId, prev);
    }

    const employees = users
      .map((u) => {
        const agg = byUser.get(u.id) ?? {
          presentDays: 0, lateDays: 0, workMinutes: 0, overtimeMinutes: 0,
        };
        const attendanceRate =
          workingDays > 0 ? Math.min(Math.round((agg.presentDays / workingDays) * 100), 100) : 0;
        const lateRatio = agg.presentDays > 0 ? agg.lateDays / agg.presentDays : 0;
        const overtimeBonus = Math.min(Math.floor(agg.overtimeMinutes / 60), 10) * 0.5;
        const score = Math.max(
          0,
          Math.min(
            100,
            Math.round(Math.min(attendanceRate * 0.85, 85) - lateRatio * 15 + overtimeBonus),
          ),
        );
        return {
          userId: u.id,
          name: u.name,
          role: u.role,
          presentDays: agg.presentDays,
          lateDays: agg.lateDays,
          totalWorkMinutes: agg.workMinutes,
          overtimeMinutes: agg.overtimeMinutes,
          attendanceRate,
          score,
        };
      })
      .sort((a, b) => b.score - a.score);

    const avgScore =
      employees.length > 0
        ? Math.round(employees.reduce((s, e) => s + e.score, 0) / employees.length)
        : 0;
    const avgAttendanceRate =
      employees.length > 0
        ? Math.round(employees.reduce((s, e) => s + e.attendanceRate, 0) / employees.length)
        : 0;

    return successResponse(res, {
      data: {
        periodDays,
        employees,
        stats: { totalEmployees: employees.length, avgScore, avgAttendanceRate, workingDays },
      },
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/workforce/contracts", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { businessId: businessContext.businessId },
          { ownedBusinesses: { some: { id: businessContext.businessId } } },
        ],
      },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    });

    const contracts = users.map((u) => ({
      userId: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      contractType: deriveContractType(u.role),
      status: u.isActive ? "Active" : "Suspended",
      startDate: u.createdAt.toISOString(),
      endDate: null as string | null,
    }));

    const active = contracts.filter((c) => c.status === "Active").length;
    const byType: Record<string, number> = {};
    for (const c of contracts) {
      byType[c.contractType] = (byType[c.contractType] ?? 0) + 1;
    }

    return successResponse(res, {
      data: {
        contracts,
        stats: { total: contracts.length, active, byType },
        note: "Contract start date is derived from account creation. Formal contract records are not yet tracked.",
      },
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
