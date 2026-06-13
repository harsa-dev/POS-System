import { HppCalculatorExtras } from "@/features/shared/workforce-operations/workforce-operation-extras";
import { HppCalculatorDashboard } from "@/features/shared/workforce-operations/workforce-operations-dashboards";

export default function HppCalculatorPage() {
  return (
    <>
      <HppCalculatorDashboard />
      <HppCalculatorExtras />
    </>
  );
}
