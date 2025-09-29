import Link from "next/link";
import { notFound } from "next/navigation";

import { EmployerLayout } from "@/components/layouts/EmployerLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ApplicationStatus } from "@/types/applications";
import type { GigListItem } from "@/types/gigs";
import {
  fetchEmployerGigDetail,
  fetchEmployerMetrics,
  fetchGigApplications,
  type EmployerApplicationsResponse,
} from "@/utils/fetchers-server";
import type { Id } from "convex/_generated/dataModel";
import { buildEmployerNavItems } from "../../../_utils/nav";
import { ApplicationActions } from "../../_components/ApplicationActions";
import { GigApplicationsTable } from "../../_components/GigApplicationsTable";

const BASE_PATH = "/app/employer" as const;
const GIGS_PATH = `${BASE_PATH}/gigs` as const;

const APPLICATION_STATUS_FILTERS: ApplicationStatus[] = [
  "submitted",
  "in_review",
  "shortlisted",
  "rejected",
  "hired",
  "withdrawn",
];

interface EmployerGigApplicationsPageProps {
  params: {
    gigId: string;
  };
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const metadata = {
  title: "Gig applications",
};

function parseStatus(value?: string): ApplicationStatus | undefined {
  if (!value) return undefined;
  return APPLICATION_STATUS_FILTERS.includes(value as ApplicationStatus)
    ? (value as ApplicationStatus)
    : undefined;
}

function parseLimit(value?: string): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  if (Number.isInteger(parsed) && parsed > 0 && parsed <= 100) {
    return parsed;
  }
  return undefined;
}

function ensureSingle(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function EmployerGigApplicationsPage({
  params,
  searchParams,
}: EmployerGigApplicationsPageProps) {
  const gigId = params.gigId as Id<"gigs">;
  const resolvedSearchParams = await searchParams;

  const status = parseStatus(ensureSingle(resolvedSearchParams?.status));
  const cursor = ensureSingle(resolvedSearchParams?.cursor) ?? undefined;
  const limit = parseLimit(ensureSingle(resolvedSearchParams?.limit));

  const [metrics, gig, applications] = await Promise.all([
    fetchEmployerMetrics(),
    fetchEmployerGigDetail(gigId),
    fetchGigApplications({ gigId, status, cursor, limit }),
  ]);

  if (!gig) {
    notFound();
  }

  const navItems = buildEmployerNavItems(
    `${GIGS_PATH}/${params.gigId}/applications`,
    {
      activeGigs: metrics.activeGigs,
      totalApplicants: metrics.totalApplicants,
    },
  );

  const tableData = enrichApplicationsWithActions(applications);

  return (
    <EmployerLayout
      title={gig.title}
      description={`Manage applications for ${gig.title}.`}
      actions={
        <Button variant="outline" asChild>
          <Link href={`${GIGS_PATH}/${params.gigId}`}>View gig</Link>
        </Button>
      }
      navItems={navItems}
    >
      <section className="space-y-6">
        <FilterBar
          status={status}
          applications={applications}
          gig={gig}
          params={{ gigId: params.gigId, limit }}
        />

        <GigApplicationsTable
          applications={tableData}
          emptyMessage="No applications match the current filters."
          footer={
            <PaginationControls
              params={{ gigId: params.gigId, status, limit }}
              continueCursor={applications.continueCursor}
              hasAppliedFilters={Boolean(status ?? limit ?? cursor)}
            />
          }
        />
      </section>
    </EmployerLayout>
  );
}

function enrichApplicationsWithActions(
  applications: EmployerApplicationsResponse,
) {
  return applications.items.map((record) => ({
    ...record,
    actions: (
      <ApplicationActions
        applicationId={record.application._id}
        currentStatus={record.application.status}
      />
    ),
  }));
}

function FilterBar({
  status,
  applications,
  gig,
  params,
}: {
  status?: ApplicationStatus;
  applications: EmployerApplicationsResponse;
  gig: GigListItem;
  params: { gigId: string; limit?: number };
}) {
  const totalApplicants = gig.metadata?.applicantCount ?? 0;

  return (
    <header className="border-border bg-card space-y-4 rounded-2xl border p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Applications</h2>
          <p className="text-muted-foreground text-sm">
            Track candidate pipeline, update statuses, and follow up.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary">{totalApplicants} total</Badge>
          <Badge variant="secondary">{applications.items.length} shown</Badge>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={status ? "outline" : "default"}>All</Badge>
        {APPLICATION_STATUS_FILTERS.map((filter) => {
          const filterActive = filter === status;
          const href = buildApplicationsHref({
            gigId: params.gigId,
            status: filterActive ? undefined : filter,
            limit: params.limit,
          });

          return (
            <Link key={filter} href={href} prefetch={false}>
              <Badge variant={filterActive ? "default" : "outline"}>
                {filter.replaceAll("_", " ")}
              </Badge>
            </Link>
          );
        })}
      </div>
    </header>
  );
}

function PaginationControls({
  params,
  continueCursor,
  hasAppliedFilters,
}: {
  params: { gigId: string; status?: ApplicationStatus; limit?: number };
  continueCursor: string | null;
  hasAppliedFilters: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <Button variant="ghost" asChild disabled={!hasAppliedFilters}>
        <Link
          href={buildApplicationsHref({ gigId: params.gigId })}
          prefetch={false}
        >
          Reset
        </Link>
      </Button>
      {continueCursor ? (
        <Button asChild variant="outline">
          <Link
            href={buildApplicationsHref({
              gigId: params.gigId,
              status: params.status,
              limit: params.limit,
              cursor: continueCursor,
            })}
            prefetch={false}
          >
            Next
          </Link>
        </Button>
      ) : (
        <span className="text-muted-foreground text-sm">End of results</span>
      )}
    </div>
  );
}

function buildApplicationsHref(args: {
  gigId: string;
  status?: ApplicationStatus;
  limit?: number;
  cursor?: string;
}) {
  const searchParams = new URLSearchParams();

  if (args.status) {
    searchParams.set("status", args.status);
  }

  if (args.limit) {
    searchParams.set("limit", String(args.limit));
  }

  if (args.cursor) {
    searchParams.set("cursor", args.cursor);
  }

  const query = searchParams.toString();
  return query
    ? `${GIGS_PATH}/${args.gigId}/applications?${query}`
    : `${GIGS_PATH}/${args.gigId}/applications`;
}
