"use server";

import { createServiceClient } from "@/lib/db/supabase";
import { projectChildFuture } from "@/lib/pipeline/child-future-projection";
import { generateChildReportSinhala } from "@/lib/pipeline/generate-child-report-sinhala";
import type { ChildProfileInput } from "@/types/child-profile";

export interface SubmitChildProfileResult {
  ok: boolean;
  error?: string;
  id?: string;
  reportSinhala?: string;
}

export async function submitChildProfileAndGenerateReport(
  input: ChildProfileInput,
): Promise<SubmitChildProfileResult> {
  if (!Number.isFinite(input.childAge) || input.childAge < 0) {
    return { ok: false, error: "Child's age must be a non-negative number." };
  }
  if (!Number.isFinite(input.householdMonthlyIncomeLkr) || input.householdMonthlyIncomeLkr < 0) {
    return { ok: false, error: "Household monthly income must be a non-negative number." };
  }

  const supabase = createServiceClient();

  // Step 1: deterministic projection (age/cost/health/sports math — no LLM).
  const projection = projectChildFuture(input);

  // Step 2: LLM narrative in Sinhala, constrained to the projection's numbers.
  let reportSinhala: string;
  try {
    reportSinhala = await generateChildReportSinhala(input, projection);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Report generation failed." };
  }

  const { data, error } = await supabase
    .from("child_profiles")
    .insert({
      child_name: input.childName,
      child_age: input.childAge,
      province: input.province,
      household_monthly_income_lkr: input.householdMonthlyIncomeLkr,
      critical_illnesses: input.criticalIllnesses,
      higher_education_plan: input.higherEducationPlan,
      local_private_degree_field: input.localPrivateDegreeField,
      sports_plan_description: input.sportsPlanDescription,
      sports_monthly_cost_lkr: input.sportsMonthlyCostLkr,
      notes: input.notes,
      status: "processed",
      raw_input: input,
      projection_output: projection,
      report_sinhala: reportSinhala,
      report_generated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, id: data.id, reportSinhala };
}
