import Link from "next/link";

/**
 * CallToActionSection closes the marketing flow with a decisive next step.
 */
export function CallToActionSection() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-[3rem] border border-indigo-200/60 bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 px-8 py-16 text-center text-white shadow-[0_40px_120px_-60px_rgba(79,70,229,0.7)]">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6">
          <p className="text-sm font-semibold tracking-[0.35em] text-indigo-200 uppercase">
            Ready For Lift Off
          </p>
          <h2 className="text-3xl font-semibold text-balance sm:text-4xl">
            Empower every leader with clarity—and every team with momentum.
          </h2>
          <p className="text-lg text-indigo-200">
            Spin up a pilot workspace in under a week with guided onboarding,
            data migration experts, and change acceleration assets tailored to
            your operating model.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Book a live strategy session
            </Link>
            <Link
              href="/playground"
              className="inline-flex items-center justify-center rounded-full border border-white/50 px-7 py-3 text-sm font-semibold text-white transition hover:border-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Explore interactive demo
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
