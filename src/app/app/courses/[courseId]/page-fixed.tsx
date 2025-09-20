/**
 * COURSE DETAIL PAGE
 *
 * Modern LMS course page that uses direct Convex queries to avoid server-only imports.
 * This resolves the build error while maintaining the Convex integration.
 *
 * @author Principal Engineer
 * @version 2.0.0
 * @since 2025-09-20
 */

import React from "react";
import type { Metadata } from "next";
import { CourseDetailsWrapper } from "./CourseDetailsWrapper";

interface CoursePageProps {
  params: Promise<{
    courseId: string;
  }>;
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: CoursePageProps): Promise<Metadata> {
  const resolvedParams = await params;

  return {
    title: "Course Details | LMS",
    description: "Learn with our comprehensive course catalog.",
  };
}

/**
 * Course Detail Page Component
 * Uses direct Convex queries for simplicity and to avoid server-only import issues
 */
export default async function CoursePage({ params }: CoursePageProps) {
  const resolvedParams = await params;

  return <CourseDetailsWrapper courseId={resolvedParams.courseId} />;
}
