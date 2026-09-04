import type { CustomerProfileInput } from "@/types/profile";

// Step 1 output: raw operator input, validated and normalized. Kept close to
// CustomerProfileInput on purpose — this step is about validation, not
// reshaping the data.
export interface StructuredProfile extends CustomerProfileInput {
  currentYear: number;
  yearsToEducationTarget: number | null; // null when no child education goal given
}

export interface FundingGapAssumptions {
  educationCostInflationPercent: number;
  localDegreeCostTodayLkr: number;
  overseasDegreeCostTodayLkr: number;
  savingsGrowthScenariosPercent: number[];
  disclaimer: string;
}

export interface FundingGapProjection {
  scenario: "local_degree" | "overseas_degree";
  projectedCostAtTargetLkr: number;
  projectedSavingsByGrowthRateLkr: Record<string, number>; // key: "4%", "8%", "10%"
  fundingGapByGrowthRateLkr: Record<string, number>; // positive = shortfall
}

export interface RiskAssessment {
  needsManualReview: boolean;
  reasons: string[];
  yearsToTarget: number | null;
  assumptions: FundingGapAssumptions;
  projections: FundingGapProjection[];
}

export interface EligibilityResult {
  eligible: boolean;
  needsManualReview: boolean;
  reasons: string[];
  checkedAgainst: { planName: string; sourceDoc: string };
}
