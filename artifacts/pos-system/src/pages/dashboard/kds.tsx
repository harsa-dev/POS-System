import { KitchenDisplayDashboard } from "@/features/fnb/kitchen";

export default function KDSPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kitchen Display System</h1>
        <p className="text-neutral-500 text-sm mt-1">Manage kitchen orders in real time</p>
      </div>
      <KitchenDisplayDashboard />
    </section>
  );
}
