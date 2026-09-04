import educationPlan from "@/data/education.json";
import type { StructuredProfile, EligibilityResult } from "./types";

// Step 3 of the pipeline (Section 3): deterministic underwriting/eligibility
// check. Hard rules only, no LLM. On ambiguous/missing data this flags for
// manual review instead of guessing — never forces a recommendation through.
export function checkEducationPlanEligibility(profile: StructuredProfile): EligibilityResult {
  const reasons: string[] = [];
  let needsManualReview = false;

  function parseRange(value: string): [number, number] {
    const match = value.match(/(\d+)\s*-\s*(\d+)/);
    if (!match) throw new Error(`Could not parse numeric range from "${value}"`);
    return [Number(match[1]), Number(match[2])];
  }

  const eligibility = educationPlan.product_eligibility;
  const [minEntryAge, maxEntryAge] = parseRange(eligibility.entry_age_years);
  const [minTerm, maxTerm] = parseRange(eligibility.policy_term_years);
  const maxMaturityAge = eligibility.maximum_maturity_age_years;
  const minLifeCover = eligibility.minimum_life_cover_lkr;

  // Entry age (next birthday, per the plan's own definition).
  const entryAge = profile.age + 1;
  if (entryAge < minEntryAge || entryAge > maxEntryAge) {
    reasons.push(
      `Entry age (next birthday: ${entryAge}) is outside the plan's allowed range of ${minEntryAge}-${maxEntryAge}.`,
    );
  }

  // Policy term: derived from years-to-education-target when available.
  // Without a target year there's no principled way to pick a term, so this
  // flags for manual review rather than guessing one.
  const term = profile.yearsToEducationTarget;
  if (term == null || term <= 0) {
    needsManualReview = true;
    reasons.push("No usable education target year — cannot determine a policy term for this plan.");
  } else {
    if (term < minTerm || term > maxTerm) {
      reasons.push(
        `Years to education target (${term}) is outside the plan's allowed policy term range of ${minTerm}-${maxTerm} years.`,
      );
    }
    if (profile.age + term > maxMaturityAge) {
      reasons.push(
        `Age at maturity (${profile.age + term}) would exceed the plan's maximum maturity age of ${maxMaturityAge}.`,
      );
    }
  }

  // Life cover: only checked if the operator entered a desired figure.
  if (profile.desiredLifeCoverLkr != null && profile.desiredLifeCoverLkr < minLifeCover) {
    reasons.push(
      `Desired life cover (LKR ${profile.desiredLifeCoverLkr.toLocaleString()}) is below the plan's minimum of LKR ${minLifeCover.toLocaleString()}.`,
    );
  }

  // Budget sanity check: mortality/admin charges aren't disclosed (Section 5),
  // so this can't compute a real minimum premium — just flags an obviously
  // unworkable budget for manual review instead of silently failing later.
  if (profile.monthlyBudgetLkr > 0 && profile.monthlyBudgetLkr < 1000) {
    needsManualReview = true;
    reasons.push("Monthly budget is unusually low for this plan type — flagging for manual review.");
  }

  return {
    eligible: reasons.length === 0 && !needsManualReview,
    needsManualReview,
    reasons,
    checkedAgainst: {
      planName: educationPlan.document_metadata.product_name,
      sourceDoc: "education.json",
    },
  };
}
