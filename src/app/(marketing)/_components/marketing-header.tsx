import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

const NAV_ITEMS: ReadonlyArray<{
  readonly label: string;
  readonly href: string;
}> = [
  { label: "Platform", href: "#features" },
  { label: "Solutions", href: "#solutions" },
  { label: "Workflow", href: "#workflow" },
  { label: "Voices", href: "#voices" },
  { label: "Operations", href: "#operations" },
];

/**
 * MarketingHeader renders a sticky navigation bar tailored for the marketing
 * experience. It uses server-side auth context to switch between acquisition
 * and return-user CTAs without shipping Clerk's browser bundle to the page.
 */
export async function MarketingHeader() {
  const { userId } = await auth();
  const isSignedIn = Boolean(userId);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 text-white lg:px-8">
        <div className="flex items-center gap-3 text-left">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-semibold"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500 text-base font-bold text-white">
              G
            </span>
            <span className="hidden sm:inline-flex">Gigsy</span>
          </Link>
          <span className="hidden text-xs font-medium tracking-[0.3em] text-indigo-300 uppercase sm:inline-flex">
            Talent Operating System
          </span>
        </div>

        <nav className="hidden items-center gap-6 text-sm font-medium text-indigo-100/90 lg:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {isSignedIn ? (
            <Link
              href="/app"
              className="inline-flex items-center justify-center rounded-full bg-indigo-400 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-indigo-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-200"
            >
              Open workspace
            </Link>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="hidden rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-indigo-100 transition hover:border-white/40 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white lg:inline-flex"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center rounded-full bg-indigo-400 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-indigo-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-200"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
