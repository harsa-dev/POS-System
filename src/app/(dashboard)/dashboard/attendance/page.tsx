import { AttendanceManager } from "@/components/attendance/attendance-manager";
import { AttendanceSettingsCard } from "@/components/attendance/attendance-settings-card";

import { requireRole } from "@/lib/auth/require-role";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export default async function AttendancePage() {
  await requireRole(["OWNER", "MANAGER", "CASHIER", "KITCHEN", "SERVER"]);

  const user = await getCurrentUser();

  const canManageAttendanceSettings =
    user?.role === "OWNER" || user?.role === "MANAGER";

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Attendance</h1>

        <p className="mt-2 text-neutral-600">
          Manage staff attendance and work sessions.
        </p>
      </div>

      {canManageAttendanceSettings && <AttendanceSettingsCard />}

      <AttendanceManager />
    </section>
  );
}
