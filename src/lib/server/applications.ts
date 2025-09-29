import { cache } from "react";
import { fetchQuery } from "convex/nextjs";
import type { Id } from "convex/_generated/dataModel";

import { api } from "convex/_generated/api";
import type { ApplicationStatusSummary } from "@/types/applications";

const APPLICATIONS_DATASOURCE = (
  process.env.NEXT_PUBLIC_GIGS_DATASOURCE ?? "mock"
).toLowerCase();

const shouldUseConvex = APPLICATIONS_DATASOURCE === "convex";

function toGigId(gigId: string | Id<"gigs">): Id<"gigs"> {
  return gigId as Id<"gigs">;
}

export const getGigApplicationStatus = cache(
  async (
    gigId: string | Id<"gigs">,
  ): Promise<ApplicationStatusSummary | null> => {
    if (!gigId || !shouldUseConvex) {
      return null;
    }

    try {
      return await fetchQuery(api.applications.statusForGig, {
        gigId: toGigId(gigId),
      });
    } catch (error) {
      console.error("Failed to fetch gig application status", error);
      return null;
    }
  },
);
