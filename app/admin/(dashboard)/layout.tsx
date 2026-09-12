import Link from "next/link";
import { requireAdmin } from "@/lib/auth/dal";
import { logout } from "@/app/login/actions";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="border-b border-neutral-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-neutral-900 sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/admin" className="text-sm font-semibold text-neutral-900 dark:text-white">
            Customer Records
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/users"
              className="text-sm text-neutral-500 transition hover:text-neutral-900 dark:hover:text-white"
            >
              Users
            </Link>
            <Link
              href="/child-report"
              className="text-sm text-neutral-500 transition hover:text-neutral-900 dark:hover:text-white"
            >
              New report
            </Link>
            <span className="text-sm text-neutral-400">{user.username}</span>
            <form action={logout}>
              <button
                type="submit"
                className="text-sm text-neutral-500 transition hover:text-neutral-900 dark:hover:text-white"
              >
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8">{children}</div>
    </div>
  );
}
