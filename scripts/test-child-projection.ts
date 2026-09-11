// Sanity check for the child-future-projection math only (no LLM call, no
// Supabase write). Run with: npx tsx scripts/test-child-projection.ts
import { projectChildFuture } from "../lib/pipeline/child-future-projection";
import type { ChildProfileInput } from "../types/child-profile";

const customerDefaults = {
  customerName: "Test Customer",
  customerContactNumber: "0771234567",
  customerAge: 35,
  customerOccupation: "Software Engineer",
  dependentsCount: 1,
  desiredLifeCoverLkr: null,
  monthlyBudgetLkr: null,
  customerHealthFlags: [],
} satisfies Partial<ChildProfileInput>;

const samples: { label: string; input: ChildProfileInput }[] = [
  {
    label: "12yo, local private degree - Computing & IT",
    input: {
      ...customerDefaults,
      childName: "Test A",
      childAge: 12,
      province: "Western",
      householdMonthlyExpenseLkr: 250_000,
      householdMonthlySavingsLkr: null,
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
      ...customerDefaults,
      childName: "Test B",
      childAge: 8,
      province: "Southern",
      householdMonthlyExpenseLkr: 180_000,
      householdMonthlySavingsLkr: null,
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
      ...customerDefaults,
      childName: "Test D",
      childAge: 14,
      province: "Central",
      householdMonthlyExpenseLkr: 150_000,
      householdMonthlySavingsLkr: null,
      criticalIllnesses: [],
      higherEducationPlan: "local_government_degree",
      localPrivateDegreeField: null,
      sportsPlanDescription: null,
      sportsMonthlyCostLkr: null,
      notes: null,
    },
  },
  {
    label: "17yo, vocational training",
    input: {
      ...customerDefaults,
      childName: "Test E",
      childAge: 17,
      province: "Western",
      householdMonthlyExpenseLkr: 120_000,
      householdMonthlySavingsLkr: null,
      criticalIllnesses: [],
      higherEducationPlan: "vocational_training",
      localPrivateDegreeField: null,
      sportsPlanDescription: null,
      sportsMonthlyCostLkr: null,
      notes: null,
    },
  },
  {
    label: "20yo — already past typical age",
    input: {
      ...customerDefaults,
      childName: "Test C",
      childAge: 20,
      province: "Central",
      householdMonthlyExpenseLkr: 300_000,
      householdMonthlySavingsLkr: null,
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
  console.log("vocationalTrainingLivingExpenses:", JSON.stringify(p.vocationalTrainingLivingExpenses, null, 2));
  console.log("overseasDegreeCostBreakdown:", JSON.stringify(p.overseasDegreeCostBreakdown, null, 2));
  console.log("grandTotal:", p.grandTotal);
}
