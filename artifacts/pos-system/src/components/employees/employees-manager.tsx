"use client";

import { useEffect, useMemo, useState } from "react";
import { ROLE_COLORS, EMPLOYEE_ROLES } from "@/constants/roles";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  AlertCircle,
  Check,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  User2,
  X,
} from "lucide-react";

type EmployeeRole = "MANAGER" | "CASHIER" | "KITCHEN" | "SERVER";

type Employee = {
  id: string;
  name: string;
  email: string;
  role: EmployeeRole;
  isActive: boolean;
  createdAt: string;
};

const roles = EMPLOYEE_ROLES as EmployeeRole[];

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
type RoleFilter = "ALL" | EmployeeRole;

function getRoleColor(role: EmployeeRole) {
  return ROLE_COLORS[role] ?? "bg-neutral-100 text-neutral-700";
}

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "U";
}

export function EmployeesManager() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<EmployeeRole>("CASHIER");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [confirmState, setConfirmState] = useState<{
    title: string;
    description?: string;
    variant?: "default" | "destructive";
    onConfirm: () => void;
  } | null>(null);
  const [resetPasswordTarget, setResetPasswordTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState("");

  async function fetchEmployees() {
    setIsFetching(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/employees", { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setEmployees(data.data);
      } else {
        setFetchError(data.message || "Failed to load employees");
      }
    } catch {
      setFetchError("Network error — could not load employees");
    } finally {
      setIsFetching(false);
    }
  }

  useEffect(() => {
    fetchEmployees();
  }, []);

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const matchSearch = [employee.name, employee.email, employee.role]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && employee.isActive) ||
        (statusFilter === "INACTIVE" && !employee.isActive);

      const matchRole = roleFilter === "ALL" || employee.role === roleFilter;

      return matchSearch && matchStatus && matchRole;
    });
  }, [employees, search, statusFilter, roleFilter]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const res = await fetch("/api/employees", {
      credentials: "include",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });

    const data = await res.json();
    setIsLoading(false);

    if (!data.success) {
      toast.error(data.message || "Failed to create employee");
      return;
    }

    setName("");
    setEmail("");
    setPassword("");
    setRole("CASHIER");
    setIsCreateModalOpen(false);
    fetchEmployees();
  }

  function startEditName(employee: Employee) {
    setEditingId(employee.id);
    setEditingName(employee.name);
  }

  function cancelEditName() {
    setEditingId(null);
    setEditingName("");
  }

  async function updateEmployee(
    id: string,
    body: Partial<{ name: string; role: EmployeeRole; isActive: boolean }>,
  ) {
    const res = await fetch(`/api/employees/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!data.success) {
      toast.error(data.message || "Failed to update employee");
      return false;
    }

    fetchEmployees();
    return true;
  }

  async function saveName(id: string) {
    if (!editingName.trim()) return;
    const success = await updateEmployee(id, { name: editingName.trim() });
    if (success) cancelEditName();
  }

  async function updateRole(id: string, role: EmployeeRole) {
    await updateEmployee(id, { role });
  }

  function deactivateEmployee(id: string) {
    setConfirmState({
      title: "Deactivate employee?",
      description: "This employee will lose system access immediately.",
      variant: "destructive",
      onConfirm: async () => {
        const res = await fetch(`/api/employees/${id}`, { method: "DELETE" });
        const data = await res.json();
        if (!data.success) {
          toast.error(data.message || "Failed to deactivate employee");
          return;
        }
        fetchEmployees();
      },
    });
  }

  function reactivateEmployee(id: string) {
    setConfirmState({
      title: "Reactivate employee?",
      description: "This employee will regain access to the system.",
      onConfirm: () => updateEmployee(id, { isActive: true }),
    });
  }

  function openResetPassword(employee: Employee) {
    setResetPasswordTarget({ id: employee.id, name: employee.name });
    setResetPasswordValue("");
  }

  async function doResetPassword() {
    if (!resetPasswordTarget) return;
    if (resetPasswordValue.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    const res = await fetch(
      `/api/employees/${resetPasswordTarget.id}/reset-password`,
      {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: resetPasswordValue }),
      },
    );
    const data = await res.json();
    if (!data.success) {
      toast.error(data.message || "Failed to reset password");
      return;
    }
    toast.success("Password reset successfully");
    setResetPasswordTarget(null);
    setResetPasswordValue("");
  }

  return (
    <>
      <div className="flex h-[calc(100svh-8rem)] min-h-0 flex-col gap-6 overflow-hidden">
        {/* Header */}
        <section className="shrink-0 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Employees
              </h1>
              <p className="mt-2 text-sm text-neutral-500 sm:text-base">
                Manage staff accounts, roles, and access status.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Add Employee
            </button>
          </div>
        </section>

        {/* Employee list */}
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
          <div className="shrink-0 border-b border-neutral-200 p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Employee List
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Search, filter, update roles, and manage employee accounts.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="flex h-11 min-w-0 items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4">
                  <Search className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden="true" />
                  <input
                    aria-label="Search employees"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search employee..."
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-400"
                  />
                </div>

                <select
                  aria-label="Filter by status"
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as StatusFilter)
                  }
                  className="h-11 rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none"
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>

                <select
                  aria-label="Filter by role"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
                  className="h-11 rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none"
                >
                  <option value="ALL">All Roles</option>
                  {roles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {fetchError && (
            <div className="flex shrink-0 items-center gap-3 border-b border-red-100 bg-red-50 px-6 py-4">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <p className="flex-1 text-sm text-red-700">{fetchError}</p>
              <button
                type="button"
                onClick={fetchEmployees}
                className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50"
              >
                <RefreshCw className="h-3 w-3" />
                Retry
              </button>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full min-w-[950px]">
              <thead className="sticky top-0 z-10 border-b border-neutral-200 bg-neutral-50">
                <tr className="text-left text-sm text-neutral-500">
                  <th scope="col" className="px-6 py-4 font-medium">Employee</th>
                  <th scope="col" className="px-6 py-4 font-medium">Role</th>
                  <th scope="col" className="px-6 py-4 font-medium">Status</th>
                  <th scope="col" className="px-6 py-4 font-medium">Created</th>
                  <th scope="col" className="px-6 py-4 text-right font-medium">Actions</th>
                </tr>
              </thead>

              <tbody>
                {isFetching ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-neutral-100">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-44" />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </td>
                      <td className="px-6 py-5">
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </td>
                      <td className="px-6 py-5">
                        <Skeleton className="h-4 w-20" />
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex justify-end gap-2">
                          <Skeleton className="h-10 w-10 rounded-xl" />
                          <Skeleton className="h-10 w-10 rounded-xl" />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <>
                    {filteredEmployees.map((employee) => (
                      <tr
                        key={employee.id}
                        className="border-b border-neutral-100 transition hover:bg-neutral-50"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-100 font-semibold text-violet-700">
                              {getInitial(employee.name)}
                            </div>

                            <div className="min-w-0">
                              {editingId === employee.id ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    aria-label={`Edit name for ${employee.name}`}
                                    autoFocus
                                    value={editingName}
                                    onChange={(e) =>
                                      setEditingName(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        saveName(employee.id);
                                      } else if (e.key === "Escape") {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        cancelEditName();
                                      }
                                    }}
                                    className="h-10 rounded-xl border border-neutral-200 px-3 text-sm outline-none"
                                  />
                                  <button
                                    type="button"
                                    aria-label={`Save name for ${employee.name}`}
                                    onClick={() => saveName(employee.id)}
                                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                                  >
                                    <Check className="h-4 w-4" aria-hidden="true" />
                                  </button>
                                  <button
                                    type="button"
                                    aria-label="Cancel editing name"
                                    onClick={cancelEditName}
                                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200"
                                  >
                                    <X className="h-4 w-4" aria-hidden="true" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-center gap-2">
                                    <p className="truncate font-semibold text-neutral-900">
                                      {employee.name}
                                    </p>
                                    <button
                                      type="button"
                                      aria-label={`Edit name for ${employee.name}`}
                                      onClick={() => startEditName(employee)}
                                      className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-neutral-100"
                                    >
                                      <Pencil className="h-3.5 w-3.5 text-neutral-500" aria-hidden="true" />
                                    </button>
                                  </div>
                                  <p className="truncate text-sm text-neutral-500">
                                    {employee.email}
                                  </p>
                                </>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <select
                            aria-label={`Role for ${employee.name}`}
                            value={employee.role}
                            onChange={(e) =>
                              updateRole(
                                employee.id,
                                e.target.value as EmployeeRole,
                              )
                            }
                            disabled={!employee.isActive}
                            className={`rounded-full border-0 px-3 py-1.5 text-xs font-semibold outline-none disabled:opacity-50 ${getRoleColor(employee.role)}`}
                          >
                            {roles.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="px-6 py-5">
                          <StatusBadge
                            className={
                              employee.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }
                          >
                            {employee.isActive ? "ACTIVE" : "INACTIVE"}
                          </StatusBadge>
                        </td>

                        <td className="px-6 py-5 text-sm text-neutral-500">
                          {new Date(employee.createdAt).toLocaleDateString()}
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              aria-label={`Reset password for ${employee.name}`}
                              onClick={() => openResetPassword(employee)}
                              className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 transition hover:bg-neutral-100"
                            >
                              <RotateCcw className="h-4 w-4 text-neutral-600" aria-hidden="true" />
                            </button>

                            {employee.isActive ? (
                              <button
                                type="button"
                                aria-label={`Deactivate ${employee.name}`}
                                onClick={() =>
                                  deactivateEmployee(employee.id)
                                }
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 text-red-600 transition hover:bg-red-50"
                              >
                                <ShieldAlert className="h-4 w-4" aria-hidden="true" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                aria-label={`Reactivate ${employee.name}`}
                                onClick={() =>
                                  reactivateEmployee(employee.id)
                                }
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-green-200 text-green-600 transition hover:bg-green-50"
                              >
                                <User2 className="h-4 w-4" aria-hidden="true" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}

                    {filteredEmployees.length === 0 && !fetchError && (
                      <tr>
                        <td colSpan={5} className="px-6 py-16 text-center text-neutral-500">
                          No employees found.
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={!!confirmState}
        title={confirmState?.title ?? ""}
        description={confirmState?.description}
        variant={confirmState?.variant}
        onConfirm={() => {
          const action = confirmState?.onConfirm;
          setConfirmState(null);
          action?.();
        }}
        onCancel={() => setConfirmState(null)}
      />

      <ConfirmDialog
        open={!!resetPasswordTarget}
        title={`Reset password — ${resetPasswordTarget?.name ?? ""}`}
        description="Enter a new password for this employee."
        confirmLabel="Reset Password"
        onConfirm={doResetPassword}
        onCancel={() => {
          setResetPasswordTarget(null);
          setResetPasswordValue("");
        }}
      >
        <input
          type="password"
          value={resetPasswordValue}
          onChange={(e) => setResetPasswordValue(e.target.value)}
          placeholder="Minimum 6 characters"
          autoFocus
          className="h-11 w-full rounded-xl border border-neutral-200 px-4 text-sm outline-none focus:border-neutral-400"
        />
      </ConfirmDialog>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Add Employee
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Create a new employee account.
                </p>
              </div>

              <button
                type="button"
                aria-label="Close Add Employee dialog"
                onClick={() => setIsCreateModalOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-neutral-100"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label htmlFor="emp-name" className="mb-2 block text-sm font-medium text-neutral-700">
                    Employee Name
                  </label>
                  <input
                    id="emp-name"
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="h-11 w-full rounded-2xl border border-neutral-200 px-4 outline-none transition focus:border-neutral-400"
                  />
                </div>

                <div>
                  <label htmlFor="emp-email" className="mb-2 block text-sm font-medium text-neutral-700">
                    Email
                  </label>
                  <input
                    id="emp-email"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="h-11 w-full rounded-2xl border border-neutral-200 px-4 outline-none transition focus:border-neutral-400"
                  />
                </div>

                <div>
                  <label htmlFor="emp-role" className="mb-2 block text-sm font-medium text-neutral-700">
                    Role
                  </label>
                  <select
                    id="emp-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as EmployeeRole)}
                    className="h-11 w-full rounded-2xl border border-neutral-200 px-4 outline-none"
                  >
                    {roles.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="emp-password" className="mb-2 block text-sm font-medium text-neutral-700">
                    Password
                  </label>
                  <input
                    id="emp-password"
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="h-11 w-full rounded-2xl border border-neutral-200 px-4 outline-none transition focus:border-neutral-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="h-11 rounded-2xl border border-neutral-200 px-5 text-sm font-medium transition hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  disabled={isLoading}
                  className="h-11 rounded-2xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
                >
                  {isLoading ? "Creating..." : "Create Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
