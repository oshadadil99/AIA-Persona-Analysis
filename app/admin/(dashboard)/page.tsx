import Link from "next/link";
import { createServiceClient } from "@/lib/db/supabase";
import DeleteButton from "../DeleteButton";

export const dynamic = "force-dynamic";

interface RowSummary {
  id: string;
  customer_name: string | null;
  customer_contact_number: string | null;
  child_name: string | null;
  created_at: string;
  report_sinhala: string | null;
}

export default async function AdminDashboardPage() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("child_profiles")
    .select("id, customer_name, customer_contact_number, child_name, created_at, report_sinhala")
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as RowSummary[];

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">Customer Records</h1>
      <p className="mt-1 text-sm text-neutral-500">{rows.length} record{rows.length === 1 ? "" : "s"}</p>

      {error && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {error.message}
        </p>
      )}

      <div className="mt-6 overflow-x-auto rounded-xl border border-neutral-200 bg-white dark:border-white/10 dark:bg-neutral-900">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-200 dark:border-white/10">
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

            {rows.length === 0 && !error && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-neutral-500">
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
