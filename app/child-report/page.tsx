"use client";

import { useState } from "react";
import { submitChildProfileAndGenerateReport } from "./actions";
import {
  SRI_LANKA_PROVINCES,
  CRITICAL_ILLNESS_FLAGS,
  HIGHER_EDUCATION_PLANS,
  LOCAL_PRIVATE_DEGREE_FIELDS,
  type Province,
  type CriticalIllnessFlag,
  type HigherEducationPlan,
  type LocalPrivateDegreeField,
  type ChildProfileInput,
} from "@/types/child-profile";

const emptyForm: ChildProfileInput = {
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

  function toggleIllness(flag: CriticalIllnessFlag) {
    setForm((f) => ({
      ...f,
      criticalIllnesses: f.criticalIllnesses.includes(flag)
        ? f.criticalIllnesses.filter((h) => h !== flag)
        : [...f.criticalIllnesses, flag],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setReport(null);

    const res = await submitChildProfileAndGenerateReport({
      ...form,
      childName: form.childName?.trim() || null,
      sportsPlanDescription: form.sportsPlanDescription?.trim() || null,
      notes: form.notes?.trim() || null,
    });

    setSubmitting(false);

    if (res.ok) {
      setReport(res.reportSinhala ?? null);
      setForm(emptyForm);
    } else {
      setError(res.error ?? "Something went wrong.");
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-semibold">Child Future Outlook Report</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Operator use only. Generates an indicative Sinhala-language report projecting the child&apos;s
        future education funding needs, based on the assumptions in{" "}
        <code>lib/pipeline/assumptions.ts</code>.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
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
              <label key={value} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.criticalIllnesses.includes(value)}
                  onChange={() => toggleIllness(value)}
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
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
        >
          {submitting ? "Generating report..." : "Save & generate report"}
        </button>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      {report && (
        <div className="mt-10 rounded-md border border-neutral-300 p-4 dark:border-neutral-700">
          <h2 className="mb-2 text-sm font-semibold text-neutral-500">Generated Report (Sinhala)</h2>
          <p className="whitespace-pre-wrap text-base leading-relaxed">{report}</p>
        </div>
      )}
    </main>
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
