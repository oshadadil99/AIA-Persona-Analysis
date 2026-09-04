import type { CustomerProfileInput } from "@/types/profile";
import type { StructuredProfile } from "./types";

// Step 1 of the pipeline (Section 3): raw operator input -> structured
// profile. Pure function, no LLM, no I/O — easy to unit test.
export function structureProfile(input: CustomerProfileInput): StructuredProfile {
  const currentYear = new Date().getFullYear();

  const yearsToEducationTarget =
    input.childTargetEducationYear != null ? input.childTargetEducationYear - currentYear : null;

  return {
    ...input,
    currentYear,
    yearsToEducationTarget,
  };
}
