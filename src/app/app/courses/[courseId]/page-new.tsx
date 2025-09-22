/**
 * COURSE DETAIL PAGE
 *
 * Modern LMS course page with Convex preloading for optimal SSR performance.
 * Uses Server Components for preloading and Client Components for reactivity.
 *
 * @author Principal Engineer
 * @version 2.0.0
 * @since 2025-09-20
 */

import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { preloadCourse, preloadCourseProgress } from "@/utils/fetchers";
import { CourseDetailsWrapper } from "./CourseDetailsWrapper";
import { preloadedQueryResult } from "convex/nextjs";

interface CoursePageProps {
  params: Promise<{
    courseId: string;
  }>;
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: CoursePageProps): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const preloadedCourse = await preloadCourse(resolvedParams.courseId);
    const course = preloadedQueryResult(preloadedCourse);

    if (!course) {
      return {
        title: "Course Not Found",
        description: "The requested course could not be found.",
      };
    }

    return {
      title: `${course.title} | Course Details`,
      description: course.shortDescription ?? course.description?.slice(0, 160),
      openGraph: {
        title: course.title,
        description:
          course.shortDescription ?? course.description?.slice(0, 160),
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: course.title,
        description:
          course.shortDescription ?? course.description?.slice(0, 160),
      },
    };
  } catch {
    return {
      title: "Course Not Found",
      description: "The requested course could not be found.",
    };
  }
}

/**
 * Course Detail Page Component
 * Uses Convex preloading for optimal SSR performance
 */
export default async function CoursePage({ params }: CoursePageProps) {
  try {
    const resolvedParams = await params;

    // Preload course data with Convex
    const preloadedCourse = await preloadCourse(resolvedParams.courseId);

    // Check if course exists before proceeding
    const courseResult = preloadedQueryResult(preloadedCourse);
    if (!courseResult) {
      notFound();
    }

    // Mock user ID - in real app, get from auth context
    const userId = "user-123";

    // Preload user progress if enrolled
    let preloadedProgress;
    try {
      preloadedProgress = await preloadCourseProgress(
        resolvedParams.courseId,
        userId,
      );
    } catch {
      // User not enrolled or progress not available
      preloadedProgress = null;
    }

    return <CourseDetailsWrapper courseId={resolvedParams.courseId} />;
  } catch (error) {
    console.error("[CoursePage] Failed to load course:", error);
    notFound();
  }
}
