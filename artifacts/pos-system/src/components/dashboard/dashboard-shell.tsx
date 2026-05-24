"use client";

import { useState } from "react";

import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";

type DashboardShellProps = {
  userName: string;
  role: string;
  children: React.ReactNode;
};

export function DashboardShell({
  userName,
  role,
  children,
}: DashboardShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  function handleToggleSidebar() {
    if (window.innerWidth < 1024) {
      setIsMobileSidebarOpen((prev) => !prev);
      return;
    }

    setIsSidebarCollapsed((prev) => !prev);
  }

  return (
    <div
      className={`grid min-h-[100svh] grid-cols-1 bg-neutral-50 transition-[grid-template-columns] duration-300 ${
        isSidebarCollapsed
          ? "lg:grid-cols-[80px_minmax(0,1fr)]"
          : "lg:grid-cols-[288px_minmax(0,1fr)]"
      }`}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-xl focus:bg-neutral-950 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg focus:outline-none"
      >
        Skip to main content
      </a>

      <Sidebar
        role={role}
        userName={userName}
        isCollapsed={isSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-col overflow-x-hidden">
        <Topbar
          userName={userName}
          role={role}
          onToggleSidebar={handleToggleSidebar}
        />

        <main
          id="main-content"
          className="min-w-0 flex-1 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8"
          style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
