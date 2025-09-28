import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CandidateLayout } from "@/components/layouts/CandidateLayout";
import { GigApplyForm } from "@/components/gigs/apply/GigApplyForm";
import { GigApplyHeader } from "@/components/gigs/apply/GigApplyHeader";
import { InlineError } from "@/components/feedback/InlineError";
import { getGigDetail } from "@/lib/server/gigs";
import { requireUser } from "@/lib/auth/requireUser";

interface GigApplyPageProps {
  params: Promise<{
    gigId: string;
  }>;
}

export async function generateMetadata({ params }: GigApplyPageProps): Promise<Metadata> {
  const { gigId } = await params;
  const gig = await getGigDetail(gigId);

  if (!gig) {
    return {
      title: "Gig not found | Gigsy",
      description: "This opportunity is no longer available.",
    } satisfies Metadata;
  }

  return {
    title: `Apply to ${gig.title} | Gigsy`,
    description: gig.description,
  } satisfies Metadata;
}

export const revalidate = 0;

export default async function GigApplyPage({ params }: GigApplyPageProps) {
  const { gigId } = await params;

  await requireUser({ returnTo: `/gigs/${gigId}/apply` });

  const gig = await getGigDetail(gigId);

  if (!gig) {
    notFound();
  }

  // TODO: Replace with actual status checks once backend integration is ready.
  const gigIsOpen = gig.status === "open";
  const alreadyApplied = false;

  const navItems = [
    { href: "/gigs", label: "Browse gigs" },
    { href: "/profile/applications", label: "My applications" },
    { href: "/profile/saved", label: "Saved gigs" },
  ];

  return (
    <CandidateLayout
      title="Submit your application"
      description="Share a concise, outcome-focused pitch. Hiring teams love clarity and confidence."
      navItems={navItems}
      contentClassName="mx-auto w-full max-w-3xl space-y-8 pb-24"
    >
      <GigApplyHeader gig={gig} />

      {!gigIsOpen ? (
        <InlineError
          title="This gig is no longer accepting applications"
          description="If you believe this is a mistake, reach out to the employer or our support team for clarity."
        />
      ) : alreadyApplied ? (
        <InlineError
          title="Looks like you already applied"
          description="We're finalizing the application summary view. Until then, keep an eye on your inbox for updates."
        />
      ) : (
        <GigApplyForm gig={gig} />
      )}
    </CandidateLayout>
  );
}
