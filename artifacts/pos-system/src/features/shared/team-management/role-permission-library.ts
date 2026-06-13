export type SystemRole = "OWNER" | "MANAGER" | "ADMIN" | "OPERATOR" | "STAFF" | "VIEWER";

export type PermissionActionId =
  | "view"
  | "create"
  | "update"
  | "delete"
  | "approve"
  | "export"
  | "manage";

export type PermissionScope = "shared" | "operations" | "finance" | "admin";

export type PermissionAction = {
  id: PermissionActionId;
  label: string;
  description: string;
  destructive?: boolean;
  elevated?: boolean;
};

export type PermissionModule = {
  id: string;
  label: string;
  scope: PermissionScope;
  description: string;
  actions: PermissionAction[];
};

export type PermissionState = Record<string, PermissionActionId[]>;

export type RoleTemplate = {
  id: string;
  name: string;
  baseRole: SystemRole;
  category: "default" | "library" | "job";
  locked: boolean;
  description: string;
  recommendedFor: string[];
  permissions: PermissionState;
};

export type ManagedRole = RoleTemplate & {
  assignedUsers: number;
  status: "Locked" | "Custom" | "Draft" | "Job Preset";
  createdAt: string;
  updatedAt: string;
};

export type TeamMemberStatus = "Active" | "Pending" | "Suspended";

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  area: string;
  roleId: string;
  status: TeamMemberStatus;
};

export type AccessChangeLog = {
  id: string;
  at: string;
  actor: string;
  action:
    | "CREATE_ROLE"
    | "UPDATE_ROLE"
    | "CLONE_ROLE"
    | "DELETE_ROLE"
    | "ASSIGN_ROLE"
    | "RESET_DEMO"
    | "APPLY_JOB_PRESET";
  target: string;
  note: string;
};

const commonActions: PermissionAction[] = [
  { id: "view", label: "View", description: "Open and read this module." },
  { id: "create", label: "Create", description: "Create new records." },
  { id: "update", label: "Update", description: "Edit existing records." },
  { id: "delete", label: "Delete", description: "Remove, void, cancel, or deactivate records.", destructive: true },
];

export const permissionModules: PermissionModule[] = [
  {
    id: "business-overview",
    label: "Business Overview",
    scope: "shared",
    description: "Main shared dashboard, KPI cards, and cross-mode overview.",
    actions: [
      { id: "view", label: "View", description: "Open overview dashboard." },
      { id: "export", label: "Export", description: "Export overview snapshots." },
    ],
  },
  {
    id: "pos",
    label: "POS / Front Desk",
    scope: "operations",
    description: "Checkout, service counter, booking desk, customer intake, and payment-facing work.",
    actions: [
      ...commonActions,
      { id: "approve", label: "Approve", description: "Approve checkout exceptions or operational overrides.", elevated: true },
    ],
  },
  {
    id: "orders",
    label: "Orders / Jobs / Work Orders",
    scope: "operations",
    description: "Order list, job order, service ticket, workflow status, and operational fulfillment.",
    actions: [
      ...commonActions,
      { id: "approve", label: "Approve", description: "Approve or move workflow status.", elevated: true },
    ],
  },
  {
    id: "inventory",
    label: "Inventory & Stock",
    scope: "operations",
    description: "Stock item, movement, adjustment, receiving, raw material, and asset tracking.",
    actions: [
      ...commonActions,
      { id: "approve", label: "Approve", description: "Approve stock correction.", elevated: true },
    ],
  },
  {
    id: "production",
    label: "Production / Processing",
    scope: "operations",
    description: "Kitchen production, raw material processing, repair execution, field service fulfillment, and quality steps.",
    actions: [
      ...commonActions,
      { id: "approve", label: "Approve", description: "Approve completion or quality gate.", elevated: true },
    ],
  },
  {
    id: "supplier",
    label: "Supplier / Procurement",
    scope: "operations",
    description: "Supplier records, purchase requests, receiving, intake, and vendor coordination.",
    actions: [
      ...commonActions,
      { id: "approve", label: "Approve", description: "Approve supplier or procurement document.", elevated: true },
    ],
  },
  {
    id: "cashflow",
    label: "Cashflow",
    scope: "finance",
    description: "Cashflow entries, payment sync, voiding, and finance review.",
    actions: [
      ...commonActions,
      { id: "export", label: "Export", description: "Export cashflow reports." },
      { id: "approve", label: "Approve", description: "Approve finance adjustments.", elevated: true },
    ],
  },
  {
    id: "reports",
    label: "Reports & Analytics",
    scope: "shared",
    description: "Analytics, financial reports, operational reports, and summaries.",
    actions: [
      { id: "view", label: "View", description: "Read reports." },
      { id: "export", label: "Export", description: "Export reports." },
      { id: "approve", label: "Approve", description: "Approve locked reports.", elevated: true },
    ],
  },
  {
    id: "customers",
    label: "Customer / Client Records",
    scope: "shared",
    description: "Customer profile, client history, loyalty, partner records, and communication notes.",
    actions: commonActions,
  },
  {
    id: "team",
    label: "Team Management",
    scope: "admin",
    description: "Employee list, role assignment, invite flow, and permission presets.",
    actions: [
      ...commonActions,
      { id: "manage", label: "Manage", description: "Create roles and assign permissions.", elevated: true },
    ],
  },
  {
    id: "settings",
    label: "Business Settings",
    scope: "admin",
    description: "Business profile, mode settings, payment config, tax, and account controls.",
    actions: [
      { id: "view", label: "View", description: "Read settings." },
      { id: "update", label: "Update", description: "Update settings.", elevated: true },
      { id: "manage", label: "Manage", description: "Manage sensitive settings.", elevated: true },
    ],
  },
];

function emptyPermissions(): PermissionState {
  return Object.fromEntries(permissionModules.map((module) => [module.id, []]));
}

function allPermissions(): PermissionState {
  return Object.fromEntries(permissionModules.map((module) => [module.id, module.actions.map((action) => action.id)]));
}

function viewOnlyPermissions(): PermissionState {
  return Object.fromEntries(permissionModules.map((module) => [module.id, module.actions.some((action) => action.id === "view") ? ["view"] : []]));
}

export function permissionState(seed: Record<string, PermissionActionId[]>): PermissionState {
  return {
    ...emptyPermissions(),
    ...Object.fromEntries(
      Object.entries(seed).map(([moduleId, actions]) => [
        moduleId,
        actions.filter((action) => permissionModules.find((module) => module.id === moduleId)?.actions.some((item) => item.id === action)),
      ]),
    ),
  };
}

export const roleTemplateLibrary: RoleTemplate[] = [
  {
    id: "owner-default",
    name: "Owner",
    baseRole: "OWNER",
    category: "default",
    locked: true,
    description: "Full system access. Default role that cannot be deleted from the demo UI.",
    recommendedFor: ["Founder", "Business owner", "Portfolio demo admin"],
    permissions: allPermissions(),
  },
  {
    id: "manager-default",
    name: "Manager",
    baseRole: "MANAGER",
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
  },
  {
    id: "admin-default",
    name: "Admin",
    baseRole: "ADMIN",
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
  },
  {
    id: "operator-default",
    name: "Operator",
    baseRole: "OPERATOR",
    category: "default",
    locked: true,
    description: "General operational role for cashier, warehouse, service, or production tasks.",
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
  },
  {
    id: "staff-default",
    name: "Staff",
    baseRole: "STAFF",
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
  },
  {
    id: "viewer-default",
    name: "Viewer",
    baseRole: "VIEWER",
    category: "default",
    locked: true,
    description: "Read-only access for investor, auditor, mentor, or reviewer account.",
    recommendedFor: ["Investor", "Auditor", "Mentor", "Read-only demo"],
    permissions: viewOnlyPermissions(),
  },
];

export function createDefaultManagedRoles(now = new Date().toISOString()): ManagedRole[] {
  return roleTemplateLibrary.map((role, index) => ({
    ...role,
    assignedUsers: [1, 2, 1, 4, 8, 2][index] ?? 0,
    status: "Locked",
    createdAt: now,
    updatedAt: now,
  }));
}

export function createDefaultMembers(): TeamMember[] {
  return [
    { id: "usr-001", name: "Nadia Putri", email: "nadia@demo.local", roleId: "manager-default", area: "Operations", status: "Active" },
    { id: "usr-002", name: "Raka Pratama", email: "raka@demo.local", roleId: "operator-default", area: "Restaurant / Retail", status: "Active" },
    { id: "usr-003", name: "Dimas Arga", email: "dimas@demo.local", roleId: "staff-default", area: "Warehouse", status: "Pending" },
    { id: "usr-004", name: "Maya Sari", email: "maya@demo.local", roleId: "admin-default", area: "Finance", status: "Active" },
  ];
}

export function clonePermissionState(permissions: PermissionState): PermissionState {
  return Object.fromEntries(permissionModules.map((module) => [module.id, [...(permissions[module.id] ?? [])]]));
}

export function countGrantedPermissions(permissions: PermissionState) {
  return Object.values(permissions).reduce((total, actions) => total + actions.length, 0);
}

export function countTotalPermissions() {
  return permissionModules.reduce((total, module) => total + module.actions.length, 0);
}

export function countRiskyPermissions(permissions: PermissionState) {
  return permissionModules.reduce((total, module) => {
    const grantedActions = new Set(permissions[module.id] ?? []);
    return total + module.actions.filter((action) => grantedActions.has(action.id) && (action.destructive || action.elevated || action.id === "manage")).length;
  }, 0);
}

export function getPermissionKeys(permissions: PermissionState) {
  return permissionModules.flatMap((module) =>
    (permissions[module.id] ?? []).map((action) => `${module.scope}.${module.id}.${action}`),
  );
}

export function roleIdFromName(name: string) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "custom-role";
  return `${slug}-${Date.now()}`;
}

export function validateRoleName(name: string, roles: ManagedRole[], currentRoleId?: string) {
  const trimmed = name.trim();

  if (trimmed.length < 3) return "Role name must be at least 3 characters.";

  const duplicate = roles.some((role) => role.id !== currentRoleId && role.name.toLowerCase() === trimmed.toLowerCase());
  if (duplicate) return "Role name already exists.";

  return null;
}

export function getPermissionDiff(previous: PermissionState, next: PermissionState) {
  const added: string[] = [];
  const removed: string[] = [];

  for (const module of permissionModules) {
    const before = new Set(previous[module.id] ?? []);
    const after = new Set(next[module.id] ?? []);

    for (const action of after) if (!before.has(action)) added.push(`${module.label}: ${action}`);
    for (const action of before) if (!after.has(action)) removed.push(`${module.label}: ${action}`);
  }

  return { added, removed };
}

export function createAccessLog(action: AccessChangeLog["action"], target: string, note: string): AccessChangeLog {
  return {
    id: `log-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    at: new Date().toISOString(),
    actor: "Demo Owner",
    action,
    target,
    note,
  };
}
