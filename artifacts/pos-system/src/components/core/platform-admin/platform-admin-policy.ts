export type PlatformAdminCapability =
  | "platform-admin.internal-monitoring.read"
  | "platform-admin.internal-monitoring.routes.read"
  | "platform-admin.internal-monitoring.contracts.read"
  | "platform-admin.internal-monitoring.integrity.read";

export type PlatformAdminRuntimeRole =
  | "OWNER"
  | "ADMIN"
  | "MANAGER"
  | "OPERATOR"
  | "STAFF"
  | "VIEWER"
  | string;

const platformAdminCapabilityRoles: Record<PlatformAdminCapability, string[]> = {
  "platform-admin.internal-monitoring.read": ["OWNER", "ADMIN"],
  "platform-admin.internal-monitoring.routes.read": ["OWNER", "ADMIN"],
  "platform-admin.internal-monitoring.contracts.read": ["OWNER", "ADMIN"],
  "platform-admin.internal-monitoring.integrity.read": ["OWNER", "ADMIN"],
};

export function getPlatformAdminAllowedRoles(capability: PlatformAdminCapability) {
  return platformAdminCapabilityRoles[capability] ?? [];
}

export function canAccessPlatformAdminCapability({
  role,
  capability,
}: {
  role: PlatformAdminRuntimeRole | null | undefined;
  capability: PlatformAdminCapability;
}) {
  if (!role) return false;

  return getPlatformAdminAllowedRoles(capability).includes(role);
}
