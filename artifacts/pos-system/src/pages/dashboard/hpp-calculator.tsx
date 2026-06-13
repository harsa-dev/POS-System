import { HppCalculatorExtras } from "@/features/shared/workforce-operations/workforce-operation-extras";
import { HppCalculatorPreparation } from "@/features/shared/workforce-operations/hpp-calculator-preparation";
import { HppCalculatorDashboard } from "@/features/shared/workforce-operations/workforce-operations-dashboards";

export default function HppCalculatorPage() {
  return (
    <>
      <HppCalculatorDashboard />
      <HppCalculatorExtras />
      <HppCalculatorPreparation />
    </>
  );
}
