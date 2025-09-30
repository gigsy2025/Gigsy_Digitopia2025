"use client";

import { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { ApplicationStatus } from "@/types/applications";
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_ORDER,
} from "@/types/applications";
import { cn } from "@/lib/utils";

export type ApplicationSortOption = "recent" | "oldest" | "status";

export interface ApplicationFiltersState {
  status: ApplicationStatus | "all";
  sort: ApplicationSortOption;
}

interface ApplicationFiltersProps {
  value: ApplicationFiltersState;
  onChange: (next: ApplicationFiltersState) => void;
  total: number;
}

const STATUS_ORDER: Array<ApplicationStatus | "all"> = [
  "all",
  ...APPLICATION_STATUS_ORDER,
];

const SORT_LABELS: Record<ApplicationSortOption, string> = {
  recent: "Most recent",
  oldest: "Oldest first",
  status: "Status priority",
};

const SORT_ORDER: ApplicationSortOption[] = ["recent", "status", "oldest"];

export function ApplicationFilters({
  value,
  onChange,
  total,
}: ApplicationFiltersProps) {
  const statusOptions = useMemo(
    () =>
      STATUS_ORDER.map((status) => ({
        value: status,
        label:
          status === "all"
            ? "All statuses"
            : (APPLICATION_STATUS_LABELS[status] ?? status),
      })),
    [],
  );

  const sortOptions = useMemo(
    () => SORT_ORDER.map((sort) => ({ value: sort, label: SORT_LABELS[sort] })),
    [],
  );

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <span>Applications</span>
        <Badge variant="secondary" className="font-medium">
          {total}
        </Badge>
      </div>

      <div className="text-muted-foreground flex items-center gap-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-foreground font-medium">Status</span>
          <Select
            value={value.status}
            onValueChange={(next) =>
              onChange({
                ...value,
                status: next as ApplicationFiltersState["status"],
              })
            }
          >
            <SelectTrigger className={cn("w-44")}>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-foreground font-medium">Sort by</span>
          <Select
            value={value.sort}
            onValueChange={(next) =>
              onChange({
                ...value,
                sort: next as ApplicationFiltersState["sort"],
              })
            }
          >
            <SelectTrigger className={cn("w-40")}>
              <SelectValue placeholder="Sort applications" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
