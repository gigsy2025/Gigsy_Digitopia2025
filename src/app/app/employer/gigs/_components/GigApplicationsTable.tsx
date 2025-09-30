"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import type { Doc } from "convex/_generated/dataModel";

export type EmployerApplicationRecord = {
  application: Doc<"applications">;
  candidate: Doc<"users"> | null;
  detailHref?: string | null;
};

interface GigApplicationsTableProps {
  applications: Array<EmployerApplicationRecord & { actions?: ReactNode }>;
  emptyMessage?: string;
  footer?: ReactNode;
}

export function GigApplicationsTable({
  applications,
  emptyMessage = "No applications yet.",
  footer,
}: GigApplicationsTableProps) {
  const hasActions = applications.some((item) => Boolean(item.actions));

  return (
    <div className="border-border bg-card overflow-hidden rounded-xl border">
      <div className="text-muted-foreground grid grid-cols-12 gap-2 px-6 py-3 text-sm font-medium">
        <span className="col-span-4">Candidate</span>
        <span className="col-span-2">Status</span>
        <span className="col-span-2">Submitted</span>
        <span className="col-span-2 text-right">Cover letter</span>
        {hasActions ? (
          <span className="col-span-2 text-right">Actions</span>
        ) : null}
      </div>
      <ul className="divide-y">
        {applications.length === 0 ? (
          <li className="text-muted-foreground px-6 py-5 text-sm">
            {emptyMessage}
          </li>
        ) : (
          applications.map(
            ({ application, candidate, actions, detailHref }) => (
              <li
                key={application._id}
                className="grid grid-cols-12 items-center gap-2 px-6 py-4"
              >
                <div className="col-span-4 space-y-1">
                  {detailHref ? (
                    <Link
                      href={detailHref}
                      className="text-primary hover:underline"
                      prefetch={false}
                    >
                      {candidate?.name ?? "Unknown candidate"}
                    </Link>
                  ) : (
                    <p className="text-foreground font-medium">
                      {candidate?.name ?? "Unknown candidate"}
                    </p>
                  )}
                  <p className="text-muted-foreground text-xs">
                    {candidate?.email ?? "No email on record"}
                  </p>
                </div>
                <div className="col-span-2 flex items-center">
                  <Badge variant={statusVariant(application.status)}>
                    {formatStatus(application.status)}
                  </Badge>
                </div>
                <div className="text-muted-foreground col-span-2 text-sm">
                  {formatDate(application._creationTime)}
                </div>
                <div className="col-span-2 text-right text-sm">
                  {application.coverLetter ? (
                    <Link
                      href="#"
                      className="text-primary hover:underline"
                      onClick={(event) => event.preventDefault()}
                    >
                      View
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
                {hasActions ? (
                  <div className="col-span-2 flex justify-end text-sm">
                    {actions ?? null}
                  </div>
                ) : null}
              </li>
            ),
          )
        )}
      </ul>
      {footer ? <div className="border-t px-6 py-4">{footer}</div> : null}
    </div>
  );
}

function statusVariant(
  status: Doc<"applications">["status"],
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "pending":
    case "submitted":
    case "viewed":
    case "in_review":
      return "secondary";
    case "shortlisted":
    case "interview_requested":
    case "hired":
    case "assigned":
      return "default";
    case "rejected":
    case "withdrawn":
    case "closed":
      return "destructive";
    default:
      return "outline";
  }
}
function formatStatus(status: Doc<"applications">["status"]): string {
  return status.replaceAll("_", " ");
}

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(timestamp));
}
