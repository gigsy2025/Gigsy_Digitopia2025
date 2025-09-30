"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { usePreloadedQuery } from "convex/react";
import type { Preloaded } from "convex/react";
import { api } from "convex/_generated/api";

import type { ApplicationStatus } from "@/types/applications";
import type { ApplicationWithGig } from "@/types/applications";
import { APPLICATION_STATUS_ORDER } from "@/types/applications";
import {
  ApplicationFilters,
  type ApplicationFiltersState,
} from "./ApplicationFilters";
import { ApplicationListContainer } from "./ApplicationList.container";

type ApplicationsContentProps = {
  preloaded: Preloaded<typeof api.applications.listByCandidate>;
};

const DEFAULT_FILTERS: ApplicationFiltersState = {
  status: "all",
  sort: "recent",
};

const PAGE_SIZE = 5;

const STATUS_SORT_ORDER: Record<ApplicationStatus, number> =
  APPLICATION_STATUS_ORDER.reduce<Record<ApplicationStatus, number>>(
    (acc, status, index) => {
      acc[status] = index + 1;
      return acc;
    },
    {
      pending: 1,
      viewed: 2,
      submitted: 3,
      in_review: 4,
      shortlisted: 5,
      interview_requested: 6,
      hired: 7,
      assigned: 8,
      rejected: 9,
      withdrawn: 10,
      closed: 11,
    },
  );

export function ApplicationsContent({ preloaded }: ApplicationsContentProps) {
  const [filters, setFilters] =
    useState<ApplicationFiltersState>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);

  const data = usePreloadedQuery(preloaded) as ApplicationWithGig[];
  const [applications, setApplications] = useState<ApplicationWithGig[]>(data);

  useEffect(() => {
    setApplications(data);
  }, [data]);

  useEffect(() => {
    setPage(1);
  }, [filters.status, filters.sort]);

  const filteredApplications = useMemo(() => {
    if (filters.status === "all") {
      return applications;
    }

    return applications.filter(
      (item) => item.application.status === filters.status,
    );
  }, [applications, filters.status]);

  const sortedApplications = useMemo(() => {
    switch (filters.sort) {
      case "oldest":
        return [...filteredApplications].sort(
          (a, b) => a.application._creationTime - b.application._creationTime,
        );
      case "status":
        return [...filteredApplications].sort((a, b) => {
          const left =
            STATUS_SORT_ORDER[a.application.status] ?? Number.MAX_SAFE_INTEGER;
          const right =
            STATUS_SORT_ORDER[b.application.status] ?? Number.MAX_SAFE_INTEGER;
          return left - right;
        });
      case "recent":
      default:
        return [...filteredApplications].sort(
          (a, b) => b.application._creationTime - a.application._creationTime,
        );
    }
  }, [filteredApplications, filters.sort]);

  const visibleApplications = useMemo(() => {
    return sortedApplications.slice(0, page * PAGE_SIZE);
  }, [sortedApplications, page]);

  const hasMore = visibleApplications.length < sortedApplications.length;

  const handleLoadMore = useCallback(() => {
    setPage((prev) => prev + 1);
  }, []);

  const enableAiInsights =
    process.env.NEXT_PUBLIC_ENABLE_APPLICATION_AI_INSIGHTS === "true";

  return (
    <div className="flex flex-col gap-6">
      <ApplicationFilters
        value={filters}
        onChange={setFilters}
        total={applications.length}
      />

      <ApplicationListContainer
        applications={visibleApplications}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        showInsights={enableAiInsights}
        onWithdrawSuccess={(applicationId) =>
          setApplications((prev) =>
            prev.filter((item) => item.application._id !== applicationId),
          )
        }
      />
    </div>
  );
}
