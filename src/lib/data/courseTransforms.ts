/**
 * COURSE DATA TRANSFORMATION UTILITIES
 *
 * Transforms Convex database responses to frontend type-safe interfaces.
 * Handles data mapping, type conversion, and default value assignment.
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2024-01-15
 */

import type { Id } from "convex/_generated/dataModel";
import type {
  CourseSummary,
  CourseStats,
  CourseCategoryType,
  CourseDifficultyLevel,
  CourseStatus,
} from "@/types/courses";

/**
 * Raw course data from Convex database
 */
export interface ConvexCourseData {
  _id: Id<"courses">;
  _creationTime: number;
  title?: string;
  description?: string;
  shortDescription?: string;
  category?: string;
  difficulty?: string;
  status?: string;
  thumbnailUrl?: string;
  estimatedDuration?: number;
  pricing?: {
    isFree: boolean;
    price?: number;
    currency?: string;
    discountPercentage?: number;
    originalPrice?: number;
    paymentType?: string;
  };
  authorId?: Id<"users">;
  // Frontend compatibility fields from getCourseById
  id?: string;
  rating?: number;
  reviewCount?: number;
  enrollmentCount?: number;
  featured?: boolean;
  trending?: boolean;
  isNew?: boolean;
  learningObjectives?: string[];
  modules?: Array<{
    id: string;
    title: string;
    description?: string;
    estimatedDuration?: number;
    lessonCount?: number;
  }>;
  author?: {
    name: string;
    title?: string;
    bio?: string;
    avatar?: string;
  };
  userProgress?: number;
  // Legacy fields for backward compatibility
  skills?: string[];
  price?: number;
  deletedAt?: number;
}

/**
 * Transform Convex course data to CourseSummary frontend interface
 */
export function transformConvexCourse(
  convexCourse: ConvexCourseData,
  author?: {
    id: Id<"users">;
    name: string;
    title?: string;
    avatarUrl?: string;
  },
): CourseSummary {
  return {
    // Primary identifiers
    id: (convexCourse.id ?? convexCourse._id) as Id<"courses">,
    _id: convexCourse._id,

    // Basic course information
    title: convexCourse.title ?? "Untitled Course",
    shortDescription:
      convexCourse.shortDescription ?? "No description available",
    category: (convexCourse.category as CourseCategoryType) ?? "development",
    difficulty:
      (convexCourse.difficulty as CourseDifficultyLevel) ?? "beginner",
    status: (convexCourse.status as CourseStatus) ?? "draft",

    // Content structure - use data from Convex if available
    modulesCount: convexCourse.modules?.length ?? 0,
    lessonsCount:
      convexCourse.modules?.reduce(
        (sum, module) => sum + (module.lessonCount ?? 0),
        0,
      ) ?? 0,
    modules: convexCourse.modules ?? [],

    // Media and pricing
    thumbnailUrl: convexCourse.thumbnailUrl,
    pricing: convexCourse.pricing
      ? {
          ...convexCourse.pricing,
          currency:
            convexCourse.pricing.currency === "USD" ||
            convexCourse.pricing.currency === "EUR" ||
            convexCourse.pricing.currency === "EGP"
              ? convexCourse.pricing.currency
              : "USD",
          paymentType:
            convexCourse.pricing.paymentType === "one-time" ||
            convexCourse.pricing.paymentType === "subscription" ||
            convexCourse.pricing.paymentType === "per-module"
              ? convexCourse.pricing.paymentType
              : "one-time",
        }
      : {
          type: convexCourse.price && convexCourse.price > 0 ? "paid" : "free",
          isFree: !convexCourse.price || convexCourse.price === 0,
          amount: convexCourse.price ?? 0,
          currency: "USD" as const,
          originalAmount: convexCourse.price ?? 0,
        },

    // Author information - prioritize convex author data
    author: convexCourse.author
      ? {
          id: (convexCourse.authorId ?? "") as Id<"users">,
          _id: (convexCourse.authorId ?? "") as Id<"users">,
          name: convexCourse.author.name,
          title: convexCourse.author.title,
          bio: convexCourse.author.bio,
          avatarUrl: convexCourse.author.avatar,
          isVerified: false,
        }
      : author
        ? {
            id: author.id as Id<"users">,
            _id: author.id as Id<"users">,
            name: author.name,
            title: author.title,
            avatarUrl: author.avatarUrl,
            isVerified: false,
          }
        : {
            id: (convexCourse.authorId ?? "") as Id<"users">,
            _id: (convexCourse.authorId ?? "") as Id<"users">,
            name: "Unknown Author",
            isVerified: false,
          },

    // Statistics with data from convex
    stats: {
      enrollmentCount: convexCourse.enrollmentCount ?? 0,
      completionRate: 0,
      averageCompletionTime: 0,
      averageRating: convexCourse.rating ?? 0,
      ratingCount: convexCourse.reviewCount ?? 0,
      totalReviews: convexCourse.reviewCount ?? 0,
      viewCount: 0,
      recentEnrollments: 0,
    },

    // Skills and metadata
    skills: convexCourse.skills ?? [],
    estimatedDuration: convexCourse.estimatedDuration ?? 0,

    // Timestamps
    createdAt: convexCourse._creationTime,
    updatedAt: convexCourse._creationTime,

    // Additional properties for compatibility - use convex data
    rating: convexCourse.rating,
    trending: convexCourse.trending ?? false,
    featured: convexCourse.featured ?? false,
    enrollmentCount: convexCourse.enrollmentCount,

    // User state
    isEnrolled: false,
    progress: convexCourse.userProgress
      ? {
          totalLessons: 0,
          completedLessons: 0,
          progressPercentage: convexCourse.userProgress,
          timeSpent: 0,
          lastAccessed: new Date(),
        }
      : undefined,
  };
}

/**
 * Transform array of Convex courses to CourseSummary array
 */
export function transformConvexCourses(
  convexCourses: ConvexCourseData[],
  authors?: Map<
    Id<"users">,
    { id: Id<"users">; name: string; title?: string; avatarUrl?: string }
  >,
): CourseSummary[] {
  return convexCourses.map((course) => {
    const author = course.authorId ? authors?.get(course.authorId) : undefined;
    return transformConvexCourse(course, author);
  });
}

/**
 * Create a default empty course for error states
 */
export function createEmptyCourseSummary(): CourseSummary {
  return {
    id: "" as Id<"courses">,
    _id: "" as Id<"courses">,
    title: "",
    shortDescription: "",
    category: "development",
    difficulty: "beginner",
    status: "draft",
    modulesCount: 0,
    lessonsCount: 0,
    modules: [],
    thumbnailUrl: undefined,
    pricing: {
      type: "free",
      isFree: true,
      amount: 0,
      currency: "USD",
      originalAmount: 0,
    },
    author: {
      id: "" as Id<"users">,
      _id: "" as Id<"users">,
      name: "",
      isVerified: false,
    },
    stats: {
      enrollmentCount: 0,
      completionRate: 0,
      averageCompletionTime: 0,
      averageRating: 0,
      ratingCount: 0,
      totalReviews: 0,
      viewCount: 0,
      recentEnrollments: 0,
    },
    skills: [],
    estimatedDuration: 0,
    createdAt: 0,
    updatedAt: 0,
    rating: 0,
    trending: false,
    featured: false,
    enrollmentCount: 0,
    isEnrolled: false,
    progress: undefined,
  };
}

/**
 * Enhance CourseSummary with statistics data
 */
export function enhanceCourseWithStats(
  course: CourseSummary,
  stats: Partial<CourseStats>,
): CourseSummary {
  return {
    ...course,
    stats: {
      ...course.stats,
      ...stats,
    },
    rating: stats.averageRating || course.rating,
    enrollmentCount: stats.enrollmentCount || course.enrollmentCount,
  };
}

/**
 * Type guard to check if data is a valid Convex course
 */
export function isValidConvexCourse(data: any): data is ConvexCourseData {
  return (
    data &&
    typeof data === "object" &&
    data._id &&
    typeof data._creationTime === "number" &&
    data.authorId
  );
}
