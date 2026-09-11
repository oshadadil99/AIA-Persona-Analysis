"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteChildProfiles } from "./actions";
import DeleteButton from "./DeleteButton";

interface RowSummary {
  id: string;
  customer_name: string | null;
  customer_contact_number: string | null;
  child_name: string | null;
  created_at: string;
  report_sinhala: string | null;
}

export default function AdminRecordsTable({ rows }: { rows: RowSummary[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const allSelected = rows.length > 0 && selected.size === rows.length;
  const someSelected = selected.size > 0 && !allSelected;

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)));
  }

  function handleBulkDelete() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    if (!window.confirm(`Delete ${ids.length} customer record${ids.length === 1 ? "" : "s"} permanently? This cannot be undone.`)) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await deleteChildProfiles(ids);
      if (!res.ok) {
        setError(res.error ?? "Delete failed.");
        return;
      }
      setSelected(new Set());
      router.refresh();
    });
  }

  const selectAllRef = useMemo(
    () => (el: HTMLInputElement | null) => {
      if (el) el.indeterminate = someSelected;
    },
    [someSelected],
  );

  return (
    <div>
      {selected.size > 0 && (
        <div className="mb-3 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 dark:border-red-900/50 dark:bg-red-950/40">
          <span className="text-sm font-medium text-red-800 dark:text-red-300">
            {selected.size} record{selected.size === 1 ? "" : "s"} selected
          </span>
          <div className="flex items-center gap-3">
            {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={pending}
              className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white transition
                hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? "Deleting…" : "Delete selected"}
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white dark:border-white/10 dark:bg-neutral-900">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-200 dark:border-white/10">
              <th className="w-10 px-4 py-3">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Select all records"
                  className="h-4 w-4 rounded border-neutral-300 dark:border-neutral-600"
                />
              </th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">Name</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">
                Contact Number
              </th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">
                Child&apos;s Name
              </th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">Date</th>
              <th className="px-4 py-3 text-right font-medium text-neutral-600 dark:text-neutral-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-neutral-100 last:border-0 dark:border-white/5">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(row.id)}
                    onChange={() => toggleRow(row.id)}
                    aria-label={`Select ${row.customer_name || row.child_name || "record"}`}
                    className="h-4 w-4 rounded border-neutral-300 dark:border-neutral-600"
                  />
                </td>
                <td className="px-4 py-3 text-neutral-800 dark:text-neutral-200">{row.customer_name || "—"}</td>
                <td className="px-4 py-3 text-neutral-800 dark:text-neutral-200">
                  {row.customer_contact_number || "—"}
                </td>
                <td className="px-4 py-3 text-neutral-800 dark:text-neutral-200">{row.child_name || "—"}</td>
                <td className="px-4 py-3 text-neutral-500">
                  {new Date(row.created_at).toLocaleDateString("en-GB", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-4">
                    {row.report_sinhala ? (
                      <a
                        href={`/api/admin/generate-pdf/${row.id}`}
                        className="text-sm font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
                      >
                        Download PDF
                      </a>
                    ) : (
                      <span className="text-sm text-neutral-400">No report</span>
                    )}
                    <Link
                      href={`/admin/${row.id}`}
                      className="text-sm font-medium text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
                    >
                      View more
                    </Link>
                    <DeleteButton id={row.id} />
                  </div>
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-neutral-500">
                  No customer records yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
