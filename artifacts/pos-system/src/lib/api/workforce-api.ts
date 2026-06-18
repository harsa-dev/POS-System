import { apiClient } from "@/lib/api/api-client";

type Env<T> = { success: boolean; data: T; message?: string };

function get<T>(endpoint: string): Promise<T> {
  return apiClient.get<Env<T>>(endpoint).then((r) => r.data);
}

export type WorkforceEmployee = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  clockInAt: string | null;
  clockOutAt: string | null;
  attendanceStatus: string | null;
  joinedAt: string;
};

export type WorkforceEmployeeStats = {
  total: number;
  active: number;
  presentToday: number;
  clockedOut: number;
};

export type AttendanceRecord = {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  date: string;
  clockInAt: string;
  clockOutAt: string | null;
  workDurationMinutes: number;
  overtimeMinutes: number;
  status: string;
  note: string | null;
};

export type AttendanceStats = {
  presentToday: number;
  lateToday: number;
  activeShift: number;
  totalRecords: number;
};

export type ShiftRow = {
  id: string;
  pic: string;
  role: string;
  openedAt: string;
  closedAt: string | null;
  status: string;
  revenue: number;
  variance: number;
  orderCount: number;
  openingCash: number;
  closingCash: number | null;
};

export type ShiftStats = {
  total: number;
  closed: number;
  open: number;
  totalRevenue: number;
  totalVariance: number;
  needsReview: number;
};

export type AuditLogRow = {
  id: string;
  event: string;
  actor: string;
  actorRole: string;
  module: string;
  entityType: string;
  entityId: string;
  action: string;
  createdAt: string;
};

export type AuditStats = {
  totalRecords: number;
  eventsToday: number;
  uniqueModules: number;
  moduleList: string[];
};

export type PayrollPreviewEmployee = {
  userId: string;
  name: string;
  role: string;
  attendanceDays: number;
  presentDays: number;
  lateDays: number;
  totalWorkMinutes: number;
  overtimeMinutes: number;
};

export type PayrollPreviewStats = {
  totalEmployees: number;
  totalAttendanceDays: number;
  avgPresentRate: number;
  totalOvertimeMinutes: number;
};

export type RosterDay = {
  date: string;
  staffCount: number;
  openShifts: number;
  closedShifts: number;
  revenue: number;
};

export type RosterStats = {
  totalDays: number;
  avgStaff: number;
  totalRevenue: number;
  openShifts: number;
};

export type PerformanceEmployee = {
  userId: string;
  name: string;
  role: string;
  presentDays: number;
  lateDays: number;
  totalWorkMinutes: number;
  overtimeMinutes: number;
  attendanceRate: number;
  score: number;
};

export type PerformanceStats = {
  totalEmployees: number;
  avgScore: number;
  avgAttendanceRate: number;
  workingDays: number;
};

export type ContractRow = {
  userId: string;
  name: string;
  email: string;
  role: string;
  contractType: string;
  status: string;
  startDate: string;
  endDate: string | null;
};

export type ContractStats = {
  total: number;
  active: number;
  byType: Record<string, number>;
};

export const workforceApi = {
  employees: () =>
    get<{ employees: WorkforceEmployee[]; stats: WorkforceEmployeeStats }>("/workforce/employees"),

  attendance: (date?: string) =>
    get<{ records: AttendanceRecord[]; stats: AttendanceStats }>(
      `/workforce/attendance${date ? `?date=${date}` : ""}`,
    ),

  shiftSummary: (limit?: number) =>
    get<{ shifts: ShiftRow[]; stats: ShiftStats }>(
      `/workforce/shift-summary${limit ? `?limit=${limit}` : ""}`,
    ),

  auditLog: (limit?: number) =>
    get<{ logs: AuditLogRow[]; stats: AuditStats }>(
      `/workforce/audit-log${limit ? `?limit=${limit}` : ""}`,
    ),

  payrollPreview: (month?: string) =>
    get<{ period: string; employees: PayrollPreviewEmployee[]; stats: PayrollPreviewStats }>(
      `/workforce/payroll-preview${month ? `?month=${month}` : ""}`,
    ),

  rosterSummary: (days?: number) =>
    get<{ days: RosterDay[]; stats: RosterStats }>(
      `/workforce/roster-summary${days ? `?days=${days}` : ""}`,
    ),

  performanceSummary: () =>
    get<{ periodDays: number; employees: PerformanceEmployee[]; stats: PerformanceStats }>(
      "/workforce/performance-summary",
    ),

  contracts: () =>
    get<{ contracts: ContractRow[]; stats: ContractStats; note: string }>("/workforce/contracts"),
};
