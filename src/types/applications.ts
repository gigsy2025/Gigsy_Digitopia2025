import type { Doc } from "convex/_generated/dataModel";

export type ApplicationStatus = Doc<"applications">["status"];

export interface ApplicationWithGig {
  application: Doc<"applications">;
  gig: Doc<"gigs">;
}

export interface ApplicationStatusSummary {
  hasApplied: boolean;
  applicationId: Doc<"applications">["_id"] | null;
  status: ApplicationStatus | null;
}

export const APPLICATION_STATUS_ORDER: ApplicationStatus[] = [
  "pending",
  "viewed",
  "submitted",
  "in_review",
  "shortlisted",
  "interview_requested",
  "hired",
  "assigned",
  "rejected",
  "withdrawn",
  "closed",
];

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: "Pending",
  viewed: "Viewed",
  submitted: "Submitted",
  in_review: "In review",
  shortlisted: "Shortlisted",
  interview_requested: "Interview requested",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
  hired: "Hired",
  assigned: "Assigned",
  closed: "Closed",
};
