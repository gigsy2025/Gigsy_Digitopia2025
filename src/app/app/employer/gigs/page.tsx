import Link from "next/link";
import { notFound } from "next/navigation";

import { EmployerLayout } from "@/components/layouts/EmployerLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { GigListItem, GigStatus } from "@/types/gigs";
import {
  fetchEmployerGigs,
  fetchEmployerMetrics,
} from "@/utils/fetchers-server";
import { buildEmployerNavItems } from "../_utils/nav";

const BASE_PATH = "/app/employer" as const;
const GIGS_PATH = `${BASE_PATH}/gigs` as const;

interface EmployerGigsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const GIG_STATUS_FILTERS: GigStatus[] = [
  "open",
  "in_progress",
  "in_review",
  "completed",
  "paused",
  "draft",
];

function parseStatus(value?: string): GigStatus | undefined {
  if (!value) return undefined;
  return GIG_STATUS_FILTERS.includes(value as GigStatus)
    ? (value as GigStatus)
    : undefined;
}

function parseLimit(value?: string): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  if (Number.isInteger(parsed) && parsed > 0 && parsed <= 50) {
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

export default async function EmployerGigsPage({
  searchParams,
}: EmployerGigsPageProps) {
  const params = await searchParams;
  const status = parseStatus(ensureSingle(params?.status));
  const cursor = ensureSingle(params?.cursor) ?? undefined;
  const limit = parseLimit(ensureSingle(params?.limit));

  const [metrics, gigs] = await Promise.all([
    fetchEmployerMetrics(),
    fetchEmployerGigs({ status, cursor, limit }),
  ]);

  if (!gigs) {
    notFound();
  }

  const navItems = buildEmployerNavItems(GIGS_PATH, {
    activeGigs: metrics.activeGigs,
    totalApplicants: metrics.totalApplicants,
  });

  return (
    <EmployerLayout
      title="Gigs"
      description="Manage active and historical gigs."
      actions={
        <Button asChild>
          <Link href={`${BASE_PATH}/gigs/create`}>Post a gig</Link>
        </Button>
      }
      navItems={navItems}
    >
      <section className="space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={status ? "outline" : "default"}>All</Badge>
            {GIG_STATUS_FILTERS.map((filter) => {
              const filterActive = filter === status;
              const href = filterActive
                ? GIGS_PATH
                : `${GIGS_PATH}?status=${filter}`;

              return (
                <Link key={filter} href={href} prefetch={false}>
                  <Badge variant={filterActive ? "default" : "outline"}>
                    {filter.replaceAll("_", " ")}
                  </Badge>
                </Link>
              );
            })}
          </div>
          <p className="text-muted-foreground text-sm">
            Showing {gigs.items.length} gig{gigs.items.length === 1 ? "" : "s"}
            {status ? ` with status ${status.replaceAll("_", " ")}` : ""}
          </p>
        </header>

        <div className="border-border bg-card overflow-hidden rounded-xl border">
          <div className="text-muted-foreground grid grid-cols-12 gap-2 px-6 py-3 text-sm font-medium">
            <span className="col-span-4">Gig</span>
            <span className="col-span-2">Status</span>
            <span className="col-span-2">Budget</span>
            <span className="col-span-2">Deadline</span>
            <span className="col-span-2 text-right">Applicants</span>
          </div>
          <ul className="divide-y">
            {gigs.items.length === 0 ? (
              <li className="text-muted-foreground px-6 py-5 text-sm">
                No gigs found. Try posting a new gig.
              </li>
            ) : (
              gigs.items.map((gig) => <GigRow key={gig._id} gig={gig} />)
            )}
          </ul>
        </div>

        <footer className="flex items-center justify-between">
          <Button
            variant="ghost"
            asChild
            disabled={!status && !limit && !cursor}
          >
            <Link href={buildPaginationHref({})} prefetch={false}>
              Reset
            </Link>
          </Button>
          {gigs.continueCursor ? (
            <Button asChild variant="outline">
              <Link
                href={buildPaginationHref({
                  status,
                  limit,
                  cursor: gigs.continueCursor,
                })}
                prefetch={false}
              >
                Next
              </Link>
            </Button>
          ) : (
            <span className="text-muted-foreground text-sm">
              End of results
            </span>
          )}
        </footer>
      </section>
    </EmployerLayout>
  );
}

function GigRow({ gig }: { gig: GigListItem }) {
  return (
    <li className="grid grid-cols-12 gap-2 px-6 py-5">
      <div className="col-span-4 space-y-1">
        <Link
          href={`${GIGS_PATH}/${gig._id}`}
          className="text-foreground font-medium hover:underline"
        >
          {gig.title}
        </Link>
        <p className="text-muted-foreground line-clamp-2 text-sm">
          {gig.description}
        </p>
      </div>
      <div className="col-span-2 text-sm font-medium capitalize">
        {gig.status.replaceAll("_", " ")}
      </div>
      <div className="text-muted-foreground col-span-2 text-sm">
        {formatBudget(gig)}
      </div>
      <div className="text-muted-foreground col-span-2 text-sm">
        {gig.deadline ? formatDate(gig.deadline) : "—"}
      </div>
      <div className="col-span-2 text-right text-sm font-medium">
        {gig.metadata?.applicantCount ?? 0}
      </div>
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

function buildPaginationHref(args: {
  status?: GigStatus;
  limit?: number;
  cursor?: string;
}): string {
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
  return query ? `${GIGS_PATH}?${query}` : GIGS_PATH;
}
