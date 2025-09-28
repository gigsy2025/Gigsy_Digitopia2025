import { cache } from "react";

import type { GigDetail, GigListItem } from "@/types/gigs";
import {
  getMockGigDetail,
  getMockGigList,
  getMockRecommendedGigs,
} from "@/lib/mock/gigs";

const GIGS_DATASOURCE = process.env.NEXT_PUBLIC_GIGS_DATASOURCE ?? "mock";

async function fetchGigListFromMock(): Promise<GigListItem[]> {
  return getMockGigList();
}

async function fetchGigDetailFromMock(
  gigId: string,
): Promise<GigDetail | null> {
  return getMockGigDetail(gigId);
}

async function fetchRecommendedFromMock(
  gigId: string,
  limit: number,
): Promise<GigListItem[]> {
  return getMockRecommendedGigs(gigId, limit);
}

export const getGigList = cache(async (): Promise<GigListItem[]> => {
  if (GIGS_DATASOURCE === "convex") {
    console.warn(
      "Convex server-side gig list fetch not implemented; falling back to mock data.",
    );
  }

  return fetchGigListFromMock();
});

export const getGigDetail = cache(
  async (gigId: string): Promise<GigDetail | null> => {
    if (!gigId) {
      return null;
    }

    if (GIGS_DATASOURCE === "convex") {
      // TODO: Replace with Convex server-side fetching when available.
      console.warn(
        "Convex server-side gig detail fetch not implemented; falling back to mock data.",
      );
    }

    return fetchGigDetailFromMock(gigId);
  },
);

export const getRelatedGigs = cache(
  async (gigId: string, limit = 3): Promise<GigListItem[]> => {
    if (!gigId) {
      return [];
    }

    if (GIGS_DATASOURCE === "convex") {
      console.warn(
        "Convex server-side related gigs fetch not implemented; falling back to mock data.",
      );
    }

    return fetchRecommendedFromMock(gigId, limit);
  },
);

export const getGigDetailWithRelated = cache(
  async (
    gigId: string,
    limit = 3,
  ): Promise<{
    gig: GigDetail | null;
    relatedGigs: GigListItem[];
  }> => {
    const [gig, relatedGigs] = await Promise.all([
      getGigDetail(gigId),
      getRelatedGigs(gigId, limit),
    ]);

    return { gig, relatedGigs };
  },
);
