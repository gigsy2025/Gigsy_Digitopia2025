/**
 * COURSE DETAIL PAGE
 *
 * Modern LMS course page with Convex integration.
 * Uses Server Components for preloading and Client Components for reactivity.
 *
 * @author Principal Engineer
 * @version 2.0.0
 * @since 2025-09-20
 */

import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api } from "convex/_generated/api";
import { preloadQuery } from "convex/nextjs";
import { auth } from "@clerk/nextjs/server";
import { CourseDetailsWrapper } from "./CourseDetailsWrapper";
import type { Id } from "convex/_generated/dataModel";

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

    // Try to get auth token
    let token: string | undefined;
    try {
      const { getToken } = await auth();
      token = (await getToken({ template: "convex" })) ?? undefined;
    } catch {
      // Continue without auth for public courses
      token = undefined;
    }

    // Preload course data
    const preloadedCourse = await preloadQuery(
      api.courses.getCourseDetails,
      { courseId: resolvedParams.courseId as Id<"courses"> },
      { token },
    );

    if (!preloadedCourse) {
      return {
        title: "Course Not Found",
        description: "The requested course could not be found.",
      };
    }

    return {
      title: `${preloadedCourse.title} | Course Details`,
      description:
        preloadedCourse.shortDescription ??
        preloadedCourse.description?.slice(0, 160),
      openGraph: {
        title: preloadedCourse.title,
        description:
          preloadedCourse.shortDescription ??
          preloadedCourse.description?.slice(0, 160),
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: preloadedCourse.title,
        description:
          preloadedCourse.shortDescription ??
          preloadedCourse.description?.slice(0, 160),
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

    // Validate courseId format (basic check)
    if (!resolvedParams.courseId || resolvedParams.courseId.length < 10) {
      console.error("Invalid courseId format:", resolvedParams.courseId);
      notFound();
    }

    // Try to get auth token
    let token: string | undefined;
    try {
      const { getToken } = await auth();
      token = (await getToken({ template: "convex" })) ?? undefined;
    } catch {
      // Continue without auth for public courses
      token = undefined;
    }

    // Preload course data to check if it exists
    try {
      const preloadedCourse = await preloadQuery(
        api.courses.getCourseDetails,
        { courseId: resolvedParams.courseId as Id<"courses"> },
        { token },
      );

      // Check if course exists
      if (!preloadedCourse) {
        console.error("Course not found for ID:", resolvedParams.courseId);
        notFound();
      }
    } catch (error) {
      console.error("Error preloading course:", error);
      notFound();
    }

    return (
      <div className="bg-background min-h-screen">
        <CourseDetailsWrapper courseId={resolvedParams.courseId} />
      </div>
    );
  } catch (error) {
    console.error("Error loading course page:", error);
    notFound();
  }
}
