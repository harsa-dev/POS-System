import { prisma } from "../../lib/prisma.js";

type CountRow = { count: number };

async function safeCount(tableName: string, whereSql = "TRUE") {
  try {
    const rows = await prisma.$queryRawUnsafe<CountRow[]>(
      `SELECT COUNT(*)::int AS count FROM "${tableName}" WHERE ${whereSql}`,
    );

    return rows[0]?.count ?? 0;
  } catch {
    return 0;
  }
}

export async function getPlatformAdminSummary() {
  const [totalTenants, activeTenants, inactiveTenants, totalUsers, activeUsers, inactiveUsers] =
    await Promise.all([
      prisma.business.count(),
      prisma.business.count({ where: { isActive: true } }),
      prisma.business.count({ where: { isActive: false } }),
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: false } }),
    ]);

  const [platformAdmins, billingSnapshots, supportTickets, auditEvents, pendingApprovals] =
    await Promise.all([
      safeCount("PlatformAdminProfile"),
      safeCount("BillingAccountSnapshot"),
      safeCount("SupportTicket", `"status" IN ('OPEN', 'IN_PROGRESS', 'ESCALATED')`),
      safeCount("PlatformAdminAuditEvent"),
      safeCount("SensitiveActionApproval", `"status" = 'PENDING'`),
    ]);

  return {
    source: "platform-admin-readonly",
    tenants: {
      total: totalTenants,
      active: activeTenants,
      inactive: inactiveTenants,
    },
    users: {
      total: totalUsers,
      active: activeUsers,
      inactive: inactiveUsers,
    },
    platformAdmins: {
      total: platformAdmins,
    },
    billing: {
      snapshots: billingSnapshots,
    },
    support: {
      openOrActive: supportTickets,
    },
    audit: {
      events: auditEvents,
    },
    approvals: {
      pending: pendingApprovals,
    },
  };
}
