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
import { RouteGuard, getStoredBusinessMode } from "@/components/core/route-guard";
import { authApi } from "@/lib/api";

const CheckoutPage         = lazy(() => import("@/pages/dashboard/checkout"));
const OrdersPage           = lazy(() => import("@/pages/dashboard/orders"));
const OrderDetailPage      = lazy(() => import("@/pages/dashboard/order-detail"));
const MenuPage             = lazy(() => import("@/pages/dashboard/menu"));
const RecipesPage          = lazy(() => import("@/pages/dashboard/recipes"));
const TablesPage           = lazy(() => import("@/pages/dashboard/tables"));
const KDSPage              = lazy(() => import("@/pages/dashboard/kds"));
const AnalyticsPage        = lazy(() => import("@/pages/dashboard/analytics"));
const CustomersPage        = lazy(() => import("@/pages/dashboard/customers"));
const CashflowPage         = lazy(() => import("@/pages/dashboard/cashflow"));
const FinancialReportsPage = lazy(() => import("@/pages/dashboard/financial-reports"));
const InvoiceGeneratorPage = lazy(() => import("@/pages/dashboard/invoice-generator"));
const CashierShiftReportsPage = lazy(() => import("@/pages/dashboard/cashier-shift-reports"));
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
  restaurantId?: string | null;
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
  requiredMode?: "fnb";
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
  requiredMode?: "fnb";
}) {
  const currentMode = getStoredBusinessMode();

  if (requiredMode && currentMode !== requiredMode) {
    return <Redirect to={ROUTES.ANALYTICS} />;
  }

  return <>{children}</>;
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
  if (getStoredBusinessMode()) return <Redirect to={ROUTES.ANALYTICS} />;

  return <ModeSelector />;
}

function PageFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="text-sm text-neutral-400">Loading...</div>
    </div>
  );
}

function isProtectedAppPath(pathname: string) {
  return (
    pathname === ROUTES.DASHBOARD ||
    pathname.startsWith(`${ROUTES.DASHBOARD}/`) ||
    pathname.startsWith("/workspace/")
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
          : targetNode instanceof Node
            ? targetNode.parentElement
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
          <Route path={ROUTES.DASHBOARD}><Redirect to={ROUTES.ANALYTICS} /></Route>
          <Route path="/dashboard/checkout"><ModeProtectedRoute requiredMode="fnb"><Redirect to={ROUTES.CHECKOUT} /></ModeProtectedRoute></Route>
          <Route path="/dashboard/orders/:id">
            {(params) => <ModeProtectedRoute requiredMode="fnb"><Redirect to={ROUTES.ORDER_DETAIL(params.id)} /></ModeProtectedRoute>}
          </Route>
          <Route path="/dashboard/orders"><ModeProtectedRoute requiredMode="fnb"><Redirect to={ROUTES.ORDERS} /></ModeProtectedRoute></Route>
          <Route path="/dashboard/menu"><ModeProtectedRoute requiredMode="fnb"><Redirect to={ROUTES.MENU} /></ModeProtectedRoute></Route>
          <Route path="/dashboard/recipes"><ModeProtectedRoute requiredMode="fnb"><Redirect to={ROUTES.RECIPES} /></ModeProtectedRoute></Route>
          <Route path="/dashboard/tables"><ModeProtectedRoute requiredMode="fnb"><Redirect to={ROUTES.TABLES} /></ModeProtectedRoute></Route>
          <Route path="/dashboard/kds"><ModeProtectedRoute requiredMode="fnb"><Redirect to={ROUTES.KDS} /></ModeProtectedRoute></Route>
          <Route path="/dashboard/serving"><ModeProtectedRoute requiredMode="fnb"><Redirect to={ROUTES.SERVING} /></ModeProtectedRoute></Route>
          <Route path={ROUTES.WORKSPACE_RESTAURANT_POS}><ModeProtectedRoute requiredMode="fnb"><RestaurantPosWorkspace /></ModeProtectedRoute></Route>
          <Route path={ROUTES.WORKSPACE_RESTAURANT_KITCHEN}><ModeProtectedRoute requiredMode="fnb"><RestaurantKitchenWorkspace /></ModeProtectedRoute></Route>
          <Route path={ROUTES.WORKSPACE_RESTAURANT_SERVING}><ModeProtectedRoute requiredMode="fnb"><RestaurantServingWorkspace /></ModeProtectedRoute></Route>
          <Route path={ROUTES.WORKSPACE_RESTAURANT_TABLES}><ModeProtectedRoute requiredMode="fnb"><RestaurantTablesWorkspace /></ModeProtectedRoute></Route>
          <Route path={ROUTES.WORKSPACE_RESTAURANT_RECIPES}><ModeProtectedRoute requiredMode="fnb"><RestaurantRecipesWorkspace /></ModeProtectedRoute></Route>
          <Route path={ROUTES.WORKSPACE_RESTAURANT_MENU}><ModeProtectedRoute requiredMode="fnb"><RestaurantMenuWorkspace /></ModeProtectedRoute></Route>
          <Route path={ROUTES.WORKSPACE_RESTAURANT_ORDERS}><ModeProtectedRoute requiredMode="fnb"><RestaurantOrdersWorkspace /></ModeProtectedRoute></Route>
          <Route path={ROUTES.PAYMENTS_SUCCESS}><PaymentSuccessPage /></Route>
          <Route path={ROUTES.PAYMENTS_ERROR}><PaymentErrorPage /></Route>
          <Route path="/dashboard/payments"><ModeProtectedRoute requiredMode="fnb"><Redirect to={ROUTES.PAYMENTS} /></ModeProtectedRoute></Route>
          <Route path={ROUTES.CHECKOUT}><ModeProtectedRoute requiredMode="fnb"><CheckoutPage /></ModeProtectedRoute></Route>
          <Route path={ROUTES.ORDERS}><ModeProtectedRoute requiredMode="fnb"><OrdersPage /></ModeProtectedRoute></Route>
          <Route path={`${ROUTES.ORDERS}/:id`}>
            {(params) => <ModeProtectedRoute requiredMode="fnb"><OrderDetailPage id={params.id} /></ModeProtectedRoute>}
          </Route>
          <Route path={ROUTES.MENU}><ModeProtectedRoute requiredMode="fnb"><MenuPage /></ModeProtectedRoute></Route>
          <Route path={ROUTES.RECIPES}><ModeProtectedRoute requiredMode="fnb"><RecipesPage /></ModeProtectedRoute></Route>
          <Route path={ROUTES.TABLES}><ModeProtectedRoute requiredMode="fnb"><TablesPage /></ModeProtectedRoute></Route>
          <Route path={ROUTES.KDS}><ModeProtectedRoute requiredMode="fnb"><KDSPage /></ModeProtectedRoute></Route>
          <Route path={ROUTES.ANALYTICS}><AnalyticsPage /></Route>
          <Route path={ROUTES.CUSTOMERS}><CustomersPage /></Route>
          <Route path={ROUTES.CASHFLOW}><CashflowPage /></Route>
          <Route path={ROUTES.FINANCIAL_REPORTS}><FinancialReportsPage /></Route>
          <Route path={ROUTES.INVOICE_GENERATOR}><InvoiceGeneratorPage /></Route>
          <Route path={ROUTES.CASHIER_SHIFT_REPORTS}><CashierShiftReportsPage /></Route>
          <Route path={ROUTES.PAYMENTS}><ModeProtectedRoute requiredMode="fnb"><PaymentsPage /></ModeProtectedRoute></Route>
          <Route path={ROUTES.INVENTORY}><InventoryPage /></Route>
          <Route path={ROUTES.SERVING}><ModeProtectedRoute requiredMode="fnb"><ServingPage /></ModeProtectedRoute></Route>
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
        <main className="flex min-h-screen items-center justify-center bg-neutral-50">
          <LoginForm />
        </main>
      </Route>
      <Route path={ROUTES.REGISTER}>
        <main className="flex min-h-screen items-center justify-center bg-neutral-50">
          <RegisterForm />
        </main>
      </Route>
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
