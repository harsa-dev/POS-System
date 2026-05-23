import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { ROUTES, API } from "@/constants/routes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { createContext, useContext, useEffect, useState } from "react";

import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

import DashboardHome from "@/pages/dashboard/home";
import CheckoutPage from "@/pages/dashboard/checkout";
import OrdersPage from "@/pages/dashboard/orders";
import OrderDetailPage from "@/pages/dashboard/order-detail";
import MenuPage from "@/pages/dashboard/menu";
import TablesPage from "@/pages/dashboard/tables";
import KDSPage from "@/pages/dashboard/kds";
import AnalyticsPage from "@/pages/dashboard/analytics";
import PaymentsPage from "@/pages/dashboard/payments";
import PaymentSuccessPage from "@/pages/dashboard/payment-success";
import PaymentErrorPage from "@/pages/dashboard/payment-error";
import InventoryPage from "@/pages/dashboard/inventory";
import EmployeesPage from "@/pages/dashboard/employees";
import AttendancePage from "@/pages/dashboard/attendance";
import ShiftsPage from "@/pages/dashboard/shifts";
import SettingsPage from "@/pages/dashboard/settings";
import ServingPage from "@/pages/dashboard/serving";
import AuditLogsPage from "@/pages/dashboard/audit-logs";

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
      const res = await fetch(API.AUTH_ME, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-neutral-500">Loading...</div>
      </div>
    );
  }

  if (!user) return <Redirect to={ROUTES.LOGIN} />;

  return (
    <DashboardShell userName={user.name} role={user.role}>
      {children}
    </DashboardShell>
  );
}

function Router() {
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
      <Route path={ROUTES.DASHBOARD}><ProtectedRoute><DashboardHome /></ProtectedRoute></Route>
      <Route path={ROUTES.CHECKOUT}><ProtectedRoute><CheckoutPage /></ProtectedRoute></Route>
      <Route path={ROUTES.ORDERS}><ProtectedRoute><OrdersPage /></ProtectedRoute></Route>
      <Route path={`${ROUTES.ORDERS}/:id`}>
        {(params) => <ProtectedRoute><OrderDetailPage id={params.id} /></ProtectedRoute>}
      </Route>
      <Route path={ROUTES.MENU}><ProtectedRoute><MenuPage /></ProtectedRoute></Route>
      <Route path={ROUTES.TABLES}><ProtectedRoute><TablesPage /></ProtectedRoute></Route>
      <Route path={ROUTES.KDS}><ProtectedRoute><KDSPage /></ProtectedRoute></Route>
      <Route path={ROUTES.ANALYTICS}><ProtectedRoute><AnalyticsPage /></ProtectedRoute></Route>
      <Route path={ROUTES.PAYMENTS_SUCCESS}><ProtectedRoute><PaymentSuccessPage /></ProtectedRoute></Route>
      <Route path={ROUTES.PAYMENTS_ERROR}><ProtectedRoute><PaymentErrorPage /></ProtectedRoute></Route>
      <Route path={ROUTES.PAYMENTS}><ProtectedRoute><PaymentsPage /></ProtectedRoute></Route>
      <Route path={ROUTES.INVENTORY}><ProtectedRoute><InventoryPage /></ProtectedRoute></Route>
      <Route path={ROUTES.EMPLOYEES}><ProtectedRoute><EmployeesPage /></ProtectedRoute></Route>
      <Route path={ROUTES.ATTENDANCE}><ProtectedRoute><AttendancePage /></ProtectedRoute></Route>
      <Route path={ROUTES.SHIFTS}><ProtectedRoute><ShiftsPage /></ProtectedRoute></Route>
      <Route path={ROUTES.SETTINGS}><ProtectedRoute><SettingsPage /></ProtectedRoute></Route>
      <Route path={ROUTES.SERVING}><ProtectedRoute><ServingPage /></ProtectedRoute></Route>
      <Route path={ROUTES.AUDIT_LOGS}><ProtectedRoute><AuditLogsPage /></ProtectedRoute></Route>
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
  );
}

export default App;
