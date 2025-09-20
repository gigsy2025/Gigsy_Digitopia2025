/**
 * ZOD VALIDATION SCHEMAS
 *
 * Runtime validation schemas for course data structures using Zod.
 * These schemas ensure type safety when data comes from external sources.
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-09-20
 */

import { z } from "zod";

// Author schema
export const authorSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Author name is required"),
  avatarUrl: z.string().url().optional(),
  role: z.string().optional(),
  bio: z.string().optional(),
  socialLinks: z
    .object({
      twitter: z.string().url().optional(),
      linkedin: z.string().url().optional(),
      website: z.string().url().optional(),
    })
    .optional(),
});

// Resource schema
export const resourceSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Resource title is required"),
  url: z.string().url("Invalid resource URL"),
  type: z.enum(["pdf", "link", "code", "zip", "other"]).optional(),
  sizeBytes: z.number().positive().optional(),
  downloadable: z.boolean().optional(),
  description: z.string().optional(),
});

// Lesson schema
export const lessonSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Lesson title is required"),
  slug: z.string().optional(),
  durationSeconds: z.number().positive().nullable().optional(),
  contentHtml: z.string().nullable().optional(),
  videoUrl: z.string().url().nullable().optional(),
  thumbnailUrl: z.string().url().optional(),
  resources: z.array(resourceSchema).optional(),
  sequenceIndex: z.number().min(0),
  isCompleted: z.boolean().optional(),
  isLocked: z.boolean().optional(),
  isFree: z.boolean().optional(),
  description: z.string().optional(),
  learningObjectives: z.array(z.string()).optional(),
  transcript: z.string().optional(),
  notes: z.string().optional(),
});

// Module schema
export const moduleSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Module title is required"),
  description: z.string().optional(),
  thumbnailUrl: z.string().url().optional(),
  lessons: z.array(lessonSchema),
  durationSeconds: z.number().positive().optional(),
  sequenceIndex: z.number().min(0),
  isCompleted: z.boolean().optional(),
  completedLessons: z.number().min(0).optional(),
  totalLessons: z.number().min(0).optional(),
});

// Course progress schema
export const courseProgressSchema = z.object({
  courseId: z.string(),
  userId: z.string(),
  completedLessons: z.array(z.string()),
  currentLessonId: z.string().optional(),
  progressPercentage: z.number().min(0).max(100),
  timeSpentSeconds: z.number().min(0),
  lastAccessedAt: z.string().datetime(),
  certificateEarned: z.boolean().optional(),
  quizScores: z.record(z.string(), z.number()).optional(),
});

// Course stats schema
export const courseStatsSchema = z.object({
  enrolledCount: z.number().min(0),
  completionRate: z.number().min(0).max(100),
  averageRating: z.number().min(0).max(5),
  totalReviews: z.number().min(0),
  recentEnrollments: z.number().min(0),
});

// Course schema
export const courseSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Course title is required"),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  coverImage: z.string().url().optional(),
  trailerVideoUrl: z.string().url().optional(),
  authors: z.array(authorSchema).min(1, "At least one author is required"),
  estimatedDurationMinutes: z.number().positive().optional(),
  difficulty: z
    .enum(["beginner", "intermediate", "advanced", "expert"])
    .optional(),
  modules: z.array(moduleSchema),
  totalLessons: z.number().min(0),
  price: z.number().min(0).optional(),
  currency: z.string().length(3).optional(), // ISO currency code
  isFree: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  prerequisites: z.array(z.string()).optional(),
  learningOutcomes: z.array(z.string()).optional(),
  category: z.string().optional(),
  language: z.string().optional(),
  lastUpdated: z.string().datetime().optional(),
  createdAt: z.string().datetime().optional(),
  status: z
    .enum(["draft", "published", "archived", "coming_soon", "private"])
    .optional(),
  enrolledCount: z.number().min(0).optional(),
  stats: courseStatsSchema.optional(),
  progress: courseProgressSchema.optional(),
  certificate: z
    .object({
      available: z.boolean(),
      requirements: z.array(z.string()).optional(),
    })
    .optional(),
});

// Lesson progress schema
export const lessonProgressSchema = z.object({
  lessonId: z.string(),
  courseId: z.string(),
  userId: z.string(),
  progressSeconds: z.number().min(0),
  completed: z.boolean(),
  watchedPercentage: z.number().min(0).max(100),
  lastWatchedAt: z.string().datetime(),
  notes: z.string().optional(),
  bookmarks: z
    .array(
      z.object({
        timeSeconds: z.number().min(0),
        note: z.string(),
        createdAt: z.string().datetime(),
      }),
    )
    .optional(),
});

// Comment schema with explicit type annotation
export const commentSchema: z.ZodType<{
  id: string;
  lessonId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  parentId?: string;
  replies?: Array<{
    id: string;
    lessonId: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    content: string;
    createdAt: string;
    updatedAt?: string;
    parentId?: string;
    replies?: unknown[];
    likes?: number;
    isAuthor?: boolean;
    isPinned?: boolean;
  }>;
  likes?: number;
  isAuthor?: boolean;
  isPinned?: boolean;
}> = z.object({
  id: z.string(),
  lessonId: z.string(),
  userId: z.string(),
  userName: z.string().min(1),
  userAvatar: z.string().url().optional(),
  content: z.string().min(1, "Comment content is required"),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
  parentId: z.string().optional(),
  replies: z.array(z.lazy(() => commentSchema)).optional(),
  likes: z.number().min(0).optional(),
  isAuthor: z.boolean().optional(),
  isPinned: z.boolean().optional(),
});

// Quiz schemas
export const quizQuestionSchema = z.object({
  id: z.string(),
  type: z.enum(["multiple-choice", "true-false", "fill-blank", "essay"]),
  question: z.string().min(1, "Question is required"),
  options: z.array(z.string()).optional(),
  correctAnswer: z.union([z.string(), z.array(z.string())]).optional(),
  explanation: z.string().optional(),
  points: z.number().positive(),
});

export const quizSchema = z.object({
  id: z.string(),
  lessonId: z.string(),
  title: z.string().min(1, "Quiz title is required"),
  description: z.string().optional(),
  questions: z
    .array(quizQuestionSchema)
    .min(1, "At least one question is required"),
  passingScore: z.number().min(0).max(100),
  timeLimit: z.number().positive().optional(),
  attempts: z.number().min(0).optional(),
  maxAttempts: z.number().positive().optional(),
});

// API Response schemas
export const courseListResponseSchema = z.object({
  courses: z.array(courseSchema),
  total: z.number().min(0),
  page: z.number().min(1),
  limit: z.number().min(1),
  hasMore: z.boolean(),
});

export const lessonWithNavigationSchema = lessonSchema.extend({
  courseId: z.string(),
  moduleId: z.string(),
  previousLesson: z
    .object({
      id: z.string(),
      title: z.string(),
      moduleId: z.string(),
    })
    .optional(),
  nextLesson: z
    .object({
      id: z.string(),
      title: z.string(),
      moduleId: z.string(),
    })
    .optional(),
  module: z.object({
    id: z.string(),
    title: z.string(),
    sequenceIndex: z.number(),
  }),
  course: z.object({
    id: z.string(),
    title: z.string(),
    totalLessons: z.number(),
  }),
});

// Form validation schemas
export const lessonFormDataSchema = z.object({
  title: z.string().min(1, "Lesson title is required"),
  description: z.string().optional(),
  contentHtml: z.string().optional(),
  videoUrl: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
  durationSeconds: z.number().positive().optional(),
  resources: z.array(resourceSchema),
  learningObjectives: z.array(z.string()),
  isLocked: z.boolean(),
  isFree: z.boolean(),
});

// Player state schema
export const videoPlayerStateSchema = z.object({
  currentTime: z.number().min(0),
  duration: z.number().min(0),
  isPlaying: z.boolean(),
  isMuted: z.boolean(),
  volume: z.number().min(0).max(1),
  playbackRate: z.number().positive(),
  isFullscreen: z.boolean(),
  quality: z.string().optional(),
  buffered: z.any().optional(), // TimeRanges can't be easily validated
});

// Analytics schema
export const lessonAnalyticsSchema = z.object({
  lessonId: z.string(),
  courseId: z.string(),
  userId: z.string(),
  events: z.array(
    z.object({
      type: z.enum([
        "start",
        "pause",
        "resume",
        "complete",
        "seek",
        "speed_change",
      ]),
      timestamp: z.string().datetime(),
      currentTime: z.number().min(0).optional(),
      metadata: z.record(z.string(), z.unknown()).optional(),
    }),
  ),
});

// Search and filtering schemas
export const courseFiltersSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  difficulty: z
    .enum(["beginner", "intermediate", "advanced", "expert"])
    .optional(),
  duration: z.enum(["short", "medium", "long"]).optional(),
  price: z.enum(["free", "paid"]).optional(),
  rating: z.number().min(0).max(5).optional(),
  tags: z.array(z.string()).optional(),
  authorId: z.string().optional(),
});

export const searchResultsSchema = z.object({
  courses: z.array(courseSchema),
  lessons: z.array(lessonSchema),
  authors: z.array(authorSchema),
  total: z.number().min(0),
  facets: z.object({
    categories: z.array(
      z.object({
        name: z.string(),
        count: z.number().min(0),
      }),
    ),
    difficulties: z.array(
      z.object({
        name: z.string(),
        count: z.number().min(0),
      }),
    ),
    authors: z.array(
      z.object({
        name: z.string(),
        count: z.number().min(0),
      }),
    ),
  }),
});

// Export type inference helpers
export type AuthorInput = z.infer<typeof authorSchema>;
export type ResourceInput = z.infer<typeof resourceSchema>;
export type LessonInput = z.infer<typeof lessonSchema>;
export type ModuleInput = z.infer<typeof moduleSchema>;
export type CourseInput = z.infer<typeof courseSchema>;
export type CourseProgressInput = z.infer<typeof courseProgressSchema>;
export type LessonProgressInput = z.infer<typeof lessonProgressSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
export type QuizInput = z.infer<typeof quizSchema>;
export type CourseListResponseInput = z.infer<typeof courseListResponseSchema>;
export type LessonWithNavigationInput = z.infer<
  typeof lessonWithNavigationSchema
>;
export type LessonFormDataInput = z.infer<typeof lessonFormDataSchema>;
export type VideoPlayerStateInput = z.infer<typeof videoPlayerStateSchema>;
export type LessonAnalyticsInput = z.infer<typeof lessonAnalyticsSchema>;
export type CourseFiltersInput = z.infer<typeof courseFiltersSchema>;
export type SearchResultsInput = z.infer<typeof searchResultsSchema>;
