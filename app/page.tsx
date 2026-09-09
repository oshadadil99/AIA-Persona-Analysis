import Link from "next/link";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden bg-white dark:bg-neutral-950">
      {/* Decorative animated background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-float-slow absolute -top-32 -left-24 h-96 w-96 rounded-full bg-emerald-200/50 blur-3xl dark:bg-emerald-900/30" />
        <div className="animate-float-slow-reverse absolute top-1/3 -right-24 h-96 w-96 rounded-full bg-teal-200/40 blur-3xl dark:bg-teal-900/20" />
        <div className="animate-float-slow absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-emerald-100/60 blur-3xl dark:bg-emerald-950/30" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-2xl flex-col gap-6 px-8 py-16 text-center">
        <p
          className="animate-fade-in-up text-sm font-medium tracking-widest text-emerald-600 uppercase dark:text-emerald-400"
          style={{ animationDelay: "0ms" }}
        >
          Internal tool — operator use only
        </p>

        <h1
          className="animate-fade-in-up text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl dark:text-white"
          style={{ animationDelay: "80ms" }}
        >
          Insurance Advisory Platform
        </h1>

        <p
          className="animate-fade-in-up mx-auto max-w-lg text-base text-neutral-600 dark:text-neutral-400"
          style={{ animationDelay: "160ms" }}
        >
          A single intake form captures the customer/policyholder profile and the child&apos;s details, then
          generates a Sinhala-language future outlook report.
        </p>

        <div className="animate-fade-in-up mt-2 flex justify-center" style={{ animationDelay: "240ms" }}>
          <Link
            href="/child-report"
            className="group inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm
              font-semibold text-white shadow-lg shadow-emerald-600/20 transition
              hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-600/30
              active:translate-y-0"
          >
            New customer & child intake
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
