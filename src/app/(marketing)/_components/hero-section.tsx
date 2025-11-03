import Link from "next/link";
import { type HeroStat } from "./content";

interface HeroSectionProps {
  readonly stats: readonly HeroStat[];
}

/**
 * HeroSection renders the primary marketing narrative with key enterprise metrics
 * and action-oriented CTAs tailored for decision makers.
 */
export function HeroSection({ stats }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute top-0 right-10 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col gap-16 px-6 pt-24 pb-32 sm:pt-32 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-6 text-left">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium tracking-[0.4em] text-indigo-200 uppercase">
              Orchestrate Talent. Accelerate Outcomes.
            </p>
            <h1 className="text-4xl leading-tight font-semibold text-balance text-white sm:text-5xl lg:text-6xl">
              The operating system for high-performing hybrid teams.
            </h1>
            <p className="max-w-2xl text-lg text-slate-200 lg:text-xl">
              Gigsy unifies talent discovery, learning, delivery, and finance in
              one adaptive platform. Empower global teams to mobilize faster,
              elevate expertise, and measure impact in real time.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center rounded-full bg-indigo-400 px-7 py-3 text-sm font-semibold text-slate-950 transition hover:bg-indigo-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-200"
              >
                Start your transformation
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center rounded-full border border-white/20 px-7 py-3 text-sm font-semibold text-indigo-100 transition hover:border-white/40 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Explore the platform
              </Link>
            </div>
          </div>

          <div className="relative rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-indigo-500/10 backdrop-blur-sm">
            <div className="absolute -top-8 -right-8 hidden h-24 w-24 rounded-full border border-white/20 sm:block" />
            <div className="absolute bottom-6 -left-8 hidden h-32 w-32 rounded-full border border-white/10 sm:block" />
            <div className="space-y-6">
              <div>
                <p className="text-sm font-medium tracking-[0.3em] text-indigo-200 uppercase">
                  Platform Snapshot
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  Bring every stakeholder into a single confident rhythm.
                </p>
              </div>
              <ul className="grid gap-6 text-sm text-slate-200">
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  Talent graph with AI-fit scoring keeps engagements staffed
                  with verified experts.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-sky-400" />
                  Continuous academies and credential wallets grow capability
                  alongside demand.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-violet-400" />
                  Finance and delivery telemetry surface margin, utilization,
                  and risk instantly.
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white backdrop-blur">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {stats.map((stat) => (
              <dl key={stat.label} className="flex flex-col">
                <dt className="text-sm font-medium text-indigo-200">
                  {stat.label}
                </dt>
                <dd className="mt-2 text-3xl font-semibold sm:text-4xl">
                  {stat.value}
                </dd>
                <dd className="mt-2 text-sm text-indigo-200">
                  {stat.description}
                </dd>
              </dl>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
