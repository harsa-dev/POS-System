import { serviceBusinessWorkflowStatuses, type ServiceBusinessWorkflowStatus } from "./service-business.types.js";

export function getText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function requireBodyObject(reqBody: unknown) {
  return typeof reqBody === "object" && reqBody !== null ? (reqBody as Record<string, unknown>) : null;
}

export function isServiceBusinessWorkflowStatus(value: string): value is ServiceBusinessWorkflowStatus {
  return serviceBusinessWorkflowStatuses.includes(value as ServiceBusinessWorkflowStatus);
}

export function parseServiceBusinessWorkflowStatus(value: unknown) {
  const status = getText(value).toUpperCase();
  return isServiceBusinessWorkflowStatus(status) ? status : null;
}
