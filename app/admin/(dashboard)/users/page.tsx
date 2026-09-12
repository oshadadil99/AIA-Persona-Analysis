import { createServiceClient } from "@/lib/db/supabase";
import { requireAdmin } from "@/lib/auth/dal";
import UsersManager, { type AppUserRow } from "./UsersManager";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  // The layout gates this too, but this page needs the actor's id anyway to
  // mark "you" in the list and hide self-delete.
  const actor = await requireAdmin();

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("app_users")
    .select("id, username, role, created_at")
    .order("created_at", { ascending: true });

  const users = (data ?? []) as AppUserRow[];

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">User Accounts</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {users.length} account{users.length === 1 ? "" : "s"} with access to this tool
      </p>

      {error && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {error.message}
        </p>
      )}

      <UsersManager users={users} currentUserId={actor.id} />
    </div>
  );
}
