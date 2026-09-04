"use server";

import { createServiceClient } from "@/lib/db/supabase";
import type { CustomerProfileInput } from "@/types/profile";

export interface SubmitProfileResult {
  ok: boolean;
  error?: string;
  id?: string;
}

export async function submitProfile(input: CustomerProfileInput): Promise<SubmitProfileResult> {
  if (!Number.isFinite(input.age) || input.age <= 0) {
    return { ok: false, error: "Age must be a positive number." };
  }
  if (!Number.isFinite(input.monthlyIncomeLkr) || input.monthlyIncomeLkr < 0) {
    return { ok: false, error: "Monthly income must be a non-negative number." };
  }
  if (!Number.isFinite(input.monthlyBudgetLkr) || input.monthlyBudgetLkr < 0) {
    return { ok: false, error: "Monthly budget must be a non-negative number." };
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("customer_profiles")
    .insert({
      customer_name: input.customerName,
      age: input.age,
      monthly_income_lkr: input.monthlyIncomeLkr,
      dependents_count: input.dependentsCount,
      child_age: input.childAge,
      child_target_education_year: input.childTargetEducationYear,
      desired_life_cover_lkr: input.desiredLifeCoverLkr,
      monthly_budget_lkr: input.monthlyBudgetLkr,
      health_flags: input.healthFlags,
      notes: input.notes,
      status: "submitted",
      raw_input: input,
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, id: data.id };
}
