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
