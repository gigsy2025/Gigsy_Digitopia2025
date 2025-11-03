import { type HeroStat, type NarrativeBlock } from "./content";

interface NarrativeGridProps {
  readonly narratives: readonly NarrativeBlock[];
  readonly supportingStats: readonly HeroStat[];
}

/**
 * NarrativeGrid combines regional expansion and time-to-value proof points to
 * reinforce enterprise readiness.
 */
export function NarrativeGrid({
  narratives,
  supportingStats,
}: NarrativeGridProps) {
  return (
    <section
      id="operations"
      className="relative bg-white py-24 dark:bg-slate-950"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-800" />
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            {narratives.map((narrative) => {
              const Icon = narrative.icon;
              return (
                <article
                  key={narrative.title}
                  className="rounded-3xl border border-slate-200 bg-slate-50/80 p-8 transition hover:-translate-y-1 hover:border-indigo-200 hover:bg-white hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-indigo-500/40"
                >
                  <div className="flex items-center gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-200">
                      <Icon className="h-6 w-6" aria-hidden />
                    </span>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                        {narrative.title}
                      </h3>
                      <p className="text-sm text-slate-700 dark:text-slate-200">
                        {narrative.subtitle}
                      </p>
                    </div>
                  </div>
                  <ul className="mt-6 space-y-3 text-sm text-slate-700 dark:text-slate-200">
                    {narrative.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-3">
                        <span
                          className="mt-1 inline-flex h-2 w-2 rounded-full bg-indigo-400"
                          aria-hidden="true"
                        />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>

          <aside className="flex h-full flex-col justify-between rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8 dark:border-indigo-500/30 dark:from-indigo-950 dark:via-slate-950 dark:to-purple-950/40">
            <div>
              <p className="text-sm font-semibold tracking-[0.3em] text-indigo-600 uppercase dark:text-indigo-200">
                Global Impact
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-balance text-slate-900 dark:text-white">
                Governance, insight, and talent intelligence built for
                everywhere you operate.
              </h3>
            </div>
            <div className="mt-10 space-y-6">
              {supportingStats.map((stat) => (
                <dl key={stat.label} className="space-y-2">
                  <dt className="text-sm font-medium text-indigo-600 dark:text-indigo-200">
                    {stat.label}
                  </dt>
                  <dd className="text-3xl font-semibold text-slate-900 dark:text-white">
                    {stat.value}
                  </dd>
                  <dd className="text-sm text-slate-700 dark:text-slate-200">
                    {stat.description}
                  </dd>
                </dl>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
