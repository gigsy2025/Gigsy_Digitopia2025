/**
 * COURSE CATALOG VALIDATION SCHEMAS
 *
 * Comprehensive Zod validation schemas for course management system with
 * strict type safety, input sanitization, and error handling.
 *
 * SECURITY: Input validation prevents injection attacks
 * PERFORMANCE: Optimized validation with early exits
 * SCALABILITY: Modular schemas for easy extension
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-01-14
 */

import { z } from "zod";

// =============================================================================
// ENUM SCHEMAS
// =============================================================================

/**
 * Course difficulty levels with validation
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
 * Course category types with validation
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
    message: "Please select a valid category from the available options",
  }),
});

/**
 * Course status lifecycle validation
 */
export const CourseStatusSchema = z.enum([
  "draft",
  "published", 
  "archived",
  "coming_soon",
  "private"
], {
  errorMap: () => ({
    message: "Course status must be draft, published, archived, coming_soon, or private",
  }),
});

/**
 * Enrollment status validation
 */
export const EnrollmentStatusSchema = z.enum([
  "not_enrolled",
  "enrolled",
  "in_progress", 
  "completed",
  "suspended",
  "expired"
], {
  errorMap: () => ({
    message: "Invalid enrollment status",
  }),
});

/**
 * Lesson content type validation
 */
export const LessonContentTypeSchema = z.enum([
  "text",
  "video",
  "audio", 
  "interactive",
  "quiz",
  "assignment",
  "live"
], {
  errorMap: () => ({
    message: "Invalid lesson content type",
  }),
});

/**
 * Currency validation schema
 */
export const CurrencySchema = z.enum(["EGP", "USD", "EUR"], {
  errorMap: () => ({
    message: "Currency must be EGP, USD, or EUR",
  }),
});

/**
 * Course format validation
 */
export const CourseFormatSchema = z.enum([
  "self-paced", 
  "instructor-led", 
  "hybrid", 
  "live"
], {
  errorMap: () => ({
    message: "Course format must be self-paced, instructor-led, hybrid, or live",
  }),
});

// =============================================================================
// COMPLEX OBJECT SCHEMAS
// =============================================================================

/**
 * Course pricing validation with business rules
 */
export const CoursePricingSchema = z.object({
  isFree: z.boolean(),
  price: z.number()
    .min(0, "Price must be non-negative")
    .max(10000, "Price cannot exceed $10,000")
    .optional(),
  currency: CurrencySchema.optional(),
  discountPercentage: z.number()
    .min(0, "Discount cannot be negative")
    .max(90, "Discount cannot exceed 90%")
    .optional(),
  originalPrice: z.number()
    .min(0, "Original price must be non-negative")
    .optional(),
  paymentType: z.enum(["one-time", "subscription", "per-module"])
    .default("one-time"),
}).superRefine((data, ctx) => {
  // Business rule: Paid courses must have a price
  if (!data.isFree && !data.price) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Paid courses must have a price specified",
      path: ["price"],
    });
  }
  
  // Business rule: Free courses cannot have pricing info
  if (data.isFree && data.price && data.price > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Free courses cannot have a price greater than 0",
      path: ["price"],
    });
  }
  
  // Business rule: Discount cannot exceed original price
  if (data.originalPrice && data.discountPercentage) {
    const discountedPrice = data.originalPrice * (1 - data.discountPercentage / 100);
    if (data.price && data.price < discountedPrice - 0.01) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Discount calculation is inconsistent with pricing",
        path: ["discountPercentage"],
      });
    }
  }
});

/**
 * Course author information validation
 */
export const CourseAuthorSchema = z.object({
  id: z.string().min(1, "Author ID is required"),
  name: z.string()
    .min(2, "Author name must be at least 2 characters")
    .max(50, "Author name must be under 50 characters"),
  title: z.string()
    .max(100, "Author title must be under 100 characters")
    .optional(),
  avatarUrl: z.string()
    .url("Avatar must be a valid URL")
    .optional(),
  bio: z.string()
    .max(500, "Author bio must be under 500 characters")
    .optional(),
  isVerified: z.boolean().default(false),
  courseCount: z.number().int().min(0).optional(),
  averageRating: z.number().min(0).max(5).optional(),
});

/**
 * Course statistics validation
 */
export const CourseStatsSchema = z.object({
  enrollmentCount: z.number().int().min(0, "Enrollment count cannot be negative"),
  completionRate: z.number()
    .min(0, "Completion rate cannot be negative")
    .max(100, "Completion rate cannot exceed 100%"),
  averageCompletionTime: z.number()
    .min(0, "Completion time cannot be negative"),
  averageRating: z.number()
    .min(0, "Rating cannot be negative")
    .max(5, "Rating cannot exceed 5 stars"),
  ratingCount: z.number().int().min(0, "Rating count cannot be negative"),
  viewCount: z.number().int().min(0, "View count cannot be negative"),
  recentEnrollments: z.number().int().min(0, "Recent enrollments cannot be negative"),
});

/**
 * Course progress validation
 */
export const CourseProgressSchema = z.object({
  totalLessons: z.number().int().min(0, "Total lessons cannot be negative"),
  completedLessons: z.number().int().min(0, "Completed lessons cannot be negative"),
  progressPercentage: z.number()
    .min(0, "Progress cannot be negative")
    .max(100, "Progress cannot exceed 100%"),
  timeSpent: z.number().min(0, "Time spent cannot be negative"),
  lastAccessed: z.date().optional(),
  currentLessonId: z.string().optional(),
  estimatedTimeToComplete: z.number().min(0).optional(),
}).superRefine((data, ctx) => {
  // Business rule: Completed lessons cannot exceed total lessons
  if (data.completedLessons > data.totalLessons) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Completed lessons cannot exceed total lessons",
      path: ["completedLessons"],
    });
  }
  
  // Business rule: Progress percentage should match lesson completion
  if (data.totalLessons > 0) {
    const expectedProgress = (data.completedLessons / data.totalLessons) * 100;
    if (Math.abs(data.progressPercentage - expectedProgress) > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Progress percentage inconsistent with lesson completion",
        path: ["progressPercentage"],
      });
    }
  }
});

/**
 * Lesson resource validation
 */
export const LessonResourceSchema = z.object({
  title: z.string()
    .min(1, "Resource title is required")
    .max(100, "Resource title must be under 100 characters"),
  url: z.string().url("Resource must have a valid URL"),
  type: z.enum(["pdf", "link", "download", "exercise"], {
    errorMap: () => ({
      message: "Resource type must be pdf, link, download, or exercise",
    }),
  }),
  fileSize: z.string()
    .max(20, "File size description too long")
    .optional(),
});

/**
 * Course lesson validation
 */
export const CourseLessonSchema = z.object({
  id: z.string().min(1, "Lesson ID is required"),
  title: z.string()
    .min(2, "Lesson title must be at least 2 characters")
    .max(100, "Lesson title must be under 100 characters"),
  content: z.string()
    .min(10, "Lesson content must be at least 10 characters")
    .max(50000, "Lesson content too long"),
  contentType: LessonContentTypeSchema,
  order: z.number().int().min(1, "Lesson order must be at least 1"),
  estimatedDuration: z.number()
    .min(1, "Lesson must be at least 1 minute")
    .max(480, "Lesson cannot exceed 8 hours"),
  isCompleted: z.boolean().optional(),
  videoUrl: z.string().url("Video URL must be valid").optional(),
  resources: z.array(LessonResourceSchema).max(10, "Maximum 10 resources per lesson"),
});

/**
 * Course module validation
 */
export const CourseModuleSchema = z.object({
  id: z.string().min(1, "Module ID is required"),
  title: z.string()
    .min(2, "Module title must be at least 2 characters")
    .max(100, "Module title must be under 100 characters"),
  description: z.string()
    .max(500, "Module description must be under 500 characters")
    .optional(),
  order: z.number().int().min(1, "Module order must be at least 1"),
  estimatedDuration: z.number()
    .min(5, "Module must be at least 5 minutes")
    .max(2400, "Module cannot exceed 40 hours"),
  lessons: z.array(CourseLessonSchema)
    .min(1, "Module must have at least one lesson")
    .max(50, "Module cannot have more than 50 lessons"),
  isLocked: z.boolean().default(false),
  completionRequirement: z.enum(["all-lessons", "percentage", "assessment"])
    .default("all-lessons"),
});

/**
 * Course review validation
 */
export const CourseReviewSchema = z.object({
  id: z.string().min(1, "Review ID is required"),
  reviewer: z.object({
    name: z.string()
      .min(2, "Reviewer name must be at least 2 characters")
      .max(50, "Reviewer name must be under 50 characters"),
    avatarUrl: z.string().url("Avatar must be a valid URL").optional(),
    isVerified: z.boolean().default(false),
  }),
  rating: z.number()
    .int("Rating must be a whole number")
    .min(1, "Rating must be at least 1 star")
    .max(5, "Rating cannot exceed 5 stars"),
  comment: z.string()
    .min(10, "Review comment must be at least 10 characters")
    .max(1000, "Review comment must be under 1000 characters"),
  createdAt: z.date(),
  helpfulCount: z.number().int().min(0, "Helpful count cannot be negative"),
});

/**
 * Course FAQ validation
 */
export const CourseFAQSchema = z.object({
  question: z.string()
    .min(5, "Question must be at least 5 characters")
    .max(200, "Question must be under 200 characters"),
  answer: z.string()
    .min(10, "Answer must be at least 10 characters")
    .max(1000, "Answer must be under 1000 characters"),
  category: z.enum(["general", "technical", "payment", "completion"], {
    errorMap: () => ({
      message: "FAQ category must be general, technical, payment, or completion",
    }),
  }),
});

/**
 * Course certificate validation
 */
export const CourseCertificateSchema = z.object({
  isAvailable: z.boolean(),
  type: z.enum(["completion", "achievement", "professional"], {
    errorMap: () => ({
      message: "Certificate type must be completion, achievement, or professional",
    }),
  }),
  description: z.string()
    .max(300, "Certificate description must be under 300 characters")
    .optional(),
  requirements: z.array(z.string())
    .min(1, "Certificate must have at least one requirement")
    .max(10, "Certificate cannot have more than 10 requirements"),
});

// =============================================================================
// MAIN COURSE SCHEMAS
// =============================================================================

/**
 * Course summary validation (for catalog display)
 */
export const CourseSummarySchema = z.object({
  id: z.string().min(1, "Course ID is required"),
  title: z.string()
    .min(5, "Course title must be at least 5 characters")
    .max(100, "Course title must be under 100 characters"),
  shortDescription: z.string()
    .min(10, "Short description must be at least 10 characters")
    .max(200, "Short description must be under 200 characters"),
  author: CourseAuthorSchema,
  category: CourseCategorySchema,
  difficulty: CourseDifficultySchema,
  status: CourseStatusSchema,
  modulesCount: z.number().int().min(0, "Modules count cannot be negative"),
  lessonsCount: z.number().int().min(0, "Lessons count cannot be negative"),
  thumbnailUrl: z.string().url("Thumbnail must be a valid URL").optional(),
  pricing: CoursePricingSchema,
  stats: CourseStatsSchema,
  skills: z.array(z.string())
    .min(1, "Course must teach at least one skill")
    .max(15, "Course cannot teach more than 15 skills"),
  estimatedDuration: z.number()
    .min(0.5, "Course must be at least 30 minutes")
    .max(200, "Course cannot exceed 200 hours"),
  createdAt: z.number().int().positive("Creation timestamp must be positive"),
  updatedAt: z.number().int().positive("Update timestamp must be positive"),
  isEnrolled: z.boolean().optional(),
  progress: CourseProgressSchema.optional(),
});

/**
 * Detailed course validation (for course detail page)
 */
export const CourseDetailSchema = CourseSummarySchema.extend({
  description: z.string()
    .min(20, "Description must be at least 20 characters")
    .max(5000, "Description must be under 5000 characters"),
  learningObjectives: z.array(z.string())
    .min(1, "Must specify at least one learning objective")
    .max(10, "Cannot have more than 10 learning objectives"),
  prerequisites: z.array(z.string())
    .max(8, "Cannot have more than 8 prerequisites"),
  targetAudience: z.array(z.string())
    .min(1, "Must specify target audience")
    .max(5, "Cannot have more than 5 target audience groups"),
  modules: z.array(CourseModuleSchema)
    .min(1, "Course must have at least one module")
    .max(20, "Course cannot have more than 20 modules"),
  reviews: z.array(CourseReviewSchema).max(100, "Too many reviews").optional(),
  faqs: z.array(CourseFAQSchema).max(20, "Too many FAQs").optional(),
  certificate: CourseCertificateSchema.optional(),
  tags: z.array(z.string())
    .max(20, "Cannot have more than 20 tags"),
  language: z.string()
    .min(2, "Language code must be at least 2 characters")
    .max(5, "Language code too long")
    .default("en"),
  format: CourseFormatSchema.default("self-paced"),
});

/**
 * Course creation/update validation
 */
export const CourseCreateSchema = z.object({
  title: z.string()
    .min(5, "Course title must be at least 5 characters")
    .max(100, "Course title must be under 100 characters")
    .transform((val) => val.trim()),
    
  description: z.string()
    .min(20, "Description must be at least 20 characters")
    .max(5000, "Description must be under 5000 characters")
    .transform((val) => val.trim()),
    
  shortDescription: z.string()
    .min(10, "Short description must be at least 10 characters")
    .max(200, "Short description must be under 200 characters")
    .transform((val) => val.trim()),
    
  category: CourseCategorySchema,
  difficulty: CourseDifficultySchema,
  status: CourseStatusSchema.default("draft"),
  pricing: CoursePricingSchema,
  
  thumbnailUrl: z.string()
    .url("Thumbnail must be a valid URL")
    .optional()
    .or(z.literal("")),
    
  skills: z.array(z.string())
    .min(1, "Course must teach at least one skill")
    .max(15, "Maximum 15 skills per course")
    .transform((skills) => skills.map(skill => skill.trim().toLowerCase())),
    
  learningObjectives: z.array(z.string())
    .min(1, "Must specify at least one learning objective")
    .max(10, "Maximum 10 learning objectives")
    .transform((objectives) => objectives.map(obj => obj.trim())),
    
  prerequisites: z.array(z.string())
    .max(8, "Maximum 8 prerequisites")
    .transform((prereqs) => prereqs.map(req => req.trim())),
  
  targetAudience: z.array(z.string())
    .min(1, "Must specify target audience")
    .max(5, "Maximum 5 target audience groups")
    .transform((audience) => audience.map(aud => aud.trim())),
    
  estimatedDuration: z.number()
    .min(0.5, "Course must be at least 30 minutes")
    .max(200, "Course cannot exceed 200 hours"),
    
  language: z.string()
    .min(2, "Language must be specified")
    .max(5, "Language code too long")
    .default("en"),
  
  format: CourseFormatSchema.default("self-paced"),
  
  tags: z.array(z.string())
    .max(20, "Maximum 20 tags")
    .transform((tags) => tags.map(tag => tag.trim().toLowerCase())),
});

/**
 * Course search and filtering validation
 */
export const CourseSearchSchema = z.object({
  query: z.string()
    .max(100, "Search query too long")
    .transform((val) => val.trim())
    .optional(),
    
  category: CourseCategorySchema
    .or(z.literal("all"))
    .default("all"),
    
  difficulty: CourseDifficultySchema
    .or(z.literal("all"))
    .default("all"),
    
  priceFilter: z.enum(["free", "paid", "all"])
    .default("all"),
    
  durationFilter: z.object({
    min: z.number().min(0, "Minimum duration cannot be negative").optional(),
    max: z.number().max(1000, "Maximum duration too high").optional(),
  }).optional(),
  
  minimumRating: z.number()
    .min(1, "Minimum rating must be at least 1")
    .max(5, "Minimum rating cannot exceed 5")
    .optional(),
    
  sortBy: z.enum([
    "newest", 
    "oldest", 
    "popular", 
    "rating", 
    "title", 
    "price",
    "duration"
  ]).default("newest"),
  
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
  
  cursor: z.string().optional(),
  
  limit: z.number()
    .int("Limit must be a whole number")
    .min(1, "Limit must be at least 1")
    .max(50, "Limit cannot exceed 50")
    .default(24),
    
  onlyEnrolled: z.boolean().default(false),
  
  skills: z.array(z.string())
    .max(10, "Maximum 10 skills filter")
    .transform((skills) => skills.map(skill => skill.trim().toLowerCase()))
    .optional(),
    
  authorId: z.string().optional(),
  
  includeArchived: z.boolean().default(false),
});

/**
 * Course enrollment validation
 */
export const CourseEnrollmentSchema = z.object({
  courseId: z.string()
    .min(1, "Course ID is required"),
    
  paymentInfo: z.object({
    amount: z.number()
      .min(0, "Payment amount cannot be negative"),
    currency: CurrencySchema,
    transactionId: z.string()
      .min(1, "Transaction ID is required")
      .max(100, "Transaction ID too long"),
    paymentMethod: z.string()
      .max(50, "Payment method description too long")
      .optional(),
  }).optional(),
  
  enrollmentSource: z.enum([
    "web",
    "mobile", 
    "api",
    "admin",
    "bulk"
  ]).default("web"),
  
  referralCode: z.string()
    .max(20, "Referral code too long")
    .optional(),
});

/**
 * Analytics event validation
 */
export const CourseAnalyticsSchema = z.object({
  action: z.enum([
    "course_viewed",
    "course_searched", 
    "course_filtered",
    "course_enrolled",
    "lesson_started",
    "lesson_completed",
    "module_completed",
    "course_completed",
    "course_rated",
    "course_reviewed",
    "course_bookmarked"
  ]),
  
  entityId: z.string().min(1, "Entity ID is required"),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  searchQuery: z.string().max(100).optional(),
  
  filters: z.record(z.unknown()).optional(),
  
  timeSpent: z.number()
    .int("Time spent must be a whole number")
    .min(0, "Time spent cannot be negative")
    .optional(),
    
  metadata: z.record(z.unknown()).optional(),
  timestamp: z.date().default(() => new Date()),
});

// =============================================================================
// PAGINATION & RESPONSE SCHEMAS
// =============================================================================

/**
 * Pagination request validation
 */
export const PaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number()
    .int("Limit must be a whole number")
    .min(1, "Limit must be at least 1")
    .max(100, "Limit cannot exceed 100")
    .default(24),
  direction: z.enum(["next", "prev"]).default("next"),
});

/**
 * Course catalog response validation
 */
export const CourseCatalogResponseSchema = z.object({
  courses: z.array(CourseSummarySchema),
  nextCursor: z.string().optional(),
  prevCursor: z.string().optional(),
  totalCount: z.number().int().min(0),
  pageSize: z.number().int().min(1),
  hasMore: z.boolean(),
  appliedFilters: z.object({
    category: CourseCategorySchema.optional(),
    difficulty: CourseDifficultySchema.optional(),
    priceFilter: z.string().optional(),
    query: z.string().optional(),
  }),
});

// =============================================================================
// EXPORTED TYPES
// =============================================================================

export type CourseCreateInput = z.infer<typeof CourseCreateSchema>;
export type CourseSearchInput = z.infer<typeof CourseSearchSchema>;
export type CourseEnrollmentInput = z.infer<typeof CourseEnrollmentSchema>;
export type CourseAnalyticsInput = z.infer<typeof CourseAnalyticsSchema>;
export type CourseSummaryType = z.infer<typeof CourseSummarySchema>;
export type CourseDetailType = z.infer<typeof CourseDetailSchema>;
export type PaginationType = z.infer<typeof PaginationSchema>;
export type CourseCatalogResponseType = z.infer<typeof CourseCatalogResponseSchema>;

// =============================================================================
// VALIDATION HELPER FUNCTIONS
// =============================================================================

/**
 * Validate course data with detailed error reporting
 */
export function validateCourseData(data: unknown): {
  success: boolean;
  data?: CourseCreateInput;
  errors?: string[];
} {
  try {
    const validatedData = CourseCreateSchema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map(issue => 
        `${issue.path.join('.')}: ${issue.message}`
      );
      return { success: false, errors };
    }
    return { success: false, errors: ["Unknown validation error"] };
  }
}

/**
 * Validate search parameters with defaults
 */
export function validateSearchParams(params: unknown): CourseSearchInput {
  return CourseSearchSchema.parse(params || {});
}

/**
 * Sanitize and validate course content
 */
export function sanitizeCourseContent(content: string): string {
  return content
    .trim()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .slice(0, 50000); // Enforce length limit
}

/**
 * Validate and format course skills
 */
export function validateCourseSkills(skills: unknown): string[] {
  if (!Array.isArray(skills)) {
    throw new Error("Skills must be an array");
  }
  
  return skills
    .filter((skill): skill is string => typeof skill === "string")
    .map(skill => skill.trim().toLowerCase())
    .filter(skill => skill.length > 0)
    .slice(0, 15); // Enforce maximum
}

export default CourseCreateSchema;