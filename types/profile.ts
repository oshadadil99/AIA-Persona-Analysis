export type HealthFlag = "smoker" | "chronic_illness" | "family_history" | "prior_claim";

export const HEALTH_FLAGS: { value: HealthFlag; label: string }[] = [
  { value: "smoker", label: "Smoker" },
  { value: "chronic_illness", label: "Chronic illness" },
  { value: "family_history", label: "Family history of major illness" },
  { value: "prior_claim", label: "Prior insurance claim" },
];

export interface CustomerProfileInput {
  customerName: string | null;
  age: number;
  monthlyIncomeLkr: number;
  dependentsCount: number;
  childAge: number | null;
  childTargetEducationYear: number | null;
  desiredLifeCoverLkr: number | null;
  monthlyBudgetLkr: number;
  healthFlags: HealthFlag[];
  notes: string | null;
}

export interface CustomerProfileRow extends CustomerProfileInput {
  id: string;
  createdAt: string;
  status: "draft" | "submitted" | "processed";
}
