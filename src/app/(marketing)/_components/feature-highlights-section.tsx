import { type FeatureHighlight } from "./content";

interface FeatureHighlightsSectionProps {
  readonly features: readonly FeatureHighlight[];
}

/**
 * FeatureHighlightsSection displays the core differentiators for the Gigsy platform
 * in a scalable grid layout suitable for responsive marketing experiences.
 */
export function FeatureHighlightsSection({
  features,
}: FeatureHighlightsSectionProps) {
  return (
    <section
      id="features"
      className="relative bg-slate-50 py-24 dark:bg-slate-950"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-200/60 to-transparent dark:via-indigo-500/40" />
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 lg:px-8">
        <header className="max-w-2xl space-y-4">
          <p className="text-sm font-semibold tracking-[0.3em] text-indigo-600 uppercase dark:text-indigo-300">
            Platform Highlights
          </p>
          <h2 className="text-3xl font-semibold text-balance text-slate-900 sm:text-4xl dark:text-white">
            Every workflow stays connected, compliant, and insight-rich.
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Modular capabilities let you launch quickly and extend
            confidently—from sourcing and onboarding to delivery, learning, and
            finance.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.id}
                className="group relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white p-8 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)] transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_45px_120px_-60px_rgba(59,130,246,0.55)] dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100">
                  <div className="absolute -top-24 right-0 h-48 w-48 rounded-full bg-indigo-300/20 blur-3xl" />
                </div>
                <div className="relative space-y-6">
                  <span className="inline-flex rounded-full border border-indigo-200/60 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200">
                    {feature.outcome}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-200">
                      <Icon className="h-6 w-6" aria-hidden />
                    </span>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {feature.description}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
