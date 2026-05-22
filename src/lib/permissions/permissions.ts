export const PERMISSIONS = {
  DASHBOARD_VIEW: "dashboard:view",

  ORDER_CREATE: "order:create",
  ORDER_VIEW: "order:view",
  ORDER_CANCEL: "order:cancel",
  ORDER_UPDATE_STATUS: "order:update-status",

  MENU_VIEW: "menu:view",
  MENU_CREATE: "menu:create",
  MENU_UPDATE: "menu:update",
  MENU_DELETE: "menu:delete",

  INVENTORY_VIEW: "inventory:view",
  INVENTORY_UPDATE: "inventory:update",

  TABLE_VIEW: "table:view",
  TABLE_UPDATE: "table:update",

  SHIFT_VIEW: "shift:view",
  SHIFT_OPEN: "shift:open",
  SHIFT_CLOSE: "shift:close",

  ATTENDANCE_VIEW: "attendance:view",
  ATTENDANCE_CLOCK: "attendance:clock",
  ATTENDANCE_MANAGE: "attendance:manage",

  ANALYTICS_VIEW: "analytics:view",

  EMPLOYEE_VIEW: "employee:view",
  EMPLOYEE_CREATE: "employee:create",
  EMPLOYEE_UPDATE: "employee:update",
  EMPLOYEE_DELETE: "employee:delete",

  SETTINGS_VIEW: "settings:view",
  SETTINGS_UPDATE: "settings:update",

  PAYMENT_VIEW: "payment:view",
  PAYMENT_MANAGE: "payment:manage",

  AUDIT_LOG_VIEW: "audit-log:view",
} as const;

export type PermissionKey =
  (typeof PERMISSIONS)[keyof typeof PERMISSIONS];