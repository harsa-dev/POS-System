import { MenuManager } from "@/components/menu/menu-manager";

import { requireRole } from "@/lib/auth/require-role";

export default async function MenuPage() {
  await requireRole(["OWNER", "MANAGER"]);

  return (
    <section className="space-y-6">

      <MenuManager />
    </section>
  );
}
