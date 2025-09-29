import Link from "next/link";

import { EmployerLayout } from "@/components/layouts/EmployerLayout";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/requireUser";
import { fetchEmployerMetrics } from "@/utils/fetchers-server";
import { buildEmployerNavItems } from "../../_utils/nav";
import { CreateGigForm } from "../_components/CreateGigForm";

export const metadata = {
  title: "Create gig",
};

const BASE_PATH = "/app/employer" as const;

export default async function EmployerCreateGigPage() {
  const userId = await requireUser({ returnTo: `${BASE_PATH}/gigs/create` });
  const metrics = await fetchEmployerMetrics();

  const navItems = buildEmployerNavItems(`${BASE_PATH}/gigs/create`, {
    activeGigs: metrics.activeGigs,
    totalApplicants: metrics.totalApplicants,
  });

  return (
    <EmployerLayout
      title="Create a new gig"
      description="Publish a detailed opportunity to attract qualified candidates."
      actions={
        <Button variant="outline" asChild>
          <Link href={`${BASE_PATH}/gigs`}>Back to gigs</Link>
        </Button>
      }
      navItems={navItems}
    >
      <CreateGigForm employerId={userId} returnPath={`${BASE_PATH}/gigs`} />
    </EmployerLayout>
  );
}
