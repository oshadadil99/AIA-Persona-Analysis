import Link from "next/link";
import { requireUser } from "@/lib/auth/dal";
import { logout } from "@/app/login/actions";

// Route segment config only — page.tsx here is a client component, so
// maxDuration can't be exported from it directly. The submit action's Gemini
// call alone has taken ~17s locally, well past Vercel's default serverless
// function duration, so this must be raised explicitly.
export const maxDuration = 60;

export default async function ChildReportLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <>
      <header className="border-b border-neutral-200/70 bg-white/80 px-4 py-2.5 backdrop-blur dark:border-white/10 dark:bg-neutral-900/80 sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-end gap-4">
          {user.role === "admin" && (
            <Link
              href="/admin"
              className="text-sm text-neutral-500 transition hover:text-neutral-900 dark:hover:text-white"
            >
              Customer records
            </Link>
          )}
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
      </header>
      {children}
    </>
  );
}
