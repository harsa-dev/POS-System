import { Role } from "@prisma/client";
import { Router, type IRouter } from "express";

import { requireRole } from "../lib/auth.js";
import { requireBusinessContextForUser } from "../lib/business-context/index.js";
import { MANAGEMENT_ROLES } from "../lib/constants.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { prisma } from "../lib/prisma.js";
import { successResponse } from "../lib/responses/success-response.js";

const router: IRouter = Router();

const TEAM_MANAGEMENT_API_CONTRACT_VERSION = "team-management.v1.local-contract";

type PermissionActionId = "view" | "create" | "update" | "delete" | "approve" | "export" | "manage";
type PermissionScope = "shared" | "operations" | "finance" | "admin";
type PermissionState = Record<string, PermissionActionId[]>;
type TeamMemberStatus = "Active" | "Pending" | "Suspended";
type AccessChangeLogAction =
  | "CREATE_ROLE"
  | "UPDATE_ROLE"
  | "CLONE_ROLE"
  | "DELETE_ROLE"
  | "ASSIGN_ROLE"
  | "RESET_DEMO"
  | "APPLY_JOB_PRESET";

type PermissionModule = {
  id: string;
  label: string;
  scope: PermissionScope;
  actions: PermissionActionId[];
};

type ManagedRoleDto = {
  id: string;
  name: string;
  baseRole: Role;
  category: "default" | "library" | "job";
  locked: boolean;
  description: string;
  recommendedFor: string[];
  permissions: PermissionState;
  assignedUsers: number;
  status: "Locked" | "Custom" | "Draft" | "Job Preset";
  createdAt: string;
  updatedAt: string;
};

type TeamMemberDto = {
  id: string;
  name: string;
  email: string;
  area: string;
  roleId: string;
  status: TeamMemberStatus;
};

type AccessChangeLogDto = {
  id: string;
  at: string;
  actor: string;
  action: AccessChangeLogAction;
  target: string;
  note: string;
};

const permissionModules: PermissionModule[] = [
  { id: "business-overview", label: "Business Overview", scope: "shared", actions: ["view", "export"] },
  { id: "pos", label: "POS / Front Desk", scope: "operations", actions: ["view", "create", "update", "delete", "approve"] },
  { id: "orders", label: "Orders / Jobs / Work Orders", scope: "operations", actions: ["view", "create", "update", "delete", "approve"] },
  { id: "inventory", label: "Inventory & Stock", scope: "operations", actions: ["view", "create", "update", "delete", "approve"] },
  { id: "production", label: "Production / Processing", scope: "operations", actions: ["view", "create", "update", "delete", "approve"] },
  { id: "supplier", label: "Supplier / Procurement", scope: "operations", actions: ["view", "create", "update", "delete", "approve"] },
  { id: "cashflow", label: "Cashflow", scope: "finance", actions: ["view", "create", "update", "delete", "export", "approve"] },
  { id: "reports", label: "Reports & Analytics", scope: "shared", actions: ["view", "export", "approve"] },
  { id: "customers", label: "Customer / Client Records", scope: "shared", actions: ["view", "create", "update", "delete"] },
  { id: "team", label: "Team Management", scope: "admin", actions: ["view", "create", "update", "delete", "manage"] },
  { id: "settings", label: "Business Settings", scope: "admin", actions: ["view", "update", "manage"] },
];

function emptyPermissions(): PermissionState {
  return Object.fromEntries(permissionModules.map((module) => [module.id, []]));
}

function allPermissions(): PermissionState {
  return Object.fromEntries(permissionModules.map((module) => [module.id, module.actions]));
}

function viewOnlyPermissions(): PermissionState {
  return Object.fromEntries(permissionModules.map((module) => [module.id, module.actions.includes("view") ? ["view"] : []]));
}

function permissionState(seed: Record<string, PermissionActionId[]>): PermissionState {
  return {
    ...emptyPermissions(),
    ...Object.fromEntries(
      Object.entries(seed).map(([moduleId, actions]) => {
        const module = permissionModules.find((item) => item.id === moduleId);
        const validActions = new Set(module?.actions ?? []);
        return [moduleId, actions.filter((action) => validActions.has(action))];
      }),
    ),
  };
}

function roleIdFromRole(role: Role) {
  return `${role.toLowerCase()}-default`;
}

function getRoleTemplate(role: Role, now: string): ManagedRoleDto {
  const templates: Record<Role, Omit<ManagedRoleDto, "assignedUsers" | "createdAt" | "updatedAt">> = {
    [Role.OWNER]: {
      id: "owner-default",
      name: "Owner",
      baseRole: Role.OWNER,
      category: "default",
      locked: true,
      description: "Full system access. Backend snapshot role mapped from the canonical OWNER enum.",
      recommendedFor: ["Founder", "Business owner", "Portfolio demo admin"],
      permissions: allPermissions(),
      status: "Locked",
    },
    [Role.MANAGER]: {
      id: "manager-default",
      name: "Manager",
      baseRole: Role.MANAGER,
      category: "default",
      locked: true,
      description: "Management access for operations, reports, team review, and most approvals.",
      recommendedFor: ["Store manager", "Operations lead", "Branch lead"],
      permissions: permissionState({
        "business-overview": ["view", "export"],
        pos: ["view", "create", "update", "approve"],
        orders: ["view", "create", "update", "approve"],
        inventory: ["view", "create", "update", "approve"],
        production: ["view", "create", "update", "approve"],
        supplier: ["view", "create", "update", "approve"],
        cashflow: ["view", "create", "update", "export", "approve"],
        reports: ["view", "export", "approve"],
        customers: ["view", "create", "update"],
        team: ["view", "create", "update"],
        settings: ["view", "update"],
      }),
      status: "Locked",
    },
    [Role.ADMIN]: {
      id: "admin-default",
      name: "Admin",
      baseRole: Role.ADMIN,
      category: "default",
      locked: true,
      description: "Back-office admin role for data maintenance, team setup, and non-owner operations.",
      recommendedFor: ["Back office", "Finance admin", "HR admin"],
      permissions: permissionState({
        "business-overview": ["view"],
        pos: ["view"],
        orders: ["view", "update"],
        inventory: ["view", "create", "update"],
        supplier: ["view", "create", "update"],
        cashflow: ["view", "create", "update", "export"],
        reports: ["view", "export"],
        customers: ["view", "create", "update"],
        team: ["view", "create", "update", "manage"],
        settings: ["view"],
      }),
      status: "Locked",
    },
    [Role.OPERATOR]: {
      id: "operator-default",
      name: "Operator",
      baseRole: Role.OPERATOR,
      category: "default",
      locked: true,
      description: "General operational role for cashier, warehouse, production, or service tasks.",
      recommendedFor: ["Cashier", "Warehouse operator", "Production operator", "Service operator"],
      permissions: permissionState({
        "business-overview": ["view"],
        pos: ["view", "create", "update"],
        orders: ["view", "create", "update", "approve"],
        inventory: ["view", "create", "update"],
        production: ["view", "create", "update"],
        customers: ["view", "create", "update"],
        reports: ["view"],
        team: ["view"],
        settings: ["view"],
      }),
      status: "Locked",
    },
    [Role.STAFF]: {
      id: "staff-default",
      name: "Staff",
      baseRole: Role.STAFF,
      category: "default",
      locked: true,
      description: "Limited operational role for daily work without sensitive management controls.",
      recommendedFor: ["Floor staff", "Inventory staff", "Support staff", "Service staff"],
      permissions: permissionState({
        pos: ["view", "create"],
        orders: ["view", "create", "update"],
        inventory: ["view", "update"],
        production: ["view", "update"],
        customers: ["view"],
        team: ["view"],
      }),
      status: "Locked",
    },
    [Role.VIEWER]: {
      id: "viewer-default",
      name: "Viewer",
      baseRole: Role.VIEWER,
      category: "default",
      locked: true,
      description: "Read-only access for investor, auditor, mentor, or reviewer account.",
      recommendedFor: ["Investor", "Auditor", "Mentor", "Read-only demo"],
      permissions: viewOnlyPermissions(),
      status: "Locked",
    },
  };

  return {
    ...templates[role],
    assignedUsers: 0,
    createdAt: now,
    updatedAt: now,
  };
}

function getAreaForRole(role: Role) {
  const areaByRole: Record<Role, string> = {
    [Role.OWNER]: "Ownership",
    [Role.MANAGER]: "Operations",
    [Role.ADMIN]: "Back Office",
    [Role.OPERATOR]: "Operations Floor",
    [Role.STAFF]: "Daily Staff",
    [Role.VIEWER]: "Read-only Review",
  };

  return areaByRole[role];
}

function getMemberStatus(isActive: boolean): TeamMemberStatus {
  return isActive ? "Active" : "Suspended";
}

function mapAuditAction(action: "CREATE" | "UPDATE" | "DELETE"): AccessChangeLogAction {
  if (action === "CREATE") return "CREATE_ROLE";
  if (action === "DELETE") return "DELETE_ROLE";
  return "UPDATE_ROLE";
}

router.get("/team-management/snapshot", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const generatedAt = new Date().toISOString();

    const [users, auditLogs] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            { businessId: businessContext.businessId },
            { ownedBusinesses: { some: { id: businessContext.businessId } } },
          ],
        },
        orderBy: [{ role: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
        },
      }),
      prisma.auditLog.findMany({
        where: { businessId: businessContext.businessId },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    const memberCountByRole = new Map<Role, number>();
    for (const member of users) {
      memberCountByRole.set(member.role, (memberCountByRole.get(member.role) ?? 0) + 1);
    }

    const roles = Object.values(Role).map((role) => ({
      ...getRoleTemplate(role, generatedAt),
      assignedUsers: memberCountByRole.get(role) ?? 0,
    }));

    const members: TeamMemberDto[] = users.map((member) => ({
      id: member.id,
      name: member.name,
      email: member.email,
      area: getAreaForRole(member.role),
      roleId: roleIdFromRole(member.role),
      status: getMemberStatus(member.isActive),
    }));

    const logs: AccessChangeLogDto[] = auditLogs.map((log) => ({
      id: log.id,
      at: log.createdAt.toISOString(),
      actor: log.user.name || log.user.email,
      action: mapAuditAction(log.action),
      target: `${log.entityType}:${log.entityId}`,
      note: `Backend audit ${log.action.toLowerCase()} for ${log.entityType}.`,
    }));

    return successResponse(res, {
      data: {
        contractVersion: TEAM_MANAGEMENT_API_CONTRACT_VERSION,
        source: "api",
        generatedAt,
        business: {
          id: businessContext.businessId,
          name: businessContext.businessName,
          mode: businessContext.businessMode,
          type: businessContext.businessType,
        },
        viewer: {
          userId: user.id,
          role: user.role,
        },
        roles,
        members,
        logs,
      },
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
