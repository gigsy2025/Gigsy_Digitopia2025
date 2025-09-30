import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { EmployerLayout } from "@/components/layouts/EmployerLayout";
import { Button } from "@/components/ui/button";
import { buildEmployerNavItems } from "@/app/app/employer/_utils/nav";
import {
  fetchConvexUserByClerkId,
  fetchEmployerGigDetail,
  fetchEmployerMetrics,
} from "@/utils/fetchers-server";
import { GigEditorForm } from "../../_components/GigEditorForm";
import { updateGigAction } from "./actions";
import type { Id } from "convex/_generated/dataModel";

const BASE_PATH = "/app/employer" as const;
const GIGS_PATH = `${BASE_PATH}/gigs` as const;

interface EmployerGigEditPageProps {
  params: Promise<{
    gigId: string;
  }>;
}

export const metadata = {
  title: "Edit gig",
};

export default async function EmployerGigEditPage({
  params,
}: EmployerGigEditPageProps) {
  const resolvedParams = await params;
  const clerkUser = await auth();

  if (!clerkUser.userId) {
    redirect(
      `/sign-in?returnTo=${encodeURIComponent(`${GIGS_PATH}/${resolvedParams.gigId}/edit`)}`,
    );
  }

  const [convexUser, metrics, gig] = await Promise.all([
    fetchConvexUserByClerkId(clerkUser.userId),
    fetchEmployerMetrics(),
    fetchEmployerGigDetail(resolvedParams.gigId as Id<"gigs">),
  ]);

  if (!gig) {
    notFound();
  }

  if (!convexUser || gig.employerId !== convexUser._id) {
    redirect(`${GIGS_PATH}/${resolvedParams.gigId}`);
  }

  const navItems = buildEmployerNavItems(
    `${GIGS_PATH}/${resolvedParams.gigId}/edit`,
    {
      activeGigs: metrics.activeGigs,
      totalApplicants: metrics.totalApplicants,
    },
  );

  return (
    <EmployerLayout
      title={`Edit: ${gig.title}`}
      description="Update gig details to keep candidates informed."
      actions={
        <Button variant="outline" asChild>
          <Link href={`${GIGS_PATH}/${resolvedParams.gigId}`}>Back to gig</Link>
        </Button>
      }
      navItems={navItems}
    >
      <GigEditorForm gig={gig} onSubmit={updateGigAction} />
    </EmployerLayout>
  );
}
