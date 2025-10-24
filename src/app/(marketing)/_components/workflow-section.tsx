import { type WorkflowStage } from "./content";

interface WorkflowSectionProps {
  readonly stages: readonly WorkflowStage[];
}

/**
 * WorkflowSection provides a narrative timeline illustrating how Gigsy powers
 * the full lifecycle of a high-value engagement.
 */
export function WorkflowSection({ stages }: WorkflowSectionProps) {
  return (
    <section
      id="workflow"
      className="relative overflow-hidden bg-slate-900 py-24 text-white"
    >
      <div className="absolute inset-0">
        <div className="absolute top-16 left-1/3 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute right-12 bottom-0 h-48 w-48 rounded-full bg-purple-500/10 blur-3xl" />
      </div>
      <div className="relative mx-auto flex max-w-6xl flex-col gap-12 px-6 lg:px-8">
        <header className="space-y-4">
          <p className="text-sm font-semibold tracking-[0.3em] text-indigo-200 uppercase">
            Orchestrated Momentum
          </p>
          <h2 className="text-3xl font-semibold text-balance sm:text-4xl">
            From strategy to measurable value in four deliberate movements.
          </h2>
          <p className="max-w-3xl text-lg text-indigo-200">
            Gigsy is built for cross-functional alignment. Each stage connects
            talent, delivery, learning, and finance with shared data and
            automation.
          </p>
        </header>

        <ol className="relative grid gap-10 sm:grid-cols-2">
          <div className="pointer-events-none absolute top-0 left-1/2 hidden h-full w-px -translate-x-1/2 bg-white/10 sm:block" />
          {stages.map((stage, index) => (
            <li
              key={stage.stage}
              className="relative space-y-4 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-slate-900/70 text-sm font-semibold text-indigo-200">
                {stage.stage}
              </span>
              <h3 className="text-xl font-semibold">{stage.headline}</h3>
              <p className="text-sm leading-relaxed text-indigo-200">
                {stage.copy}
              </p>
              {index < stages.length - 1 ? (
                <span className="absolute -bottom-5 left-1/2 hidden h-10 w-px -translate-x-1/2 bg-white/10 sm:block" />
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
