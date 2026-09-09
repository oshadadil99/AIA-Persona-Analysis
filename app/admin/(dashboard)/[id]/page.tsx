import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/db/supabase";
import PricingTables from "@/app/child-report/PricingTables";
import DeleteButton from "../../DeleteButton";
import type { ChildFutureProjection } from "@/lib/pipeline/child-future-projection";
import { HIGHER_EDUCATION_PLANS, LOCAL_PRIVATE_DEGREE_FIELDS } from "@/types/child-profile";

export const dynamic = "force-dynamic";

export default async function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();
  const { data: row, error } = await supabase.from("child_profiles").select("*").eq("id", id).single();

  if (error || !row) {
    notFound();
  }

  const planLabel =
    HIGHER_EDUCATION_PLANS.find((p) => p.value === row.higher_education_plan)?.label ??
    row.higher_education_plan;
  const fieldLabel = row.local_private_degree_field
    ? LOCAL_PRIVATE_DEGREE_FIELDS.find((f) => f.value === row.local_private_degree_field)?.label
    : null;

  return (
    <div>
      <Link href="/admin" className="text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200">
        ← Back to all records
      </Link>

      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">
            {row.customer_name || "Unnamed customer"}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Submitted {new Date(row.created_at).toLocaleString("en-GB")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          {row.report_sinhala && (
            <a
              href={`/api/admin/generate-pdf/${row.id}`}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              Download PDF
            </a>
          )}
          <DeleteButton id={row.id} redirectTo="/admin" label="Delete record" />
        </div>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <InfoCard title="Customer / Policyholder">
          <InfoRow label="Name" value={row.customer_name} />
          <InfoRow label="Contact number" value={row.customer_contact_number} />
          <InfoRow label="Age" value={row.customer_age} />
          <InfoRow label="Dependents" value={row.dependents_count} />
          <InfoRow label="Desired life cover" value={row.desired_life_cover_lkr ? `LKR ${Number(row.desired_life_cover_lkr).toLocaleString()}` : null} />
          <InfoRow label="Monthly budget" value={row.monthly_budget_lkr ? `LKR ${Number(row.monthly_budget_lkr).toLocaleString()}` : null} />
          <InfoRow label="Health flags" value={(row.customer_health_flags ?? []).join(", ") || null} />
        </InfoCard>

        <InfoCard title="Child">
          <InfoRow label="Name" value={row.child_name} />
          <InfoRow label="Age" value={row.child_age} />
          <InfoRow label="Province" value={row.province} />
          <InfoRow label="Household monthly income" value={`LKR ${Number(row.household_monthly_income_lkr).toLocaleString()}`} />
          <InfoRow label="Higher education plan" value={`${planLabel}${fieldLabel ? ` — ${fieldLabel}` : ""}`} />
          <InfoRow label="Critical illnesses" value={(row.critical_illnesses ?? []).join(", ") || null} />
          <InfoRow
            label="Sports plan"
            value={row.sports_plan_description ? `${row.sports_plan_description} (LKR ${Number(row.sports_monthly_cost_lkr ?? 0).toLocaleString()}/month)` : null}
          />
          <InfoRow label="Notes" value={row.notes} />
        </InfoCard>
      </div>

      {row.projection_output && (
        <div className="mt-6">
          <h2 className="mb-3 text-xs font-semibold tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
            Pricing Summary
          </h2>
          <PricingTables projection={row.projection_output as ChildFutureProjection} />
        </div>
      )}

      {row.report_sinhala && (
        <div className="mt-6">
          <h2 className="mb-3 text-xs font-semibold tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
            Generated Report (Sinhala)
          </h2>
          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900">
            <p className="whitespace-pre-wrap text-base leading-relaxed">{row.report_sinhala}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-white/10 dark:bg-neutral-900">
      <h2 className="mb-3 text-sm font-semibold text-neutral-800 dark:text-neutral-100">{title}</h2>
      <dl className="space-y-2 text-sm">{children}</dl>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="text-right text-neutral-800 dark:text-neutral-200">{value ?? "—"}</dd>
    </div>
  );
}
