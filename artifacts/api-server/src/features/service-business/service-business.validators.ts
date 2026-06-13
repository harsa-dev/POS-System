import {
  serviceBusinessCostCategories,
  serviceBusinessPriorities,
  serviceBusinessWorkflowStatuses,
  type ServiceBusinessCostCategory,
  type ServiceBusinessPriority,
  type ServiceBusinessWorkflowStatus,
} from "./service-business.types.js";

export function getText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function getFiniteNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

export function getDate(value: unknown) {
  const raw = getText(value);
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function requireBodyObject(reqBody: unknown) {
  return typeof reqBody === "object" && reqBody !== null ? (reqBody as Record<string, unknown>) : null;
}

export function isServiceBusinessWorkflowStatus(value: string): value is ServiceBusinessWorkflowStatus {
  return serviceBusinessWorkflowStatuses.includes(value as ServiceBusinessWorkflowStatus);
}

export function isServiceBusinessPriority(value: string): value is ServiceBusinessPriority {
  return serviceBusinessPriorities.includes(value as ServiceBusinessPriority);
}

export function isServiceBusinessCostCategory(value: string): value is ServiceBusinessCostCategory {
  return serviceBusinessCostCategories.includes(value as ServiceBusinessCostCategory);
}

export function parseServiceBusinessWorkflowStatus(value: unknown) {
  const status = getText(value).toUpperCase();
  return isServiceBusinessWorkflowStatus(status) ? status : null;
}

export function parseServiceBusinessPriority(value: unknown) {
  const priority = getText(value).toUpperCase();
  return isServiceBusinessPriority(priority) ? priority : null;
}

export function parseServiceBusinessCostCategory(value: unknown) {
  const category = getText(value).toLowerCase();
  return isServiceBusinessCostCategory(category) ? category : null;
}
