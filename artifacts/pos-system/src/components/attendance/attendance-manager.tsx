"use client";

import { useEffect, useMemo, useState } from "react";

import { formatDateTime } from "@/lib/utils/format";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ClipboardList } from "lucide-react";

type Attendance = {
  id: string;
  clockInAt: string;
  clockOutAt?: string | null;

  workDurationMinutes: number;
  overtimeMinutes: number;

  status: "PRESENT" | "LATE" | "ABSENT" | "LEAVE";

  note?: string | null;

  user: {
    name: string;
    email: string;
    role: string;
  };
};

const ATTENDANCE_STATUS_COLORS: Record<string, string> = {
  PRESENT: "bg-green-100 text-green-700",
  LATE: "bg-red-100 text-red-700",
  ABSENT: "bg-neutral-100 text-neutral-600",
  LEAVE: "bg-blue-100 text-blue-700",
};

function getAttendanceStatusColor(status: string) {
  return ATTENDANCE_STATUS_COLORS[status] ?? "bg-neutral-100 text-neutral-600";
}

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

function getLiveDurationMinutes(clockInAt: string) {
  const clockIn = new Date(clockInAt);
  return Math.max(0, Math.floor((Date.now() - clockIn.getTime()) / 1000 / 60));
}

export function AttendanceManager() {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sessionFilter, setSessionFilter] = useState("ALL");
  const [confirmState, setConfirmState] = useState<{
    title: string;
    description?: string;
    variant?: "default" | "destructive";
    onConfirm: () => void;
  } | null>(null);

  async function fetchAttendances() {
    const res = await fetch("/api/attendance", { credentials: "include" });
    const data = await res.json();
    if (data.success) {
      setAttendances(data.data);
    }
  }

  async function clockIn() {
    setIsLoading(true);

    const res = await fetch("/api/attendance/clock-in", {
      credentials: "include",
      method: "POST",
    });

    const data = await res.json();
    setIsLoading(false);

    if (!data.success) {
      toast.error(data.message || "Failed to clock in");
      return;
    }

    fetchAttendances();
  }

  async function clockOut() {
    setIsLoading(true);

    const res = await fetch("/api/attendance/clock-out", {
      credentials: "include",
      method: "POST",
    });

    const data = await res.json();
    setIsLoading(false);

    if (!data.success) {
      toast.error(data.message || "Failed to clock out");
      return;
    }

    fetchAttendances();
  }

  async function deleteAttendance(id: string) {
    const res = await fetch(`/api/attendance/${id}`, {
      credentials: "include",
      method: "DELETE",
    });

    const data = await res.json();

    if (!data.success) {
      toast.error(data.message || "Failed to delete attendance record");
      return;
    }

    fetchAttendances();
  }

  const activeAttendance = attendances.find((a) => !a.clockOutAt) ?? null;

  const filteredAttendances = useMemo(() => {
    return attendances.filter((attendance) => {
      const isActive = !attendance.clockOutAt;

      const matchStatus =
        statusFilter === "ALL" || attendance.status === statusFilter;

      const matchSession =
        sessionFilter === "ALL" ||
        (sessionFilter === "ACTIVE" && isActive) ||
        (sessionFilter === "CLOSED" && !isActive);

      return matchStatus && matchSession;
    });
  }, [attendances, statusFilter, sessionFilter]);

  useEffect(() => {
    fetchAttendances();
  }, []);

  return (
    <div className="space-y-6">
      {/* Clock in/out card */}
      <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-bold">Attendance</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Clock in before starting work and clock out when done.
            </p>
          </div>

          <StatusBadge
            className={
              activeAttendance
                ? "bg-green-100 text-green-700"
                : "bg-neutral-200 text-neutral-700"
            }
          >
            {activeAttendance ? "CLOCKED IN" : "NOT CLOCKED IN"}
          </StatusBadge>
        </div>

        {activeAttendance && (
          <div className="mt-5 grid gap-3 rounded-2xl bg-neutral-50 p-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-neutral-500">Current Session</p>
              <p className="mt-1 font-semibold">
                Started at {formatDateTime(activeAttendance.clockInAt)}
              </p>
              <p className="text-sm text-neutral-500">
                {activeAttendance.user.name} · {activeAttendance.user.role}
              </p>
            </div>

            <div>
              <p className="text-sm text-neutral-500">Live Duration</p>
              <p className="mt-1 text-xl font-bold">
                {formatMinutes(
                  getLiveDurationMinutes(activeAttendance.clockInAt),
                )}
              </p>
            </div>

            <div>
              <p className="text-sm text-neutral-500">Status</p>
              <p
                className={`mt-1 text-xl font-bold ${
                  activeAttendance.status === "LATE"
                    ? "text-red-600"
                    : "text-green-700"
                }`}
              >
                {activeAttendance.status}
              </p>
            </div>
          </div>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={clockIn}
            disabled={isLoading || Boolean(activeAttendance)}
            className="flex h-11 items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Processing..." : "Clock In"}
          </button>

          <button
            type="button"
            onClick={clockOut}
            disabled={isLoading || !activeAttendance}
            className="flex h-11 items-center justify-center rounded-2xl bg-red-600 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Processing..." : "Clock Out"}
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-neutral-500">Total Records</p>
          <p className="mt-2 text-3xl font-bold">{attendances.length}</p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-neutral-500">Late Staff</p>
          <p className="mt-2 text-3xl font-bold text-red-600">
            {attendances.filter((a) => a.status === "LATE").length}
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-neutral-500">Active Sessions</p>
          <p className="mt-2 text-3xl font-bold text-green-700">
            {attendances.filter((a) => !a.clockOutAt).length}
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-neutral-500">Total Overtime</p>
          <p className="mt-2 text-3xl font-bold text-orange-600">
            {formatMinutes(
              attendances.reduce((acc, a) => acc + a.overtimeMinutes, 0),
            )}
          </p>
        </div>
      </div>

      {/* Attendance history table */}
      <div className="rounded-3xl border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-200 p-5">
          <h2 className="text-lg font-bold">Attendance History</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Staff clock-in, clock-out, duration, and overtime records.
          </p>
        </div>

        <div className="flex flex-col gap-3 border-b border-neutral-200 p-5 sm:flex-row">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 rounded-2xl border border-neutral-200 px-4 text-sm outline-none"
          >
            <option value="ALL">All Attendance Status</option>
            <option value="PRESENT">Present</option>
            <option value="LATE">Late</option>
            <option value="ABSENT">Absent</option>
            <option value="LEAVE">Leave</option>
          </select>

          <select
            value={sessionFilter}
            onChange={(e) => setSessionFilter(e.target.value)}
            className="h-11 rounded-2xl border border-neutral-200 px-4 text-sm outline-none"
          >
            <option value="ALL">All Sessions</option>
            <option value="ACTIVE">Active</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="p-4 font-medium text-neutral-500">Staff</th>
                <th className="p-4 font-medium text-neutral-500">Role</th>
                <th className="p-4 font-medium text-neutral-500">Attendance</th>
                <th className="p-4 font-medium text-neutral-500">Session</th>
                <th className="p-4 font-medium text-neutral-500">Clock In</th>
                <th className="p-4 font-medium text-neutral-500">Clock Out</th>
                <th className="p-4 font-medium text-neutral-500">Duration</th>
                <th className="p-4 font-medium text-neutral-500">Overtime</th>
              </tr>
            </thead>

            <tbody>
              {filteredAttendances.map((attendance) => {
                const isActive = !attendance.clockOutAt;

                const durationMinutes = isActive
                  ? getLiveDurationMinutes(attendance.clockInAt)
                  : attendance.workDurationMinutes;

                return (
                  <tr key={attendance.id} className="border-b border-neutral-100 transition hover:bg-neutral-50">
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{attendance.user.name}</p>
                        <p className="text-xs text-neutral-500">
                          {attendance.user.email}
                        </p>
                      </div>
                    </td>

                    <td className="p-4 text-neutral-600">
                      {attendance.user.role}
                    </td>

                    <td className="p-4">
                      <StatusBadge
                        className={getAttendanceStatusColor(attendance.status)}
                      >
                        {attendance.status}
                      </StatusBadge>
                    </td>

                    <td className="p-4">
                      <StatusBadge
                        className={
                          isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-neutral-100 text-neutral-600"
                        }
                      >
                        {isActive ? "ACTIVE" : "CLOSED"}
                      </StatusBadge>
                    </td>

                    <td className="p-4 text-neutral-500">
                      {formatDateTime(attendance.clockInAt)}
                    </td>

                    <td className="p-4 text-neutral-500">
                      {attendance.clockOutAt
                        ? formatDateTime(attendance.clockOutAt)
                        : "—"}
                    </td>

                    <td className="p-4">{formatMinutes(durationMinutes)}</td>

                    <td className="p-4">
                      {attendance.overtimeMinutes > 0 ? (
                        <span className="font-semibold text-orange-600">
                          {formatMinutes(attendance.overtimeMinutes)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredAttendances.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      icon={ClipboardList}
                      title="No attendance records"
                      description="Records will appear after staff clock in."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmState}
        title={confirmState?.title ?? ""}
        description={confirmState?.description}
        variant={confirmState?.variant}
        onConfirm={() => {
          const action = confirmState?.onConfirm;
          setConfirmState(null);
          action?.();
        }}
        onCancel={() => setConfirmState(null)}
      />
    </div>
  );
}
