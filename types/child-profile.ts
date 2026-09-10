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

// Only relevant when higherEducationPlan === "local_private_degree" — price
// varies a lot by field, so this drives which cost range gets used.
export type LocalPrivateDegreeField =
  | "business_management"
  | "humanities_social_healthcare"
  | "computing_it"
  | "engineering_built_environment";

export const LOCAL_PRIVATE_DEGREE_FIELDS: { value: LocalPrivateDegreeField; label: string }[] = [
  { value: "business_management", label: "Business & Management (BBA, Marketing, HR, Finance)" },
  {
    value: "humanities_social_healthcare",
    label: "Humanities, Social Sciences & Healthcare (Psychology, Biotech, Nursing, BEd)",
  },
  {
    value: "computing_it",
    label: "Computing & IT (Software Engineering, CS, Cyber Security, Data Science)",
  },
  {
    value: "engineering_built_environment",
    label: "Engineering & Built Environment (Civil, Mechanical, Architecture, Quantity Surveying)",
  },
];

// Sri Lanka's typical age for entering higher education (post-A/Level).
export const TYPICAL_HIGHER_EDUCATION_AGE = 19;

// Parent/guardian's own health flags — distinct from the child's
// CriticalIllnessFlag above. Carried over from the old separate /intake form.
export type CustomerHealthFlag = "smoker" | "chronic_illness" | "family_history" | "prior_claim";

export const CUSTOMER_HEALTH_FLAGS: { value: CustomerHealthFlag; label: string }[] = [
  { value: "smoker", label: "Smoker" },
  { value: "chronic_illness", label: "Chronic illness" },
  { value: "family_history", label: "Family history of major illness" },
  { value: "prior_claim", label: "Prior insurance claim" },
];

export interface ChildProfileInput {
  // Customer / parent-guardian fields (merged in from the old /intake form).
  customerName: string | null;
  customerContactNumber: string | null;
  customerAge: number | null;
  dependentsCount: number;
  desiredLifeCoverLkr: number | null;
  monthlyBudgetLkr: number | null;
  customerHealthFlags: CustomerHealthFlag[];

  // Child fields.
  childName: string | null;
  childAge: number;
  province: Province;
  // Current household monthly expenses (everything EXCEPT this child's future
  // education costs) — used to show the combined monthly budget burden at
  // each stage (A/Level, university), not as an income/affordability check.
  householdMonthlyExpenseLkr: number;
  criticalIllnesses: CriticalIllnessFlag[];
  higherEducationPlan: HigherEducationPlan;
  localPrivateDegreeField: LocalPrivateDegreeField | null;
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
