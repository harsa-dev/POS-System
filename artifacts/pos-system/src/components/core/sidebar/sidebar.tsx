"use client";

import { type ElementType, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { ROUTES } from "@/constants/routes";
import { ROLES } from "@/constants/roles";
import {
  BarChart3,
  BellRing,
  BookOpenCheck,
  ChefHat,
  ClipboardList,
  CreditCard,
  FileText,
  Grid2X2,
  Handshake,
  LogOut,
  Package,
  ReceiptText,
  ShoppingCart,
  Table2,
  UtensilsCrossed,
  WalletCards,
  X,
} from "lucide-react";
import { authApi } from "@/lib/api";
import { getStoredBusinessMode, type BusinessMode } from "@/components/core/route-guard";

type SidebarProps = {
  role: string;
  userName: string;
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
};

type MenuItem = {
  href: string;
  label: string;
  icon: ElementType;
  roles: string[];
  modes?: BusinessMode[];
};

type MenuGroup = {
  title: string;
  items: MenuItem[];
};

const menuGroups: MenuGroup[] = [
  {
    title: "Shared Dashboards",
    items: [
      {
        href: ROUTES.ANALYTICS,
        label: "Sales Analytics",
        icon: BarChart3,
        roles: [ROLES.OWNER, ROLES.MANAGER],
      },
      {
        href: ROUTES.CUSTOMERS,
        label: "Customers & Partners",
        icon: Handshake,
        roles: [ROLES.OWNER, ROLES.MANAGER],
      },
      {
        href: ROUTES.INVENTORY,
        label: "Inventory",
        icon: Package,
        roles: [ROLES.OWNER, ROLES.MANAGER],
      },
      {
        href: ROUTES.CASHFLOW,
        label: "Cashflow",
        icon: WalletCards,
        roles: [ROLES.OWNER, ROLES.MANAGER],
      },
      {
        href: ROUTES.FINANCIAL_REPORTS,
        label: "Financial Reports",
        icon: FileText,
        roles: [ROLES.OWNER, ROLES.MANAGER],
      },
      {
        href: ROUTES.INVOICE_GENERATOR,
        label: "Invoice Generator",
        icon: ReceiptText,
        roles: [ROLES.OWNER, ROLES.MANAGER],
      },
      {
        href: ROUTES.CASHIER_SHIFT_REPORTS,
        label: "Cashier Shift Reports",
        icon: CreditCard,
        roles: [ROLES.OWNER, ROLES.MANAGER],
      },
    ],
  },
  {
    title: "F&B Server",
    items: [
      {
        href: ROUTES.CHECKOUT,
        label: "Cashier",
        icon: ShoppingCart,
        roles: [ROLES.OWNER, ROLES.MANAGER, ROLES.CASHIER],
        modes: ["fnb"],
      },
      {
        href: ROUTES.ORDERS,
        label: "Orders",
        icon: ClipboardList,
        roles: [ROLES.OWNER, ROLES.MANAGER, ROLES.CASHIER],
        modes: ["fnb"],
      },
      {
        href: ROUTES.SERVING,
        label: "Serving",
        icon: BellRing,
        roles: [ROLES.OWNER, ROLES.MANAGER, ROLES.SERVER, ROLES.CASHIER],
        modes: ["fnb"],
      },
      {
        href: ROUTES.TABLES,
        label: "Tables",
        icon: Table2,
        roles: [ROLES.OWNER, ROLES.MANAGER, ROLES.SERVER, ROLES.CASHIER],
        modes: ["fnb"],
      },
      {
        href: ROUTES.PAYMENTS,
        label: "Payments",
        icon: CreditCard,
        roles: [ROLES.OWNER, ROLES.MANAGER],
        modes: ["fnb"],
      },
    ],
  },
  {
    title: "F&B Menu & Kitchen",
    items: [
      {
        href: ROUTES.MENU,
        label: "Menu",
        icon: UtensilsCrossed,
        roles: [ROLES.OWNER, ROLES.MANAGER],
        modes: ["fnb"],
      },
      {
        href: ROUTES.RECIPES,
        label: "Recipes",
        icon: BookOpenCheck,
        roles: [ROLES.OWNER, ROLES.MANAGER],
        modes: ["fnb"],
      },
      {
        href: ROUTES.KDS,
        label: "Kitchen (KDS)",
        icon: ChefHat,
        roles: [ROLES.OWNER, ROLES.MANAGER, ROLES.KITCHEN],
        modes: ["fnb"],
      },
    ],
  },
];

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "U";
}

function SidebarContent({
  role,
  userName,
  isCollapsed,
  onNavigate,
  onCloseMobile,
  showMobileClose,
}: {
  role: string;
  userName: string;
  isCollapsed: boolean;
  onNavigate?: () => void;
  onCloseMobile?: () => void;
  showMobileClose?: boolean;
}) {
  const [pathname] = useLocation();
  const currentMode = getStoredBusinessMode();

  const visibleGroups = useMemo(
    () =>
      menuGroups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => {
            const roleAllowed = item.roles.includes(role);
            const modeAllowed = !item.modes || (currentMode ? item.modes.includes(currentMode) : false);

            return roleAllowed && modeAllowed;
          }),
        }))
        .filter((group) => group.items.length > 0),
    [currentMode, role],
  );

  async function handleLogout() {
    await authApi.logout();

    window.location.href = ROUTES.LOGIN;
  }

  return (
    <>
      <div
        className={`flex h-20 items-center gap-3 px-4 ${
          isCollapsed ? "justify-center" : "justify-between"
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border bg-neutral-50">
            <Grid2X2 className="h-6 w-6 text-neutral-900" />
          </div>

          {!isCollapsed && (
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold tracking-tight">
                POS System
              </h1>

              <p className="truncate text-xs text-neutral-500">
                Restaurant Platform
              </p>
            </div>
          )}
        </div>

        {showMobileClose && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-xl p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-4 pb-4">
        {visibleGroups.map((group) => (
          <div key={group.title}>
            {!isCollapsed && (
              <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-400">
                {group.title}
              </p>
            )}

            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;

                const isActive =
                  item.href === ROUTES.DASHBOARD
                    ? pathname === item.href
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={isCollapsed ? item.label : undefined}
                    onClick={onNavigate}
                    className={`flex items-center rounded-2xl px-3 py-3 text-sm font-medium transition ${
                      isCollapsed ? "justify-center" : "gap-3"
                    } ${
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-950"
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 shrink-0 ${
                        isActive ? "text-blue-700" : "text-neutral-500"
                      }`}
                    />

                    {!isCollapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t p-4">
        <button
          type="button"
          onClick={handleLogout}
          className={`w-full rounded-2xl border bg-white p-3 text-left shadow-sm transition hover:bg-neutral-50 ${
            isCollapsed ? "flex justify-center" : ""
          }`}
          title={isCollapsed ? "Logout" : undefined}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
              {getInitial(userName)}
            </div>

            {!isCollapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{userName}</p>
                  <p className="truncate text-xs text-neutral-500">{role}</p>
                </div>

                <LogOut className="h-4 w-4 shrink-0 text-neutral-400" />
              </>
            )}
          </div>
        </button>
      </div>
    </>
  );
}

export function Sidebar({
  role,
  userName,
  isCollapsed,
  isMobileOpen,
  onCloseMobile,
}: SidebarProps) {
  return (
    <>
      <aside
        className={`sticky top-0 z-40 hidden h-[100svh] flex-col border-r border-neutral-200 bg-white transition-[width] duration-300 lg:flex ${
          isCollapsed ? "w-20" : "w-72"
        }`}
        style={{
          paddingLeft: "env(safe-area-inset-left)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <SidebarContent
          role={role}
          userName={userName}
          isCollapsed={isCollapsed}
        />
      </aside>

      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close sidebar overlay"
            onClick={onCloseMobile}
            className="absolute inset-0 bg-black/40"
          />

          <aside
            className="relative flex h-full w-72 flex-col border-r border-neutral-200 bg-white shadow-2xl"
            style={{
              paddingTop: "env(safe-area-inset-top)",
              paddingBottom: "env(safe-area-inset-bottom)",
              paddingLeft: "env(safe-area-inset-left)",
            }}
          >
            <SidebarContent
              role={role}
              userName={userName}
              isCollapsed={false}
              onNavigate={onCloseMobile}
              onCloseMobile={onCloseMobile}
              showMobileClose
            />
          </aside>
        </div>
      )}
    </>
  );
}
