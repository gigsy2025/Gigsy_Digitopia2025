"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface GigListPaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems?: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  className?: string;
}

const MAX_VISIBLE_PAGES = 5;

export function GigListPagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  disabled,
  className,
}: GigListPaginationProps) {
  const pages = useMemo(() => {
    if (totalPages <= MAX_VISIBLE_PAGES) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const halfWindow = Math.floor(MAX_VISIBLE_PAGES / 2);
    let start = Math.max(1, currentPage - halfWindow);
    const end = Math.min(totalPages, start + MAX_VISIBLE_PAGES - 1);

    if (end - start + 1 < MAX_VISIBLE_PAGES) {
      start = Math.max(1, end - MAX_VISIBLE_PAGES + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [currentPage, totalPages]);

  const handleChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) {
      return;
    }
    onPageChange(page);
  };

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(
    currentPage * pageSize,
    totalItems ?? currentPage * pageSize,
  );
  const firstPage = pages.at(0);
  const lastPage = pages.at(-1);

  return (
    <nav
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <p className="text-muted-foreground text-sm">
        Showing {startItem}-{endItem}
        {typeof totalItems === "number" ? ` of ${totalItems}` : ""}
      </p>
      <div
        className="flex items-center gap-2"
        role="group"
        aria-label="Pagination"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleChange(currentPage - 1)}
          disabled={(disabled ?? false) || currentPage === 1}
        >
          Previous
        </Button>
        {typeof firstPage === "number" && firstPage !== 1 ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleChange(1)}
            disabled={disabled}
          >
            1
          </Button>
        ) : null}
        {typeof firstPage === "number" && firstPage > 2 ? (
          <span className="text-muted-foreground px-2">…</span>
        ) : null}
        {pages.map((page) => (
          <Button
            key={page}
            variant={page === currentPage ? "default" : "ghost"}
            size="sm"
            onClick={() => handleChange(page)}
            disabled={disabled}
            aria-current={page === currentPage ? "page" : undefined}
          >
            {page}
          </Button>
        ))}
        {typeof lastPage === "number" && lastPage < totalPages - 1 ? (
          <span className="text-muted-foreground px-2">…</span>
        ) : null}
        {typeof lastPage === "number" && lastPage !== totalPages ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleChange(totalPages)}
            disabled={disabled}
          >
            {totalPages}
          </Button>
        ) : null}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleChange(currentPage + 1)}
          disabled={(disabled ?? false) || currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    </nav>
  );
}
