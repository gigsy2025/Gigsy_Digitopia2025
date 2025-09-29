import Link from "next/link";

import { EmployerLayout } from "@/components/layouts/EmployerLayout";
import { Button } from "@/components/ui/button";
import type { GigListItem } from "@/types/gigs";
import {
  fetchEmployerGigs,
  fetchEmployerMetrics,
} from "@/utils/fetchers-server";
import { buildEmployerNavItems } from "./_utils/nav";

export const metadata = {
  title: "Employer dashboard",
};

export default async function EmployerOverviewPage() {
  const [metrics, gigs] = await Promise.all([
    fetchEmployerMetrics(),
    fetchEmployerGigs({ limit: 5 }),
  ]);

  const navItems = buildEmployerNavItems("/app/employer", {
    activeGigs: metrics.activeGigs,
    totalApplicants: metrics.totalApplicants,
  });

  return (
    <EmployerLayout
      title="Employer overview"
      description="Track hiring performance and manage active gigs."
      actions={
        <Button asChild>
          <Link href="/app/employer/gigs/create">Post a gig</Link>
        </Button>
      }
      navItems={navItems}
    >
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricTile label="Total gigs" value={metrics.totalGigs} />
        <MetricTile label="Active gigs" value={metrics.activeGigs} />
        <MetricTile label="Total applicants" value={metrics.totalApplicants} />
        <MetricTile
          label="Applications this week"
          value={metrics.applicationsThisWeek}
        />
      </section>

      <section className="space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Recent gigs</h2>
            <p className="text-muted-foreground text-sm">
              Latest postings with status and application insights.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/app/employer/gigs">View all gigs</Link>
          </Button>
        </header>

        <div className="border-border bg-card rounded-xl border">
          <div className="text-muted-foreground grid grid-cols-12 gap-2 px-6 py-3 text-sm font-medium">
            <span className="col-span-5">Gig</span>
            <span className="col-span-2">Status</span>
            <span className="col-span-3">Budget</span>
            <span className="col-span-2 text-right">Applicants</span>
          </div>
          <ul className="divide-y">
            {gigs.items.length === 0 ? (
              <li className="text-muted-foreground px-6 py-4 text-sm">
                No gigs published yet. Post your first gig to get started.
              </li>
            ) : (
              gigs.items.map((gig) => (
                <li key={gig._id} className="grid grid-cols-12 gap-2 px-6 py-4">
                  <div className="col-span-5 space-y-1">
                    <Link
                      href={`/app/employer/gigs/${gig._id}`}
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
                  <div className="text-muted-foreground col-span-3 text-sm">
                    {formatBudget(gig)}
                  </div>
                  <div className="col-span-2 text-right text-sm font-medium">
                    {gig.metadata?.applicantCount ?? 0}
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>
    </EmployerLayout>
  );
}

function MetricTile({ label, value }: { label: string; value: number }) {
  return (
    <article className="border-border bg-card rounded-xl border p-4 shadow-sm">
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="text-foreground mt-2 text-2xl font-semibold">{value}</p>
    </article>
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
