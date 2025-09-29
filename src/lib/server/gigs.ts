import { cache } from "react";
import { fetchQuery, preloadQuery } from "convex/nextjs";
import type { Id } from "convex/_generated/dataModel";

import type { GigDetail, GigListItem } from "@/types/gigs";
import {
  getMockGigDetail,
  getMockGigList,
  getMockRecommendedGigs,
} from "@/lib/mock/gigs";
import { api } from "convex/_generated/api";
import {
  normalizePublicGigFilters,
  mapGigRecordToListItem,
  mapGigRecordToDetail,
} from "@/utils/gig-mappers";

const GIGS_DATASOURCE = (
  process.env.NEXT_PUBLIC_GIGS_DATASOURCE ?? "mock"
).toLowerCase();

const shouldUseConvex = GIGS_DATASOURCE === "convex";

async function fetchGigListFromConvex(
  filters?: Parameters<typeof normalizePublicGigFilters>[0],
): Promise<GigListItem[]> {
  const normalizedFilters = normalizePublicGigFilters(filters);
  const response = await fetchQuery(api.gigs.list, {
    ...(normalizedFilters ? { filters: normalizedFilters } : {}),
  });

  return response.items.map(mapGigRecordToListItem);
}

function toGigId(gigId: string): Id<"gigs"> {
  return gigId as Id<"gigs">;
}

async function fetchGigDetailFromConvex(
  gigId: string,
): Promise<GigDetail | null> {
  const gig = await fetchQuery(api.gigs.get, { gigId: toGigId(gigId) });
  return gig ? mapGigRecordToDetail(gig) : null;
}

async function fetchRelatedFromConvex(
  gigId: string,
  limit: number,
): Promise<GigListItem[]> {
  const related = await fetchQuery(api.gigs.related, {
    gigId: toGigId(gigId),
    limit,
  });
  return related.map(mapGigRecordToListItem);
}

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
  console.log("Should use Convex: ", shouldUseConvex);
  if (shouldUseConvex) {
    console.log("Fetching gig list from Convex");
    return fetchGigListFromConvex();
  }

  return fetchGigListFromMock();
});

export const preloadGigList = cache(async () => {
  if (!shouldUseConvex) {
    return null;
  }

  return preloadQuery(api.gigs.list, {});
});

export const getGigDetail = cache(
  async (gigId: string): Promise<GigDetail | null> => {
    if (!gigId) {
      return null;
    }

    if (shouldUseConvex) {
      return fetchGigDetailFromConvex(gigId);
    }

    return fetchGigDetailFromMock(gigId);
  },
);

export const getRelatedGigs = cache(
  async (gigId: string, limit = 3): Promise<GigListItem[]> => {
    if (!gigId) {
      return [];
    }

    if (shouldUseConvex) {
      return fetchRelatedFromConvex(gigId, limit);
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
