import Link from "next/link";
import { SectionHeading, BenefitCard } from "../PlanBenefitUi";
import {
  HEALTH_PLAN_EYEBROW,
  HEALTH_PLAN_HEADING,
  HEALTH_PLAN_INTRO,
  HEALTH_CORE_BENEFITS,
  HEALTH_OPTIONAL_BENEFITS,
  HEALTH_KEY_FEATURE,
  HEALTH_PLAN_DISCLAIMER,
} from "@/lib/content/plan-benefits";

export default function HealthPlanBenefitsPage() {
  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: "url('/child-report-bg.jpg')" }}
    >
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-8">
        <div className="flex items-center justify-between">
          <Link
            href="/child-report"
            className="text-sm font-medium text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
          >
            ← ආපසු ලියාපදිංචි කිරීමට
          </Link>
          <Link
            href="/child-report/plan-benefits"
            className="text-sm font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
          >
            අධ්‍යාපන සැලැස්ම ප්‍රතිලාභ →
          </Link>
        </div>

        <div className="animate-fade-in-up mt-4 overflow-hidden rounded-2xl border border-white/40 bg-white/85 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-neutral-900/85">
          <div className="border-b border-neutral-200/70 bg-gradient-to-br from-emerald-50/80 to-white/40 px-6 py-8 dark:border-white/10 dark:from-emerald-900/20 dark:to-transparent sm:px-10">
            <p className="text-sm font-medium tracking-widest text-emerald-600 uppercase dark:text-emerald-400">
              {HEALTH_PLAN_EYEBROW}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white">
              {HEALTH_PLAN_HEADING}
            </h1>
            <p className="mt-3 max-w-2xl text-neutral-600 dark:text-neutral-400">{HEALTH_PLAN_INTRO}</p>
          </div>

          <div className="space-y-12 px-6 py-10 sm:px-10">
            <section>
              <SectionHeading eyebrow="ප්‍රධාන ජීවිත ප්‍රතිලාභය" title="මූලික ආවරණය" />
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {HEALTH_CORE_BENEFITS.map((b, i) => (
                  <BenefitCard key={b.title} index={i} title={b.title} body={b.body} />
                ))}
              </div>
            </section>

            <section>
              <SectionHeading eyebrow="විකල්ප ආරක්ෂණ හා ආදායම් ප්‍රතිලාභ" title="ඔබට එක් කළ හැකි අමතර ආවරණ" />
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {HEALTH_OPTIONAL_BENEFITS.map((r, i) => (
                  <BenefitCard key={r.title} index={i} title={r.title} body={r.body} />
                ))}
              </div>
            </section>

            <section>
              <SectionHeading eyebrow="ප්‍රධාන මූල්‍ය විශේෂාංගය" title="ඔබ දිගු කලක් ජීවත් වුවහොත්" />
              <div className="mt-6">
                <div className="animate-fade-in-up rounded-xl border border-emerald-300 bg-emerald-50/60 p-5 dark:border-emerald-700 dark:bg-emerald-900/20">
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                    {HEALTH_KEY_FEATURE.title}
                  </h3>
                  <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">{HEALTH_KEY_FEATURE.body}</p>
                </div>
              </div>
            </section>

            <p className="border-t border-neutral-200/70 pt-6 text-xs text-neutral-500 dark:border-white/10 dark:text-neutral-400">
              {HEALTH_PLAN_DISCLAIMER}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
