import { type Metadata } from "next";

import { MarketingHeader } from "./_components/marketing-header";

export const metadata: Metadata = {
  title: "Gigsy Marketing",
  description:
    "Discover how Gigsy unifies talent, learning, and delivery to accelerate enterprise momentum.",
};

interface MarketingLayoutProps {
  readonly children: React.ReactNode;
}

export default function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <MarketingHeader />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-slate-800/60 bg-slate-950/80 py-10 text-sm text-slate-300">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 lg:px-8">
          <p className="font-semibold text-slate-200">Gigsy</p>
          <p className="max-w-2xl text-slate-300">
            End-to-end orchestration for hybrid talent ecosystems. Built for
            enterprises that run on momentum, compliance, and measurable
            outcomes.
          </p>
          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-300">
            <span>
              © {new Date().getFullYear()} Gigsy. All rights reserved.
            </span>
            <a
              href="/legal/privacy"
              className="transition hover:text-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-200"
            >
              Privacy
            </a>
            <a
              href="/legal/terms"
              className="transition hover:text-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-200"
            >
              Terms
            </a>
            <a
              href="/contact"
              className="transition hover:text-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-200"
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
