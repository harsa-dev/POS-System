"use client";

import { useEffect, useMemo, useState } from "react";

import { formatDateTime } from "@/lib/utils/format";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

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

  function clockOut() {
    setConfirmState({
      title: "Clock out now?",
      description: "Your current session will be recorded and closed.",
      onConfirm: async () => {
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
      },
    });
  }

  const activeAttendance = useMemo(() => {
    return attendances.find((attendance) => !attendance.clockOutAt);
  }, [attendances]);

  const filteredAttendances = useMemo(() => {
    return attendances.filter((attendance) => {
      const matchStatus =
        statusFilter === "ALL" || attendance.status === statusFilter;

      const matchSession =
        sessionFilter === "ALL" ||
        (sessionFilter === "ACTIVE" && !attendance.clockOutAt) ||
        (sessionFilter === "CLOSED" && attendance.clockOutAt);

      return matchStatus && matchSession;
    });
  }, [attendances, statusFilter, sessionFilter]);

  useEffect(() => {
    fetchAttendances();
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-bold">Attendance</h2>

            <p className="mt-1 text-sm text-neutral-500">
              Clock in before starting work and clock out when done.
            </p>
          </div>

          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              activeAttendance
                ? "bg-green-100 text-green-700"
                : "bg-neutral-200 text-neutral-700"
            }`}
          >
            {activeAttendance ? "CLOCKED IN" : "NOT CLOCKED IN"}
          </span>
        </div>

        {activeAttendance && (
          <div className="mt-5 grid gap-3 rounded-xl bg-neutral-50 p-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-neutral-500">Current Session</p>

              <p className="mt-1 font-semibold">
                Started at {formatDateTime(activeAttendance.clockInAt)}
              </p>

              <p className="text-sm text-neutral-500">
                {activeAttendance.user.name} • {activeAttendance.user.role}
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
            className="rounded-xl bg-black py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Processing..." : "Clock In"}
          </button>

          <button
            type="button"
            onClick={clockOut}
            disabled={isLoading || !activeAttendance}
            className="rounded-xl bg-red-600 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Processing..." : "Clock Out"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-neutral-500">Total Records</p>

          <p className="mt-2 text-3xl font-bold">{attendances.length}</p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-neutral-500">Late Staff</p>

          <p className="mt-2 text-3xl font-bold text-red-600">
            {
              attendances.filter((attendance) => attendance.status === "LATE")
                .length
            }
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-neutral-500">Active Sessions</p>

          <p className="mt-2 text-3xl font-bold text-green-700">
            {attendances.filter((attendance) => !attendance.clockOutAt).length}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-neutral-500">Total Overtime</p>

          <p className="mt-2 text-3xl font-bold text-orange-600">
            {formatMinutes(
              attendances.reduce(
                (acc, attendance) => acc + attendance.overtimeMinutes,
                0,
              ),
            )}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-5">
          <h2 className="text-lg font-bold">Attendance History</h2>

          <p className="mt-1 text-sm text-neutral-500">
            Staff clock-in, clock-out, duration, and overtime records.
          </p>
        </div>

        <div className="flex flex-col gap-3 border-b p-5 sm:flex-row">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border px-4 py-3 text-sm"
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
            className="rounded-xl border px-4 py-3 text-sm"
          >
            <option value="ALL">All Sessions</option>
            <option value="ACTIVE">Active</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead>
              <tr className="border-b bg-neutral-50">
                <th className="p-4">Staff</th>
                <th className="p-4">Role</th>
                <th className="p-4">Attendance</th>
                <th className="p-4">Session</th>
                <th className="p-4">Clock In</th>
                <th className="p-4">Clock Out</th>
                <th className="p-4">Duration</th>
                <th className="p-4">Overtime</th>
              </tr>
            </thead>

            <tbody>
              {filteredAttendances.map((attendance) => {
                const isActive = !attendance.clockOutAt;

                const durationMinutes = isActive
                  ? getLiveDurationMinutes(attendance.clockInAt)
                  : attendance.workDurationMinutes;

                return (
                  <td key={attendance.id} className="border-b">
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{attendance.user.name}</p>

                        <p className="text-xs text-neutral-500">
                          {attendance.user.email}
                        </p>
                      </div>
                    </td>

                    <td className="p-4">{attendance.user.role}</td>

                    <td className="p-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          attendance.status === "LATE"
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {attendance.status}
                      </span>
                    </td>

                    <td className="p-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-neutral-200 text-neutral-700"
                        }`}
                      >
                        {isActive ? "ACTIVE" : "CLOSED"}
                      </span>
                    </td>

                    <td className="p-4 text-neutral-500">
                      {formatDateTime(attendance.clockInAt)}
                    </td>

                    <td className="p-4 text-neutral-500">
                      {attendance.clockOutAt
                        ? formatDateTime(attendance.clockOutAt)
                        : "-"}
                    </td>

                    <td className="p-4">{formatMinutes(durationMinutes)}</td>

                    <td className="p-4">
                      {attendance.overtimeMinutes > 0 ? (
                        <span className="font-semibold text-orange-600">
                          {formatMinutes(attendance.overtimeMinutes)}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                  </td>
                );
              })}

              {filteredAttendances.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-neutral-500">
                    No attendance records yet.
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
