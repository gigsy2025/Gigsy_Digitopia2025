/**
 * COURSE CATALOG TYPE DEFINITIONS
 *
 * Comprehensive type-safe system for course management, learning management,
 * and enrollment tracking with validation and analytics support.
 *
 * PERFORMANCE: Optimized for large datasets with cursor pagination
 * SCALABILITY: Designed for multi-tenant, enterprise-grade LMS
 * ACCESSIBILITY: Full support for screen readers and keyboard navigation
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-01-14
 */

import { z } from "zod";
import type { Id } from "../../convex/_generated/dataModel";

/**
 * Course difficulty levels for skill progression
 */
export type CourseDifficultyLevel = 
  | "beginner" 
  | "intermediate" 
  | "advanced" 
  | "expert";

/**
 * Course categories for organization and filtering
 */
export type CourseCategoryType =
  | "development"
  | "design"
  | "marketing"
  | "writing"
  | "data"
  | "business"
  | "creative"
  | "technology"
  | "soft-skills"
  | "languages";

/**
 * Sort options for course listings
 */
export type SortOption =
  | "relevance"
  | "newest"
  | "popular"
  | "rating"
  | "price_low"
  | "price_high"
  | "duration"
  | "students"
  | "oldest"
  | "title"
  | "date";

/**
 * Course filters interface for search and filtering
 */
export interface CourseFilters {
  /** Search term */
  searchTerm?: string;
  
  /** Alternative search field for compatibility */
  search?: string;
  
  /** Selected categories */
  categories?: CourseCategoryType[];
  
  /** Selected difficulty levels */
  difficulties?: CourseDifficultyLevel[];
  
  /** Sort criteria */
  sortBy?: SortOption;
  
  /** Price range filter */
  priceRange?: [number, number] | { min: number; max: number };
  
  /** Minimum rating filter */
  minRating?: number;
  
  /** Rating filter for compatibility */
  rating?: number;
  
  /** Maximum duration filter (hours) */
  maxDuration?: number;
  
  /** Duration range filter for compatibility */
  duration?: { min: number; max: number };
  
  /** Show only new courses */
  isNew?: boolean;
  
  /** Show only featured courses */
  isFeatured?: boolean;
  
  /** Show only free courses */
  isFree?: boolean;
  
  /** Filter by instructor */
  instructorId?: string;
  
  /** Current page number */
  page?: number;
  
  /** Items per page */
  limit?: number;
  
  /** Additional statuses to filter by */
  statuses?: string[];
  
  /** Offset for pagination */
  offset?: number;
}

/**
 * Type alias for compatibility
 */
export type CourseFiltersType = CourseFilters;

/**
 * Course status lifecycle states
 */
export type CourseStatus =
  | "draft"        // Under development
  | "published"    // Live and available
  | "archived"     // No longer active
  | "coming_soon"  // Announced but not ready
  | "private";     // Restricted access

/**
 * Enrollment status tracking
 */
export type EnrollmentStatus =
  | "not_enrolled"
  | "enrolled"
  | "in_progress"
  | "completed"
  | "suspended"
  | "expired";

/**
 * Lesson content types for different media
 */
export type LessonContentType =
  | "text"         // Markdown content
  | "video"        // Video URL
  | "audio"        // Audio content
  | "interactive"  // Interactive exercises
  | "quiz"         // Assessment
  | "assignment"   // Homework/project
  | "live";        // Live session

/**
 * Course pricing models
 */
export interface CoursePricing {
  /** Pricing type */
  type?: "free" | "paid" | "subscription";
  
  /** Whether course is free */
  isFree: boolean;
  
  /** Price amount in primary currency */
  amount?: number;
  
  /** Price in primary currency (alternative name) */
  price?: number;
  
  /** Currency code (EGP, USD, EUR) */
  currency?: "EGP" | "USD" | "EUR";
  
  /** Discount percentage if applicable */
  discountPercentage?: number;
  
  /** Original price before discount */
  originalPrice?: number;
  
  /** Original amount before discount */
  originalAmount?: number;
  
  /** Payment type */
  paymentType?: "one-time" | "subscription" | "per-module";
}

/**
 * Course author information
 */
export interface CourseAuthor {
  /** Author's user ID */
  id: Id<"users">;
  
  /** Convex internal ID for compatibility */
  _id?: Id<"users">;
  
  /** Author's display name */
  name: string;
  
  /** Author's professional title */
  title?: string;
  
  /** Author's avatar URL */
  avatarUrl?: string;
  
  /** Author's bio/description */
  bio?: string;
  
  /** Author's verification status */
  isVerified?: boolean;
  
  /** Number of courses by this author */
  courseCount?: number;
  
  /** Average rating across all courses */
  averageRating?: number;
}

/**
 * Course progress tracking
 */
export interface CourseProgress {
  /** Total lessons in course */
  totalLessons: number;
  
  /** Completed lessons count */
  completedLessons: number;
  
  /** Progress percentage (0-100) */
  progressPercentage: number;
  
  /** Time spent in course (minutes) */
  timeSpent: number;
  
  /** Last accessed date */
  lastAccessed?: Date;
  
  /** Last accessed date as string for compatibility */
  lastAccessedAt?: string;
  
  /** Current lesson being studied */
  currentLessonId?: Id<"lessons">;
  
  /** Estimated completion time (minutes) */
  estimatedTimeToComplete?: number;
}

/**
 * Course statistics and analytics
 */
export interface CourseStats {
  /** Total enrolled students */
  enrollmentCount: number;
  
  /** Course completion rate (0-100) */
  completionRate: number;
  
  /** Average time to complete (hours) */
  averageCompletionTime: number;
  
  /** Student satisfaction rating (1-5) */
  averageRating: number;
  
  /** Total number of ratings */
  ratingCount: number;
  
  /** Total number of reviews for compatibility */
  totalReviews?: number;
  
  /** View count for analytics */
  viewCount: number;
  
  /** Last 30 days enrollment count */
  recentEnrollments: number;
}

/**
 * Course summary for catalog display
 */
export interface CourseSummary {
  /** Course unique identifier */
  id: Id<"courses">;
  
  /** Convex internal ID for compatibility */
  _id?: Id<"courses">;
  
  /** Course title */
  title: string;
  
  /** Short description for cards */
  shortDescription: string;
  
  /** Course author information */
  author: CourseAuthor;
  
  /** Course category */
  category: CourseCategoryType;
  
  /** Difficulty level */
  difficulty: CourseDifficultyLevel;
  
  /** Course status */
  status: CourseStatus;
  
  /** Number of modules */
  modulesCount: number;
  
  /** Number of lessons */
  lessonsCount: number;
  
  /** Course modules for compatibility */
  modules?: Array<{
    id: string;
    title: string;
    description?: string;
    lessonCount?: number;
    estimatedDuration?: number;
  }>;
  
  /** Course thumbnail/cover image */
  thumbnailUrl?: string;
  
  /** Course pricing information */
  pricing: CoursePricing;
  
  /** Course statistics */
  stats: CourseStats;
  
  /** Skills taught in this course */
  skills: string[];
  
  /** Estimated duration (hours) */
  estimatedDuration: number;
  
  /** Course creation timestamp */
  createdAt: number;
  
  /** Last update timestamp */
  updatedAt: number;
  
  /** Course rating for compatibility */
  rating?: number;
  
  /** Trending status */
  trending?: boolean;
  
  /** Featured status */
  featured?: boolean;
  
  /** Enrollment count for compatibility */
  enrollmentCount?: number;
  
  /** Whether user is enrolled */
  isEnrolled?: boolean;
  
  /** User's progress if enrolled */
  progress?: CourseProgress;
}

/**
 * Detailed course information
 */
export interface CourseDetail extends CourseSummary {
  /** Full course description */
  description: string;
  
  /** Course learning objectives */
  learningObjectives: string[];
  
  /** Prerequisites */
  prerequisites: string[];
  
  /** Target audience */
  targetAudience: string[];
  
  /** Course outline/curriculum */
  modules: CourseModule[];
  
  /** Student reviews and ratings */
  reviews?: CourseReview[];
  
  /** Frequently asked questions */
  faqs?: CourseFAQ[];
  
  /** Course certificate information */
  certificate?: CourseCertificate;
  
  /** Course tags for search */
  tags: string[];
  
  /** Course language */
  language: string;
  
  /** Course format (self-paced, instructor-led, etc.) */
  format: "self-paced" | "instructor-led" | "hybrid" | "live";
}

/**
 * Course module structure
 */
export interface CourseModule {
  /** Module unique identifier */
  id: Id<"modules">;
  
  /** Module title */
  title: string;
  
  /** Module description */
  description?: string;
  
  /** Module order in course */
  order: number;
  
  /** Estimated duration (minutes) */
  estimatedDuration: number;
  
  /** Module lessons */
  lessons: CourseLesson[];
  
  /** Whether module is locked */
  isLocked?: boolean;
  
  /** Module completion requirement */
  completionRequirement?: "all-lessons" | "percentage" | "assessment";
}

/**
 * Course lesson structure
 */
export interface CourseLesson {
  /** Lesson unique identifier */
  id: Id<"lessons">;
  
  /** Lesson title */
  title: string;
  
  /** Lesson content */
  content: string;
  
  /** Content type */
  contentType: LessonContentType;
  
  /** Lesson order in module */
  order: number;
  
  /** Estimated duration (minutes) */
  estimatedDuration: number;
  
  /** Whether lesson is completed */
  isCompleted?: boolean;
  
  /** Video URL if applicable */
  videoUrl?: string;
  
  /** Additional resources */
  resources?: LessonResource[];
}

/**
 * Lesson resource attachments
 */
export interface LessonResource {
  /** Resource title */
  title: string;
  
  /** Resource URL */
  url: string;
  
  /** Resource type */
  type: "pdf" | "link" | "download" | "exercise";
  
  /** File size if applicable */
  fileSize?: string;
}

/**
 * Course review system
 */
export interface CourseReview {
  /** Review unique identifier */
  id: string;
  
  /** Reviewer information */
  reviewer: {
    name: string;
    avatarUrl?: string;
    isVerified?: boolean;
  };
  
  /** Rating (1-5 stars) */
  rating: number;
  
  /** Review text */
  comment: string;
  
  /** Review creation date */
  createdAt: Date;
  
  /** Whether review is helpful */
  helpfulCount: number;
}

/**
 * Course FAQ system
 */
export interface CourseFAQ {
  /** Question */
  question: string;
  
  /** Answer */
  answer: string;
  
  /** FAQ category */
  category: "general" | "technical" | "payment" | "completion";
}

/**
 * Course certificate information
 */
export interface CourseCertificate {
  /** Whether certificate is available */
  isAvailable: boolean;
  
  /** Certificate type */
  type: "completion" | "achievement" | "professional";
  
  /** Certificate description */
  description?: string;
  
  /** Requirements for certificate */
  requirements: string[];
}

/**
 * Course search and filtering options
 */
export interface CourseSearchOptions {
  /** Search query string */
  query?: string;
  
  /** Category filter */
  category?: CourseCategoryType | "all";
  
  /** Difficulty filter */
  difficulty?: CourseDifficultyLevel | "all";
  
  /** Price filter */
  priceFilter?: "free" | "paid" | "all";
  
  /** Duration filter (in hours) */
  durationFilter?: {
    min?: number;
    max?: number;
  };
  
  /** Rating filter (minimum stars) */
  minimumRating?: number;
  
  /** Sort criteria */
  sortBy?: "newest" | "oldest" | "popular" | "rating" | "title" | "price";
  
  /** Sort direction */
  sortDirection?: "asc" | "desc";
  
  /** Pagination cursor */
  cursor?: string;
  
  /** Results per page */
  limit?: number;
  
  /** Include only enrolled courses */
  onlyEnrolled?: boolean;
  
  /** Skills filter */
  skills?: string[];
}

/**
 * Course catalog response with pagination
 */
export interface CourseCatalogResponse {
  /** Course summaries */
  courses: CourseSummary[];
  
  /** Next page cursor */
  nextCursor?: string;
  
  /** Previous page cursor */
  prevCursor?: string;
  
  /** Total results count */
  totalCount: number;
  
  /** Current page size */
  pageSize: number;
  
  /** Whether there are more results */
  hasMore: boolean;
  
  /** Applied filters summary */
  appliedFilters: {
    category?: CourseCategoryType;
    difficulty?: CourseDifficultyLevel;
    priceFilter?: string;
    query?: string;
  };
}

/**
 * Course enrollment data
 */
export interface CourseEnrollment {
  /** Enrollment unique identifier */
  id: Id<"enrollments">;
  
  /** Student ID */
  studentId: Id<"users">;
  
  /** Course ID */
  courseId: Id<"courses">;
  
  /** Enrollment status */
  status: EnrollmentStatus;
  
  /** Enrollment date */
  enrolledAt: Date;
  
  /** Course progress */
  progress: CourseProgress;
  
  /** Payment information */
  paymentInfo?: {
    amount: number;
    currency: string;
    paymentDate: Date;
    transactionId: string;
  };
}

/**
 * Course analytics event tracking
 */
export interface CourseAnalyticsEvent {
  /** Event type */
  action: 
    | "course_viewed"
    | "course_searched"
    | "course_filtered"
    | "course_enrolled"
    | "lesson_started"
    | "lesson_completed"
    | "module_completed"
    | "course_completed"
    | "course_rated";
  
  /** Course or lesson ID */
  entityId: string;
  
  /** User context */
  userId?: string;
  
  /** Search query if applicable */
  searchQuery?: string;
  
  /** Applied filters */
  filters?: Record<string, unknown>;
  
  /** Time spent (seconds) */
  timeSpent?: number;
  
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  
  /** Event timestamp */
  timestamp: Date;
}

// =============================================================================
// ZOD VALIDATION SCHEMAS
// =============================================================================

/**
 * Course difficulty validation schema
 */
export const CourseDifficultySchema = z.enum(
  ["beginner", "intermediate", "advanced", "expert"],
  {
    errorMap: () => ({
      message: "Difficulty must be beginner, intermediate, advanced, or expert",
    }),
  }
);

/**
 * Course category validation schema
 */
export const CourseCategorySchema = z.enum([
  "development",
  "design", 
  "marketing",
  "writing",
  "data",
  "business",
  "creative",
  "technology",
  "soft-skills",
  "languages"
], {
  errorMap: () => ({
    message: "Please select a valid category",
  }),
});

/**
 * Course status validation schema
 */
export const CourseStatusSchema = z.enum([
  "draft",
  "published", 
  "archived",
  "coming_soon",
  "private"
], {
  errorMap: () => ({
    message: "Invalid course status",
  }),
});

/**
 * Course pricing validation schema
 */
export const CoursePricingSchema = z.object({
  isFree: z.boolean(),
  price: z.number().min(0, "Price must be non-negative").optional(),
  currency: z.enum(["EGP", "USD", "EUR"]).optional(),
  discountPercentage: z.number().min(0).max(100).optional(),
  originalPrice: z.number().min(0).optional(),
  paymentType: z.enum(["one-time", "subscription", "per-module"]).optional(),
}).refine((data) => {
  if (!data.isFree && !data.price) {
    return false;
  }
  return true;
}, {
  message: "Paid courses must have a price specified",
  path: ["price"],
});

/**
 * Course creation/update validation schema
 */
export const CourseCreateSchema = z.object({
  title: z.string()
    .min(5, "Course title must be at least 5 characters")
    .max(100, "Course title must be under 100 characters"),
    
  description: z.string()
    .min(20, "Description must be at least 20 characters")
    .max(2000, "Description must be under 2000 characters"),
    
  shortDescription: z.string()
    .min(10, "Short description must be at least 10 characters")
    .max(200, "Short description must be under 200 characters"),
    
  category: CourseCategorySchema,
  
  difficulty: CourseDifficultySchema,
  
  status: CourseStatusSchema.default("draft"),
  
  pricing: CoursePricingSchema,
  
  thumbnailUrl: z.string().url("Must be a valid URL").optional(),
  
  skills: z.array(z.string())
    .min(1, "Course must teach at least one skill")
    .max(10, "Maximum 10 skills per course"),
    
  learningObjectives: z.array(z.string())
    .min(1, "Must specify at least one learning objective")
    .max(8, "Maximum 8 learning objectives"),
    
  prerequisites: z.array(z.string()).max(5, "Maximum 5 prerequisites"),
  
  targetAudience: z.array(z.string())
    .min(1, "Must specify target audience")
    .max(5, "Maximum 5 target audience groups"),
    
  estimatedDuration: z.number()
    .min(0.5, "Course must be at least 30 minutes")
    .max(200, "Course cannot exceed 200 hours"),
    
  language: z.string().min(2, "Language must be specified").default("en"),
  
  format: z.enum(["self-paced", "instructor-led", "hybrid", "live"])
    .default("self-paced"),
    
  tags: z.array(z.string()).max(15, "Maximum 15 tags"),
});

/**
 * Course search validation schema
 */
export const CourseSearchSchema = z.object({
  query: z.string().max(100, "Search query too long").optional(),
  category: CourseCategorySchema.or(z.literal("all")).optional(),
  difficulty: CourseDifficultySchema.or(z.literal("all")).optional(),
  priceFilter: z.enum(["free", "paid", "all"]).optional(),
  durationFilter: z.object({
    min: z.number().min(0).optional(),
    max: z.number().max(1000).optional(),
  }).optional(),
  minimumRating: z.number().min(1).max(5).optional(),
  sortBy: z.enum(["newest", "oldest", "popular", "rating", "title", "price"])
    .default("newest"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
  cursor: z.string().optional(),
  limit: z.number().min(1).max(50).default(24),
  onlyEnrolled: z.boolean().optional(),
  skills: z.array(z.string()).max(10).optional(),
});

/**
 * Course enrollment validation schema
 */
export const CourseEnrollmentSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
  paymentInfo: z.object({
    amount: z.number().min(0),
    currency: z.enum(["EGP", "USD", "EUR"]),
    transactionId: z.string().min(1),
  }).optional(),
});

/**
 * TypeScript type inference from schemas
 */
export type CourseCreateInput = z.infer<typeof CourseCreateSchema>;
export type CourseSearchInput = z.infer<typeof CourseSearchSchema>;
export type CourseEnrollmentInput = z.infer<typeof CourseEnrollmentSchema>;

/**
 * Component props interfaces
 */

/**
 * Course card component props
 */
export interface CourseCardProps {
  /** Course summary data */
  course: CourseSummary;
  
  /** Card display variant */
  variant?: "default" | "compact" | "featured";
  
  /** Show enrollment status */
  showEnrollment?: boolean;
  
  /** Show enroll button */
  showEnrollButton?: boolean;
  
  /** Show progress if enrolled */
  showProgress?: boolean;
  
  /** Enrollment handler */
  onEnroll?: (courseId: string) => void;
  
  /** View handler */
  onView?: (courseId: string) => void;
  
  /** Click handler */
  onClick?: (course: CourseSummary) => void;
  
  /** Additional CSS classes */
  className?: string;
  
  /** Analytics tracking */
  onAnalytics?: (event: CourseAnalyticsEvent) => void;
}

/**
 * Course list component props
 */
export interface CourseListProps {
  /** Array of courses to display */
  courses: CourseSummary[];
  
  /** Loading state */
  isLoading?: boolean;
  
  /** Loading state (alternative name) */
  loading?: boolean;
  
  /** Error state */
  error?: Error | null;
  
  /** Layout variant */
  layout?: "grid" | "list" | "masonry";
  
  /** Number of columns for grid layout */
  columns?: 1 | 2 | 3 | 4 | "auto";
  
  /** Show layout controls */
  showLayoutControls?: boolean;
  
  /** Show pagination controls */
  showPagination?: boolean;
  
  /** Show progress indicators */
  showProgress?: boolean;
  
  /** Show enroll buttons */
  showEnrollButton?: boolean;
  
  /** Current page number */
  currentPage?: number;
  
  /** Total number of pages */
  totalPages?: number;
  
  /** Items per page */
  itemsPerPage?: number;
  
  /** Additional CSS class */
  className?: string;
  
  /** Layout change handler */
  onLayoutChange?: (layout: "grid" | "list" | "masonry") => void;
  
  /** Columns change handler */
  onColumnsChange?: (columns: 1 | 2 | 3 | 4 | "auto") => void;
  
  /** Page change handler */
  onPageChange?: (page: number) => void;
  
  /** Course enrollment handler */
  onCourseEnroll?: (courseId: string) => void;
  
  /** Course view handler */
  onCourseView?: (courseId: string) => void;
  
  /** Retry handler for error states */
  onRetry?: () => void;
  
  /** Clear filters handler */
  onClearFilters?: () => void;
  
  /** Show load more button */
  showLoadMore?: boolean;
  
  /** Load more handler */
  onLoadMore?: () => void;
  
  /** Whether there are more results */
  hasMore?: boolean;
  
  /** Empty state message */
  emptyMessage?: string;
  
  /** Analytics tracking */
  onAnalytics?: (event: CourseAnalyticsEvent) => void;
}

/**
 * Course filters component props
 */
export interface CourseFiltersProps {
  /** Current search options */
  searchOptions: CourseSearchInput;
  
  /** Filter change handler */
  onFiltersChange: (filters: Partial<CourseSearchInput>) => void;
  
  /** Available categories */
  categories: { value: CourseCategoryType; label: string; count: number }[];
  
  /** Available skills */
  skills: { value: string; label: string; count: number }[];
  
  /** Show mobile filter sheet */
  showMobileSheet?: boolean;
  
  /** Reset filters handler */
  onResetFilters: () => void;
  
  /** Whether filters are being applied */
  isLoading?: boolean;
}

/**
 * Course pagination component props  
 */
export interface CoursePaginationProps {
  /** Current page cursor */
  currentCursor?: string;
  
  /** Next page cursor */
  nextCursor?: string;
  
  /** Previous page cursor */
  prevCursor?: string;
  
  /** Whether there are more results */
  hasMore: boolean;
  
  /** Total results count */
  totalCount: number;
  
  /** Current page size */
  pageSize: number;
  
  /** Page change handler */
  onPageChange: (cursor?: string, direction?: "next" | "prev") => void;
  
  /** Loading state */
  isLoading?: boolean;
  
  /** Show page info */
  showPageInfo?: boolean;
}

export default CourseCreateSchema;