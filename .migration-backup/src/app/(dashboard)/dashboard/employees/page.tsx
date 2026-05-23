import { EmployeesManager } from "@/components/employees/employees-manager";
import { requireRole } from "@/lib/auth/require-role";

export default async function EmployeesPage() {
  await requireRole(["OWNER"]);

  return (
      <EmployeesManager />
  );
}
