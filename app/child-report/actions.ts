"use server";

import { createServiceClient } from "@/lib/db/supabase";
import { projectChildFuture } from "@/lib/pipeline/child-future-projection";
import { generateChildReportSinhala } from "@/lib/pipeline/generate-child-report-sinhala";
import type { ChildProfileInput } from "@/types/child-profile";
import type { ChildFutureProjection } from "@/lib/pipeline/child-future-projection";

export interface SubmitChildProfileResult {
  ok: boolean;
  error?: string;
  id?: string;
  reportSinhala?: string;
  // All pricing numbers, structured — the client renders these as real tables
  // instead of relying on the LLM's free-text output for figures.
  projection?: ChildFutureProjection;
}

export async function submitChildProfileAndGenerateReport(
  input: ChildProfileInput,
): Promise<SubmitChildProfileResult> {
  if (!Number.isFinite(input.childAge) || input.childAge < 0) {
    return { ok: false, error: "Child's age must be a non-negative number." };
  }
  if (!Number.isFinite(input.householdMonthlyExpenseLkr) || input.householdMonthlyExpenseLkr < 0) {
    return { ok: false, error: "Household monthly expense must be a non-negative number." };
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
      customer_name: input.customerName,
      customer_contact_number: input.customerContactNumber,
      customer_age: input.customerAge,
      customer_occupation: input.customerOccupation,
      dependents_count: input.dependentsCount,
      desired_life_cover_lkr: input.desiredLifeCoverLkr,
      monthly_budget_lkr: input.monthlyBudgetLkr,
      customer_health_flags: input.customerHealthFlags,
      child_name: input.childName,
      child_age: input.childAge,
      province: input.province,
      household_monthly_expense_lkr: input.householdMonthlyExpenseLkr,
      household_monthly_savings_lkr: input.householdMonthlySavingsLkr,
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

  return { ok: true, id: data.id, reportSinhala, projection };
}
