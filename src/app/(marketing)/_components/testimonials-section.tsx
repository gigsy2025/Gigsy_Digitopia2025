import { type Testimonial } from "./content";

interface TestimonialsSectionProps {
  readonly testimonials: readonly Testimonial[];
}

/**
 * TestimonialsSection showcases executive-level proof points supporting the platform.
 */
export function TestimonialsSection({
  testimonials,
}: TestimonialsSectionProps) {
  return (
    <section id="voices" className="bg-slate-50 py-24 dark:bg-slate-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 lg:px-8">
        <header className="max-w-2xl space-y-4">
          <p className="text-sm font-semibold tracking-[0.3em] text-indigo-600 uppercase dark:text-indigo-300">
            Voices From The Field
          </p>
          <h2 className="text-3xl font-semibold text-balance text-slate-900 sm:text-4xl dark:text-white">
            The platform trusted by transformation leaders worldwide.
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Whether you are scaling a global consultancy or orchestrating
            internal mobility, Gigsy delivers the clarity and speed your teams
            expect.
          </p>
        </header>

        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <figure
              key={testimonial.name}
              className="flex h-full flex-col gap-6 rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-[0_30px_90px_-60px_rgba(15,23,42,0.4)] transition hover:-translate-y-1 dark:border-slate-800 dark:bg-slate-900/80"
            >
              <blockquote className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                “{testimonial.quote}”
              </blockquote>
              <figcaption className="mt-auto space-y-1 text-sm">
                <p className="font-semibold text-slate-900 dark:text-white">
                  {testimonial.name}
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  {testimonial.role} · {testimonial.company}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
