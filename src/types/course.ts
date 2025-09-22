/**
 * COURSE TYPE DEFINITIONS
 *
 * Comprehensive type definitions for the LMS course system,
 * including lessons, modules, authors, and progress tracking.
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-09-20
 */

export interface Author {
  id: string;
  name: string;
  avatarUrl?: string;
  role?: string;
  bio?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    website?: string;
  };
}

export interface Resource {
  id: string;
  title: string;
  url: string;
  type?: "pdf" | "link" | "code" | "zip" | "other";
  sizeBytes?: number;
  downloadable?: boolean;
  description?: string;
}

export interface Lesson {
  id: string;
  title: string;
  slug?: string;
  content?: string;
  durationSeconds?: number | null;
  duration?: number;
  estimatedDuration?: number;
  contentHtml?: string | null;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  resources?: Resource[];
  sequenceIndex: number;
  isCompleted?: boolean;
  isLocked?: boolean;
  isFree?: boolean;
  description?: string;
  learningObjectives?: string[];
  transcript?: string;
  notes?: string;
  moduleId?: string;
  courseId?: string;
}

export interface Module {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  lessons: Lesson[];
  durationSeconds?: number;
  sequenceIndex: number;
  isCompleted?: boolean;
  completedLessons?: number;
  totalLessons?: number;
}

export interface CourseProgress {
  courseId: string;
  userId: string;
  completedLessons: number;
  totalLessons: number;
  currentLessonId?: string;
  progressPercentage: number;
  timeSpentSeconds?: number;
  lastAccessedAt: string;
  enrolledAt: string;
  estimatedTimeRemaining: number;
  certificateEarned?: boolean;
  quizScores?: Record<string, number>;
}

export interface CourseStats {
  enrolledCount: number;
  completionRate: number;
  averageRating: number;
  totalReviews: number;
  recentEnrollments: number;
}

export interface Course {
  id: string;
  title: string;
  shortDescription?: string;
  description?: string;
  coverImage?: string;
  thumbnailUrl?: string;
  bannerUrl?: string;
  trailerVideoUrl?: string;
  authors: Author[];
  estimatedDurationMinutes?: number;
  difficulty?: "beginner" | "intermediate" | "advanced" | "expert";
  modules: Module[];
  totalLessons: number;
  price?: number;
  currency?: string;
  isFree?: boolean;
  tags?: string[];
  skills?: string[];
  prerequisites?: string[];
  learningOutcomes?: string[];
  category?: string;
  language?: string;
  lastUpdated?: string;
  createdAt?: string;
  updatedAt?: string;
  status?: "draft" | "published" | "archived" | "coming_soon" | "private";
  enrolledCount?: number;
  enrollmentCount?: number;
  averageRating?: number;
  authorId?: string;
  authorName?: string;
  authorAvatar?: string;
  stats?: CourseStats;
  progress?: CourseProgress;
  certificate?: {
    available: boolean;
    requirements?: string[];
  };
}

export interface LessonProgress {
  lessonId: string;
  courseId?: string;
  userId: string;
  progressSeconds?: number;
  completed: boolean;
  isCompleted?: boolean;
  watchedDuration?: number;
  totalDuration?: number;
  watchedPercentage?: number;
  progressPercentage?: number;
  lastWatchedAt: string;
  completedAt?: string;
  notes?: string;
  bookmarks?: Array<{
    timeSeconds: number;
    note: string;
    createdAt: string;
  }>;
}

export interface Comment {
  id: string;
  lessonId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  parentId?: string;
  replies?: Comment[];
  likes?: number;
  isAuthor?: boolean;
  isPinned?: boolean;
}

export interface Quiz {
  id: string;
  lessonId: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
  passingScore: number;
  timeLimit?: number;
  attempts?: number;
  maxAttempts?: number;
}

export interface QuizQuestion {
  id: string;
  type: "multiple-choice" | "true-false" | "fill-blank" | "essay";
  question: string;
  options?: string[];
  correctAnswer?: string | string[];
  explanation?: string;
  points: number;
}

// API Response types
export interface CourseListResponse {
  courses: Course[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface LessonWithNavigation extends Lesson {
  courseId: string;
  moduleId: string;
  contentType?:
    | "text"
    | "video"
    | "audio"
    | "interactive"
    | "quiz"
    | "assignment"
    | "live"
    | "external"
    | "file";
  previousLesson?: {
    id: string;
    title: string;
    moduleId: string;
  };
  nextLesson?: {
    id: string;
    title: string;
    moduleId: string;
  };
  module?: {
    id: string;
    title: string;
    sequenceIndex: number;
  };
  course?: {
    id: string;
    title: string;
    totalLessons: number;
  };
  quiz?: Array<{
    _id: string;
    question: string;
    options: Array<{ _id: string; text: string }>;
  }>;
}

// Form types for lesson editing
export interface LessonFormData {
  title: string;
  description?: string;
  contentHtml?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  resources: Resource[];
  learningObjectives: string[];
  isLocked: boolean;
  isFree: boolean;
}

// Video player specific types
export interface VideoPlayerState {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  playbackRate: number;
  isFullscreen: boolean;
  quality?: string;
  buffered: TimeRanges | null;
}

export interface PlayerEvent {
  type: "play" | "pause" | "timeupdate" | "ended" | "progress" | "error";
  currentTime?: number;
  duration?: number;
  error?: string;
}

// Analytics types
export interface LessonAnalytics {
  lessonId: string;
  courseId: string;
  userId: string;
  events: Array<{
    type: "start" | "pause" | "resume" | "complete" | "seek" | "speed_change";
    timestamp: string;
    currentTime?: number;
    metadata?: Record<string, unknown>;
  }>;
}

// Search and filtering types
export interface CourseFilters {
  query?: string;
  category?: string;
  difficulty?: Course["difficulty"];
  duration?: "short" | "medium" | "long";
  price?: "free" | "paid";
  rating?: number;
  tags?: string[];
  authorId?: string;
}

export interface SearchResults {
  courses: Course[];
  lessons: Lesson[];
  authors: Author[];
  total: number;
  facets: {
    categories: Array<{ name: string; count: number }>;
    difficulties: Array<{ name: string; count: number }>;
    authors: Array<{ name: string; count: number }>;
  };
}

// =============================================================================
// FORM DATA TYPES
// =============================================================================

export interface CourseFormData {
  title: string;
  description: string;
  difficultyLevel: "beginner" | "intermediate" | "advanced";
  thumbnailId: string;
  modules: Array<{
    title: string;
    lessons: Array<{
      title: string;
      content: string;
    }>;
  }>;
}

export type FormStep = "basic" | "media" | "structure" | "pricing";
