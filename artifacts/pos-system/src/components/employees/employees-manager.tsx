"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Pencil,
  Plus,
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

const roles: EmployeeRole[] = ["MANAGER", "CASHIER", "KITCHEN", "SERVER"];

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
type RoleFilter = "ALL" | EmployeeRole;

function getRoleColor(role: EmployeeRole) {
  if (role === "MANAGER") return "bg-blue-100 text-blue-700";
  if (role === "CASHIER") return "bg-violet-100 text-violet-700";
  if (role === "KITCHEN") return "bg-orange-100 text-orange-700";
  return "bg-emerald-100 text-emerald-700";
}

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "U";
}

export function EmployeesManager() {
  const [employees, setEmployees] = useState<Employee[]>([]);
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

  async function fetchEmployees() {
    const res = await fetch("/api/employees", { credentials: "include" });
    const data = await res.json();

    if (data.success) {
      setEmployees(data.data);
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
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        password,
        role,
      }),
    });

    const data = await res.json();

    setIsLoading(false);

    if (!data.success) {
      alert(data.message || "Failed to create employee");
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
    body: Partial<{
      name: string;
      role: EmployeeRole;
      isActive: boolean;
    }>,
  ) {
    const res = await fetch(`/api/employees/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!data.success) {
      alert(data.message || "Failed to update employee");
      return false;
    }

    fetchEmployees();
    return true;
  }

  async function saveName(id: string) {
    if (!editingName.trim()) return;

    const success = await updateEmployee(id, {
      name: editingName.trim(),
    });

    if (success) {
      cancelEditName();
    }
  }

  async function updateRole(id: string, role: EmployeeRole) {
    await updateEmployee(id, { role });
  }

  async function deactivateEmployee(id: string) {
    const confirmed = confirm("Deactivate this employee?");
    if (!confirmed) return;

    const res = await fetch(`/api/employees/${id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (!data.success) {
      alert(data.message || "Failed to deactivate employee");
      return;
    }

    fetchEmployees();
  }

  async function reactivateEmployee(id: string) {
    const confirmed = confirm("Reactivate this employee?");
    if (!confirmed) return;

    await updateEmployee(id, {
      isActive: true,
    });
  }

  async function resetPassword(id: string) {
    const newPassword = prompt("Enter new password for this employee");

    if (!newPassword) return;

    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    const res = await fetch(`/api/employees/${id}/reset-password`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        password: newPassword,
      }),
    });

    const data = await res.json();

    if (!data.success) {
      alert(data.message || "Failed to reset password");
      return;
    }

    alert("Password reset successfully");
  }

  return (
    <>
      <div className="flex h-[calc(100vh-8rem)] min-h-0 flex-col gap-6 overflow-hidden">
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
              className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              <Plus className="h-4 w-4" />
              Add Employee
            </button>
          </div>
        </section>

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
                <div className="flex h-12 min-w-0 items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4">
                  <Search className="h-4 w-4 shrink-0 text-neutral-400" />

                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search employee..."
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-400"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as StatusFilter)
                  }
                  className="h-12 rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none"
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>

                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
                  className="h-12 rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none"
                >
                  <option value="ALL">All Roles</option>
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto no-scrollbar">
            <table className="w-full min-w-[950px]">
              <thead className="sticky top-0 z-10 border-b border-neutral-200 bg-neutral-50">
                <tr className="text-left text-sm text-neutral-500">
                  <th className="px-6 py-4 font-medium">Employee</th>
                  <th className="px-6 py-4 font-medium">Role</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Created</th>
                  <th className="px-6 py-4 text-right font-medium">Actions</th>
                </tr>
              </thead>

              <tbody>
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
                                value={editingName}
                                onChange={(e) =>
                                  setEditingName(e.target.value)
                                }
                                className="h-10 rounded-xl border border-neutral-200 px-3 text-sm outline-none"
                              />

                              <button
                                type="button"
                                onClick={() => saveName(employee.id)}
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white"
                              >
                                <Check className="h-4 w-4" />
                              </button>

                              <button
                                type="button"
                                onClick={cancelEditName}
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200"
                              >
                                <X className="h-4 w-4" />
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
                                  onClick={() => startEditName(employee)}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-neutral-100"
                                >
                                  <Pencil className="h-3.5 w-3.5 text-neutral-500" />
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
                        value={employee.role}
                        onChange={(e) =>
                          updateRole(
                            employee.id,
                            e.target.value as EmployeeRole,
                          )
                        }
                        disabled={!employee.isActive}
                        className={`rounded-full border-0 px-3 py-1.5 text-xs font-semibold outline-none disabled:opacity-50 ${getRoleColor(
                          employee.role,
                        )}`}
                      >
                        {roles.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          employee.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {employee.isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-sm text-neutral-500">
                      {new Date(employee.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          title="Reset password"
                          onClick={() => resetPassword(employee.id)}
                          className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 transition hover:bg-neutral-100"
                        >
                          <RotateCcw className="h-4 w-4 text-neutral-600" />
                        </button>

                        {employee.isActive ? (
                          <button
                            type="button"
                            title="Deactivate"
                            onClick={() => deactivateEmployee(employee.id)}
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 text-red-600 transition hover:bg-red-50"
                          >
                            <ShieldAlert className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            title="Reactivate"
                            onClick={() => reactivateEmployee(employee.id)}
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-green-200 text-green-600 transition hover:bg-green-50"
                          >
                            <User2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredEmployees.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-16 text-center text-neutral-500"
                    >
                      No employees found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

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
                onClick={() => setIsCreateModalOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-neutral-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700">
                    Employee Name
                  </label>

                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="h-12 w-full rounded-2xl border border-neutral-200 px-4 outline-none transition focus:border-neutral-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700">
                    Email
                  </label>

                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="h-12 w-full rounded-2xl border border-neutral-200 px-4 outline-none transition focus:border-neutral-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700">
                    Role
                  </label>

                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as EmployeeRole)}
                    className="h-12 w-full rounded-2xl border border-neutral-200 px-4 outline-none"
                  >
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700">
                    Password
                  </label>

                  <input
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="h-12 w-full rounded-2xl border border-neutral-200 px-4 outline-none transition focus:border-neutral-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="h-12 rounded-2xl border border-neutral-200 px-5 font-medium transition hover:bg-neutral-50"
                >
                  Cancel
                </button>

                <button
                  disabled={isLoading}
                  className="h-12 rounded-2xl bg-neutral-950 px-6 font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50"
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