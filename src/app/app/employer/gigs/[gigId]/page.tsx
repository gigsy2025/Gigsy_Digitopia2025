import Link from "next/link";
import { notFound } from "next/navigation";

import { EmployerLayout } from "@/components/layouts/EmployerLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { GigListItem } from "@/types/gigs";
import {
  fetchEmployerGigDetail,
  fetchEmployerMetrics,
  fetchGigApplications,
} from "@/utils/fetchers-server";
import type { Id } from "convex/_generated/dataModel";
import { buildEmployerNavItems } from "../../_utils/nav";
import { GigApplicationsTable } from "../_components/GigApplicationsTable";

const BASE_PATH = "/app/employer" as const;
const GIGS_PATH = `${BASE_PATH}/gigs` as const;

interface EmployerGigDetailPageProps {
  params: {
    gigId: string;
  };
}

export const metadata = {
  title: "Gig detail",
};

export default async function EmployerGigDetailPage({
  params,
}: EmployerGigDetailPageProps) {
  const gigId = params.gigId as Id<"gigs">;

  const [metrics, gig, applications] = await Promise.all([
    fetchEmployerMetrics(),
    fetchEmployerGigDetail(gigId),
    fetchGigApplications({ gigId, limit: 10 }),
  ]);

  if (!gig) {
    notFound();
  }

  const navItems = buildEmployerNavItems(`${GIGS_PATH}/${params.gigId}`, {
    activeGigs: metrics.activeGigs,
    totalApplicants: metrics.totalApplicants,
  });

  return (
    <EmployerLayout
      title={gig.title}
      description={gig.description}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`${GIGS_PATH}`}>Back to gigs</Link>
          </Button>
          <Button asChild>
            <Link href={`${GIGS_PATH}/${params.gigId}/applications`}>
              View applications
            </Link>
          </Button>
        </div>
      }
      navItems={navItems}
    >
      <section className="grid gap-6 lg:grid-cols-3">
        <article className="border-border bg-card rounded-xl border p-6 shadow-sm lg:col-span-2">
          <header className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {gig.status.replaceAll("_", " ")}
            </Badge>
            <Badge variant="secondary">{gig.category}</Badge>
            <Badge variant="secondary">{gig.difficultyLevel}</Badge>
          </header>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <GigMetaItem label="Budget" value={formatBudget(gig)} />
            <GigMetaItem label="Experience" value={gig.experienceRequired} />
            <GigMetaItem
              label="Application deadline"
              value={
                gig.applicationDeadline
                  ? formatDate(gig.applicationDeadline)
                  : "—"
              }
            />
            <GigMetaItem
              label="Project deadline"
              value={gig.deadline ? formatDate(gig.deadline) : "—"}
            />
            <GigMetaItem label="Location" value={formatLocation(gig)} />
            <GigMetaItem
              label="Skills"
              value={
                gig.skills.length
                  ? gig.skills.join(", ")
                  : "No specific skills listed"
              }
            />
          </dl>
        </article>

        <article className="border-border bg-card rounded-xl border p-6 shadow-sm">
          <h2 className="text-muted-foreground text-sm font-semibold">
            Performance snapshot
          </h2>
          <ul className="mt-4 space-y-3 text-sm">
            <SnapshotItem
              label="Applicants"
              value={gig.metadata?.applicantCount ?? 0}
            />
            <SnapshotItem label="Views" value={gig.metadata?.views ?? 0} />
            <SnapshotItem label="Saved" value={gig.metadata?.savedCount ?? 0} />
            <SnapshotItem
              label="Urgent"
              value={gig.metadata?.isUrgent ? "Yes" : "No"}
            />
            <SnapshotItem
              label="Remote only"
              value={gig.metadata?.isRemoteOnly ? "Yes" : "No"}
            />
          </ul>
        </article>
      </section>

      <section className="space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Recent applications</h2>
            <p className="text-muted-foreground text-sm">
              Latest candidates who applied for this gig.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href={`${GIGS_PATH}/${params.gigId}/applications`}>
              Manage applications
            </Link>
          </Button>
        </header>

        <GigApplicationsTable applications={applications.items ?? []} />
      </section>
    </EmployerLayout>
  );
}

function GigMetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
        {label}
      </dt>
      <dd className="text-foreground mt-1 text-sm">{value}</dd>
    </div>
  );
}

function SnapshotItem({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-medium">{value}</span>
    </li>
  );
}

function formatBudget(gig: { budget: GigListItem["budget"] }): string {
  const { min, max, currency, type } = gig.budget;
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });

  const range = `${formatter.format(min)} - ${formatter.format(max)}`;
  return `${range} · ${type}`;
}

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(timestamp));
}

function formatLocation(gig: GigListItem): string {
  if (!gig.location) {
    return gig.metadata?.isRemoteOnly ? "Remote" : "Not specified";
  }

  const { type, city, country } = gig.location;
  const parts: string[] = [type];
  if (city) parts.push(city);
  if (country) parts.push(country);
  return parts.join(" · ");
}
