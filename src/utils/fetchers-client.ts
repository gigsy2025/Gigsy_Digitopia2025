/**
 * Client-safe Convex utilities for Next.js App Router
 *
 * This file contains only client-safe utilities and types that can be
 * imported by both Server Components and Client Components.
 *
 * @version 2.0.0
 * @author Principal Engineering Team
 */

// Legacy types for backward compatibility
import type { Course } from "../types/course";

// Modern types from courses.ts
import type {
  CourseCategoryType,
  CourseDifficultyLevel,
  CourseStatus,
} from "../types/courses";

// =============================================================================
// CORE TYPES AND INTERFACES (CLIENT-SAFE)
// =============================================================================

interface ConvexCourseData {
  _id: string;
  _creationTime: number;
  title: string;
  description: string;
  shortDescription?: string;
  category?: string;
  difficultyLevel?: string;
  estimatedDuration?: number;
  price?: number;
  thumbnailUrl?: string;
  bannerUrl?: string;
  status?: string;
  enrollmentCount?: number;
  averageRating?: number;
  lastUpdated?: number;
  authorId?: string;
  author?: {
    _id: string;
    name: string;
    avatarUrl?: string;
  };
  modules?: Array<{
    _id: string;
    title: string;
    description?: string;
    lessons?: Array<{
      _id: string;
      title: string;
      estimatedDuration?: number;
    }>;
  }>;
}

// =============================================================================
// DATA TRANSFORMATION UTILITIES (CLIENT-SAFE)
// =============================================================================

/**
 * Transform Convex course data to legacy Course interface
 * CLIENT-SAFE: Can be used in both Server and Client Components
 */
export function transformConvexCourse(courseData: ConvexCourseData): Course {
  return {
    id: courseData._id,
    title: courseData.title,
    description: courseData.description,
    shortDescription: courseData.shortDescription,
    category: courseData.category ?? "technology",
    difficulty:
      (courseData.difficultyLevel === "expert"
        ? "advanced"
        : (courseData.difficultyLevel as
            | "beginner"
            | "intermediate"
            | "advanced")) ?? "beginner",
    estimatedDurationMinutes: courseData.estimatedDuration ?? 0,
    price: courseData.price ?? 0,
    thumbnailUrl: courseData.thumbnailUrl,
    bannerUrl: courseData.bannerUrl,
    status:
      (courseData.status as "draft" | "published" | "archived") ?? "draft",
    enrollmentCount: courseData.enrollmentCount ?? 0,
    averageRating: courseData.averageRating ?? 0,
    createdAt:
      courseData._creationTime && !isNaN(courseData._creationTime)
        ? new Date(courseData._creationTime).toISOString()
        : new Date().toISOString(),
    updatedAt:
      courseData.lastUpdated && !isNaN(courseData.lastUpdated)
        ? new Date(courseData.lastUpdated).toISOString()
        : new Date().toISOString(),
    authorId: courseData.authorId ?? courseData.author?._id ?? "",
    authorName: courseData.author?.name ?? "Unknown Author",
    authorAvatar: courseData.author?.avatarUrl,
    authors: courseData.author
      ? [
          {
            id: courseData.author._id,
            name: courseData.author.name,
            avatarUrl: courseData.author.avatarUrl,
          },
        ]
      : [],
    totalLessons:
      courseData.modules?.reduce(
        (total, module) => total + (module.lessons?.length ?? 0),
        0,
      ) ?? 0,
    modules:
      courseData.modules?.map((module, index) => ({
        id: module._id,
        title: module.title,
        description: module.description,
        sequenceIndex: index,
        lessons:
          module.lessons?.map((lesson, lessonIndex) => ({
            id: lesson._id,
            title: lesson.title,
            duration: lesson.estimatedDuration ?? 0,
            sequenceIndex: lessonIndex,
          })) ?? [],
      })) ?? [],
  };
}

/**
 * Transform array of Convex courses
 * CLIENT-SAFE: Can be used in both Server and Client Components
 */
export function transformConvexCourses(courses: ConvexCourseData[]): Course[] {
  return courses.map(transformConvexCourse);
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type { ConvexCourseData };
