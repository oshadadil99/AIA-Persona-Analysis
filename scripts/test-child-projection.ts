// Sanity check for the child-future-projection math only (no LLM call, no
// Supabase write). Run with: npx tsx scripts/test-child-projection.ts
import { projectChildFuture } from "../lib/pipeline/child-future-projection";
import type { ChildProfileInput } from "../types/child-profile";

const samples: { label: string; input: ChildProfileInput }[] = [
  {
    label: "12yo, no health flags, no sports",
    input: {
      childName: "Test A",
      childAge: 12,
      province: "Western",
      householdMonthlyIncomeLkr: 250_000,
      criticalIllnesses: [],
      higherEducationPlan: "local_private_degree",
      sportsPlanDescription: null,
      sportsMonthlyCostLkr: null,
      notes: null,
    },
  },
  {
    label: "8yo, diabetes flag, competitive swimming",
    input: {
      childName: "Test B",
      childAge: 8,
      province: "Southern",
      householdMonthlyIncomeLkr: 180_000,
      criticalIllnesses: ["diabetes"],
      higherEducationPlan: "overseas_degree",
      sportsPlanDescription: "Competitive swimming",
      sportsMonthlyCostLkr: 15_000,
      notes: null,
    },
  },
  {
    label: "20yo — already past typical age",
    input: {
      childName: "Test C",
      childAge: 20,
      province: "Central",
      householdMonthlyIncomeLkr: 300_000,
      criticalIllnesses: [],
      higherEducationPlan: "undecided",
      sportsPlanDescription: null,
      sportsMonthlyCostLkr: null,
      notes: null,
    },
  },
];

for (const { label, input } of samples) {
  console.log("\n=== " + label + " ===");
  const p = projectChildFuture(input);
  console.log("yearsToHigherEducation:", p.yearsToHigherEducation, "| alreadyPast:", p.alreadyPastTypicalAge);
  for (const e of p.education) {
    console.log(`  [${e.scenario}] cost@19: LKR ${e.projectedCostAtAge19Lkr.toLocaleString()}`);
    console.log(`    required monthly saving:`, e.requiredMonthlySavingByGrowthRateLkr);
  }
  console.log("healthRisk:", p.healthRisk);
  console.log("sports:", p.sports);
  console.log("alTuition:", p.alTuition);
  console.log("alMaterials:", p.alMaterials);
  console.log("alTransport:", p.alTransport);
  console.log("alCombinedTotal:", p.alCombinedTotal);
}
