import { type SolutionShowcase } from "./content";

interface SolutionShowcaseSectionProps {
  readonly solutions: readonly SolutionShowcase[];
}

/**
 * SolutionShowcaseSection presents bundled solutions that connect Gigsy capabilities
 * to measurable business outcomes for enterprise buyers.
 */
export function SolutionShowcaseSection({
  solutions,
}: SolutionShowcaseSectionProps) {
  return (
    <section id="solutions" className="bg-white py-24 dark:bg-slate-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 lg:px-8">
        <header className="max-w-3xl space-y-4 text-slate-900 dark:text-white">
          <p className="text-sm font-semibold tracking-[0.3em] text-indigo-600 uppercase dark:text-indigo-300">
            Built For Scale
          </p>
          <h2 className="text-3xl font-semibold text-balance sm:text-4xl">
            Curated solution suites that launch fast and evolve with your
            operating model.
          </h2>
          <p className="text-lg text-slate-700 dark:text-slate-200">
            Each suite is powered by cross-functional workflows, automation, and
            analytics so your teams move together with clarity and confidence.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-3">
          {solutions.map((solution) => {
            const Icon = solution.icon;
            return (
              <article
                key={solution.title}
                className="relative flex h-full flex-col gap-6 rounded-3xl border border-slate-200 bg-slate-50/60 p-8 transition hover:-translate-y-1 hover:border-indigo-200 hover:bg-white hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-indigo-500/40"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-200">
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                    {solution.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                    {solution.subtitle}
                  </p>
                </div>
                <ul className="mt-auto space-y-3 text-sm text-slate-700 dark:text-slate-200">
                  {solution.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-3">
                      <span
                        className="mt-1 inline-flex h-2 w-2 rounded-full bg-indigo-400"
                        aria-hidden="true"
                      />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
