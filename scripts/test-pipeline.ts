// Sanity check for pipeline steps 1-3 (Section 3) against a few sample
// profiles. Pure functions, no LLM/Inngest/network involved.
// Run with: npx tsx scripts/test-pipeline.ts
import { structureProfile } from "../lib/pipeline/structure-profile";
import { assessFundingGap } from "../lib/pipeline/risk-assessment";
import { checkEducationPlanEligibility } from "../lib/pipeline/eligibility";
import type { CustomerProfileInput } from "../types/profile";

const currentYear = new Date().getFullYear();

const samples: { label: string; input: CustomerProfileInput }[] = [
  {
    label: "Good fit — 32yo, child needs funding in 12 years, reasonable budget",
    input: {
      customerName: "Test A",
      age: 32,
      monthlyIncomeLkr: 250_000,
      dependentsCount: 2,
      childAge: 5,
      childTargetEducationYear: currentYear + 12,
      desiredLifeCoverLkr: 5_000_000,
      monthlyBudgetLkr: 15_000,
      healthFlags: [],
      notes: null,
    },
  },
  {
    label: "Too old for entry age (65)",
    input: {
      customerName: "Test B",
      age: 65,
      monthlyIncomeLkr: 200_000,
      dependentsCount: 1,
      childAge: 10,
      childTargetEducationYear: currentYear + 10,
      desiredLifeCoverLkr: 1_000_000,
      monthlyBudgetLkr: 20_000,
      healthFlags: [],
      notes: null,
    },
  },
  {
    label: "No education target year — should flag for manual review",
    input: {
      customerName: "Test C",
      age: 40,
      monthlyIncomeLkr: 300_000,
      dependentsCount: 3,
      childAge: null,
      childTargetEducationYear: null,
      desiredLifeCoverLkr: null,
      monthlyBudgetLkr: 10_000,
      healthFlags: ["smoker"],
      notes: null,
    },
  },
  {
    label: "Term too short (target next year)",
    input: {
      customerName: "Test D",
      age: 35,
      monthlyIncomeLkr: 180_000,
      dependentsCount: 1,
      childAge: 17,
      childTargetEducationYear: currentYear + 1,
      desiredLifeCoverLkr: 500_000,
      monthlyBudgetLkr: 8_000,
      healthFlags: [],
      notes: null,
    },
  },
];

for (const { label, input } of samples) {
  console.log("\n=== " + label + " ===");
  const structured = structureProfile(input);
  const risk = assessFundingGap(structured);
  const eligibility = checkEducationPlanEligibility(structured);

  console.log("yearsToTarget:", structured.yearsToEducationTarget);
  console.log("risk.needsManualReview:", risk.needsManualReview, risk.reasons);
  if (risk.projections.length) {
    for (const p of risk.projections) {
      console.log(`  [${p.scenario}] cost@target: LKR ${p.projectedCostAtTargetLkr.toLocaleString()}`);
      console.log(`    gap by growth rate:`, p.fundingGapByGrowthRateLkr);
    }
  }
  console.log("eligibility:", eligibility.eligible, "| review:", eligibility.needsManualReview, "|", eligibility.reasons);
}
