export function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-widest text-emerald-600 uppercase dark:text-emerald-400">
        {eyebrow}
      </p>
      <h2 className="mt-1 text-xl font-semibold text-neutral-900 dark:text-white">{title}</h2>
    </div>
  );
}

export function BenefitCard({ index, title, body }: { index: number; title: string; body: string }) {
  return (
    <div
      className="animate-fade-in-up rounded-xl border border-neutral-200 bg-white/70 p-4 shadow-sm transition
        hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-neutral-800/40"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
          ✓
        </span>
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">{title}</h3>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{body}</p>
        </div>
      </div>
    </div>
  );
}
