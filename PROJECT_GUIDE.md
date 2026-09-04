# AI Insurance Advisory Platform — Build Guide

## ⚠️ CRITICAL RULE — READ FIRST

**DO NOT run `git commit`, `git push`, or initialize/modify git in any way.**
Do not create commits, branches, or touch `.git`. The project owner handles all git operations manually. You may create/edit files freely, but leave version control entirely alone. If a task seems to require a commit, stop and ask instead.

---

## 1. What This Project Is

An internal tool (single operator use — **not customer-facing**) for a Sri Lankan insurance advisory workflow:

1. Operator (the only user) enters a customer's profile (age, income, dependents, child's education goals, health flags, budget, etc.) into a form.
2. The system runs the data through a multi-agent pipeline that profiles risk, checks eligibility against real policy rules, and matches the best-fit insurance plan.
3. The system generates a **Sinhala-language PDF report** for the operator to give to the customer, explaining:
   - Future financial/education funding risk if nothing is done
   - The recommended AIA plan and why it fits
   - Benefits, in plain Sinhala
   - Commitments/risks (grace periods, lapse rules, surrender penalties)

No end customer ever touches this platform directly. The operator is the sole user.

---

## 2. Stack (Phase 1 — Vercel only)

| Layer | Tech |
|---|---|
| Frontend | Next.js (App Router), hosted on Vercel |
| API | Next.js API routes on Vercel |
| Background pipeline runner | Inngest (free tier) — required because the agent pipeline takes 15–40+ seconds and will exceed Vercel's serverless function time limits |
| Database | Supabase (Postgres) — stores operator inputs, structured profiles, recommendation audit trail, job status |
| Auth | Supabase Auth (only needed if/when more than one operator exists) |
| Vector DB | Pinecone — **one index**, namespaced per insurer (e.g. `aia`), metadata-tagged by plan type (e.g. `education`, `life`, `health`). Do not create multiple indexes. |
| LLM | Google Gemini via **Vertex AI** (confirmed) — accessed using the owner's existing GCP service account JSON credentials, NOT a plain Google AI Studio API key. Auth uses OAuth2 access tokens generated from the service account (via `google-auth-library`), sent as Bearer tokens to the Vertex AI REST endpoint. Design all LLM calls behind a single wrapper function (`lib/gemini.ts`) so the pipeline logic never talks to the API directly. |
| PDF generation | Puppeteer or Playwright rendering HTML/CSS → PDF. **Must embed a proper Sinhala font (e.g. Noto Sans Sinhala)** — do not rely on system fonts, Sinhala script renders incorrectly otherwise |
| File storage | Supabase Storage (for generated PDFs) |

Phase 2 (later, not now): migrate only the pipeline/report-generation service to GCP Cloud Run if Vercel limits become a problem. Do not build for GCP yet.

---

## 3. Agent Pipeline (in order)

Each step should be a distinct, testable function — do not collapse them into one giant LLM call.

1. **Operator Input → Structured Profile**
   Takes raw form input, validates it, produces a JSON profile (income, dependents, child age, target education year, health flags, budget, desired cover).

2. **Risk & Profiling Agent**
   Computes a funding-gap projection: estimated future education cost vs. current savings trajectory. State all inflation/cost assumptions explicitly in the output — never present assumed numbers as guaranteed facts.

3. **Underwriting & Eligibility Agent — DETERMINISTIC, not LLM-driven**
   Hard rule checks against the actual policy terms (see Section 5). Output: pass/fail + reasons. If ambiguous or inconsistent data, flag for manual review — do not force a recommendation through.

4. **Recommendation & Explanation Agent**
   - First: deterministic filter to eligible plan configurations (hard rules only)
   - Then: LLM generates the explanation/pitch *using only the deterministic outputs as input* — the LLM must never invent numbers (premiums, charges, maturity values). Any number in the final report must trace back to the rules engine or the RAG-retrieved policy document, not to LLM generation.

5. **Sinhala Report Generation Agent**
   Templated document generator (HTML/CSS → PDF via Puppeteer). LLM fills in *narrative connective text only* inside a fixed template — it does not freely compose the whole report. See Section 6 for report structure.

Log every step's input/output to Supabase in a `recommendation_audit` table (profile → rule engine outputs → final recommendation), so any report can be reconstructed and explained later. This is a compliance requirement, not optional.

---

## 4. RAG / Pinecone Setup

- One Pinecone index for all insurers/plans.
- Namespace per insurer: `aia`, (future insurers added later).
- Metadata fields per chunk: `plan_type` (e.g. `education`, `life`, `health`), `source_doc`, `section`.
- Ingest policy PDFs by chunking + embedding (embedding model TBD — must support Sinhala reasonably if Sinhala-language source docs are ever added; for now source PDFs are in English).
- Retrieval must be scoped to the matched insurer + plan type via metadata filter, not a blind top-k across everything.

---

## 5. Reference Data — AIA EducationPlan (already extracted, use as-is for the rules engine)

```json
{
  "plan_name": "AIA EducationPlan",
  "entry_age_years": { "min": 19, "max": 61, "basis": "next birthday" },
  "max_maturity_age": 75,
  "policy_term_years": { "min": 10, "max": 56 },
  "min_life_cover_lkr": 300000,
  "premium_protection_benefit": "waives premiums on death or TPD; policy continues",
  "loyalty_reward": {
    "at_policy_anniversary": 10,
    "max_percent_of_annual_basic_premium": 400,
    "condition": "all premiums paid within 180 days of each due date",
    "note": "varies by payment mode (monthly/quarterly/half-yearly)"
  },
  "allocation_charge_basic_premium": { "year1": 0.80, "year2": 0.45, "year3_onward": 0.00 },
  "allocation_charge_topup_premium": 0.04,
  "surrender_penalty": { "year1": 1.00, "year2_3": "0.75 to 0 (reducing)", "year4_onward": 0.00 },
  "admin_charge_lkr": { "base_year_2017": 262.35, "annual_increase_percent": 15 },
  "fund_management_charge_percent_pa": 0.75,
  "mortality_charge": "based on Basic Sum Assured and cost-of-cover rate table (NOT disclosed in brochure — do not fabricate)",
  "modal_charge_monthly_mode_percent": 4,
  "grace_period_days": 30,
  "lapse_rule": "policy lapses if premium unpaid within grace period during first 3 policy years",
  "sample_illustration": {
    "age_at_entry": 30,
    "annual_basic_premium_lkr": 50000,
    "life_cover_multiple": 16,
    "annual_total_premium_lkr": 56509,
    "policy_term_years_illustrated": 15,
    "projected_maturity_lkr": { "4pct": 1074238, "8pct": 1433563, "10pct": 1661609 },
    "disclaimer": "dividend rates are assumed, not guaranteed"
  }
}
```

**IMPORTANT — do not extrapolate beyond this data.** There is no disclosed formula linking arbitrary age/premium/term/cover combinations to a maturity value (mortality charge table is not public). For any customer profile that doesn't closely match the sample illustration:
- Either show only the sample illustration clearly labeled "example only, not this customer's actual figures," or
- Show a proportional estimate with a prominent disclaimer that it is indicative only and final figures must come from AIA directly.
Never let the LLM compute or invent a maturity value. This is the single highest-risk area in the whole system — treat it as a hard constraint, not a suggestion.

---

## 6. Sinhala Report Structure (template sections)

1. **ඔබේ දරුවාගේ අධ්‍යාපන අවශ්‍යතාව** — the child's future education need, cost estimate with assumptions stated
2. **ඔබ නොමැති අවස්ථාවක ඇතිවිය හැකි අභියෝග** — funding gap / risk framed constructively, not fear-based
3. **නිර්දේශිත විසඳුම** — recommended plan + why, tied to the specific customer's numbers
4. **ප්‍රතිලාභ විස්තරය** — benefits in plain Sinhala
5. **වගකීම් හා කොන්දේසි** — commitments: grace period, lapse risk, surrender penalty, stated clearly
6. **Disclaimer** — computer-generated indicative report; final terms confirmed by a licensed AIA advisor

Get a fluent Sinhala speaker to review financial terminology before this goes live — mistranslated terms (e.g. "surrender penalty" sounding like a minor fee instead of a real capital loss) are a mis-selling risk.

---

## 7. Build Order (suggested)

1. Set up Next.js project on Vercel, connect Supabase (env vars, client setup)
2. Build the operator input form + Supabase schema for storing profiles
3. Set up Pinecone index, ingest the AIA EducationPlan PDF as the first test document
4. Build Step 1–3 of the pipeline (profile → risk/gap calc → deterministic eligibility) as plain functions first, testable without any LLM or Inngest involved
5. Wire in Inngest for the background job trigger once the pipeline functions work standalone
6. Add the LLM-driven explanation step (Step 4), constrained to only use rules-engine outputs
7. Build the Sinhala PDF template + Puppeteer rendering (test Sinhala font rendering early — this breaks often)
8. Wire the full pipeline end-to-end, add the `recommendation_audit` logging
9. Add a simple job-status polling UI so the operator knows when the PDF is ready

---

## 8. LLM Access — Vertex AI (Gemini) via GCP Service Account

The owner already has a GCP service account JSON key. This is the confirmed method for accessing Gemini (via Vertex AI), used from Phase 1 onward.

**Setup requirements:**
- Vertex AI API must be enabled on the GCP project.
- The service account needs the `Vertex AI User` (`roles/aiplatform.user`) IAM role at minimum — owner confirms this is already set.
- Auth flow: the service account JSON is used to generate short-lived OAuth2 access tokens (via the `google-auth-library` npm package), sent as a Bearer token on each Vertex AI REST call. This is different from a simple API key — do not treat it like one.

**Required files:**
- `lib/vertex-auth.ts` — reads the service account credentials from an env var, returns an access token
- `lib/gemini.ts` — wraps the actual Vertex AI `generateContent` REST call; this is the ONLY place in the codebase that should call the Gemini API directly. All pipeline agents call this wrapper, never the API directly.

```ts
// lib/vertex-auth.ts
import { GoogleAuth } from 'google-auth-library';

const auth = new GoogleAuth({
  credentials: JSON.parse(process.env.GCP_SERVICE_ACCOUNT_JSON!),
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
});

export async function getAccessToken() {
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return token.token;
}
```

```ts
// lib/gemini.ts
import { getAccessToken } from './vertex-auth';

const PROJECT_ID = process.env.GCP_PROJECT_ID;
const LOCATION = 'us-central1'; // confirm region with owner

export async function callGemini(prompt: string) {
  const token = await getAccessToken();
  const url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/gemini-1.5-pro:generateContent`;
  // NOTE: verify current Gemini model name in Vertex AI docs before use — model identifiers get updated

  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] }),
  });

  return res.json();
}
```

**Credential handling rules — non-negotiable:**
- **Never commit the JSON key file to git**, and never place the raw `.json` file inside the repo folder.
- **Never read the file's contents into context, logs, or a prompt.** Reference it only by env var name.
- The key's full contents go into a **Vercel environment variable** (`GCP_SERVICE_ACCOUNT_JSON`), pasted in via the Vercel dashboard by the owner directly — not written into any file in the repo.
- If a `.json` credentials file ever ends up in the project folder temporarily, add it to `.gitignore` immediately.
- Treat this credential like a password: a leaked service account key is a security and billing risk.
- **Claude Code should never ask the owner to paste the JSON contents into chat or into a file it creates.** The owner sets the env var directly in Vercel's dashboard.

---

## 9. Things to Explicitly Ask the Project Owner Before Deciding

- Which LLM provider to use (affects env vars / API wrapper)
- Whether Supabase Auth is needed yet (single operator = maybe not yet)
- Sinhala embedding model choice, if/when Sinhala-language source documents are added
- Confirm before touching git, deployment settings, or billing-related configuration

---

## 10. Reminder

**No git commits or pushes. No repo initialization changes. File edits only.** The owner reviews and commits everything manually.
