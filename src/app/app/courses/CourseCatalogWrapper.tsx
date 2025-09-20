"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { CourseFilters, CourseList } from "@/components/courses";
import type { CourseFiltersType } from "@/types/courses";
import { transformConvexCourses } from "@/utils/fetchers-client";

// Inline type definitions for immediate resolution
type CourseCategoryType =
  | "development"
  | "design"
  | "marketing"
  | "writing"
  | "data"
  | "business"
  | "creative"
  | "technology"
  | "soft-skills"
  | "languages";

import {
  BookOpen,
  TrendingUp,
  Users,
  Award,
  RefreshCw,
  Share2,
} from "lucide-react";
import { useUser } from "@/providers/UserContext";

// Default filters configuration
const DEFAULT_FILTERS: CourseFiltersType = {
  searchTerm: "",
  sortBy: "relevance",
  page: 1,
  limit: 12,
};

// Featured course categories for quick access
const FEATURED_CATEGORIES = [
  {
    category: "development" as CourseCategoryType,
    title: "Development",
    description: "Master coding and software development",
    icon: "💻",
    gradient: "from-blue-500 to-cyan-600",
  },
  {
    category: "design" as CourseCategoryType,
    title: "Design",
    description: "Create stunning visual experiences",
    icon: "🎨",
    gradient: "from-pink-500 to-rose-600",
  },
  {
    category: "marketing" as CourseCategoryType,
    title: "Marketing",
    description: "Grow your audience and business",
    icon: "📈",
    gradient: "from-orange-500 to-yellow-600",
  },
  {
    category: "business" as CourseCategoryType,
    title: "Business",
    description: "Build and scale your business",
    icon: "💼",
    gradient: "from-green-500 to-emerald-600",
  },
];

/**
 * Course Catalog Wrapper Component
 * Client component that handles interactivity and real-time updates
 */
export function CourseCatalogWrapper() {
  const { isAdmin } = useUser();
  const router = useRouter();

  // Initialize filters from URL parameters
  const [filters, setFilters] = useState<CourseFiltersType>(DEFAULT_FILTERS);
  const [layout, setLayout] = useState<"grid" | "list" | "masonry">("grid");
  const [columns, setColumns] = useState<1 | 2 | 3 | 4 | "auto">(3);

  // Transform filters for Convex compatibility (page -> offset)
  const convexFilters = useMemo(() => {
    const { page, limit, priceRange, ...otherFilters } = filters;
    const offset = page && limit ? (page - 1) * limit : 0;

    let priceRangeArray: number[] | undefined;
    if (priceRange) {
      if (Array.isArray(priceRange)) {
        priceRangeArray = priceRange;
      } else if (typeof priceRange === "object" && "min" in priceRange) {
        priceRangeArray = [priceRange.min, priceRange.max];
      }
    }

    return {
      ...otherFilters,
      offset,
      limit,
      priceRange: priceRangeArray,
    };
  }, [filters]);

  // Query courses from Convex for real-time updates
  const coursesData = useQuery(api.courses.listWithDetails, convexFilters);
  const coursesLoading = coursesData === undefined;

  const totalResults = coursesData?.total ?? 0;
  const totalPages = Math.ceil(
    totalResults / (filters.limit ?? DEFAULT_FILTERS.limit!),
  );

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();

    if (filters.searchTerm) params.set("search", filters.searchTerm);
    if (filters.categories?.length)
      params.set("categories", filters.categories.join(","));
    if (filters.difficulties?.length)
      params.set("difficulties", filters.difficulties.join(","));
    if (filters.sortBy && filters.sortBy !== "relevance")
      params.set("sort", filters.sortBy);
    if (filters.priceRange) {
      const priceRange = Array.isArray(filters.priceRange)
        ? { min: filters.priceRange[0], max: filters.priceRange[1] }
        : filters.priceRange;

      params.set("priceMin", priceRange.min.toString());
      params.set("priceMax", priceRange.max.toString());
    }
    if (filters.minRating) params.set("rating", filters.minRating.toString());
    if (filters.maxDuration)
      params.set("duration", filters.maxDuration.toString());
    if (filters.isNew) params.set("new", "true");
    if (filters.isFeatured) params.set("featured", "true");
    if (filters.instructorId) params.set("instructor", filters.instructorId);
    if (filters.page && filters.page > 1)
      params.set("page", filters.page.toString());
    if (filters.limit && filters.limit !== DEFAULT_FILTERS.limit)
      params.set("limit", filters.limit.toString());

    const newUrl = params.toString() ? `?${params.toString()}` : "/app/courses";
    router.replace(newUrl, { scroll: false });
  }, [filters, router]);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: CourseFiltersType) => {
    setFilters(newFilters);
  }, []);

  // Handle course enrollment (placeholder)
  const handleCourseEnroll = useCallback((courseId: string) => {
    console.log("Enrolling in course:", courseId);
    // TODO: Implement enrollment logic
  }, []);

  // Handle category selection from featured categories
  const handleCategorySelect = useCallback((category: CourseCategoryType) => {
    setFilters((prev) => ({
      ...prev,
      categories: [category],
      page: 1,
    }));
  }, []);

  // Refresh courses data
  const handleRefresh = useCallback(() => {
    // Convex handles real-time updates, but we can trigger a manual refresh if needed
    window.location.reload();
  }, []);

  // Share course catalog
  const handleShare = useCallback(async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Gigsy Course Catalog",
          text: "Discover amazing courses on Gigsy",
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        // Could add a toast notification here
      }
    } catch (error) {
      console.error("Failed to share:", error);
      // Fallback: Could show an error message or copy URL manually
    }
  }, []);

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Course Catalog
              </h1>
              <p className="text-muted-foreground">
                Discover and learn from our extensive library of courses
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              {isAdmin && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => router.push("/admin/courses/create")}
                >
                  Create Course
                </Button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="bg-card rounded-lg border p-4 text-center">
              <BookOpen className="text-primary mx-auto mb-2 h-8 w-8" />
              <div className="text-2xl font-bold">{totalResults}</div>
              <div className="text-muted-foreground text-sm">Courses</div>
            </div>
            <div className="bg-card rounded-lg border p-4 text-center">
              <Users className="text-primary mx-auto mb-2 h-8 w-8" />
              <div className="text-2xl font-bold">10k+</div>
              <div className="text-muted-foreground text-sm">Students</div>
            </div>
            <div className="bg-card rounded-lg border p-4 text-center">
              <Award className="text-primary mx-auto mb-2 h-8 w-8" />
              <div className="text-2xl font-bold">500+</div>
              <div className="text-muted-foreground text-sm">Certificates</div>
            </div>
            <div className="bg-card rounded-lg border p-4 text-center">
              <TrendingUp className="text-primary mx-auto mb-2 h-8 w-8" />
              <div className="text-2xl font-bold">95%</div>
              <div className="text-muted-foreground text-sm">Success Rate</div>
            </div>
          </div>
        </div>

        {/* Featured Categories */}
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">Popular Categories</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURED_CATEGORIES.map((category) => (
              <button
                key={category.category}
                onClick={() => handleCategorySelect(category.category)}
                className={cn(
                  "rounded-xl bg-gradient-to-br p-6 text-left text-white transition-transform hover:scale-105",
                  category.gradient,
                )}
              >
                <div className="text-2xl">{category.icon}</div>
                <h3 className="mt-2 font-semibold">{category.title}</h3>
                <p className="text-sm opacity-90">{category.description}</p>
              </button>
            ))}
          </div>
        </div>

        <Separator className="my-8" />

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <CourseFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              totalResults={totalResults}
            />
          </div>

          {/* Course List */}
          <div className="lg:col-span-3">
            <CourseList
              courses={coursesData ?? { courses: [], total: 0, hasMore: false }}
              loading={coursesLoading}
              layout={layout}
              columns={columns}
              onLayoutChange={setLayout}
              onColumnsChange={setColumns}
              onCourseEnroll={handleCourseEnroll}
              // Pagination props
              currentPage={filters.page ?? 1}
              totalPages={totalPages}
              totalResults={totalResults}
              onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
              // Search and sort
              searchTerm={filters.searchTerm ?? ""}
              sortBy={filters.sortBy ?? "relevance"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
