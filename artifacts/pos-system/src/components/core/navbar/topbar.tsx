"use client";

import { Bell, Menu, Search } from "lucide-react";

import { BusinessModeSwitcher } from "@/components/core/business-mode";

type TopbarProps = {
  userName: string;
  role: string;
  onToggleSidebar: () => void;
};

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "U";
}

export function Topbar({ userName, role, onToggleSidebar }: TopbarProps) {
  return (
    <header
      className="sticky top-0 z-50 min-w-0 shrink-0 border-b border-neutral-200 bg-white/95 backdrop-blur"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex h-16 min-w-0 items-center justify-between px-4 sm:px-6 lg:h-20">
        <div className="flex min-w-0 items-center gap-4">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-neutral-700 shadow-sm transition hover:bg-neutral-50 hover:text-foreground"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" strokeWidth={2.2} />
          </button>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-neutral-900">
              Welcome, {userName}
            </p>

            <span className="mt-1 inline-flex rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-bold uppercase text-green-700">
              {role}
            </span>
          </div>
        </div>

        <div className="flex min-w-0 shrink-0 items-center gap-3">
          <BusinessModeSwitcher />

          <div className="hidden w-72 items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-500 shadow-sm md:flex xl:w-96">
            <Search className="h-4 w-4 shrink-0" aria-hidden="true" />

            <input
              aria-label="Search"
              placeholder="Search anything..."
              className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-neutral-400"
            />

            <span
              className="rounded-md bg-neutral-100 px-2 py-1 text-xs text-neutral-500"
              aria-hidden="true"
            >
              ⌘K
            </span>
          </div>

          <button
            type="button"
            className="inline-flex shrink-0 rounded-2xl border border-neutral-200 bg-white p-3 text-neutral-600 shadow-sm transition hover:bg-neutral-50 md:hidden"
            aria-label="Search"
          >
            <Search className="h-5 w-5" aria-hidden="true" />
          </button>

          <button
            type="button"
            className="relative inline-flex shrink-0 rounded-2xl border border-neutral-200 bg-white p-3 text-neutral-600 shadow-sm transition hover:bg-neutral-50"
            aria-label="Notifications — you have unread notifications"
          >
            <Bell className="h-5 w-5" aria-hidden="true" />

            <span
              className="absolute right-3 top-3 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"
              aria-hidden="true"
            />
          </button>

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
            {getInitial(userName)}
          </div>
        </div>
      </div>
    </header>
  );
}
