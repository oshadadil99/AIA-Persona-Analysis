// Sanity check for the child-future-projection math only (no LLM call, no
// Supabase write). Run with: npx tsx scripts/test-child-projection.ts
import { projectChildFuture } from "../lib/pipeline/child-future-projection";
import type { ChildProfileInput } from "../types/child-profile";

const samples: { label: string; input: ChildProfileInput }[] = [
  {
    label: "12yo, local private degree - Computing & IT",
    input: {
      childName: "Test A",
      childAge: 12,
      province: "Western",
      householdMonthlyIncomeLkr: 250_000,
      criticalIllnesses: [],
      higherEducationPlan: "local_private_degree",
      localPrivateDegreeField: "computing_it",
      sportsPlanDescription: null,
      sportsMonthlyCostLkr: null,
      notes: null,
    },
  },
  {
    label: "8yo, diabetes flag, competitive swimming, overseas degree",
    input: {
      childName: "Test B",
      childAge: 8,
      province: "Southern",
      householdMonthlyIncomeLkr: 180_000,
      criticalIllnesses: ["diabetes"],
      higherEducationPlan: "overseas_degree",
      localPrivateDegreeField: null,
      sportsPlanDescription: "Competitive swimming",
      sportsMonthlyCostLkr: 15_000,
      notes: null,
    },
  },
  {
    label: "14yo, local government degree",
    input: {
      childName: "Test D",
      childAge: 14,
      province: "Central",
      householdMonthlyIncomeLkr: 150_000,
      criticalIllnesses: [],
      higherEducationPlan: "local_government_degree",
      localPrivateDegreeField: null,
      sportsPlanDescription: null,
      sportsMonthlyCostLkr: null,
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
      localPrivateDegreeField: null,
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
    console.log(`  [${e.scenario}]${e.fieldOfStudyLabel ? ` (${e.fieldOfStudyLabel})` : ""}`);
    console.log(`    cost today: LKR ${e.costTodayLkrMin.toLocaleString()}-${e.costTodayLkrMax.toLocaleString()}`);
    console.log(
      `    cost@19: LKR ${e.projectedCostAtAge19LkrMin.toLocaleString()}-${e.projectedCostAtAge19LkrMax.toLocaleString()}`,
    );
    console.log(`    required monthly saving:`, e.requiredMonthlySavingByGrowthRateLkr);
  }
  console.log("healthRisk:", p.healthRisk);
  console.log("sports:", p.sports);
  console.log("alTuition:", p.alTuition);
  console.log("alMaterials:", p.alMaterials);
  console.log("alCombinedTotal:", p.alCombinedTotal);
  console.log("localPrivateLivingExpenses:", p.localPrivateLivingExpenses);
  console.log("governmentUniversityLivingExpenses:", JSON.stringify(p.governmentUniversityLivingExpenses, null, 2));
  console.log("grandTotal:", p.grandTotal);
}
