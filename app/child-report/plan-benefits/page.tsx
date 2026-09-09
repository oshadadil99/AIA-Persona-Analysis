import Link from "next/link";
import { SectionHeading, BenefitCard } from "../PlanBenefitUi";
import {
  EDUCATION_PLAN_EYEBROW,
  EDUCATION_PLAN_HEADING,
  EDUCATION_PLAN_INTRO,
  EDUCATION_CORE_BENEFITS,
  EDUCATION_OPTIONAL_BENEFITS,
  EDUCATION_FD_COMPARISON,
  EDUCATION_PLAN_DISCLAIMER,
} from "@/lib/content/plan-benefits";

export default function PlanBenefitsPage() {
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
            href="/child-report/health-plan-benefits"
            className="text-sm font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
          >
            සෞඛ්‍ය සැලැස්ම ප්‍රතිලාභ →
          </Link>
        </div>

        <div className="animate-fade-in-up mt-4 overflow-hidden rounded-2xl border border-white/40 bg-white/85 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-neutral-900/85">
          <div className="border-b border-neutral-200/70 bg-gradient-to-br from-emerald-50/80 to-white/40 px-6 py-8 dark:border-white/10 dark:from-emerald-900/20 dark:to-transparent sm:px-10">
            <p className="text-sm font-medium tracking-widest text-emerald-600 uppercase dark:text-emerald-400">
              {EDUCATION_PLAN_EYEBROW}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white">
              {EDUCATION_PLAN_HEADING}
            </h1>
            <p className="mt-3 max-w-2xl text-neutral-600 dark:text-neutral-400">{EDUCATION_PLAN_INTRO}</p>
          </div>

          <div className="space-y-12 px-6 py-10 sm:px-10">
            <section>
              <SectionHeading eyebrow="ප්‍රධාන ප්‍රතිපත්ති ප්‍රතිලාභ" title="මෙම සැලැස්ම ඔබට සහතික කරන දේ" />
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {EDUCATION_CORE_BENEFITS.map((b, i) => (
                  <BenefitCard key={b.title} index={i} title={b.title} body={b.body} />
                ))}
              </div>
            </section>

            <section>
              <SectionHeading eyebrow="විකල්ප ආරක්ෂණ ප්‍රතිලාභ" title="ඔබට එක් කළ හැකි අමතර ආවරණ" />
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {EDUCATION_OPTIONAL_BENEFITS.map((r, i) => (
                  <BenefitCard key={r.title} index={i} title={r.title} body={r.body} />
                ))}
              </div>
            </section>

            <section>
              <SectionHeading eyebrow="සැබෑ සංසන්දනයක්" title="ස්ථාවර තැන්පතුවක් පමණක් භාවිත නොකළ යුත්තේ ඇයි?" />
              <div className="mt-6 space-y-3">
                {EDUCATION_FD_COMPARISON.map((c) => (
                  <div
                    key={c.title}
                    className="overflow-hidden rounded-xl border border-neutral-200 bg-white/70 dark:border-white/10 dark:bg-neutral-800/40"
                  >
                    <div className="border-b border-neutral-200/70 px-5 py-3 dark:border-white/10">
                      <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">{c.title}</h3>
                    </div>
                    <div className="grid divide-y divide-neutral-200/70 sm:grid-cols-2 sm:divide-x sm:divide-y-0 dark:divide-white/10">
                      <div className="px-5 py-4">
                        <p className="mb-1 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                          ස්ථාවර තැන්පතුව
                        </p>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">{c.fd}</p>
                      </div>
                      <div className="bg-emerald-50/50 px-5 py-4 dark:bg-emerald-900/10">
                        <p className="mb-1 text-xs font-semibold tracking-wide text-emerald-600 uppercase dark:text-emerald-400">
                          AIA අධ්‍යාපන සැලැස්ම
                        </p>
                        <p className="text-sm text-neutral-700 dark:text-neutral-300">{c.plan}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <p className="border-t border-neutral-200/70 pt-6 text-xs text-neutral-500 dark:border-white/10 dark:text-neutral-400">
              {EDUCATION_PLAN_DISCLAIMER}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
