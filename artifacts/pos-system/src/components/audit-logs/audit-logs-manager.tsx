"use client";

import { useEffect, useState } from "react";
import { auditApi } from "@/lib/api";

type AuditLog = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  changes: unknown;
  createdAt: string;
  user: {
    name: string;
    email: string;
    role: string;
  };
};

export function AuditLogsManager() {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  async function fetchLogs() {
    const data = await auditApi.list();

    if (data.success) {
      setLogs(data.data as AuditLog[]);
    }
  }

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="rounded-2xl border bg-white">
      <div className="border-b p-4">
        <h2 className="font-semibold">Recent Activities</h2>
      </div>

      <div className="divide-y">
        {logs.map((log) => (
          <div key={log.id} className="p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">
                  {log.action} {log.entityType}
                </p>

                <p className="text-sm text-neutral-500">
                  By {log.user.name} · {log.user.role}
                </p>
              </div>

              <p className="text-sm text-neutral-500">
                {new Date(log.createdAt).toLocaleString()}
              </p>
            </div>

            <pre className="mt-3 max-h-40 overflow-auto rounded-xl bg-neutral-50 p-3 text-xs text-neutral-700">
              {JSON.stringify(log.changes, null, 2)}
            </pre>
          </div>
        ))}

        {logs.length === 0 && (
          <div className="p-6 text-center text-neutral-500">
            No audit logs yet.
          </div>
        )}
      </div>
    </div>
  );
}
