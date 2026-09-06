import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col justify-center gap-6 p-8">
      <div>
        <p className="text-sm uppercase tracking-widest text-neutral-500">
          Internal tool — operator use only
        </p>
        <h1 className="mt-2 text-3xl font-semibold">AI Insurance Advisory Platform</h1>
      </div>

      <p className="text-neutral-600 dark:text-neutral-400">
        Operator profile intake is live. Rules engine, pipeline, and Sinhala
        report generation come next.
      </p>

      <div className="flex gap-3">
        <Link
          href="/intake"
          className="inline-block w-fit rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
        >
          New customer intake →
        </Link>
        <Link
          href="/child-report"
          className="inline-block w-fit rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium dark:border-neutral-700"
        >
          Child future outlook report →
        </Link>
      </div>

      <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
        <li>Next.js App Router + TypeScript + Tailwind + Supabase</li>
        <li>Pinecone, Inngest, Vertex AI pipeline — set up, not yet wired end-to-end</li>
      </ul>
    </main>
  );
}
