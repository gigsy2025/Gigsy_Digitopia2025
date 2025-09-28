import type { Metadata } from "next";
import Link from "next/link";

import { CandidateLayout } from "@/components/layouts/CandidateLayout";
import { GigListContainer } from "@/components/gigs/list/GigListContainer";
import { Button } from "@/components/ui/button";
import { getGigList } from "@/lib/server/gigs";

export const metadata: Metadata = {
  title: "Browse gigs | Gigsy",
  description:
    "Discover curated opportunities across design, development, marketing, and more on Gigsy.",
};

const candidateNavItems = [
  { href: "/app/gigs", label: "Browse gigs", active: true },
  // http://localhost:3000/app/profile/applications
  { href: "/app/profile/applications", label: "My applications" },
  { href: "/app/profile/saved", label: "Saved gigs" },
];

export const revalidate = 120;

export default async function GigsPage() {
  const initialGigs = await getGigList();

  return (
    <CandidateLayout
      title="Find your next opportunity"
      description="Browse curated gigs tailored for independent talent. Use filters to zero in on the projects that fit your skills and interests."
      actions={
        <Button asChild variant="outline" size="sm">
          <Link href="/profile/applications">View applications</Link>
        </Button>
      }
      navItems={candidateNavItems}
      contentClassName="space-y-8"
    >
      <section className="space-y-4">
        <header className="border-border bg-muted/30 text-muted-foreground rounded-2xl border border-dashed p-4 text-sm">
          <p>
            Use the filters on the left to refine by category, experience level,
            or budget. Save gigs that catch your eye and apply when you&apos;re
            ready.
          </p>
        </header>
        <GigListContainer initialGigs={initialGigs} />
      </section>
    </CandidateLayout>
  );
}
