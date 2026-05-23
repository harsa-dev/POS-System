import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";

import { getCurrentUser } from "@/lib/auth/get-current-user";

import { QueryProvider } from "@/providers/query-provider";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="h-screen overflow-hidden bg-neutral-50">
      <DashboardShell userName={user.name} role={user.role}>
        <QueryProvider>{children}</QueryProvider>
      </DashboardShell>
    </div>
  );
}
