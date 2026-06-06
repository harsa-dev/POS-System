import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
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

function Router() {
  return (
    <Suspense fallback={<PageFallback />}>
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
        <Route path={ROUTES.DASHBOARD}><ProtectedRoute><Redirect to={ROUTES.ANALYTICS} /></ProtectedRoute></Route>
        <Route path="/dashboard/checkout"><ProtectedRoute requiredMode="fnb"><Redirect to={ROUTES.CHECKOUT} /></ProtectedRoute></Route>
        <Route path="/dashboard/orders/:id">
          {(params) => <ProtectedRoute requiredMode="fnb"><Redirect to={ROUTES.ORDER_DETAIL(params.id)} /></ProtectedRoute>}
        </Route>
        <Route path="/dashboard/orders"><ProtectedRoute requiredMode="fnb"><Redirect to={ROUTES.ORDERS} /></ProtectedRoute></Route>
        <Route path="/dashboard/menu"><ProtectedRoute requiredMode="fnb"><Redirect to={ROUTES.MENU} /></ProtectedRoute></Route>
        <Route path="/dashboard/recipes"><ProtectedRoute requiredMode="fnb"><Redirect to={ROUTES.RECIPES} /></ProtectedRoute></Route>
        <Route path="/dashboard/tables"><ProtectedRoute requiredMode="fnb"><Redirect to={ROUTES.TABLES} /></ProtectedRoute></Route>
        <Route path="/dashboard/kds"><ProtectedRoute requiredMode="fnb"><Redirect to={ROUTES.KDS} /></ProtectedRoute></Route>
        <Route path="/dashboard/serving"><ProtectedRoute requiredMode="fnb"><Redirect to={ROUTES.SERVING} /></ProtectedRoute></Route>
        <Route path={ROUTES.WORKSPACE_RESTAURANT_POS}><ProtectedRoute requiredMode="fnb"><RestaurantPosWorkspace /></ProtectedRoute></Route>
        <Route path={ROUTES.WORKSPACE_RESTAURANT_KITCHEN}><ProtectedRoute requiredMode="fnb"><RestaurantKitchenWorkspace /></ProtectedRoute></Route>
        <Route path={ROUTES.WORKSPACE_RESTAURANT_SERVING}><ProtectedRoute requiredMode="fnb"><RestaurantServingWorkspace /></ProtectedRoute></Route>
        <Route path={ROUTES.WORKSPACE_RESTAURANT_TABLES}><ProtectedRoute requiredMode="fnb"><RestaurantTablesWorkspace /></ProtectedRoute></Route>
        <Route path={ROUTES.WORKSPACE_RESTAURANT_MENU}><ProtectedRoute requiredMode="fnb"><RestaurantMenuWorkspace /></ProtectedRoute></Route>
        <Route path={ROUTES.WORKSPACE_RESTAURANT_ORDERS}><ProtectedRoute requiredMode="fnb"><RestaurantOrdersWorkspace /></ProtectedRoute></Route>
        <Route path={ROUTES.PAYMENTS_SUCCESS}><ProtectedRoute><PaymentSuccessPage /></ProtectedRoute></Route>
        <Route path={ROUTES.PAYMENTS_ERROR}><ProtectedRoute><PaymentErrorPage /></ProtectedRoute></Route>
        <Route path="/dashboard/payments"><ProtectedRoute requiredMode="fnb"><Redirect to={ROUTES.PAYMENTS} /></ProtectedRoute></Route>
        <Route path={ROUTES.CHECKOUT}><ProtectedRoute requiredMode="fnb"><CheckoutPage /></ProtectedRoute></Route>
        <Route path={ROUTES.ORDERS}><ProtectedRoute requiredMode="fnb"><OrdersPage /></ProtectedRoute></Route>
        <Route path={`${ROUTES.ORDERS}/:id`}>
          {(params) => <ProtectedRoute requiredMode="fnb"><OrderDetailPage id={params.id} /></ProtectedRoute>}
        </Route>
        <Route path={ROUTES.MENU}><ProtectedRoute requiredMode="fnb"><MenuPage /></ProtectedRoute></Route>
        <Route path={ROUTES.RECIPES}><ProtectedRoute requiredMode="fnb"><RecipesPage /></ProtectedRoute></Route>
        <Route path={ROUTES.TABLES}><ProtectedRoute requiredMode="fnb"><TablesPage /></ProtectedRoute></Route>
        <Route path={ROUTES.KDS}><ProtectedRoute requiredMode="fnb"><KDSPage /></ProtectedRoute></Route>
        <Route path={ROUTES.ANALYTICS}><ProtectedRoute><AnalyticsPage /></ProtectedRoute></Route>
        <Route path={ROUTES.CUSTOMERS}><ProtectedRoute><CustomersPage /></ProtectedRoute></Route>
        <Route path={ROUTES.CASHFLOW}><ProtectedRoute><CashflowPage /></ProtectedRoute></Route>
        <Route path={ROUTES.FINANCIAL_REPORTS}><ProtectedRoute><FinancialReportsPage /></ProtectedRoute></Route>
        <Route path={ROUTES.INVOICE_GENERATOR}><ProtectedRoute><InvoiceGeneratorPage /></ProtectedRoute></Route>
        <Route path={ROUTES.CASHIER_SHIFT_REPORTS}><ProtectedRoute><CashierShiftReportsPage /></ProtectedRoute></Route>
        <Route path={ROUTES.PAYMENTS}><ProtectedRoute requiredMode="fnb"><PaymentsPage /></ProtectedRoute></Route>
        <Route path={ROUTES.INVENTORY}><ProtectedRoute><InventoryPage /></ProtectedRoute></Route>
        <Route path={ROUTES.SERVING}><ProtectedRoute requiredMode="fnb"><ServingPage /></ProtectedRoute></Route>
        <Route>
          <div className="flex min-h-screen items-center justify-center">
            <h1 className="text-2xl font-bold">404 - Page Not Found</h1>
          </div>
        </Route>
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <MotionConfig reducedMotion="user">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
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
