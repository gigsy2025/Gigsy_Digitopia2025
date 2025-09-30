/**
 * Server-only Convex fetchers for Next.js App Router
 *
 * IMPORTANT: This file contains server-only code and should never be imported
 * by Client Components. Use the client-safe fetchers-client.ts instead.
 *
 * @version 2.0.0
 * @author Principal Engineering Team
 */

import "server-only";
import { cache } from "react";
import { preloadQuery, fetchQuery, fetchMutation } from "convex/nextjs";
import { auth } from "@clerk/nextjs/server";
import { api } from "convex/_generated/api";
import type { Preloaded } from "convex/react";
import type { Doc, Id } from "convex/_generated/dataModel";
import type { ApplicationWithGig } from "@/types/applications";
import type { GigListItem, GigStats } from "@/types/gigs";

// Legacy types for backward compatibility
import type {
  Course,
  CourseProgress,
  LessonProgress,
  LessonWithNavigation,
  Module,
} from "../types/course";

// =============================================================================
// CORE TYPES AND INTERFACES
// =============================================================================

interface ConvexRequestOptions {
  token?: string;
  skipAuth?: boolean;
  url?: string;
}

// =============================================================================
// EMPLOYER DASHBOARD FETCHERS
// =============================================================================

type EmployerGigRecord = Doc<"gigs">;
type ConvexUserRecord = Doc<"users">;

interface EmployerGigListResult {
  items: EmployerGigRecord[];
  continueCursor: string | null;
  isDone: boolean;
}

interface EmployerGigListResponse {
  items: GigListItem[];
  continueCursor: string | null;
  isDone: boolean;
}

export type EmployerGigDetail = EmployerGigRecord;

interface EmployerMetricsResult {
  totalGigs: number;
  activeGigs: number;
  totalApplicants: number;
  applicationsThisWeek: number;
}

interface EmployerApplicationsResult {
  items: Array<{
    application: Doc<"applications">;
    candidate: Doc<"users"> | null;
  }>;
  continueCursor: string | null;
  isDone: boolean;
}

export interface EmployerApplicationsResponse {
  items: EmployerApplicationsResult["items"];
  continueCursor: string | null;
  isDone: boolean;
}

export interface EmployerApplicationDetail {
  application: Doc<"applications">;
  candidate: Doc<"users"> | null;
  events: Doc<"applicationStatusEvents">[];
  notes: Array<Doc<"employerNotes"> & { authorClerkId: string | null }>;
}

async function requireConvexToken(): Promise<string> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error("Not authenticated");
  }
  return token;
}

export const preloadEmployerGigs = cache(
  async (
    args: {
      status?: GigListItem["status"];
      cursor?: string | null;
      limit?: number;
    } = {},
  ): Promise<Preloaded<typeof api.employerGigs.listByEmployer>> => {
    const token = await requireConvexToken();
    const { status, cursor, limit } = args;
    return preloadQuery(
      api.employerGigs.listByEmployer,
      {
        ...(status ? { status } : {}),
        ...(cursor !== undefined && cursor !== null ? { cursor } : {}),
        ...(limit !== undefined ? { limit } : {}),
      },
      { token },
    );
  },
);

export const fetchEmployerApplications = cache(
  async (args: {
    gigId: Id<"gigs">;
    status?: Doc<"applications">["status"];
    cursor?: string | null;
    limit?: number;
  }): Promise<EmployerApplicationsResponse> => {
    const token = await requireConvexToken();
    const { gigId, status, cursor, limit } = args;

    const result = await fetchQuery(
      api.employerApplications.listByGig,
      {
        gigId,
        ...(status ? { status } : {}),
        ...(cursor !== undefined && cursor !== null ? { cursor } : {}),
        ...(limit !== undefined ? { limit } : {}),
      },
      { token },
    );

    return result as EmployerApplicationsResponse;
  },
);

export async function fetchEmployerApplicationDetail(args: {
  gigId: Id<"gigs">;
  applicationId: Id<"applications">;
}): Promise<EmployerApplicationDetail> {
  const token = await requireConvexToken();
  const { gigId, applicationId } = args;

  const detail = await fetchQuery(
    api.employerApplications.getApplication,
    {
      gigId,
      applicationId,
    },
    { token },
  );

  return detail as EmployerApplicationDetail;
}

export async function markEmployerApplicationViewed(
  applicationId: Id<"applications">,
): Promise<void> {
  const token = await requireConvexToken();
  await fetchMutation(
    api.employerApplications.markViewed,
    {
      applicationId,
    },
    { token },
  );
}

export async function addEmployerApplicationNote(args: {
  applicationId: Id<"applications">;
  body: string;
}): Promise<void> {
  const token = await requireConvexToken();
  await fetchMutation(
    api.employerApplications.addNote,
    {
      applicationId: args.applicationId,
      body: args.body,
    },
    { token },
  );
}

export const fetchEmployerGigs = cache(
  async (
    args: {
      status?: GigListItem["status"];
      cursor?: string | null;
      limit?: number;
    } = {},
  ): Promise<EmployerGigListResponse> => {
    const token = await requireConvexToken();
    const { status, cursor, limit } = args;
    const result = (await fetchQuery(
      api.employerGigs.listByEmployer,
      {
        ...(status ? { status } : {}),
        ...(cursor !== undefined && cursor !== null ? { cursor } : {}),
        ...(limit !== undefined ? { limit } : {}),
      },
      { token },
    )) as EmployerGigListResult;

    const items = result.items.map((gig) => ({
      _id: gig._id,
      title: gig.title,
      description: gig.description,
      category: gig.category,
      difficultyLevel: gig.difficultyLevel,
      status: gig.status,
      budget: gig.budget,
      skills: gig.skills,
      deadline: gig.deadline,
      experienceRequired: gig.experienceRequired,
      location: gig.location,
      metadata: gig.metadata,
      _creationTime: gig._creationTime,
      employerId: gig.employerId,
    })) satisfies GigListItem[];

    return {
      items,
      continueCursor: result.continueCursor ?? null,
      isDone: result.isDone ?? true,
    } satisfies EmployerGigListResponse;
  },
);

export async function fetchConvexUserByClerkId(
  clerkId: string,
): Promise<ConvexUserRecord | null> {
  if (!clerkId) {
    return null;
  }

  const token = await requireConvexToken();
  const user = await fetchQuery(
    api.users.getUserByClerkId,
    { clerkId },
    {
      token,
    },
  );

  return user ?? null;
}

export const fetchEmployerGigDetail = cache(
  async (gigId: Id<"gigs">): Promise<EmployerGigDetail> => {
    const token = await requireConvexToken();
    const gig = await fetchQuery(
      api.employerGigs.getEmployerGig,
      { gigId },
      { token },
    );

    if (!gig) {
      throw new Error(`Gig ${gigId} not found`);
    }

    return gig;
  },
);

export const fetchEmployerMetrics = cache(
  async (): Promise<EmployerMetricsResult & Pick<GigStats, "totalGigs">> => {
    const token = await requireConvexToken();
    const result = (await fetchQuery(
      api.employerGigs.getEmployerMetrics,
      {},
      { token },
    )) as EmployerMetricsResult;

    return {
      ...result,
      totalGigs: result.totalGigs,
    };
  },
);

export const preloadGigApplications = cache(
  async (args: {
    gigId: Id<"gigs">;
    status?: Doc<"applications">["status"];
    cursor?: string | null;
    limit?: number;
  }): Promise<Preloaded<typeof api.employerGigs.listApplicationsByGig>> => {
    const token = await requireConvexToken();
    const { gigId, status, cursor, limit } = args;
    return preloadQuery(
      api.employerGigs.listApplicationsByGig,
      {
        gigId,
        ...(status ? { status } : {}),
        ...(cursor !== undefined && cursor !== null ? { cursor } : {}),
        ...(limit !== undefined ? { limit } : {}),
      },
      {
        token,
      },
    );
  },
);

export const fetchGigApplications = cache(
  async (args: {
    gigId: Id<"gigs">;
    status?: Doc<"applications">["status"];
    cursor?: string | null;
    limit?: number;
  }): Promise<EmployerApplicationsResponse> => {
    const token = await requireConvexToken();
    const { gigId, status, cursor, limit } = args;
    const result = (await fetchQuery(
      api.employerGigs.listApplicationsByGig,
      {
        gigId,
        ...(status ? { status } : {}),
        ...(cursor !== undefined && cursor !== null ? { cursor } : {}),
        ...(limit !== undefined ? { limit } : {}),
      },
      { token },
    )) as EmployerApplicationsResult;

    return {
      items: result.items,
      continueCursor: result.continueCursor ?? null,
      isDone: result.isDone ?? true,
    } satisfies EmployerApplicationsResponse;
  },
);

// =============================================================================
// APPLICATIONS FETCHERS
// =============================================================================

export const preloadApplications = cache(async () => {
  const token = await getAuthToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  return preloadQuery(api.applications.listByCandidate, {}, { token });
});

export const fetchApplications = cache(async () => {
  const token = await getAuthToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetchQuery(
    api.applications.listByCandidate,
    {},
    { token },
  );
  return response as ApplicationWithGig[];
});

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
  title: string;
  content?: string;
  videoUrl?: string;
  estimatedDuration?: number;
  moduleId?: string;
  courseId?: string;
  sequenceIndex?: number;
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
// AUTHENTICATION UTILITIES (SERVER-ONLY)
// =============================================================================

/**
 * Retrieve Clerk authentication token for Convex requests
 * SERVER-ONLY: This function can only be used in Server Components
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
 * Transform Convex course data to legacy Course interface
 */
function transformConvexCourse(courseData: ConvexCourseData): Course {
  return {
    id: courseData._id,
    title: courseData.title,
    description: courseData.description,
    shortDescription: courseData.shortDescription,
    category: courseData.category ?? "technology",
    difficulty:
      ((courseData.difficultyLevel === "expert"
        ? "advanced"
        : courseData.difficultyLevel) as Course["difficulty"]) ?? "beginner",
    estimatedDurationMinutes: courseData.estimatedDuration ?? 0,
    price: courseData.price ?? 0,
    thumbnailUrl: courseData.thumbnailUrl,
    bannerUrl: courseData.bannerUrl,
    status: (courseData.status as Course["status"]) ?? "draft",
    enrollmentCount: courseData.enrollmentCount ?? 0,
    averageRating: courseData.averageRating ?? 0,
    createdAt: new Date(courseData._creationTime).toISOString(),
    updatedAt: courseData.lastUpdated
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
function transformConvexCourses(courses: ConvexCourseData[]): Course[] {
  return courses.map(transformConvexCourse);
}

/**
 * Transform Convex lesson data to legacy LessonWithNavigation interface
 */
function transformConvexLesson(
  lessonData: ConvexLessonData,
  quiz: unknown[] = [],
): LessonWithNavigation {
  return {
    id: lessonData._id,
    title: lessonData.title,
    content: lessonData.content ?? "",
    videoUrl: lessonData.videoUrl,
    estimatedDuration: lessonData.estimatedDuration ?? 0,
    moduleId: lessonData.moduleId ?? "",
    courseId: lessonData.courseId ?? "",
    sequenceIndex: lessonData.sequenceIndex ?? 0,
    previousLesson: undefined,
    nextLesson: undefined,
    quiz: quiz as Array<{
      _id: string;
      question: string;
      options: Array<{ _id: string; text: string }>;
    }>,
  };
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
    lastAccessedAt: progressData.lastAccessedAt
      ? new Date(progressData.lastAccessedAt).toISOString()
      : new Date().toISOString(),
    enrolledAt: progressData.enrolledAt
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
    lastWatchedAt: progressData.lastWatchedAt
      ? new Date(progressData.lastWatchedAt).toISOString()
      : new Date().toISOString(),
    completedAt: progressData.completedAt
      ? new Date(progressData.completedAt).toISOString()
      : undefined,
  };
}

// =============================================================================
// SERVER COMPONENT PRELOADING FUNCTIONS
// =============================================================================

/**
 * Preload course details for Server Components
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

    return transformConvexCourse(convexCourse as ConvexCourseData);
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
 * Legacy getCourseModules function for backward compatibility
 */
export async function getCourseModules(courseId: string): Promise<Module[]> {
  const course = await getCourse(courseId);
  return course?.modules ?? [];
}

// Export transformation utilities for use in other server components
export { transformConvexCourses };
