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

    // Preload course data
    logger.debug("🔍 Preloading course data for metadata");
    const preloadedCourse = await preloadQuery(
      api.courses.getCourseDetails,
      { courseId: resolvedParams.courseId as Id<"courses"> },
      { token },
    );

    if (!preloadedCourse) {
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
      title: preloadedCourse.title,
      hasDescription: !!preloadedCourse.description,
      hasShortDescription: !!preloadedCourse.shortDescription,
    });

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
  } catch (error) {
    logger.error("❌ Failed to generate metadata", {
      error: error instanceof Error ? error.message : "Unknown error",
      params: await params,
    });
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
      logger.error("❌ Invalid courseId format", {
        courseId: resolvedParams.courseId,
        length: resolvedParams.courseId?.length,
        minimum: 10,
      });
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

    // Preload course data to check if it exists
    try {
      logger.debug("🔍 Preloading course data", {
        courseId: resolvedParams.courseId,
        hasAuthToken: !!token,
      });

      const preloadedCourse = await preloadQuery(
        api.courses.getCourseDetails,
        { courseId: resolvedParams.courseId as Id<"courses"> },
        { token },
      );

      // Check if course exists
      if (!preloadedCourse) {
        logger.error("❌ Course not found in database", {
          courseId: resolvedParams.courseId,
          reason: "Course does not exist or is not accessible",
        });
        notFound();
      }

      logger.info("✅ Course data preloaded successfully", {
        courseId: preloadedCourse._id,
        title: preloadedCourse.title,
        modulesCount: preloadedCourse.modules?.length || 0,
        isPublished: preloadedCourse.isPublished,
        hasDescription: !!preloadedCourse.description,
      });
    } catch (error) {
      logger.error("❌ Error preloading course data", {
        error: error instanceof Error ? error.message : "Unknown error",
        courseId: resolvedParams.courseId,
      });
      notFound();
    }

    logger.info("✅ Course page ready to render", {
      courseId: resolvedParams.courseId,
      timestamp: new Date().toISOString(),
    });

    return (
      <div className="bg-background min-h-screen">
        <CourseDetailsWrapper courseId={resolvedParams.courseId} />
      </div>
    );
  } catch (error) {
    logger.error("❌ Critical error loading course page", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    notFound();
  }
}
