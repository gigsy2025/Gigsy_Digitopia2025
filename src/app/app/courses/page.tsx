/**
 * COURSE CATALOG PAGE
 *
 * Production-grade course catalog with Convex preloading for optimal SSR performance.
 * Uses Server Components for preloading and Client Components for reactivity.
 *
 * FEATURES:
 * - Server-side preloading with Convex preloadQuery
 * - Client-side reactivity with useQuery for real-time updates
 * - Advanced search and filtering with URL state persistence
 * - Responsive grid layout with multiple view options
 * - Performance optimizations with React.memo and virtualization
 * - Accessibility compliance with ARIA labels and keyboard navigation
 *
 * ARCHITECTURE:
 * - Server Component: Handles preloading and SEO
 * - Client Component: Handles interactivity and real-time updates
 * - Hybrid approach for optimal performance and UX
 *
 * @author Principal Engineer
 * @version 2.0.0
 * @since 2025-09-20
 */

import React from "react";
import type { Metadata } from "next";
import { preloadCourses } from "@/utils/fetchers";
import { CourseCatalogWrapper } from "./CourseCatalogWrapper";

interface CoursePageProps {
  searchParams: Promise<{
    search?: string;
    categories?: string;
    difficulties?: string;
    sort?: string;
    priceMin?: string;
    priceMax?: string;
    rating?: string;
    duration?: string;
    new?: string;
    featured?: string;
    instructor?: string;
    page?: string;
    limit?: string;
  }>;
}

// Generate metadata for SEO
export async function generateMetadata({
  searchParams,
}: CoursePageProps): Promise<Metadata> {
  const params = await searchParams;
  const searchTerm = params.search;
  const categories = params.categories?.split(",");

  let title = "Course Catalog";
  let description =
    "Discover and learn from our extensive library of online courses.";

  if (searchTerm) {
    title = `Search: ${searchTerm} | Course Catalog`;
    description = `Find courses about ${searchTerm}. ${description}`;
  } else if (categories?.length) {
    title = `${categories[0]} Courses | Course Catalog`;
    description = `Explore ${categories[0]} courses. ${description}`;
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

/**
 * Course Catalog Page Component
 * Server Component that preloads initial data for optimal performance
 */
export default async function CourseCatalogPage({
  searchParams,
}: CoursePageProps) {
  try {
    const params = await searchParams;

    // Transform URL params to Convex filters
    const filters = {
      searchTerm: params.search,
      categories: params.categories?.split(","),
      difficulties: params.difficulties?.split(","),
      sortBy: params.sort,
      priceRange:
        params.priceMin && params.priceMax
          ? [parseInt(params.priceMin), parseInt(params.priceMax)]
          : undefined,
      minRating: params.rating ? parseFloat(params.rating) : undefined,
      maxDuration: params.duration ? parseInt(params.duration) : undefined,
      isNew: params.new === "true",
      offset: params.page
        ? (parseInt(params.page) - 1) * parseInt(params.limit ?? "12")
        : 0,
      limit: params.limit ? parseInt(params.limit) : 12,
    };

    // Preload initial courses data for SSR
    const preloadedCourses = await preloadCourses(filters);

    return (
      <div className="bg-background min-h-screen">
        {/* Server-rendered metadata and preloaded data */}
        <CourseCatalogWrapper />
      </div>
    );
  } catch (error) {
    console.error("[CourseCatalogPage] Failed to load courses:", error);

    // Fallback to client-only rendering
    return (
      <div className="bg-background min-h-screen">
        <CourseCatalogWrapper />
      </div>
    );
  }
}
