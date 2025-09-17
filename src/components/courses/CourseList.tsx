"use client";

import React, { useState, useMemo } from "react";
import { cva } from "class-variance-authority";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type {
  CourseListProps as OriginalCourseListProps,
  CourseSummary,
  CourseAuthor,
  CourseMediaAssets,
} from "@/types/courses";
import CourseCard from "./CourseCard";
import {
  Grid3X3,
  List,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import type { FunctionReturnType } from "convex/server";
import type { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import Link from "next/link";

// Enhance props to accept the detailed course data from our new query
type DetailedCourseList = FunctionReturnType<
  typeof api.courses.listWithDetails
>;

interface EnhancedCourseListProps
  extends Omit<OriginalCourseListProps, "courses"> {
  courses: DetailedCourseList;
  totalResults: number;
}

// Course list layout variants
const courseListVariants = cva("w-full", {
  variants: {
    layout: {
      grid: "grid gap-6",
      list: "space-y-4",
      masonry: "columns-1 gap-6 space-y-6",
    },
    columns: {
      1: "grid-cols-1",
      2: "grid-cols-1 md:grid-cols-2",
      3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
      auto: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5",
    },
  },
  defaultVariants: {
    layout: "grid",
    columns: 3,
  },
});

// Layout control component
const LayoutControls: React.FC<{
  currentLayout: "grid" | "list" | "masonry";
  currentColumns: 1 | 2 | 3 | 4 | "auto";
  onLayoutChange: (layout: "grid" | "list" | "masonry") => void;
  onColumnsChange: (columns: 1 | 2 | 3 | 4 | "auto") => void;
}> = ({ currentLayout, currentColumns, onLayoutChange, onColumnsChange }) => {
  return (
    <div className="flex items-center gap-2">
      {/* Layout Type Controls */}
      <div className="flex items-center rounded-lg border border-gray-200 p-1 dark:border-gray-700">
        <Button
          variant={currentLayout === "grid" ? "default" : "ghost"}
          size="sm"
          onClick={() => onLayoutChange("grid")}
          className="h-8 w-8 p-0"
          title="Grid layout"
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
        <Button
          variant={currentLayout === "list" ? "default" : "ghost"}
          size="sm"
          onClick={() => onLayoutChange("list")}
          className="h-8 w-8 p-0"
          title="List layout"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant={currentLayout === "masonry" ? "default" : "ghost"}
          size="sm"
          onClick={() => onLayoutChange("masonry")}
          className="h-8 w-8 p-0"
          title="Masonry layout"
        >
          <Grid3X3 className="h-4 w-4" />
        </Button>
      </div>

      {/* Column Count Controls (only for grid layout) */}
      {currentLayout === "grid" && (
        <div className="flex items-center rounded-lg border border-gray-200 p-1 dark:border-gray-700">
          {([1, 2, 3, 4, "auto"] as const).map((cols) => (
            <Button
              key={cols}
              variant={currentColumns === cols ? "default" : "ghost"}
              size="sm"
              onClick={() => onColumnsChange(cols)}
              className="h-8 px-2 text-xs"
              title={`${cols === "auto" ? "Auto" : cols} column${cols !== 1 && cols !== "auto" ? "s" : ""}`}
            >
              {cols === "auto" ? "Auto" : cols}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

// Pagination component
const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPageNumbers?: boolean;
}> = ({ currentPage, totalPages, onPageChange, showPageNumbers = true }) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="h-9"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        Previous
      </Button>

      {showPageNumbers && (
        <div className="flex items-center gap-1">
          {getPageNumbers().map((pageNumber, index) => (
            <React.Fragment key={index}>
              {pageNumber === "..." ? (
                <span className="px-2 py-1 text-gray-500">...</span>
              ) : (
                <Button
                  variant={currentPage === pageNumber ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(pageNumber as number)}
                  className="h-9 w-9 p-0"
                >
                  {pageNumber}
                </Button>
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="h-9"
      >
        Next
        <ChevronRight className="ml-1 h-4 w-4" />
      </Button>
    </div>
  );
};

// Loading skeleton component
const CourseCardSkeleton: React.FC = () => (
  <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
    <Skeleton className="h-48 rounded-lg" />
    <div className="flex justify-between">
      <Skeleton className="h-6 w-20" />
      <Skeleton className="h-6 w-16" />
    </div>
    <Skeleton className="h-6 w-full" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-3/4" />
    <div className="flex items-center gap-4">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-14" />
    </div>
    <div className="flex items-center gap-3 pt-2">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="space-y-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
    <Skeleton className="h-9 w-full" />
  </div>
);

// Empty state component
const EmptyState: React.FC<{
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({
  title = "No courses found",
  description = "Try adjusting your search criteria or explore different categories.",
  actionLabel = "Clear filters",
  onAction,
}) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="mb-6 rounded-full bg-gray-100 p-6 dark:bg-gray-800">
      <BookOpen className="h-12 w-12 text-gray-400 dark:text-gray-600" />
    </div>
    <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
      {title}
    </h3>
    <p className="mb-6 max-w-md text-gray-600 dark:text-gray-400">
      {description}
    </p>
    {onAction && (
      <Button variant="outline" onClick={onAction}>
        {actionLabel}
      </Button>
    )}
  </div>
);

// Error state component
const ErrorState: React.FC<{
  error: Error;
  onRetry?: () => void;
}> = ({ error, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="mb-6 rounded-full bg-red-100 p-6 dark:bg-red-900/20">
      <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400" />
    </div>
    <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
      Something went wrong
    </h3>
    <p className="mb-6 max-w-md text-gray-600 dark:text-gray-400">
      {error.message || "Failed to load courses. Please try again."}
    </p>
    {onRetry && (
      <Button variant="outline" onClick={onRetry}>
        Try again
      </Button>
    )}
  </div>
);

const CourseList: React.FC<EnhancedCourseListProps> = ({
  courses,
  loading = false,
  error,
  layout = "grid",
  columns = 3,
  showLayoutControls = true,
  showPagination = true,
  showProgress = false,
  showEnrollButton = true,
  currentPage = 1,
  totalPages = 1,
  itemsPerPage = 12,
  totalResults = 0,
  className,
  onLayoutChange,
  onColumnsChange,
  onPageChange,
  onCourseEnroll,
  onRetry,
  onClearFilters,
}) => {
  const [localLayout, setLocalLayout] = useState<"grid" | "list" | "masonry">(
    layout,
  );
  const [localColumns, setLocalColumns] = useState<1 | 2 | 3 | 4 | "auto">(
    columns,
  );

  // Handle layout changes
  const handleLayoutChange = (newLayout: "grid" | "list" | "masonry") => {
    setLocalLayout(newLayout);
    onLayoutChange?.(newLayout);
  };

  const handleColumnsChange = (newColumns: 1 | 2 | 3 | 4 | "auto") => {
    setLocalColumns(newColumns);
    onColumnsChange?.(newColumns);
  };

  // Loading skeletons
  const loadingSkeletons = useMemo(() => {
    return Array.from({ length: itemsPerPage }, (_, index) => (
      <CourseCardSkeleton key={`skeleton-${index}`} />
    ));
  }, [itemsPerPage]);

  const courseItems = useMemo(() => {
    if (loading) {
      return loadingSkeletons;
    }
    if (!courses?.courses || courses.courses.length === 0) {
      return (
        <div className="col-span-full">
          <EmptyState onAction={onClearFilters} />
        </div>
      );
    }
    return courses.courses.map(
      (course: DetailedCourseList["courses"][number]) => {
        const author: CourseAuthor = course.author
          ? {
              id: course.author._id,
              name: course.author.name || "Unknown Author",
              avatarUrl: course.author.avatarUrl,
            }
          : {
              id: "unknown-author-id" as Id<"users">,
              name: "Unknown Author",
            };

        const media: CourseMediaAssets = {
          thumbnailUrl: course.thumbnailUrl,
          bannerUrl: course.bannerUrl,
          introVideoUrl: undefined,
        };

        const courseSummary: CourseSummary = {
          id: course._id,
          title: course.title,
          shortDescription: course.description || "",
          author,
          category: course.category ?? "creative",
          difficulty: course.difficultyLevel ?? "beginner",
          status: course.status ?? "draft",
          modulesCount: 0,
          lessonsCount: 0,
          media,
          pricing: {
            isFree: course.price === undefined || course.price === 0,
            price: course.price,
          },
          stats: {
            enrollmentCount: course.enrollmentCount ?? 0,
            completionRate: 0,
            averageCompletionTime: 0,
            averageRating: course.averageRating ?? 0,
            ratingCount: 0,
            viewCount: 0,
            recentEnrollments: 0,
          },
          skills: [],
          tags: [],
          estimatedDuration: course.estimatedDuration ?? 0,
          createdAt: course._creationTime,
          updatedAt: course._creationTime,
        };

        return (
          <Link
            href={`/app/courses/${courseSummary.id}`}
            key={courseSummary.id}
            className="block rounded-xl transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
          >
            <CourseCard
              course={courseSummary}
              variant={localLayout === "list" ? "compact" : "default"}
              showProgress={showProgress}
              showEnrollButton={showEnrollButton}
              onEnroll={
                onCourseEnroll
                  ? () => onCourseEnroll(courseSummary.id)
                  : undefined
              }
            />
          </Link>
        );
      },
    );
  }, [
    loading,
    courses,
    localLayout,
    showProgress,
    showEnrollButton,
    onCourseEnroll,
    onClearFilters,
    loadingSkeletons,
  ]);

  // Handle error state
  if (error) {
    return (
      <div className={cn("w-full", className)}>
        <ErrorState error={error} onRetry={onRetry} />
      </div>
    );
  }

  return (
    <div className={cn("w-full space-y-6", className)}>
      {/* Header with layout controls */}
      {showLayoutControls && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {courses?.courses && (
              <span>
                Showing {(currentPage - 1) * itemsPerPage + 1}-
                {Math.min(currentPage * itemsPerPage, courses.courses.length)}
                {totalPages > 1 && ` of ${totalResults}`}
              </span>
            )}
          </div>
          <LayoutControls
            currentLayout={localLayout}
            currentColumns={localColumns}
            onLayoutChange={handleLayoutChange}
            onColumnsChange={handleColumnsChange}
          />
        </div>
      )}

      {/* Course Grid/List */}
      <div
        className={cn(
          courseListVariants({
            layout: localLayout,
            columns: localLayout === "grid" ? localColumns : undefined,
          }),
        )}
      >
        {courseItems}
      </div>

      {/* Loading indicator for additional content */}
      {loading && courses.courses && courses.courses.length > 0 && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            Loading more courses...
          </span>
        </div>
      )}

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={
            onPageChange ??
            (() => {
              console.warn("onPageChange handler not provided");
            })
          }
        />
      )}
    </div>
  );
};

export default CourseList;
