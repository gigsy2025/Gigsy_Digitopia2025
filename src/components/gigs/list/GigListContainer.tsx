"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import type { GigListItem } from "@/types/gigs";
import { GigList } from "@/components/gigs/list/GigList";
import {
  GigFilters,
  type GigFilterState,
} from "@/components/gigs/list/GigFilters";
import { GigListPagination } from "@/components/gigs/list/GigListPagination";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { cn } from "@/lib/utils";
import { useGigListQuery } from "@/hooks/useGigData";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const DEFAULT_PAGE_SIZE = 9;

type GigListContainerProps = {
  initialGigs?: GigListItem[];
  pageSize?: number;
  className?: string;
};

type FilteredResult = {
  items: GigListItem[];
  total: number;
  totalPages: number;
};

function areFiltersEqual(left: GigFilterState, right: GigFilterState): boolean {
  return (
    left.search === right.search &&
    left.category === right.category &&
    left.difficultyLevel === right.difficultyLevel &&
    left.experienceRequired === right.experienceRequired &&
    left.budgetType === right.budgetType &&
    left.currency === right.currency &&
    left.budgetMin === right.budgetMin &&
    left.budgetMax === right.budgetMax &&
    left.isRemoteOnly === right.isRemoteOnly &&
    left.isUrgent === right.isUrgent
  );
}

export function GigListContainer({
  initialGigs = [],
  pageSize = DEFAULT_PAGE_SIZE,
  className,
}: GigListContainerProps) {
  const router = useRouter();
  const [uiFilters, setUiFilters] = useState<GigFilterState>({});
  const [filters, setFilters] = useState<GigFilterState>({});
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();
  const debouncedSearch = useDebouncedValue(uiFilters.search, 400);

  useEffect(() => {
    const nextFilters: GigFilterState = {
      ...uiFilters,
      search: debouncedSearch,
    };

    setFilters((previous) => {
      if (areFiltersEqual(previous, nextFilters)) {
        return previous;
      }
      return nextFilters;
    });
  }, [uiFilters, debouncedSearch]);

  const deferredFilters = useDeferredValue(filters);

  const {
    data: remoteGigs,
    status: queryStatus,
    error: queryError,
  } = useGigListQuery(filters, {
    initialData: initialGigs,
    debugLabel: "GigListContainer",
  });

  const sourceGigs = remoteGigs ?? initialGigs;
  const isDebouncePending = uiFilters.search !== filters.search;
  const showLoadingPlaceholder =
    isPending || queryStatus === "loading" || isDebouncePending;

  const filtered = useMemo<FilteredResult>(() => {
    const baseGigs = remoteGigs ?? initialGigs;
    const items = applyFilters(baseGigs, deferredFilters);
    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return {
      items,
      total,
      totalPages,
    };
  }, [remoteGigs, initialGigs, deferredFilters, pageSize]);

  const paginatedGigs = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filtered.items.slice(startIndex, startIndex + pageSize);
  }, [filtered.items, page, pageSize]);

  useEffect(() => {
    if (page > filtered.totalPages) {
      setPage(filtered.totalPages);
    }
  }, [filtered.totalPages, page]);

  const handleFiltersChange = useCallback((nextFilters: GigFilterState) => {
    startTransition(() => {
      setUiFilters(nextFilters);
      setPage(1);
    });
  }, []);

  const handleReset = useCallback(() => {
    startTransition(() => {
      setUiFilters({});
      setPage(1);
    });
  }, []);

  const handlePageChange = useCallback((nextPage: number) => {
    startTransition(() => {
      setPage(nextPage);
    });
  }, []);

  const handleApply = useCallback(
    (gigId: GigListItem["_id"]) => {
      router.push(`/app/gigs/${gigId}/apply`);
    },
    [router],
  );

  const handleSave = useCallback((gigId: GigListItem["_id"]) => {
    console.info(`Save clicked for gig ${gigId}`);
  }, []);

  const handleSelect = useCallback(
    (gigId: GigListItem["_id"]) => {
      router.push(`/app/gigs/${gigId}`);
    },
    [router],
  );

  const isQueryLoading = queryStatus === "loading" && sourceGigs.length === 0;
  const isBusy = isPending || queryStatus === "loading";

  return (
    <div className={cn("grid gap-6 lg:grid-cols-[280px_1fr]", className)}>
      <GigFilters
        filters={uiFilters}
        onChange={handleFiltersChange}
        onReset={handleReset}
        isBusy={isBusy}
      />

      <div className="relative min-h-[320px]">
        {showLoadingPlaceholder ? (
          <div className="border-border bg-card/80 absolute inset-0 z-10 rounded-2xl border backdrop-blur-sm">
            <div className="flex h-full w-full flex-col justify-center gap-4 p-6">
              <LoadingSkeleton lines={5} />
            </div>
          </div>
        ) : null}
        <div
          className={cn(
            "space-y-6 transition-opacity",
            showLoadingPlaceholder
              ? "pointer-events-none opacity-40"
              : "opacity-100",
          )}
        >
          {queryError ? (
            <EmptyState
              title="We couldn't load gigs right now"
              description="Please try again in a few moments or adjust your filters."
              actionLabel="Retry"
              onAction={handleReset}
            />
          ) : paginatedGigs.length > 0 ? (
            <>
              <GigList
                gigs={paginatedGigs}
                onApply={handleApply}
                onSave={handleSave}
                onSelect={handleSelect}
              />
              <GigListPagination
                currentPage={page}
                totalPages={filtered.totalPages}
                pageSize={pageSize}
                totalItems={filtered.total}
                onPageChange={handlePageChange}
                disabled={isBusy}
              />
            </>
          ) : (
            <EmptyState
              title="No gigs found"
              description="Try adjusting your filters or come back later for new opportunities."
              actionLabel="Clear filters"
              onAction={handleReset}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function applyFilters(
  gigs: GigListItem[],
  filters: GigFilterState,
): GigListItem[] {
  const normalizedSearch = filters.search?.trim().toLowerCase();

  return gigs.filter((gig) => {
    if (normalizedSearch) {
      const haystack = [gig.title, gig.description, gig.category, ...gig.skills]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(normalizedSearch)) {
        return false;
      }
    }

    if (filters.category && gig.category !== filters.category) {
      return false;
    }

    if (
      filters.difficultyLevel &&
      gig.difficultyLevel !== filters.difficultyLevel
    ) {
      return false;
    }

    if (
      filters.experienceRequired &&
      gig.experienceRequired !== filters.experienceRequired
    ) {
      return false;
    }

    if (
      typeof filters.budgetMin === "number" &&
      gig.budget.min < filters.budgetMin
    ) {
      return false;
    }

    if (
      typeof filters.budgetMax === "number" &&
      gig.budget.max > filters.budgetMax
    ) {
      return false;
    }

    if (filters.budgetType && gig.budget.type !== filters.budgetType) {
      return false;
    }

    if (filters.currency && gig.budget.currency !== filters.currency) {
      return false;
    }

    if (filters.isRemoteOnly) {
      const isRemote =
        gig.location?.type === "remote" || gig.metadata?.isRemoteOnly;
      if (!isRemote) {
        return false;
      }
    }

    if (filters.isUrgent && !gig.metadata?.isUrgent) {
      return false;
    }

    return true;
  });
}
