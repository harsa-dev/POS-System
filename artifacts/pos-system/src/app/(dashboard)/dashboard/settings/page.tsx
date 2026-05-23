import { SettingsManager } from "@/components/settings/settings-manager";

import { requireRole } from "@/lib/auth/require-role";

export default async function SettingsPage() {
  await requireRole(["OWNER"]);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-2 text-neutral-600">
          Manage restaurant profile and checkout configuration.
        </p>
      </div>

      <SettingsManager />
    </section>
  );
}
