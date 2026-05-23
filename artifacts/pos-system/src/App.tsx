import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
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
      const res = await fetch("/api/auth/me", { credentials: "include" });
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

  if (!user) return <Redirect to="/login" />;

  return (
    <DashboardShell userName={user.name} role={user.role}>
      {children}
    </DashboardShell>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/"><Redirect to="/login" /></Route>
      <Route path="/login">
        <main className="flex min-h-screen items-center justify-center bg-neutral-50">
          <LoginForm />
        </main>
      </Route>
      <Route path="/register">
        <main className="flex min-h-screen items-center justify-center bg-neutral-50">
          <RegisterForm />
        </main>
      </Route>
      <Route path="/dashboard"><ProtectedRoute><DashboardHome /></ProtectedRoute></Route>
      <Route path="/dashboard/checkout"><ProtectedRoute><CheckoutPage /></ProtectedRoute></Route>
      <Route path="/dashboard/orders"><ProtectedRoute><OrdersPage /></ProtectedRoute></Route>
      <Route path="/dashboard/orders/:id">
        {(params) => <ProtectedRoute><OrderDetailPage id={params.id} /></ProtectedRoute>}
      </Route>
      <Route path="/dashboard/menu"><ProtectedRoute><MenuPage /></ProtectedRoute></Route>
      <Route path="/dashboard/tables"><ProtectedRoute><TablesPage /></ProtectedRoute></Route>
      <Route path="/dashboard/kds"><ProtectedRoute><KDSPage /></ProtectedRoute></Route>
      <Route path="/dashboard/analytics"><ProtectedRoute><AnalyticsPage /></ProtectedRoute></Route>
      <Route path="/dashboard/payments/success"><ProtectedRoute><PaymentSuccessPage /></ProtectedRoute></Route>
      <Route path="/dashboard/payments/error"><ProtectedRoute><PaymentErrorPage /></ProtectedRoute></Route>
      <Route path="/dashboard/payments"><ProtectedRoute><PaymentsPage /></ProtectedRoute></Route>
      <Route path="/dashboard/inventory"><ProtectedRoute><InventoryPage /></ProtectedRoute></Route>
      <Route path="/dashboard/employees"><ProtectedRoute><EmployeesPage /></ProtectedRoute></Route>
      <Route path="/dashboard/attendance"><ProtectedRoute><AttendancePage /></ProtectedRoute></Route>
      <Route path="/dashboard/shifts"><ProtectedRoute><ShiftsPage /></ProtectedRoute></Route>
      <Route path="/dashboard/settings"><ProtectedRoute><SettingsPage /></ProtectedRoute></Route>
      <Route path="/dashboard/serving"><ProtectedRoute><ServingPage /></ProtectedRoute></Route>
      <Route path="/dashboard/audit-logs"><ProtectedRoute><AuditLogsPage /></ProtectedRoute></Route>
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
