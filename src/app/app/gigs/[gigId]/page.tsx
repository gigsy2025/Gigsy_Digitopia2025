import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { GigDetailPageContent } from "@/components/gigs/detail/GigDetailPageContent";
import { getGigDetail, getGigDetailWithRelated } from "@/lib/server/gigs";

interface GigDetailPageProps {
  params: Promise<{
    gigId: string;
  }>;
}

export async function generateMetadata({
  params,
}: GigDetailPageProps): Promise<Metadata> {
  const { gigId } = await params;
  const gig = await getGigDetail(gigId);

  if (!gig) {
    return {
      title: "Gig not found | Gigsy",
      description: "Browse our curated marketplace of opportunities on Gigsy.",
    };
  }

  return {
    title: `${gig.title} | Gigsy`,
    description: gig.description,
    openGraph: {
      title: gig.title,
      description: gig.description,
    },
    twitter: {
      title: gig.title,
      description: gig.description,
    },
  } satisfies Metadata;
}

export const revalidate = 0;

export default async function GigDetailPage({ params }: GigDetailPageProps) {
  const { gigId } = await params;
  const { gig, relatedGigs } = await getGigDetailWithRelated(gigId, 3);

  if (!gig) {
    notFound();
  }

  return <GigDetailPageContent gig={gig} relatedGigs={relatedGigs} />;
}
