"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useConvex } from "convex/react";
import type { ConvexReactClient } from "convex/react";
import type { GigDetail, GigListItem } from "@/types/gigs";
import {
  getMockEmployerGigs,
  getMockGigDetail,
  getMockGigList,
  getMockRecommendedGigs,
  MOCK_APPLICATIONS,
  type GigApplicationStub,
} from "@/lib/mock/gigs";
import type { GigFilterState } from "@/components/gigs/list/GigFilters";

const GIGS_DATASOURCE = process.env.NEXT_PUBLIC_GIGS_DATASOURCE ?? "mock";
const SHOULD_USE_CONVEX = GIGS_DATASOURCE === "convex";

type QueryStatus = "idle" | "loading" | "success" | "error";

interface BaseQueryState<T> {
  data: T | null;
  status: QueryStatus;
  error: Error | null;
  refetch: () => Promise<void>;
}

interface QueryOptions<T> {
  enabled?: boolean;
  initialData?: T | null;
  /** Enables logging in development for debugging data flow */
  debugLabel?: string;
}

function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === "string") {
    return new Error(error);
  }

  return new Error("Unknown error while fetching gigs data");
}

function useConfiguredConvexClient(): ConvexReactClient | null {
  const convexClient = useConvex();

  if (!SHOULD_USE_CONVEX) {
    return null;
  }

  return convexClient ?? null;
}

type ConvexQueryExecutor = {
  query: (name: string, args?: Record<string, unknown>) => Promise<unknown>;
};

function getConvexQueryExecutor(
  client: ConvexReactClient | null,
): ConvexQueryExecutor | null {
  if (!client) {
    return null;
  }

  return client as unknown as ConvexQueryExecutor;
}

function useAsyncQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  { enabled = true, initialData, debugLabel }: QueryOptions<T> = {},
): BaseQueryState<T> {
  const [data, setData] = useState<T | null>(initialData ?? null);
  const [status, setStatus] = useState<QueryStatus>(
    initialData === undefined || initialData === null ? "idle" : "success",
  );
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    if (!enabled) {
      return;
    }

    setStatus("loading");
    setError(null);

    try {
      const result = await fetcher();
      setData(result);
      setStatus("success");
    } catch (err) {
      const normalized = normalizeError(err);
      setError(normalized);
      setStatus("error");
      if (process.env.NODE_ENV !== "production" && debugLabel) {
        console.error(`[${debugLabel}] query failed`, normalized);
      }
    }
  }, [debugLabel, enabled, fetcher]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let isActive = true;

    void (async () => {
      try {
        setStatus("loading");
        const result = await fetcher();
        if (!isActive) {
          return;
        }
        setData(result);
        setStatus("success");
        setError(null);
      } catch (err) {
        if (!isActive) {
          return;
        }
        const normalized = normalizeError(err);
        setError(normalized);
        setStatus("error");
        if (process.env.NODE_ENV !== "production" && debugLabel) {
          console.error(`[${debugLabel}] query effect failed`, normalized);
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [debugLabel, enabled, fetcher, key]);

  const refetch = useCallback(async () => {
    if (!enabled) {
      return;
    }
    await execute();
  }, [enabled, execute]);

  return {
    data,
    status,
    error,
    refetch,
  };
}

export function useGigListQuery(
  filters: GigFilterState,
  options: QueryOptions<GigListItem[] | null> = {},
): BaseQueryState<GigListItem[]> {
  const convexClient = useConfiguredConvexClient();
  const convexExecutor = useMemo(
    () => getConvexQueryExecutor(convexClient),
    [convexClient],
  );
  const serializedFilters = useMemo(
    () => JSON.stringify(filters ?? {}),
    [filters],
  );

  const fetcher = useCallback(async () => {
    if (convexExecutor) {
      try {
        const response = await convexExecutor.query("gigs:list", {
          filters,
        });
        if (Array.isArray(response)) {
          return response as GigListItem[];
        }
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            "Convex gigs:list query failed, falling back to mock data",
            error,
          );
        }
      }
    }

    return getMockGigList();
  }, [convexExecutor, filters]);

  return useAsyncQuery<GigListItem[]>(serializedFilters, fetcher, {
    ...options,
    debugLabel: options.debugLabel ?? "useGigListQuery",
  });
}

export function useGigDetailQuery(
  gigId: string,
  options: QueryOptions<GigDetail | null> = {},
): BaseQueryState<GigDetail> {
  const convexClient = useConfiguredConvexClient();
  const convexExecutor = useMemo(
    () => getConvexQueryExecutor(convexClient),
    [convexClient],
  );

  const fetcher = useCallback(async () => {
    if (convexExecutor) {
      try {
        const response = await convexExecutor.query("gigs:get", {
          gigId,
        });
        if (response) {
          return response as GigDetail;
        }
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            "Convex gigs:get query failed, falling back to mock data",
            error,
          );
        }
      }
    }

    const mock = await getMockGigDetail(gigId);
    if (!mock) {
      throw new Error("Gig not found");
    }
    return mock;
  }, [convexClient, gigId]);

  return useAsyncQuery<GigDetail>(gigId, fetcher, {
    ...options,
    debugLabel: options.debugLabel ?? "useGigDetailQuery",
  });
}

export function useEmployerGigDashboardQuery(
  employerId: string,
  options: QueryOptions<GigListItem[] | null> = {},
): BaseQueryState<GigListItem[]> {
  const convexClient = useConfiguredConvexClient();
  const convexExecutor = useMemo(
    () => getConvexQueryExecutor(convexClient),
    [convexClient],
  );

  const fetcher = useCallback(async () => {
    if (convexExecutor) {
      try {
        const response = await convexExecutor.query("gigs:byEmployer", {
          employerId,
        });
        if (Array.isArray(response)) {
          return response as GigListItem[];
        }
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            "Convex gigs:byEmployer query failed, falling back to mock data",
            error,
          );
        }
      }
    }

    return getMockEmployerGigs(employerId);
  }, [convexClient, employerId]);

  return useAsyncQuery<GigListItem[]>(employerId, fetcher, {
    ...options,
    debugLabel: options.debugLabel ?? "useEmployerGigDashboardQuery",
  });
}

export function useCandidateGigApplicationsQuery(
  userId: string,
  options: QueryOptions<GigApplicationStub[] | null> = {},
): BaseQueryState<GigApplicationStub[]> {
  const convexClient = useConfiguredConvexClient();
  const convexExecutor = useMemo(
    () => getConvexQueryExecutor(convexClient),
    [convexClient],
  );

  const fetcher = useCallback(async () => {
    if (convexExecutor) {
      try {
        const response = await convexExecutor.query(
          "gigs:applicationsForUser",
          {
            userId,
          },
        );
        if (Array.isArray(response)) {
          return response as GigApplicationStub[];
        }
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            "Convex gigs:applicationsForUser query failed, falling back to mock data",
            error,
          );
        }
      }
    }

    return MOCK_APPLICATIONS;
  }, [convexExecutor, userId]);

  return useAsyncQuery<GigApplicationStub[]>(userId, fetcher, {
    ...options,
    debugLabel: options.debugLabel ?? "useCandidateGigApplicationsQuery",
  });
}

export async function preloadGigRecommendations(gigId: string, limit?: number) {
  return getMockRecommendedGigs(gigId, limit);
}
