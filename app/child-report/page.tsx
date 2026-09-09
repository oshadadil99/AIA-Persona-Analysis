"use client";

import { useState } from "react";
import { submitChildProfileAndGenerateReport } from "./actions";
import PricingTables from "./PricingTables";
import type { ChildFutureProjection } from "@/lib/pipeline/child-future-projection";
import {
  SRI_LANKA_PROVINCES,
  CRITICAL_ILLNESS_FLAGS,
  CUSTOMER_HEALTH_FLAGS,
  HIGHER_EDUCATION_PLANS,
  LOCAL_PRIVATE_DEGREE_FIELDS,
  type Province,
  type CriticalIllnessFlag,
  type CustomerHealthFlag,
  type HigherEducationPlan,
  type LocalPrivateDegreeField,
  type ChildProfileInput,
} from "@/types/child-profile";

const emptyForm: ChildProfileInput = {
  customerName: "",
  customerContactNumber: "",
  customerAge: null,
  dependentsCount: 0,
  desiredLifeCoverLkr: null,
  monthlyBudgetLkr: null,
  customerHealthFlags: [],
  childName: "",
  childAge: 0,
  province: "Western",
  householdMonthlyIncomeLkr: 0,
  criticalIllnesses: [],
  higherEducationPlan: "undecided",
  localPrivateDegreeField: null,
  sportsPlanDescription: "",
  sportsMonthlyCostLkr: null,
  notes: "",
};

export default function ChildReportPage() {
  const [form, setForm] = useState<ChildProfileInput>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<string | null>(null);
  const [projection, setProjection] = useState<ChildFutureProjection | null>(null);
  // Captured at submit time — the form resets after a successful submit, so
  // this is what the PDF download uses for its content and filename.
  const [submittedProfile, setSubmittedProfile] = useState<ChildProfileInput | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  function toggleIllness(flag: CriticalIllnessFlag) {
    setForm((f) => ({
      ...f,
      criticalIllnesses: f.criticalIllnesses.includes(flag)
        ? f.criticalIllnesses.filter((h) => h !== flag)
        : [...f.criticalIllnesses, flag],
    }));
  }

  function toggleCustomerHealthFlag(flag: CustomerHealthFlag) {
    setForm((f) => ({
      ...f,
      customerHealthFlags: f.customerHealthFlags.includes(flag)
        ? f.customerHealthFlags.filter((h) => h !== flag)
        : [...f.customerHealthFlags, flag],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setReport(null);
    setProjection(null);
    setPdfError(null);

    const submitted: ChildProfileInput = {
      ...form,
      customerName: form.customerName?.trim() || null,
      customerContactNumber: form.customerContactNumber?.trim() || null,
      childName: form.childName?.trim() || null,
      sportsPlanDescription: form.sportsPlanDescription?.trim() || null,
      notes: form.notes?.trim() || null,
    };

    const res = await submitChildProfileAndGenerateReport(submitted);

    setSubmitting(false);

    if (res.ok) {
      setReport(res.reportSinhala ?? null);
      setProjection(res.projection ?? null);
      setSubmittedProfile(submitted);
      setForm(emptyForm);
    } else {
      setError(res.error ?? "Something went wrong.");
    }
  }

  async function handleDownloadPdf() {
    if (!submittedProfile || !projection || !report) return;
    setDownloadingPdf(true);
    setPdfError(null);

    try {
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: submittedProfile, projection, reportSinhala: report }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `PDF generation failed (${res.status}).`);
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const filenameMatch = disposition.match(/filename="([^"]+)"/);
      const filename = filenameMatch?.[1] ?? "future-outlook-report.pdf";

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : "PDF download failed.");
    } finally {
      setDownloadingPdf(false);
    }
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: "url('/child-report-bg.jpg')" }}
    >
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-8">
        <div className="overflow-hidden rounded-2xl border border-white/40 bg-white/85 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-neutral-900/85">
          <div className="border-b border-neutral-200/70 bg-gradient-to-br from-emerald-50/80 to-white/40 px-6 py-6 dark:border-white/10 dark:from-emerald-900/20 dark:to-transparent sm:px-8">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">
              Future Outlook Intake
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 px-6 py-8 sm:px-8">
            <SectionHeading>Customer / Policyholder</SectionHeading>

            <Field label="Customer name (optional, for your reference)">
              <input
                type="text"
                value={form.customerName ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                className="input"
              />
            </Field>

            <Field label="Contact number">
              <input
                type="tel"
                value={form.customerContactNumber ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, customerContactNumber: e.target.value }))}
                className="input"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Customer age">
                <input
                  type="number"
                  min={0}
                  value={form.customerAge ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      customerAge: e.target.value.trim() === "" ? null : Number(e.target.value),
                    }))
                  }
                  className="input"
                />
              </Field>

              <Field label="Dependents">
                <input
                  type="number"
                  min={0}
                  value={form.dependentsCount}
                  onChange={(e) => setForm((f) => ({ ...f, dependentsCount: Number(e.target.value) }))}
                  className="input"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Desired life cover (LKR, optional)">
                <input
                  type="number"
                  min={0}
                  value={form.desiredLifeCoverLkr ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      desiredLifeCoverLkr: e.target.value.trim() === "" ? null : Number(e.target.value),
                    }))
                  }
                  className="input"
                />
              </Field>

              <Field label="Monthly budget for premium (LKR, optional)">
                <input
                  type="number"
                  min={0}
                  value={form.monthlyBudgetLkr ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      monthlyBudgetLkr: e.target.value.trim() === "" ? null : Number(e.target.value),
                    }))
                  }
                  className="input"
                />
              </Field>
            </div>

            <Field label="Customer health flags">
              <div className="flex flex-wrap gap-3">
                {CUSTOMER_HEALTH_FLAGS.map(({ value, label }) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-2 rounded-full border border-neutral-300/80
                      bg-white/60 px-3 py-1.5 text-sm transition has-checked:border-emerald-500
                      has-checked:bg-emerald-50 dark:border-neutral-700 dark:bg-neutral-800/50
                      dark:has-checked:border-emerald-500 dark:has-checked:bg-emerald-900/30"
                  >
                    <input
                      type="checkbox"
                      checked={form.customerHealthFlags.includes(value)}
                      onChange={() => toggleCustomerHealthFlag(value)}
                      className="accent-emerald-600"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </Field>

            <SectionHeading>Child</SectionHeading>

            <Field label="Child's name (optional, for your reference)">
              <input
                type="text"
                value={form.childName ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, childName: e.target.value }))}
                className="input"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Child's age" required>
                <input
                  type="number"
                  required
                  min={0}
                  value={form.childAge || ""}
                  onChange={(e) => setForm((f) => ({ ...f, childAge: Number(e.target.value) }))}
                  className="input"
                />
              </Field>

              <Field label="Province" required>
                <select
                  value={form.province}
                  onChange={(e) => setForm((f) => ({ ...f, province: e.target.value as Province }))}
                  className="input"
                >
                  {SRI_LANKA_PROVINCES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Household monthly income (LKR)" required>
              <input
                type="number"
                required
                min={0}
                value={form.householdMonthlyIncomeLkr || ""}
                onChange={(e) => setForm((f) => ({ ...f, householdMonthlyIncomeLkr: Number(e.target.value) }))}
                className="input"
              />
            </Field>

            <Field label="Higher education plan">
              <select
                value={form.higherEducationPlan}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    higherEducationPlan: e.target.value as HigherEducationPlan,
                    localPrivateDegreeField:
                      e.target.value === "local_private_degree" ? f.localPrivateDegreeField : null,
                  }))
                }
                className="input"
              >
                {HIGHER_EDUCATION_PLANS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>

            {form.higherEducationPlan === "local_private_degree" && (
              <Field label="Field of study" required>
                <select
                  required
                  value={form.localPrivateDegreeField ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      localPrivateDegreeField: (e.target.value || null) as LocalPrivateDegreeField | null,
                    }))
                  }
                  className="input"
                >
                  <option value="" disabled>
                    Select a field...
                  </option>
                  {LOCAL_PRIVATE_DEGREE_FIELDS.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            <Field label="Critical illnesses / health flags (child)">
              <div className="flex flex-wrap gap-3">
                {CRITICAL_ILLNESS_FLAGS.map(({ value, label }) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-2 rounded-full border border-neutral-300/80
                      bg-white/60 px-3 py-1.5 text-sm transition has-checked:border-emerald-500
                      has-checked:bg-emerald-50 dark:border-neutral-700 dark:bg-neutral-800/50
                      dark:has-checked:border-emerald-500 dark:has-checked:bg-emerald-900/30"
                  >
                    <input
                      type="checkbox"
                      checked={form.criticalIllnesses.includes(value)}
                      onChange={() => toggleIllness(value)}
                      className="accent-emerald-600"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Sports/extracurricular plan (optional)">
                <input
                  type="text"
                  placeholder="e.g. competitive swimming"
                  value={form.sportsPlanDescription ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, sportsPlanDescription: e.target.value }))}
                  className="input"
                />
              </Field>

              <Field label="Estimated monthly cost (LKR)">
                <input
                  type="number"
                  min={0}
                  value={form.sportsMonthlyCostLkr ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      sportsMonthlyCostLkr: e.target.value.trim() === "" ? null : Number(e.target.value),
                    }))
                  }
                  className="input"
                />
              </Field>
            </div>

            <Field label="Notes">
              <textarea
                value={form.notes ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={3}
                className="input"
              />
            </Field>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white
                shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50
                sm:w-auto"
            >
              {submitting ? "Generating report…" : "Save & generate report"}
            </button>

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </p>
            )}
          </form>

          {projection && (
            <div className="border-t border-neutral-200/70 px-6 py-8 dark:border-white/10 sm:px-8">
              <h2 className="mb-3 text-xs font-semibold tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
                Pricing Summary
              </h2>
              <PricingTables projection={projection} />
            </div>
          )}

          {report && (
            <div className="border-t border-neutral-200/70 px-6 py-8 dark:border-white/10 sm:px-8">
              <h2 className="mb-3 text-xs font-semibold tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
                Generated Report (Sinhala)
              </h2>
              <div className="rounded-xl border border-neutral-200 bg-white/70 p-5 shadow-sm dark:border-white/10 dark:bg-neutral-800/40">
                <p className="whitespace-pre-wrap text-base leading-relaxed">{report}</p>
              </div>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="mt-5 w-full rounded-lg bg-neutral-900 px-4 py-3 text-sm font-semibold text-white
                  shadow-sm transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50
                  dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 sm:w-auto"
              >
                {downloadingPdf ? "Generating PDF…" : "Download PDF"}
              </button>

              {pdfError && (
                <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                  {pdfError}
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-5 w-1 rounded-full bg-emerald-500" />
      <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-100">{children}</h2>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}
