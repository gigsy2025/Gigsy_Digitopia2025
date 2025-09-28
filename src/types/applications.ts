import type { Doc } from "convex/_generated/dataModel";

export type ApplicationStatus = Doc<"applications">["status"];

export interface ApplicationWithGig {
  application: Doc<"applications">;
  gig: Doc<"gigs">;
}
