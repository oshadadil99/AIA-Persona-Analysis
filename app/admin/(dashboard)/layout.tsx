import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";
import { logoutOperator } from "../login/actions";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!verifySessionToken(token)) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="border-b border-neutral-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-neutral-900 sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/admin" className="text-sm font-semibold text-neutral-900 dark:text-white">
            Customer Records
          </Link>
          <form action={logoutOperator}>
            <button
              type="submit"
              className="text-sm text-neutral-500 transition hover:text-neutral-900 dark:hover:text-white"
            >
              Log out
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8">{children}</div>
    </div>
  );
}
