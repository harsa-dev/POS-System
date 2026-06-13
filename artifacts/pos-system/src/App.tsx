import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { ROUTES } from "@/constants/routes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MotionConfig } from "framer-motion";
import { createContext, useContext, useEffect, useState, lazy, Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import { ModeSelector } from "@/components/core/mode-selector";
import { LegalPage } from "@/pages/legal/legal-page";
import {
  RouteGuard,
  getStoredBusinessMode,
  getStoredBusinessModeEntryRoute,
  type BusinessMode,
} from "@/components/core/route-guard";
import { authApi } from "@/lib/api";

const CheckoutPage         = lazy(() => import("@/pages/dashboard/checkout"));
const OrdersPage           = lazy(() => import("@/pages/dashboard/orders"));
const OrderDetailPage      = lazy(() => import("@/pages/dashboard/order-detail"));
const MenuPage             = lazy(() => import("@/pages/dashboard/menu"));
const RecipesPage          = lazy(() => import("@/pages/dashboard/recipes"));
const TablesPage           = lazy(() => import("@/pages/dashboard/tables"));
const KDSPage              = lazy(() => import("@/pages/dashboard/kds"));
const BusinessOverviewPage = lazy(() => import("@/pages/dashboard/overview"));
const InternalMonitoringPage = lazy(() => import("@/pages/dashboard/platform-monitoring"));
const AnalyticsPage        = lazy(() => import("@/pages/dashboard/analytics"));
const CustomersPage        = lazy(() => import("@/pages/dashboard/customers"));
const CashflowPage         = lazy(() => import("@/pages/dashboard/cashflow"));
const FinancialReportsPage = lazy(() => import("@/pages/dashboard/financial-reports"));
const InvoiceGeneratorPage = lazy(() => import("@/pages/dashboard/invoice-generator"));
const CashierShiftReportsPage = lazy(() => import("@/pages/dashboard/cashier-shift-reports"));
const HppCalculatorPage = lazy(() => import("@/pages/dashboard/hpp-calculator"));
const OperationReportsPage = lazy(() => import("@/pages/dashboard/shift-reports"));
const TeamManagementPage = lazy(() => import("@/pages/dashboard/team-management"));
const RosterOverviewPage = lazy(() => import("@/pages/dashboard/roster-overview"));
const EmployeePerformancePage = lazy(() => import("@/pages/dashboard/employee-performance"));
const AuditLogPage = lazy(() => import("@/pages/dashboard/audit-log"));
const ApprovalsPage = lazy(() => import("@/pages/dashboard/approvals"));
const EmployeeContractsPage = lazy(() => import("@/pages/dashboard/employee-contracts"));
const EmployeeAttendancePage = lazy(() => import("@/pages/dashboard/employee-attendance"));
const PayrollPage = lazy(() => import("@/pages/dashboard/payroll"));
const PaymentsPage         = lazy(() => import("@/pages/dashboard/payments"));
const PaymentSuccessPage   = lazy(() => import("@/pages/dashboard/payment-success"));
const PaymentErrorPage     = lazy(() => import("@/pages/dashboard/payment-error"));
const InventoryPage        = lazy(() => import("@/pages/dashboard/inventory"));
const ServingPage          = lazy(() => import("@/pages/dashboard/serving"));
const RestaurantPosWorkspace = lazy(() => import("@/app/workspace/restaurant/restaurant-pos-workspace"));
const RestaurantKitchenWorkspace = lazy(() => import("@/app/workspace/restaurant/restaurant-kitchen-workspace"));
const RestaurantServingWorkspace = lazy(() => import("@/app/workspace/restaurant/restaurant-serving-workspace"));
const RestaurantTablesWorkspace = lazy(() => import("@/app/workspace/restaurant/restaurant-tables-workspace"));
const RestaurantMenuWorkspace = lazy(() => import("@/app/workspace/restaurant/restaurant-menu-workspace"));
const RestaurantRecipesWorkspace = lazy(() => import("@/app/workspace/restaurant/restaurant-recipes-workspace"));
const RestaurantOrdersWorkspace = lazy(() => import("@/app/workspace/restaurant/restaurant-orders-workspace"));
const RetailWorkspace = lazy(() => import("@/app/workspace/retail/retail-workspace"));
const RetailGrowthWorkspace = lazy(() =>
  import("@/app/workspace/retail/retail-growth-workspace").then((module) => ({
    default: module.RetailGrowthWorkspace,
  })),
);
const RawMaterialPlaceholderWorkspace = lazy(() => import("@/app/workspace/raw-material/raw-material-placeholder-workspace"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60, refetchOnWindowFocus: false, retry: 1 },
  },
});

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  businessId?: string | null;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  refetch: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function fetchUser() {
    try {
      const data = await authApi.me();
      if (data.success && data.data) {
        setUser(data.data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { fetchUser(); }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, refetch: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

function ProtectedRoute({
  children,
  requiredMode,
}: {
  children: React.ReactNode;
  requiredMode?: BusinessMode;
}) {
  const { user, isLoading } = useAuth();

  return (
    <RouteGuard user={user} isLoading={isLoading} requiredMode={requiredMode}>
      {children}
    </RouteGuard>
  );
}

function ModeProtectedRoute({
  children,
  requiredMode,
}: {
  children: React.ReactNode;
  requiredMode?: BusinessMode;
}) {
  const currentMode = getStoredBusinessMode();

  if (!currentMode || (requiredMode && currentMode !== requiredMode)) {
    return <Redirect to={ROUTES.SELECT_MODE} />;
  }

  return <>{children}</>;
}

function getBusinessModeEntryRoute() {
  return getStoredBusinessModeEntryRoute() ?? ROUTES.SELECT_MODE;
}

function ModeSelectionRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-neutral-500">Loading...</div>
      </div>
    );
  }

  if (!user) return <Redirect to={ROUTES.LOGIN} />;

  return <ModeSelector />;
}

function DashboardEntryRedirect() {
  return <Redirect to={getBusinessModeEntryRoute()} />;
}

function PageFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="text-sm text-neutral-400">Loading...</div>
    </div>
  );
}

function AuthPageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(59,130,246,0.18),transparent_32%),radial-gradient(circle_at_85%_10%,rgba(16,185,129,0.16),transparent_28%),radial-gradient(circle_at_50%_100%,rgba(99,102,241,0.16),transparent_34%)]" />
      <div className="absolute left-1/2 top-0 h-64 w-[42rem] -translate-x-1/2 rounded-full bg-white/50 blur-3xl" />
      <div className="relative z-10 w-full">{children}</div>
    </main>
  );
}

function isProtectedAppPath(pathname: string) {
  return (
    pathname === ROUTES.DASHBOARD ||
    pathname.startsWith(`${ROUTES.DASHBOARD}/`) ||
    pathname.startsWith("/workspace/") ||
    pathname.startsWith("/v3/")
  );
}

function InternalNavigationBoundary() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const targetNode = event.target;
      const targetElement =
        targetNode instanceof Element
          ? targetNode
          : null;
      const anchor = targetElement?.closest("a[href]");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      const target = anchor.getAttribute("target");
      if (target && target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search &&
        url.hash
      ) {
        return;
      }

      event.preventDefault();
      setLocation(`${url.pathname}${url.search}${url.hash}`);
    }

    document.addEventListener("click", handleDocumentClick);

    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, [setLocation]);

  return null;
}

function ProtectedAppRoutes() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<PageFallback />}>
        <Switch>
          <Route path={ROUTES.DASHBOARD}><DashboardEntryRedirect /></Route>
          <Route path="/dashboard/checkout"><ModeProtectedRoute requiredMode="restaurant"><Redirect to={ROUTES.CHECKOUT} /></ModeProtectedRoute></Route>
          <Route path="/dashboard/orders/:id">
            {(params) => <ModeProtectedRoute requiredMode="restaurant"><Redirect to={ROUTES.ORDER_DETAIL(params.id)} /></ModeProtectedRoute>}
          </Route>
          <Route path="/dashboard/orders"><ModeProtectedRoute requiredMode="restaurant"><Redirect to={ROUTES.ORDERS} /></ModeProtectedRoute></Route>
          <Route path="/dashboard/menu"><ModeProtectedRoute requiredMode="restaurant"><Redirect to={ROUTES.MENU} /></ModeProtectedRoute></Route>
          <Route path="/dashboard/recipes"><ModeProtectedRoute requiredMode="restaurant"><Redirect to={ROUTES.RECIPES} /></ModeProtectedRoute></Route>
          <Route path="/dashboard/tables"><ModeProtectedRoute requiredMode="restaurant"><Redirect to={ROUTES.TABLES} /></ModeProtectedRoute></Route>
          <Route path="/dashboard/kds"><ModeProtectedRoute requiredMode="restaurant"><Redirect to={ROUTES.KDS} /></ModeProtectedRoute></Route>
          <Route path="/dashboard/serving"><ModeProtectedRoute requiredMode="restaurant"><Redirect to={ROUTES.SERVING} /></ModeProtectedRoute></Route>
          <Route path={ROUTES.WORKSPACE_RESTAURANT_POS}><ModeProtectedRoute requiredMode="restaurant"><RestaurantPosWorkspace /></ModeProtectedRoute></Route>
          <Route path={ROUTES.WORKSPACE_RESTAURANT_KITCHEN}><ModeProtectedRoute requiredMode="restaurant"><RestaurantKitchenWorkspace /></ModeProtectedRoute></Route>
          <Route path={ROUTES.WORKSPACE_RESTAURANT_SERVING}><ModeProtectedRoute requiredMode="restaurant"><RestaurantServingWorkspace /></ModeProtectedRoute></Route>
          <Route path={ROUTES.WORKSPACE_RESTAURANT_TABLES}><ModeProtectedRoute requiredMode="restaurant"><RestaurantTablesWorkspace /></ModeProtectedRoute></Route>
          <Route path={ROUTES.WORKSPACE_RESTAURANT_RECIPES}><ModeProtectedRoute requiredMode="restaurant"><RestaurantRecipesWorkspace /></ModeProtectedRoute></Route>
          <Route path={ROUTES.WORKSPACE_RESTAURANT_MENU}><ModeProtectedRoute requiredMode="restaurant"><RestaurantMenuWorkspace /></ModeProtectedRoute></Route>
          <Route path={ROUTES.WORKSPACE_RESTAURANT_ORDERS}><ModeProtectedRoute requiredMode="restaurant"><RestaurantOrdersWorkspace /></ModeProtectedRoute></Route>
          <Route path="/v3/retail/cashier"><ModeProtectedRoute requiredMode="retail"><RetailWorkspace moduleId="cashier" /></ModeProtectedRoute></Route>
          <Route path="/v3/retail/catalog"><ModeProtectedRoute requiredMode="retail"><RetailWorkspace moduleId="catalog" /></ModeProtectedRoute></Route>
          <Route path="/v3/retail/barcode"><ModeProtectedRoute requiredMode="retail"><RetailWorkspace moduleId="barcode" /></ModeProtectedRoute></Route>
          <Route path="/v3/retail/receiving"><ModeProtectedRoute requiredMode="retail"><RetailWorkspace moduleId="receiving" /></ModeProtectedRoute></Route>
          <Route path="/v3/retail/stock-opname"><ModeProtectedRoute requiredMode="retail"><RetailWorkspace moduleId="stock-opname" /></ModeProtectedRoute></Route>
          <Route path="/v3/retail/shelf-management"><ModeProtectedRoute requiredMode="retail"><RetailWorkspace moduleId="shelf-management" /></ModeProtectedRoute></Route>
          <Route path="/v3/retail/promotions"><ModeProtectedRoute requiredMode="retail"><RetailWorkspace moduleId="promotions" /></ModeProtectedRoute></Route>
          <Route path="/v3/retail/customers-loyalty"><ModeProtectedRoute requiredMode="retail"><RetailGrowthWorkspace moduleId="customers-loyalty" /></ModeProtectedRoute></Route>
          <Route path="/v3/retail/returns-exchanges"><ModeProtectedRoute requiredMode="retail"><RetailGrowthWorkspace moduleId="returns-exchanges" /></ModeProtectedRoute></Route>
          <Route path="/v3/retail/staff-shifts"><ModeProtectedRoute requiredMode="retail"><RetailGrowthWorkspace moduleId="staff-shifts" /></ModeProtectedRoute></Route>
          <Route path="/v3/retail/multi-location"><ModeProtectedRoute requiredMode="retail"><RetailGrowthWorkspace moduleId="multi-location" /></ModeProtectedRoute></Route>
          <Route path="/v3/retail/omnichannel"><ModeProtectedRoute requiredMode="retail"><RetailGrowthWorkspace moduleId="omnichannel" /></ModeProtectedRoute></Route>
          <Route path="/v3/retail/forecasting"><ModeProtectedRoute requiredMode="retail"><RetailGrowthWorkspace moduleId="forecasting" /></ModeProtectedRoute></Route>
          <Route path="/v3/retail/audit-controls"><ModeProtectedRoute requiredMode="retail"><RetailGrowthWorkspace moduleId="audit-controls" /></ModeProtectedRoute></Route>
          <Route path={ROUTES.V3_RAW_MATERIAL_INTAKE}><ModeProtectedRoute requiredMode="raw-material"><RawMaterialPlaceholderWorkspace moduleId="intake" /></ModeProtectedRoute></Route>
          <Route path={ROUTES.V3_RAW_MATERIAL_WEIGHING}><ModeProtectedRoute requiredMode="raw-material"><RawMaterialPlaceholderWorkspace moduleId="weighing" /></ModeProtectedRoute></Route>
          <Route path={ROUTES.V3_RAW_MATERIAL_BATCHES}><ModeProtectedRoute requiredMode="raw-material"><RawMaterialPlaceholderWorkspace moduleId="batches" /></ModeProtectedRoute></Route>
          <Route path={ROUTES.V3_RAW_MATERIAL_STORAGE}><ModeProtectedRoute requiredMode="raw-material"><RawMaterialPlaceholderWorkspace moduleId="storage" /></ModeProtectedRoute></Route>
          <Route path={ROUTES.V3_RAW_MATERIAL_PROCESSING}><ModeProtectedRoute requiredMode="raw-material"><RawMaterialPlaceholderWorkspace moduleId="processing" /></ModeProtectedRoute></Route>
          <Route path={ROUTES.V3_RAW_MATERIAL_KANDANG}><ModeProtectedRoute requiredMode="raw-material"><RawMaterialPlaceholderWorkspace moduleId="kandang" /></ModeProtectedRoute></Route>
          <Route path={ROUTES.V3_RAW_MATERIAL_SUPPLIERS}><ModeProtectedRoute requiredMode="raw-material"><RawMaterialPlaceholderWorkspace moduleId="suppliers" /></ModeProtectedRoute></Route>
          <Route path={ROUTES.PAYMENTS_SUCCESS}><PaymentSuccessPage /></Route>
          <Route path={ROUTES.PAYMENTS_ERROR}><PaymentErrorPage /></Route>
          <Route path="/dashboard/payments"><ModeProtectedRoute requiredMode="restaurant"><Redirect to={ROUTES.PAYMENTS} /></ModeProtectedRoute></Route>
          <Route path={ROUTES.CHECKOUT}><ModeProtectedRoute requiredMode="restaurant"><CheckoutPage /></ModeProtectedRoute></Route>
          <Route path={ROUTES.ORDERS}><ModeProtectedRoute requiredMode="restaurant"><OrdersPage /></ModeProtectedRoute></Route>
          <Route path={`${ROUTES.ORDERS}/:id`}>
            {(params) => <ModeProtectedRoute requiredMode="restaurant"><OrderDetailPage id={params.id} /></ModeProtectedRoute>}
          </Route>
          <Route path={ROUTES.MENU}><ModeProtectedRoute requiredMode="restaurant"><MenuPage /></ModeProtectedRoute></Route>
          <Route path={ROUTES.RECIPES}><ModeProtectedRoute requiredMode="restaurant"><RecipesPage /></ModeProtectedRoute></Route>
          <Route path={ROUTES.TABLES}><ModeProtectedRoute requiredMode="restaurant"><TablesPage /></ModeProtectedRoute></Route>
          <Route path={ROUTES.KDS}><ModeProtectedRoute requiredMode="restaurant"><KDSPage /></ModeProtectedRoute></Route>
          <Route path={ROUTES.BUSINESS_OVERVIEW}><BusinessOverviewPage /></Route>
          <Route path={ROUTES.INTERNAL_MONITORING}><InternalMonitoringPage /></Route>
          <Route path={ROUTES.ANALYTICS}><AnalyticsPage /></Route>
          <Route path={ROUTES.CUSTOMERS}><CustomersPage /></Route>
          <Route path={ROUTES.CASHFLOW}><CashflowPage /></Route>
          <Route path={ROUTES.FINANCIAL_REPORTS}><FinancialReportsPage /></Route>
          <Route path={ROUTES.INVOICE_GENERATOR}><InvoiceGeneratorPage /></Route>
          <Route path={ROUTES.CASHIER_SHIFT_REPORTS}><CashierShiftReportsPage /></Route>
          <Route path={ROUTES.HPP_CALCULATOR}><HppCalculatorPage /></Route>
          <Route path={ROUTES.OPERATION_REPORTS}><OperationReportsPage /></Route>
          <Route path={ROUTES.TEAM_MANAGEMENT}><TeamManagementPage /></Route>
          <Route path={ROUTES.ROSTER_OVERVIEW}><RosterOverviewPage /></Route>
          <Route path={ROUTES.EMPLOYEE_PERFORMANCE}><EmployeePerformancePage /></Route>
          <Route path={ROUTES.AUDIT_LOG}><AuditLogPage /></Route>
          <Route path={ROUTES.APPROVALS}><ApprovalsPage /></Route>
          <Route path={ROUTES.EMPLOYEE_CONTRACTS}><EmployeeContractsPage /></Route>
          <Route path={ROUTES.EMPLOYEE_ATTENDANCE}><EmployeeAttendancePage /></Route>
          <Route path={ROUTES.PAYROLL}><PayrollPage /></Route>
          <Route path={ROUTES.PAYMENTS}><ModeProtectedRoute requiredMode="restaurant"><PaymentsPage /></ModeProtectedRoute></Route>
          <Route path={ROUTES.INVENTORY}><InventoryPage /></Route>
          <Route path={ROUTES.SERVING}><ModeProtectedRoute requiredMode="restaurant"><ServingPage /></ModeProtectedRoute></Route>
          <Route>
            <div className="flex min-h-[40vh] items-center justify-center">
              <h1 className="text-2xl font-bold">404 - Page Not Found</h1>
            </div>
          </Route>
        </Switch>
      </Suspense>
    </ProtectedRoute>
  );
}

function Router() {
  const [pathname] = useLocation();

  if (isProtectedAppPath(pathname)) {
    return <ProtectedAppRoutes />;
  }

  return (
    <Switch>
      <Route path={ROUTES.ROOT}><Redirect to={ROUTES.LOGIN} /></Route>
      <Route path={ROUTES.LOGIN}>
        <AuthPageShell>
          <LoginForm />
        </AuthPageShell>
      </Route>
      <Route path={ROUTES.REGISTER}>
        <AuthPageShell>
          <RegisterForm />
        </AuthPageShell>
      </Route>
      <Route path={ROUTES.PRIVACY}><LegalPage kind="privacy" /></Route>
      <Route path={ROUTES.TERMS}><LegalPage kind="terms" /></Route>
      <Route path={ROUTES.SECURITY}><LegalPage kind="security" /></Route>
      <Route path={ROUTES.COOKIES}><LegalPage kind="cookies" /></Route>
      <Route path={ROUTES.SELECT_MODE}><ModeSelectionRoute /></Route>
      <Route>
        <div className="flex min-h-screen items-center justify-center">
          <h1 className="text-2xl font-bold">404 - Page Not Found</h1>
        </div>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <MotionConfig reducedMotion="user">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <InternalNavigationBoundary />
              <Router />
            </WouterRouter>
            <Toaster />
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </MotionConfig>
  );
}

export default App;
