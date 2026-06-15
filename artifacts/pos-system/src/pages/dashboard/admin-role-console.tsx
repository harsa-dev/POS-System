import { useEffect, useState } from "react";

import { PlatformAdminRoute } from "@/components/core/platform-admin/platform-admin-route";
import { AdminRoleConsolePage } from "@/features/shared/platform-monitoring/admin-role-console-page";
import { authApi } from "@/lib/api";

type AdminRoleConsoleUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  businessId?: string | null;
};

export default function AdminRoleConsoleRoute() {
  const [user, setUser] = useState<AdminRoleConsoleUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      try {
        const response = await authApi.me();

        if (!isMounted) return;

        setUser(response.success && response.data ? response.data : null);
      } catch {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <PlatformAdminRoute
      user={user}
      isLoading={isLoading}
      capability="platform-admin.admin-role-console.read"
    >
      <AdminRoleConsolePage />
    </PlatformAdminRoute>
  );
}
