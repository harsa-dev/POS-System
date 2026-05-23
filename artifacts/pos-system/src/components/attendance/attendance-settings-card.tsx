"use client";

import { useEffect, useMemo, useState } from "react";

type AttendanceSetting = {
  workStartHour: number;
  workStartMinute: number;
  lateTolerance: number;
  overtimeAfterMinutes: number;
};

function padTime(value: number) {
  return String(value).padStart(2, "0");
}

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m`;
}

export function AttendanceSettingsCard() {
  const [setting, setSetting] = useState<AttendanceSetting>({
    workStartHour: 9,
    workStartMinute: 0,
    lateTolerance: 15,
    overtimeAfterMinutes: 480,
  });

  const [isLoading, setIsLoading] = useState(false);

  const workStartTime = useMemo(() => {
    return `${padTime(setting.workStartHour)}:${padTime(
      setting.workStartMinute,
    )}`;
  }, [setting.workStartHour, setting.workStartMinute]);

  const lateLimitTime = useMemo(() => {
    const date = new Date();

    date.setHours(setting.workStartHour);
    date.setMinutes(setting.workStartMinute + setting.lateTolerance);
    date.setSeconds(0);
    date.setMilliseconds(0);

    return `${padTime(date.getHours())}:${padTime(date.getMinutes())}`;
  }, [setting.workStartHour, setting.workStartMinute, setting.lateTolerance]);

  async function fetchSetting() {
    const res = await fetch("/api/attendance-settings", { credentials: "include" });
    const data = await res.json();

    if (data.success) {
      setSetting({
        workStartHour: data.data.workStartHour,
        workStartMinute: data.data.workStartMinute,
        lateTolerance: data.data.lateTolerance,
        overtimeAfterMinutes: data.data.overtimeAfterMinutes,
      });
    }
  }

  async function saveSetting() {
    setIsLoading(true);

    const res = await fetch("/api/attendance-settings", {
      credentials: "include",
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(setting),
    });

    const data = await res.json();

    setIsLoading(false);

    if (!data.success) {
      alert(data.message || "Failed to update attendance setting");
      return;
    }

    alert("Attendance setting updated");
  }

  useEffect(() => {
    fetchSetting();
  }, []);

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold">Attendance Settings</h2>

      <p className="mt-1 text-sm text-neutral-500">
        Configure work start time, late tolerance, and overtime rules.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium">
            Work Start Time
          </label>

          <input
            type="time"
            value={workStartTime}
            onChange={(e) => {
              const [hour, minute] = e.target.value.split(":").map(Number);

              setSetting((prev) => ({
                ...prev,
                workStartHour: hour,
                workStartMinute: minute,
              }));
            }}
            className="w-full rounded-xl border px-4 py-3"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Late Tolerance
          </label>

          <input
            type="number"
            min={0}
            value={setting.lateTolerance}
            onChange={(e) =>
              setSetting((prev) => ({
                ...prev,
                lateTolerance: Number(e.target.value),
              }))
            }
            className="w-full rounded-xl border px-4 py-3"
          />

          <p className="mt-1 text-xs text-neutral-500">In minutes.</p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Overtime After
          </label>

          <input
            type="number"
            min={0}
            value={setting.overtimeAfterMinutes}
            onChange={(e) =>
              setSetting((prev) => ({
                ...prev,
                overtimeAfterMinutes: Number(e.target.value),
              }))
            }
            className="w-full rounded-xl border px-4 py-3"
          />

          <p className="mt-1 text-xs text-neutral-500">
            Current rule: after {formatMinutes(setting.overtimeAfterMinutes)}.
          </p>
        </div>

        <div className="rounded-xl bg-neutral-50 p-4">
          <p className="text-sm font-medium">Rule Preview</p>

          <p className="mt-2 text-sm text-neutral-600">
            Staff clocking in after{" "}
            <span className="font-bold text-red-600">{lateLimitTime}</span>{" "}
            will be marked as late.
          </p>

          <p className="mt-1 text-xs text-neutral-500">
            Work starts at {workStartTime} with {setting.lateTolerance} minutes
            tolerance.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={saveSetting}
        disabled={isLoading}
        className="mt-5 w-full rounded-xl bg-black py-3 font-semibold text-white disabled:opacity-50"
      >
        {isLoading ? "Saving..." : "Save Attendance Settings"}
      </button>
    </div>
  );
}