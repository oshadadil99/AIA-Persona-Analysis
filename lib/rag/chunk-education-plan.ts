// Turns data/education.json into retrievable text chunks. One chunk per
// natural section so retrieval (Section 4) can be scoped tightly — e.g. a
// question about surrender penalties shouldn't pull back rider descriptions.

export interface PlanChunk {
  id: string;
  section: string;
  text: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function chunkEducationPlan(plan: any): PlanChunk[] {
  const name = plan.document_metadata?.product_name ?? "AIA Education Plan";
  const chunks: PlanChunk[] = [];

  const primaryBenefits = plan.core_features_and_benefits?.primary_benefits ?? [];
  if (primaryBenefits.length) {
    const text = [
      `${name} — Primary benefits.`,
      ...primaryBenefits.map((b: { title: string; description: string }) => `${b.title}: ${b.description}`),
    ].join("\n");
    chunks.push({ id: "primary-benefits", section: "primary_benefits", text });
  }

  const inBuilt = plan.core_features_and_benefits?.in_built_benefits;
  if (inBuilt) {
    const text = [
      `${name} — In-built benefits.`,
      `Amount payable on death: ${inBuilt.amount_payable_on_death}.`,
      `Premium protection benefit: ${inBuilt.premium_protection_benefit}`,
    ].join("\n");
    chunks.push({ id: "in-built-benefits", section: "in_built_benefits", text });
  }

  const eligibility = plan.product_eligibility;
  if (eligibility) {
    const text = [
      `${name} — Eligibility.`,
      `Entry age: ${eligibility.entry_age_years} years.`,
      `Maximum maturity age: ${eligibility.maximum_maturity_age_years} years.`,
      `Policy term: ${eligibility.policy_term_years} years.`,
      `Minimum life cover: LKR ${eligibility.minimum_life_cover_lkr}.`,
    ].join("\n");
    chunks.push({ id: "eligibility", section: "eligibility", text });
  }

  const illustration = plan.financial_illustration;
  if (illustration) {
    const p = illustration.example_parameters ?? {};
    const proj = illustration.projected_maturity_benefits_lkr ?? {};
    const cover = illustration.in_built_cover_amounts_lkr ?? {};
    const text = [
      `${name} — Sample financial illustration. This is an EXAMPLE ONLY for a specific` +
        ` entry age and premium — not a formula, and not any specific customer's actual figures.`,
      `Example entry age: ${p.entry_age}. Annual basic premium: LKR ${p.annual_basic_premium_lkr}.`,
      `Life cover multiple: ${p.life_cover_multiple}. Policy term: ${p.policy_term_years} years.`,
      `Annual total premium (incl. riders): LKR ${p.annual_total_premium_lkr}.`,
      `Includes rider premiums: ${(p.includes_rider_premiums ?? []).join(", ")}.`,
      `Projected maturity benefit at 4% p.a.: LKR ${proj["4_percent_pa"]}.`,
      `Projected maturity benefit at 8% p.a.: LKR ${proj["8_percent_pa"]}.`,
      `Projected maturity benefit at 10% p.a.: LKR ${proj["10_percent_pa"]}.`,
      `In-built cover — amount payable on death: LKR ${cover.amount_payable_on_death}.`,
      `In-built cover — premium protection benefit: ${cover.premium_protection_benefit}.`,
      `Dividend rates used above are assumed, not guaranteed.`,
    ].join("\n");
    chunks.push({ id: "financial-illustration", section: "financial_illustration", text });
  }

  const charges = plan.charges_and_fees;
  if (charges) {
    if (charges.allocation_charge) {
      const a = charges.allocation_charge;
      chunks.push({
        id: "charge-allocation",
        section: "allocation_charge",
        text: [
          `${name} — Allocation charge.`,
          `Basic premium — 1st policy year: ${a.basic_premium?.["1st_policy_year"]}.`,
          `Basic premium — 2nd policy year: ${a.basic_premium?.["2nd_policy_year"]}.`,
          `Basic premium — 3rd policy year onwards: ${a.basic_premium?.["3rd_policy_year_onwards"]}.`,
          `Top up premium: ${a.top_up_premium}.`,
        ].join("\n"),
      });
    }
    if (charges.surrender_penalty) {
      const s = charges.surrender_penalty;
      chunks.push({
        id: "charge-surrender-penalty",
        section: "surrender_penalty",
        text: [
          `${name} — Surrender penalty. This is a real reduction of the amount paid out on` +
            ` early cash-in, not a minor fee.`,
          `1st policy year: ${s["1st_policy_year"]}.`,
          `2nd policy year: ${s["2nd_policy_year"]}.`,
          `3rd policy year: ${s["3rd_policy_year"]}.`,
          `4th policy year onwards: ${s["4th_policy_year_onwards"]}.`,
        ].join("\n"),
      });
    }
    chunks.push({
      id: "charge-other",
      section: "other_charges",
      text: [
        `${name} — Administration, fund management, mortality, and modal charges.`,
        `Administration charge: ${charges.administration_charge}`,
        `Fund management charge: ${charges.fund_management_charge}`,
        `Mortality charge: ${charges.mortality_charge}`,
        `Modal charge: ${charges.modal_charge}`,
      ].join("\n"),
    });
  }

  const commitments = plan.policyholder_commitments_and_discontinuance;
  if (commitments) {
    const text = [
      `${name} — Policyholder commitments and discontinuance rules.`,
      `Grace period: ${commitments.grace_period_days} days.`,
      `Lapse rule (first 3 policy years): ${commitments.lapse_policy_first_3_years}`,
      `Continuation after 3 years: ${commitments.continuation_after_3_years}`,
      `Termination condition: ${commitments.termination_condition}`,
      `Cashing in / surrender: ${commitments.cashing_in_surrender}`,
    ].join("\n");
    chunks.push({ id: "commitments", section: "commitments_and_discontinuance", text });
  }

  const riders = plan.optional_additional_benefits_riders ?? [];
  for (const rider of riders) {
    const slug = rider.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    chunks.push({
      id: `rider-${slug}`,
      section: "optional_rider",
      text: `${name} — Optional rider: ${rider.name}. ${rider.description}`,
    });
  }

  return chunks;
}
