export const SRI_LANKA_PROVINCES = [
  "Western",
  "Central",
  "Southern",
  "Northern",
  "Eastern",
  "North Western",
  "North Central",
  "Uva",
  "Sabaragamuwa",
] as const;
export type Province = (typeof SRI_LANKA_PROVINCES)[number];

export type CriticalIllnessFlag =
  | "heart_disease"
  | "cancer_history"
  | "kidney_disease"
  | "diabetes"
  | "respiratory_condition"
  | "other_chronic_illness";

export const CRITICAL_ILLNESS_FLAGS: { value: CriticalIllnessFlag; label: string }[] = [
  { value: "heart_disease", label: "Heart disease" },
  { value: "cancer_history", label: "Cancer (personal or immediate family history)" },
  { value: "kidney_disease", label: "Kidney disease" },
  { value: "diabetes", label: "Diabetes" },
  { value: "respiratory_condition", label: "Respiratory condition (e.g. asthma)" },
  { value: "other_chronic_illness", label: "Other chronic illness" },
];

export type HigherEducationPlan =
  | "local_government_degree"
  | "local_private_degree"
  | "overseas_degree"
  | "vocational_training"
  | "medicine"
  | "engineering"
  | "undecided";

export const HIGHER_EDUCATION_PLANS: { value: HigherEducationPlan; label: string }[] = [
  { value: "local_government_degree", label: "Local government university" },
  { value: "local_private_degree", label: "Local private degree" },
  { value: "overseas_degree", label: "Overseas degree" },
  { value: "vocational_training", label: "Vocational / technical training" },
  { value: "medicine", label: "Medicine" },
  { value: "engineering", label: "Engineering" },
  { value: "undecided", label: "Undecided" },
];

// Sri Lanka's typical age for entering higher education (post-A/Level).
export const TYPICAL_HIGHER_EDUCATION_AGE = 19;

export interface ChildProfileInput {
  childName: string | null;
  childAge: number;
  province: Province;
  householdMonthlyIncomeLkr: number;
  criticalIllnesses: CriticalIllnessFlag[];
  higherEducationPlan: HigherEducationPlan;
  sportsPlanDescription: string | null;
  sportsMonthlyCostLkr: number | null;
  notes: string | null;
}

export interface ChildProfileRow extends ChildProfileInput {
  id: string;
  createdAt: string;
  status: "draft" | "submitted" | "processed";
  reportSinhala: string | null;
}
