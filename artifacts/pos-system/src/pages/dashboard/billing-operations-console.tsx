import { PlatformAdminRoute } from "@/components/core/platform-admin/platform-admin-route";
import { authApi } from "@/lib/api";
import { BillingOperationsConsolePage } from "@/features/shared/platform-monitoring/internal-admin-console-page";
import { useEffect, useState } from "react";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export default function BillingOperationsConsoleRoute() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const response = await authApi.me();

        if (mounted) {
          setUser(response.success && response.data ? response.data : null);
        }
      } catch {
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <PlatformAdminRoute
      user={user}
      isLoading={isLoading}
      capability="platform-admin.billing-operations-console.read"
      label="Billing Operations Console"
    >
      <BillingOperationsConsolePage />
    </PlatformAdminRoute>
  );
}
