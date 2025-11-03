interface LogoWallProps {
  readonly logos: readonly string[];
}

/**
 * LogoWall provides social proof via a responsive grid of partner and client logos.
 */
export function LogoWall({ logos }: LogoWallProps) {
  return (
    <section className="bg-white py-14 dark:bg-slate-950">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 px-6 text-center lg:px-8">
        <p className="text-xs font-semibold tracking-[0.35em] text-slate-600 uppercase dark:text-slate-300">
          Trusted by teams redefining the future of work
        </p>
        <div className="grid w-full grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
          {logos.map((logo) => (
            <div
              key={logo}
              className="flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300"
            >
              {logo}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
