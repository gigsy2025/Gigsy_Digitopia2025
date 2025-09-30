"use client";

import type { EmployerGigDetail } from "@/utils/fetchers-server";

interface GigSnapshotCardProps {
  gig: EmployerGigDetail;
}

export function GigSnapshotCard({ gig }: GigSnapshotCardProps) {
  return (
    <section className="border-border rounded-2xl border p-6 shadow-sm">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold">Gig snapshot</h2>
        <p className="text-muted-foreground text-sm">
          Key metrics from the current gig.
        </p>
      </header>

      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Status</dt>
          <dd className="capitalize">{gig.status.replaceAll("_", " ")}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Applicants</dt>
          <dd>{gig.metadata?.applicantCount ?? 0}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Views</dt>
          <dd>{gig.metadata?.views ?? 0}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Last updated</dt>
          <dd>
            {new Date(gig.updatedAt ?? gig._creationTime).toLocaleDateString()}
          </dd>
        </div>
      </dl>
    </section>
  );
}
