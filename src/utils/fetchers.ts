/**
 * Enterprise-grade Convex preloading system for Next.js App Router
 *
 * ARCHITECTURE OVERVIEW:
 * - Server Components: preloadQuery + usePreloadedQuery pattern
 * - Client Components: Direct useQuery for reactivity
 * - Server Actions/Route Handlers: fetchQuery for one-time operations
 * - Authentication: Clerk JWT tokens integrated throughout
 *
 * PERFORMANCE FEATURES:
 * - React.cache() for server-side deduplication
 * - Type-safe Convex query integration
 * - Optimized for Next.js App Router SSR/SSG
 * - Legacy HTTP fetcher compatibility layer
 *
 * BEST PRACTICES IMPLEMENTED:
 * - No explicit 'any' types per ESLint rules
 * - Proper error boundaries and fallbacks
 * - Consistent authentication handling
 * - SOLID principles with single responsibility
 *
 * @version 2.0.0
 * @author Principal Engineering Team
 */

import { cache } from "react";
import { preloadQuery, fetchQuery } from "convex/nextjs";
import { auth } from "@clerk/nextjs/server";
import { api } from "convex/_generated/api";
import type { Preloaded } from "convex/react";
import type { Id } from "convex/_generated/dataModel";
import { notFound } from "next/navigation";

// Legacy types for backward compatibility
import type {
  Course,
  Module,
  Lesson,
  LessonWithNavigation,
  CourseProgress,
  LessonProgress,
} from "../types/course";

// Modern types from courses.ts
import type {
  CourseCategoryType,
  CourseDifficultyLevel,
  CourseStatus,
} from "../types/courses";

// =============================================================================
// CONVEX QUERY RESPONSE TYPES
// =============================================================================

interface ConvexRequestOptions {
  token?: string;
  skipAuth?: boolean;
  url?: string;
}

// Base interface for course data with _creationTime (from getCourseDetails)
interface ConvexCourseDetails {
  _id: string;
  _creationTime: number;
  title: string;
  description: string;
  shortDescription?: string;
  author: {
    _id: string;
    name: string;
    avatarUrl?: string;
  };
  modules: Array<{
    _id: string;
    title: string;
    description?: string;
    lessons: Array<{
      _id: string;
      title: string;
      estimatedDuration?: number;
    }>;
  }>;
}

// Interface for course data without _creationTime (from listWithDetails)
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

interface ConvexLessonData {
  _id: string;
  _creationTime?: number;
  title: string;
  description?: string;
  content: string | Id<"_storage">; // Can be text content, URL, or storage ID
  contentType:
    | "text"
    | "video"
    | "audio"
    | "interactive"
    | "quiz"
    | "assignment"
    | "live"
    | "external"
    | "file";
  videoUrl?: string; // Legacy field for backward compatibility
  estimatedDuration?: number;
  moduleId: string;
  courseId: string;
  order: number; // Actual field name in schema
  sequenceIndex?: number; // Legacy compatibility
  thumbnailId?: string;
  thumbnailUrl?: string;
  resources?: Array<{
    title: string;
    url?: string;
    fileId?: string;
    type: "pdf" | "link" | "download" | "exercise" | "document";
    fileSize?: string;
  }>;
  isPublished?: boolean;
  isFree?: boolean;
  isLocked?: boolean;
  updatedAt?: number;
  createdBy?: string;
  deletedAt?: number;
}

interface ConvexProgressData {
  progressPercentage?: number;
  completedLessons?: number;
  totalLessons?: number;
  lastAccessedAt?: number;
  enrolledAt?: number;
  estimatedTimeRemaining?: number;
  isCompleted?: boolean;
  watchedDuration?: number;
  totalDuration?: number;
  lastWatchedAt?: number;
  completedAt?: number;
}

// =============================================================================
// AUTHENTICATION UTILITIES
// =============================================================================

/**
 * Retrieve Clerk authentication token for Convex requests
 *
 * @returns JWT token string or undefined if not authenticated
 */
export async function getAuthToken(): Promise<string | undefined> {
  try {
    const { getToken } = await auth();
    return (await getToken({ template: "convex" })) ?? undefined;
  } catch (error) {
    console.error("[ConvexAuth] Failed to retrieve auth token:", error);
    return undefined;
  }
}

// =============================================================================
// DATA TRANSFORMATION UTILITIES
// =============================================================================

/**
 * Transform Convex course details to legacy Course interface
 * Specifically for getCourseDetails query response
 */
function transformConvexCourseDetails(courseData: ConvexCourseDetails): Course {
  return {
    id: courseData._id,
    title: courseData.title,
    description: courseData.description,
    shortDescription: courseData.shortDescription,
    authors: [
      {
        id: courseData.author._id,
        name: courseData.author.name,
        avatarUrl: courseData.author.avatarUrl,
      },
    ],
    estimatedDurationMinutes: 0, // Default since not in details
    difficulty: "beginner", // Default since not in details
    modules: courseData.modules.map((module, index) => ({
      id: module._id,
      title: module.title,
      description: module.description,
      sequenceIndex: index,
      lessons: module.lessons.map((lesson, lessonIndex) => ({
        id: lesson._id,
        title: lesson.title,
        durationSeconds: lesson.estimatedDuration
          ? lesson.estimatedDuration * 60
          : undefined,
        sequenceIndex: lessonIndex,
      })),
    })),
    totalLessons: courseData.modules.reduce(
      (total, module) => total + module.lessons.length,
      0,
    ),
    price: 0, // Default since not in details
    isFree: true, // Default since not in details
    category: "development", // Default since not in details
    createdAt:
      courseData._creationTime && !isNaN(courseData._creationTime)
        ? new Date(courseData._creationTime).toISOString()
        : new Date().toISOString(),
    status: "draft", // Default since not in details
  };
}

/**
 * Transform Convex course data to legacy Course interface
 * Ensures type safety and provides fallback values
 */
function transformConvexCourse(courseData: ConvexCourseData): Course {
  return {
    id: courseData._id,
    title: courseData.title,
    description: courseData.description,
    shortDescription: courseData.shortDescription,
    category: (courseData.category as CourseCategoryType) ?? "technology",
    difficulty:
      ((courseData.difficultyLevel === "expert"
        ? "advanced"
        : courseData.difficultyLevel) as CourseDifficultyLevel) ?? "beginner",
    estimatedDurationMinutes: courseData.estimatedDuration ?? 0,
    price: courseData.price ?? 0,
    thumbnailUrl: courseData.thumbnailUrl,
    bannerUrl: courseData.bannerUrl,
    status: (courseData.status as CourseStatus) ?? "draft",
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
 */
export function transformConvexCourses(courses: ConvexCourseData[]): Course[] {
  return courses.map(transformConvexCourse);
}

/**
 * Transform Convex lesson data to legacy LessonWithNavigation interface
 */
function transformConvexLesson(
  lessonData: ConvexLessonData,
  quiz: unknown[] = [],
): LessonWithNavigation {
  // Handle video URL based on content type - following Video URL Resolution Strategy
  let videoUrl: string | undefined;
  let content: string | undefined;

  // Debug logging to understand actual data structure
  console.log("[transformConvexLesson] Processing lesson data:", {
    id: lessonData._id,
    title: lessonData.title,
    contentType: lessonData.contentType,
    content: lessonData.content,
    order: lessonData.order,
    sequenceIndex: lessonData.sequenceIndex,
  });

  // Check if lesson data has contentType (new schema)
  if ("contentType" in lessonData && lessonData.contentType) {
    if (lessonData.contentType === "video") {
      // If content is a video and content is a URL string, use it as videoUrl
      if (
        typeof lessonData.content === "string" &&
        lessonData.content.startsWith("http")
      ) {
        videoUrl = lessonData.content;
      } else if (
        typeof lessonData.content === "string" &&
        lessonData.content.length < 50
      ) {
        // Likely a Convex storage ID - store it as videoUrl for component to resolve
        videoUrl = lessonData.content;
      }
      // If content is a storage ID, we'll need to resolve it separately
    } else if (lessonData.contentType === "text") {
      // Text content goes to content field
      content =
        typeof lessonData.content === "string" ? lessonData.content : undefined;
    } else if (lessonData.contentType === "external") {
      // External video (YouTube, Vimeo, etc.)
      if (typeof lessonData.content === "string") {
        videoUrl = lessonData.content;
      }
    } else if (lessonData.contentType === "file") {
      // File content could be video, store as videoUrl for component to resolve
      if (typeof lessonData.content === "string") {
        videoUrl = lessonData.content;
      }
    }
  } else {
    // Fallback for legacy data or when contentType is missing
    videoUrl = lessonData.videoUrl;
    content =
      typeof lessonData.content === "string" ? lessonData.content : undefined;
  }

  // Following Defensive Array Handling memory - ensure quiz is properly validated
  const validatedQuiz = Array.isArray(quiz) ? quiz : [];

  // Map 'order' field from new schema to 'sequenceIndex' for legacy compatibility
  const sequenceIndex = lessonData.order ?? lessonData.sequenceIndex ?? 0;

  const transformedLesson = {
    id: lessonData._id,
    title: lessonData.title,
    content: content ?? "",
    contentHtml: content, // For backward compatibility with LessonViewer
    videoUrl: videoUrl,
    contentType: lessonData.contentType, // Add contentType for component logic
    estimatedDuration: lessonData.estimatedDuration ?? 0,
    moduleId: lessonData.moduleId ?? "",
    courseId: lessonData.courseId ?? "",
    sequenceIndex: sequenceIndex,
    thumbnailUrl: lessonData.thumbnailUrl,
    previousLesson: undefined, // Navigation computed in component
    nextLesson: undefined, // Navigation computed in component
    quiz: validatedQuiz as Array<{
      _id: string;
      question: string;
      options: Array<{ _id: string; text: string }>;
    }>,
  };

  console.log("[transformConvexLesson] Transformed result:", transformedLesson);

  return transformedLesson;
}

/**
 * Transform Convex progress data to legacy CourseProgress interface
 */
function transformCourseProgress(
  progressData: ConvexProgressData,
  courseId: string,
  userId: string,
): CourseProgress {
  return {
    courseId,
    userId,
    progressPercentage: progressData.progressPercentage ?? 0,
    completedLessons: progressData.completedLessons ?? 0,
    totalLessons: progressData.totalLessons ?? 0,
    lastAccessedAt:
      progressData.lastAccessedAt && !isNaN(progressData.lastAccessedAt)
        ? new Date(progressData.lastAccessedAt).toISOString()
        : new Date().toISOString(),
    enrolledAt:
      progressData.enrolledAt && !isNaN(progressData.enrolledAt)
        ? new Date(progressData.enrolledAt).toISOString()
        : new Date().toISOString(),
    estimatedTimeRemaining: progressData.estimatedTimeRemaining ?? 0,
  };
}

/**
 * Transform Convex progress data to legacy LessonProgress interface
 */
function transformLessonProgress(
  progressData: ConvexProgressData,
  lessonId: string,
  userId: string,
): LessonProgress {
  return {
    lessonId,
    userId,
    completed: progressData.isCompleted ?? false,
    isCompleted: progressData.isCompleted ?? false,
    watchedDuration: progressData.watchedDuration ?? 0,
    totalDuration: progressData.totalDuration ?? 0,
    progressPercentage: progressData.progressPercentage ?? 0,
    lastWatchedAt:
      progressData.lastWatchedAt && !isNaN(progressData.lastWatchedAt)
        ? new Date(progressData.lastWatchedAt).toISOString()
        : new Date().toISOString(),
    completedAt:
      progressData.completedAt && !isNaN(progressData.completedAt)
        ? new Date(progressData.completedAt).toISOString()
        : undefined,
  };
}

// =============================================================================
// SERVER COMPONENT PRELOADING FUNCTIONS
// =============================================================================

/**
 * Preload course details for Server Components
 * Uses React.cache() for deduplication across component tree
 */
export const preloadCourse = cache(
  async (
    courseId: string,
    options: ConvexRequestOptions = {},
  ): Promise<Preloaded<typeof api.courses.getCourseDetails>> => {
    const token = options.skipAuth
      ? undefined
      : (options.token ?? (await getAuthToken()));

    try {
      return await preloadQuery(
        api.courses.getCourseDetails,
        { courseId: courseId as Id<"courses"> },
        { token, ...(options.url && { url: options.url }) },
      );
    } catch (error) {
      console.error("[ConvexPreload] Course preload failed:", {
        courseId,
        error,
      });
      throw error;
    }
  },
);

/**
 * Preload courses list with filtering for Server Components
 */
export const preloadCourses = cache(
  async (
    filters: Record<string, unknown> = {},
    options: ConvexRequestOptions = {},
  ): Promise<Preloaded<typeof api.courses.listWithDetails>> => {
    const token = options.skipAuth
      ? undefined
      : (options.token ?? (await getAuthToken()));

    try {
      return await preloadQuery(api.courses.listWithDetails, filters, {
        token,
        ...(options.url && { url: options.url }),
      });
    } catch (error) {
      console.error("[ConvexPreload] Courses preload failed:", {
        filters,
        error,
      });
      throw error;
    }
  },
);

/**
 * Preload lesson with navigation context for Server Components
 */
export const preloadLessonWithNavigation = cache(
  async (
    lessonId: string,
    options: ConvexRequestOptions = {},
  ): Promise<Preloaded<typeof api.lessons.getLessonById>> => {
    const token = options.skipAuth
      ? undefined
      : (options.token ?? (await getAuthToken()));

    try {
      return await preloadQuery(
        api.lessons.getLessonById,
        { lessonId: lessonId as Id<"lessons"> },
        { token, ...(options.url && { url: options.url }) },
      );
    } catch (error) {
      console.error("[ConvexPreload] Lesson preload failed:", {
        lessonId,
        error,
      });
      throw error;
    }
  },
);

/**
 * Preload course progress for Server Components
 */
export const preloadCourseProgress = cache(
  async (
    courseId: string,
    userId?: string,
    options: ConvexRequestOptions = {},
  ): Promise<Preloaded<typeof api.lessons.getCourseProgress>> => {
    const token = options.skipAuth
      ? undefined
      : (options.token ?? (await getAuthToken()));

    try {
      return await preloadQuery(
        api.lessons.getCourseProgress,
        {
          courseId: courseId as Id<"courses">,
        },
        { token, ...(options.url && { url: options.url }) },
      );
    } catch (error) {
      console.error("[ConvexPreload] Course progress preload failed:", {
        courseId,
        userId,
        error,
      });
      throw error;
    }
  },
);

/**
 * Preload lesson progress for Server Components
 */
export const preloadLessonProgress = cache(
  async (
    lessonId: string,
    userId?: string,
    options: ConvexRequestOptions = {},
  ): Promise<Preloaded<typeof api.lessons.getProgress>> => {
    const token = options.skipAuth
      ? undefined
      : (options.token ?? (await getAuthToken()));

    try {
      return await preloadQuery(
        api.lessons.getProgress,
        {
          lessonId: lessonId as Id<"lessons">,
        },
        { token, ...(options.url && { url: options.url }) },
      );
    } catch (error) {
      console.error("[ConvexPreload] Lesson progress preload failed:", {
        lessonId,
        userId,
        error,
      });
      throw error;
    }
  },
);

// =============================================================================
// FETCH FUNCTIONS FOR SERVER ACTIONS & ROUTE HANDLERS
// =============================================================================

/**
 * Fetch single course for Server Actions/Route Handlers
 */
export async function fetchCourse(
  courseId: string,
  options: ConvexRequestOptions = {},
): Promise<Course | null> {
  const token = options.skipAuth
    ? undefined
    : (options.token ?? (await getAuthToken()));

  try {
    const convexCourse = await fetchQuery(
      api.courses.getCourseDetails,
      { courseId: courseId as Id<"courses"> },
      { token, ...(options.url && { url: options.url }) },
    );

    if (!convexCourse) {
      return null;
    }

    return transformConvexCourseDetails(convexCourse as ConvexCourseDetails);
  } catch (error) {
    console.error("[ConvexFetch] Course fetch failed:", { courseId, error });
    throw error;
  }
}

/**
 * Fetch courses list for Server Actions/Route Handlers
 */
export async function fetchCourses(
  filters: Record<string, unknown> = {},
  options: ConvexRequestOptions = {},
): Promise<{ courses: Course[]; total: number; hasMore: boolean }> {
  const token = options.skipAuth
    ? undefined
    : (options.token ?? (await getAuthToken()));

  try {
    const result = await fetchQuery(api.courses.listWithDetails, filters, {
      token,
      ...(options.url && { url: options.url }),
    });

    if (!result) {
      return { courses: [], total: 0, hasMore: false };
    }

    const courses = (result.courses as ConvexCourseData[]).map(
      transformConvexCourse,
    );

    return {
      courses,
      total: result.total,
      hasMore: result.hasMore,
    };
  } catch (error) {
    console.error("[ConvexFetch] Courses fetch failed:", { filters, error });
    throw error;
  }
}

/**
 * Validate if an ID matches the expected format for a specific table
 */
function isValidConvexId(
  id: string,
  tableType: "lessons" | "courses" | "modules",
): boolean {
  // Basic validation - Convex IDs are typically 32-character alphanumeric strings
  // Storage IDs often have different patterns and may be longer
  if (!id || typeof id !== "string") {
    console.error(`[isValidConvexId] Invalid ID type for ${tableType}:`, {
      id,
      type: typeof id,
    });
    return false;
  }

  // If the ID is too long or contains patterns typical of storage IDs, it's likely invalid
  if (id.length > 40 || id.includes("_storage") || id.startsWith("st_")) {
    console.error(
      `[isValidConvexId] ID appears to be storage ID for ${tableType}:`,
      {
        id,
        length: id.length,
        containsStorage: id.includes("_storage"),
        startsWithSt: id.startsWith("st_"),
      },
    );
    return false;
  }

  // Basic alphanumeric check
  const alphanumericPattern = /^[a-zA-Z0-9]+$/;
  const isValid = alphanumericPattern.test(id) && id.length >= 20;

  if (!isValid) {
    console.error(`[isValidConvexId] ID failed validation for ${tableType}:`, {
      id,
      length: id.length,
      isAlphanumeric: alphanumericPattern.test(id),
      minLength: id.length >= 20,
    });
  }

  return isValid;
}

/**
 * Resolve storage ID to actual URL using Convex storage
 */
async function resolveStorageUrl(
  storageId: string,
  token?: string,
): Promise<string | null> {
  try {
    const url = await fetchQuery(
      api.files.getFileUrl,
      { storageId: storageId as Id<"_storage"> },
      { token },
    );
    return url;
  } catch (error) {
    console.error("[resolveStorageUrl] Failed to resolve storage URL:", {
      storageId,
      error,
    });
    return null;
  }
}

/**
 * Fetch lesson with navigation for Server Actions/Route Handlers
 */
export async function fetchLessonWithNavigation(
  lessonId: string,
  options: ConvexRequestOptions = {},
): Promise<LessonWithNavigation | null> {
  const token = options.skipAuth
    ? undefined
    : (options.token ?? (await getAuthToken()));

  // Validate lesson ID format before making the query
  if (!isValidConvexId(lessonId, "lessons")) {
    console.error(
      "[fetchLessonWithNavigation] Invalid lesson ID format - returning null:",
      {
        lessonId,
        length: lessonId.length,
        type: typeof lessonId,
        suggestion:
          "Check if this is a storage ID being incorrectly used as lesson ID",
      },
    );
    return null;
  }

  try {
    const result = await fetchQuery(
      api.lessons.getLessonById,
      { lessonId: lessonId as Id<"lessons"> },
      { token, ...(options.url && { url: options.url }) },
    );

    if (!result?.lesson) {
      console.log(
        "[fetchLessonWithNavigation] No lesson found for valid ID:",
        lessonId,
      );
      return null;
    }

    // Debug logging to understand the actual data structure
    console.log("[fetchLessonWithNavigation] Raw lesson data:", result.lesson);

    let transformedLesson = transformConvexLesson(
      result.lesson as ConvexLessonData,
      result.quiz,
    );

    // Resolve storage URLs if videoUrl is a storage ID
    if (transformedLesson.videoUrl && isStorageId(transformedLesson.videoUrl)) {
      console.log(
        "[fetchLessonWithNavigation] Resolving storage URL:",
        transformedLesson.videoUrl,
      );
      const resolvedUrl = await resolveStorageUrl(
        transformedLesson.videoUrl,
        token,
      );
      if (resolvedUrl) {
        transformedLesson = {
          ...transformedLesson,
          videoUrl: resolvedUrl,
        };
        console.log(
          "[fetchLessonWithNavigation] Storage URL resolved:",
          resolvedUrl,
        );
      } else {
        console.warn(
          "[fetchLessonWithNavigation] Failed to resolve storage URL, keeping original:",
          transformedLesson.videoUrl,
        );
      }
    }

    console.log(
      "[fetchLessonWithNavigation] Final transformed lesson:",
      transformedLesson,
    );

    return transformedLesson;
  } catch (error) {
    console.error("[ConvexFetch] Lesson fetch failed:", { lessonId, error });

    // Check if it's the specific table validation error
    if (
      error instanceof Error &&
      error.message.includes("does not match the table name")
    ) {
      console.error(
        "[fetchLessonWithNavigation] Table validation error - this ID belongs to a different table:",
        {
          lessonId,
          errorMessage: error.message,
          suggestion:
            "This ID might be from _storage, courses, modules, or another table",
        },
      );
    }

    throw error;
  }
}

/**
 * Check if a string is a storage ID
 */
function isStorageId(id: string): boolean {
  // Storage IDs in Convex typically have specific patterns
  // This is a basic check - you might need to adjust based on actual storage ID patterns
  return (
    typeof id === "string" &&
    id.length >= 20 &&
    id.length <= 50 &&
    /^[a-zA-Z0-9]+$/.test(id) &&
    !id.startsWith("http")
  );
}

/**
 * Fetch course progress for Server Actions/Route Handlers
 */
export async function fetchCourseProgress(
  courseId: string,
  userId?: string,
  options: ConvexRequestOptions = {},
): Promise<CourseProgress | null> {
  const token = options.skipAuth
    ? undefined
    : (options.token ?? (await getAuthToken()));

  try {
    const progress = await fetchQuery(
      api.lessons.getCourseProgress,
      {
        courseId: courseId as Id<"courses">,
      },
      { token, ...(options.url && { url: options.url }) },
    );

    if (!progress) {
      return null;
    }

    return transformCourseProgress(
      progress as ConvexProgressData,
      courseId,
      userId ?? "",
    );
  } catch (error) {
    console.error("[ConvexFetch] Course progress fetch failed:", {
      courseId,
      userId,
      error,
    });
    throw error;
  }
}

/**
 * Fetch lesson progress for Server Actions/Route Handlers
 */
export async function fetchLessonProgress(
  lessonId: string,
  userId?: string,
  options: ConvexRequestOptions = {},
): Promise<LessonProgress | null> {
  const token = options.skipAuth
    ? undefined
    : (options.token ?? (await getAuthToken()));

  try {
    const progress = await fetchQuery(
      api.lessons.getProgress,
      {
        lessonId: lessonId as Id<"lessons">,
      },
      { token, ...(options.url && { url: options.url }) },
    );

    if (!progress) {
      return null;
    }

    return transformLessonProgress(
      progress as ConvexProgressData,
      lessonId,
      userId ?? "",
    );
  } catch (error) {
    console.error("[ConvexFetch] Lesson progress fetch failed:", {
      lessonId,
      userId,
      error,
    });
    throw error;
  }
}

// =============================================================================
// LEGACY COMPATIBILITY FUNCTIONS
// =============================================================================

/**
 * Legacy getCourse function for backward compatibility
 */
export async function getCourse(courseId: string): Promise<Course | null> {
  return fetchCourse(courseId);
}

/**
 * Legacy getCourses function for backward compatibility
 */
export async function getCourses(
  filters: Record<string, unknown> = {},
): Promise<Course[]> {
  const result = await fetchCourses(filters);
  return result.courses;
}

/**
 * Legacy getLessonWithNavigation function for backward compatibility
 */
export async function getLessonWithNavigation(
  courseId: string,
  lessonId: string,
): Promise<LessonWithNavigation | null> {
  return fetchLessonWithNavigation(lessonId);
}

/**
 * Legacy getCourseProgress function for backward compatibility
 */
export async function getCourseProgress(
  courseId: string,
  userId: string,
): Promise<CourseProgress | null> {
  return fetchCourseProgress(courseId, userId);
}

/**
 * Legacy getLessonProgress function for backward compatibility
 */
export async function getLessonProgress(
  lessonId: string,
  userId: string,
): Promise<LessonProgress | null> {
  return fetchLessonProgress(lessonId, userId);
}

/**
 * Legacy getCourseModules function for backward compatibility
 */
export async function getCourseModules(courseId: string): Promise<Module[]> {
  const course = await getCourse(courseId);
  return course?.modules ?? [];
}
// timestamp: 09/20/2025 21:41:57
