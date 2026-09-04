"use client";

import { useState } from "react";
import { submitProfile } from "./actions";
import { HEALTH_FLAGS, type HealthFlag, type CustomerProfileInput } from "@/types/profile";

const emptyForm: CustomerProfileInput = {
  customerName: "",
  age: 0,
  monthlyIncomeLkr: 0,
  dependentsCount: 0,
  childAge: null,
  childTargetEducationYear: null,
  desiredLifeCoverLkr: null,
  monthlyBudgetLkr: 0,
  healthFlags: [],
  notes: "",
};

function numberOrNull(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export default function IntakePage() {
  const [form, setForm] = useState<CustomerProfileInput>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  function toggleHealthFlag(flag: HealthFlag) {
    setForm((f) => ({
      ...f,
      healthFlags: f.healthFlags.includes(flag)
        ? f.healthFlags.filter((h) => h !== flag)
        : [...f.healthFlags, flag],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    const res = await submitProfile({
      ...form,
      customerName: form.customerName?.trim() || null,
      notes: form.notes?.trim() || null,
    });

    setSubmitting(false);

    if (res.ok) {
      setResult({ ok: true, message: `Saved. Profile ID: ${res.id}` });
      setForm(emptyForm);
    } else {
      setResult({ ok: false, message: res.error ?? "Something went wrong." });
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-semibold">New Customer Intake</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Operator use only. This saves a profile — it does not run the recommendation pipeline yet.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <Field label="Customer name (optional, for your reference)">
          <input
            type="text"
            value={form.customerName ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
            className="input"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Age" required>
            <input
              type="number"
              required
              min={0}
              value={form.age || ""}
              onChange={(e) => setForm((f) => ({ ...f, age: Number(e.target.value) }))}
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
          <Field label="Monthly income (LKR)" required>
            <input
              type="number"
              required
              min={0}
              value={form.monthlyIncomeLkr || ""}
              onChange={(e) => setForm((f) => ({ ...f, monthlyIncomeLkr: Number(e.target.value) }))}
              className="input"
            />
          </Field>

          <Field label="Monthly budget for premium (LKR)" required>
            <input
              type="number"
              required
              min={0}
              value={form.monthlyBudgetLkr || ""}
              onChange={(e) => setForm((f) => ({ ...f, monthlyBudgetLkr: Number(e.target.value) }))}
              className="input"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Child's current age (if applicable)">
            <input
              type="number"
              min={0}
              value={form.childAge ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, childAge: numberOrNull(e.target.value) }))}
              className="input"
            />
          </Field>

          <Field label="Target education year (if applicable)">
            <input
              type="number"
              value={form.childTargetEducationYear ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, childTargetEducationYear: numberOrNull(e.target.value) }))
              }
              className="input"
            />
          </Field>
        </div>

        <Field label="Desired life cover (LKR, optional)">
          <input
            type="number"
            min={0}
            value={form.desiredLifeCoverLkr ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, desiredLifeCoverLkr: numberOrNull(e.target.value) }))
            }
            className="input"
          />
        </Field>

        <Field label="Health flags">
          <div className="flex flex-wrap gap-3">
            {HEALTH_FLAGS.map(({ value, label }) => (
              <label key={value} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.healthFlags.includes(value)}
                  onChange={() => toggleHealthFlag(value)}
                />
                {label}
              </label>
            ))}
          </div>
        </Field>

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
          {submitting ? "Saving..." : "Save profile"}
        </button>

        {result && (
          <p className={result.ok ? "text-sm text-green-600" : "text-sm text-red-600"}>
            {result.message}
          </p>
        )}
      </form>
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
