import { cache } from "react";
import { unstable_cache } from "next/cache";
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
import { cacheTags } from "@/lib/server/cache-tags";

const GIGS_DATASOURCE = (
  process.env.NEXT_PUBLIC_GIGS_DATASOURCE ?? "mock"
).toLowerCase();

const shouldUseConvex = GIGS_DATASOURCE === "convex";

const GIG_LIST_REVALIDATE_SECONDS = shouldUseConvex ? 120 : 3600;
const GIG_DETAIL_REVALIDATE_SECONDS = shouldUseConvex ? 180 : 3600;
const RELATED_GIGS_REVALIDATE_SECONDS = shouldUseConvex ? 180 : 3600;

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

const getGigListCached = unstable_cache(
  async (): Promise<GigListItem[]> => {
    if (shouldUseConvex) {
      return fetchGigListFromConvex();
    }

    return fetchGigListFromMock();
  },
  ["gigs", "list", GIGS_DATASOURCE],
  {
    revalidate: GIG_LIST_REVALIDATE_SECONDS,
    tags: [cacheTags.gigs.list],
  },
);

export async function getGigList(): Promise<GigListItem[]> {
  return getGigListCached();
}

export const preloadGigList = cache(async () => {
  if (!shouldUseConvex) {
    return null;
  }

  return preloadQuery(api.gigs.list, {});
});

function createGigDetailCache(gigId: string) {
  return unstable_cache(
    async () => {
      if (shouldUseConvex) {
        return fetchGigDetailFromConvex(gigId);
      }

      return fetchGigDetailFromMock(gigId);
    },
    ["gigs", "detail", gigId, GIGS_DATASOURCE],
    {
      revalidate: GIG_DETAIL_REVALIDATE_SECONDS,
      tags: [cacheTags.gigs.detail(gigId)],
    },
  );
}

export async function getGigDetail(gigId: string): Promise<GigDetail | null> {
  if (!gigId) {
    return null;
  }

  return createGigDetailCache(gigId)();
}

function createRelatedGigsCache(gigId: string, limit: number) {
  return unstable_cache(
    async () => {
      if (shouldUseConvex) {
        return fetchRelatedFromConvex(gigId, limit);
      }

      return fetchRecommendedFromMock(gigId, limit);
    },
    ["gigs", "related", gigId, `${limit}`, GIGS_DATASOURCE],
    {
      revalidate: RELATED_GIGS_REVALIDATE_SECONDS,
      tags: [cacheTags.gigs.related(gigId)],
    },
  );
}

export async function getRelatedGigs(
  gigId: string,
  limit = 3,
): Promise<GigListItem[]> {
  if (!gigId) {
    return [];
  }

  return createRelatedGigsCache(gigId, limit)();
}

export async function getGigDetailWithRelated(
  gigId: string,
  limit = 3,
): Promise<{
  gig: GigDetail | null;
  relatedGigs: GigListItem[];
}> {
  const [gig, relatedGigs] = await Promise.all([
    getGigDetail(gigId),
    getRelatedGigs(gigId, limit),
  ]);

  return { gig, relatedGigs };
}
