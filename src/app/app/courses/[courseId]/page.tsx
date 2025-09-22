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
import { getCourse } from "@/utils/fetchers";
import type { Id } from "convex/_generated/dataModel";

// Enhanced debugging logger for course pages
const createCourseLogger = (context: string) => ({
  info: (message: string, data?: Record<string, unknown>) => {
    console.log(
      `📚 [CoursePage:${context}] ${message}`,
      data ? JSON.stringify(data, null, 2) : "",
    );
  },
  warn: (message: string, data?: Record<string, unknown>) => {
    console.warn(
      `⚠️ [CoursePage:${context}] ${message}`,
      data ? JSON.stringify(data, null, 2) : "",
    );
  },
  error: (message: string, error?: Error) => {
    console.error(`❌ [CoursePage:${context}] ${message}`, error);
  },
  debug: (message: string, data?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === "development") {
      console.debug(`🔍 [CoursePage:${context}] ${message}`, data);
    }
  },
});

interface CoursePageProps {
  params: Promise<{
    courseId: string;
  }>;
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: CoursePageProps): Promise<Metadata> {
  const logger = createCourseLogger("generateMetadata");

  try {
    const resolvedParams = await params;

    logger.info("🌐 Generating metadata for course", {
      courseId: resolvedParams.courseId,
      timestamp: new Date().toISOString(),
    });

    // Try to get auth token
    let token: string | undefined;
    try {
      const { getToken } = await auth();
      token = (await getToken({ template: "convex" })) ?? undefined;

      logger.debug("🔑 Auth token obtained for metadata", {
        hasToken: !!token,
        tokenLength: token?.length,
      });
    } catch {
      // Continue without auth for public courses
      token = undefined;
      logger.warn(
        "⚠️ No auth token available for metadata - continuing with public access",
      );
    }

    // Get course data for metadata
    logger.debug("🔍 Getting course data for metadata");
    const courseData = await getCourse(resolvedParams.courseId);

    if (!courseData) {
      logger.warn("⚠️ Course not found for metadata generation", {
        courseId: resolvedParams.courseId,
      });
      return {
        title: "Course Not Found",
        description: "The requested course could not be found.",
      };
    }

    logger.info("✅ Course metadata generated successfully", {
      courseId: resolvedParams.courseId,
      title: courseData?.title,
      hasDescription: !!courseData?.description,
      hasShortDescription: !!courseData?.shortDescription,
    });

    return {
      title: `${courseData?.title || "Course"} | Course Details`,
      description:
        courseData?.shortDescription ?? courseData?.description?.slice(0, 160),
      openGraph: {
        title: courseData?.title || "Course",
        description:
          courseData?.shortDescription ??
          courseData?.description?.slice(0, 160),
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: courseData?.title || "Course",
        description:
          courseData?.shortDescription ??
          courseData?.description?.slice(0, 160),
      },
    };
  } catch (error) {
    logger.error(
      "❌ Failed to generate metadata",
      error instanceof Error ? error : new Error("Unknown error"),
    );
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
  const logger = createCourseLogger("CoursePage");

  try {
    const resolvedParams = await params;

    logger.info("🚀 Course page initialization", {
      courseId: resolvedParams.courseId,
      timestamp: new Date().toISOString(),
    });

    // Validate courseId format (basic check)
    if (!resolvedParams.courseId || resolvedParams.courseId.length < 10) {
      logger.error(
        "❌ Invalid courseId format",
        new Error(`Invalid courseId format: ${resolvedParams.courseId}`),
      );
      notFound();
    }

    logger.debug("✅ CourseId validation passed", {
      courseId: resolvedParams.courseId,
      length: resolvedParams.courseId.length,
    });

    // Try to get auth token
    let token: string | undefined;
    try {
      const { getToken } = await auth();
      token = (await getToken({ template: "convex" })) ?? undefined;

      logger.info("🔑 Authentication check completed", {
        hasToken: !!token,
        tokenLength: token?.length,
        isAuthenticated: !!token,
      });
    } catch (authError) {
      // Continue without auth for public courses
      token = undefined;
      logger.warn("⚠️ Authentication failed - continuing as guest", {
        error:
          authError instanceof Error ? authError.message : "Unknown auth error",
      });
    }

    // Get course data to check if it exists
    try {
      logger.debug("🔍 Getting course data", {
        courseId: resolvedParams.courseId,
        hasAuthToken: !!token,
      });

      const courseData = await getCourse(resolvedParams.courseId);

      // Check if course exists
      if (!courseData) {
        logger.error(
          "❌ Course not found in database",
          new Error("Course does not exist or is not accessible"),
        );
        notFound();
      }
      logger.info("✅ Course data preloaded successfully", {
        courseId: courseData?.id,
        title: courseData?.title,
        modulesCount: courseData?.modules?.length || 0,
        status: courseData?.status,
        hasDescription: !!courseData?.description,
      });
    } catch (error) {
      logger.error(
        "❌ Error preloading course data",
        error instanceof Error ? error : new Error("Unknown error"),
      );
      notFound();
    }

    logger.info("✅ Course page ready to render", {
      courseId: resolvedParams.courseId,
    });

    return (
      <div className="bg-background min-h-screen">
        <CourseDetailsWrapper courseId={resolvedParams.courseId} />
      </div>
    );
  } catch (error) {
    logger.error(
      "❌ Critical error loading course page",
      error instanceof Error ? error : new Error("Unknown error"),
    );
    notFound();
  }
}
