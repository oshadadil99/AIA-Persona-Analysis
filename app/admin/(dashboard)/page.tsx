import { createServiceClient } from "@/lib/db/supabase";
import AdminRecordsTable from "../AdminRecordsTable";

export const dynamic = "force-dynamic";

interface RowSummary {
  id: string;
  customer_name: string | null;
  customer_contact_number: string | null;
  child_name: string | null;
  created_at: string;
  report_sinhala: string | null;
  household_monthly_expense_lkr: number | null;
  household_monthly_savings_lkr: number | null;
}

export default async function AdminDashboardPage() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("child_profiles")
    .select(
      "id, customer_name, customer_contact_number, child_name, created_at, report_sinhala, household_monthly_expense_lkr, household_monthly_savings_lkr",
    )
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

      <div className="mt-6">
        <AdminRecordsTable rows={rows} />
      </div>
    </div>
  );
}
