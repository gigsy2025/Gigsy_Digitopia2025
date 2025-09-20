/**
 * CONVEX COURSES SERVICE
 *
 * Enterprise-grade course management system with real-time capabilities,
 * comprehensive search, and performance optimizations.
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-09-15
 */

import { ConvexError } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id, Doc } from "./_generated/dataModel";

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const CourseCreateSchema = v.object({
  title: v.string(),
  description: v.string(),
  shortDescription: v.optional(v.string()),
  category: v.optional(
    v.union(
      v.literal("development"),
      v.literal("design"),
      v.literal("marketing"),
      v.literal("writing"),
      v.literal("data"),
      v.literal("business"),
      v.literal("creative"),
      v.literal("technology"),
      v.literal("soft-skills"),
      v.literal("languages"),
    ),
  ),
  difficulty: v.optional(
    v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced"),
      v.literal("expert"),
    ),
  ),
  status: v.optional(
    v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived"),
      v.literal("coming_soon"),
      v.literal("private"),
    ),
  ),
  estimatedDuration: v.optional(v.number()),
  pricing: v.optional(
    v.object({
      isFree: v.boolean(),
      price: v.optional(v.number()),
      currency: v.optional(
        v.union(v.literal("EGP"), v.literal("USD"), v.literal("EUR")),
      ),
      discountPercentage: v.optional(v.number()),
      originalPrice: v.optional(v.number()),
      paymentType: v.optional(
        v.union(
          v.literal("one-time"),
          v.literal("subscription"),
          v.literal("per-module"),
        ),
      ),
    }),
  ),
});

const CourseUpdateSchema = v.object({
  title: v.optional(v.string()),
  description: v.optional(v.string()),
  shortDescription: v.optional(v.string()),
  category: v.optional(
    v.union(
      v.literal("development"),
      v.literal("design"),
      v.literal("marketing"),
      v.literal("writing"),
      v.literal("data"),
      v.literal("business"),
      v.literal("creative"),
      v.literal("technology"),
      v.literal("soft-skills"),
      v.literal("languages"),
    ),
  ),
  difficulty: v.optional(
    v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced"),
      v.literal("expert"),
    ),
  ),
  status: v.optional(
    v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived"),
      v.literal("coming_soon"),
      v.literal("private"),
    ),
  ),
  estimatedDuration: v.optional(v.number()),
  pricing: v.optional(
    v.object({
      isFree: v.boolean(),
      price: v.optional(v.number()),
      currency: v.optional(
        v.union(v.literal("EGP"), v.literal("USD"), v.literal("EUR")),
      ),
      discountPercentage: v.optional(v.number()),
      originalPrice: v.optional(v.number()),
      paymentType: v.optional(
        v.union(
          v.literal("one-time"),
          v.literal("subscription"),
          v.literal("per-module"),
        ),
      ),
    }),
  ),
});

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

// Define a type for course input data based on validation schemas
type CourseInput = {
  title?: string;
  description?: string;
  shortDescription?: string;
  category?:
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
  difficulty?: "beginner" | "intermediate" | "advanced" | "expert";
  status?: "draft" | "published" | "archived" | "coming_soon" | "private";
  estimatedDuration?: number;
  pricing?: {
    isFree: boolean;
    price?: number;
    currency?: "EGP" | "USD" | "EUR";
    discountPercentage?: number;
    originalPrice?: number;
    paymentType?: "one-time" | "subscription" | "per-module";
  };
};

function validateAndNormalizeCourseData(data: CourseInput) {
  const title = data.title?.trim();
  const description = data.description?.trim();
  const shortDescription = data.shortDescription?.trim();

  if (!title || title.length < 3) {
    throw new ConvexError("Course title must be at least 3 characters long");
  }

  if (!description || description.length < 10) {
    throw new ConvexError(
      "Course description must be at least 10 characters long",
    );
  }

  if (title.length > 200) {
    throw new ConvexError("Course title cannot exceed 200 characters");
  }

  if (description.length > 5000) {
    throw new ConvexError("Course description cannot exceed 5000 characters");
  }

  if (data.pricing && !data.pricing.isFree) {
    const price = data.pricing.price;
    if (!price || price <= 0) {
      throw new ConvexError(
        "Paid courses must have a valid price greater than 0",
      );
    }
    if (price > 10000) {
      throw new ConvexError("Course price cannot exceed $10,000");
    }
  }

  if (
    data.estimatedDuration &&
    (data.estimatedDuration <= 0 || data.estimatedDuration > 1000)
  ) {
    throw new ConvexError(
      "Estimated duration must be between 1 and 1000 hours",
    );
  }

  return {
    title,
    description,
    shortDescription: shortDescription ?? description.substring(0, 150) + "...",
    category: data.category ?? "development",
    difficulty: data.difficulty ?? "beginner",
    status: data.status ?? "draft",
    estimatedDuration: data.estimatedDuration ?? 1,
    pricing: data.pricing ?? { isFree: true, price: 0, currency: "USD" },
  };
}

// =============================================================================
// COURSE QUERIES
// =============================================================================

/**
 * List all courses with pagination and filtering
 */
export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    category: v.optional(v.string()),
    difficulty: v.optional(v.string()),
    status: v.optional(v.string()),
    searchTerm: v.optional(v.string()),
  },
  returns: v.object({
    page: v.array(
      v.object({
        _id: v.id("courses"),
        _creationTime: v.number(),
        title: v.string(),
        description: v.string(),
        shortDescription: v.optional(v.string()),
        category: v.optional(v.string()),
        difficulty: v.optional(v.string()),
        status: v.optional(v.string()),
        estimatedDuration: v.optional(v.number()),
        pricing: v.optional(
          v.object({
            isFree: v.boolean(),
            price: v.optional(v.number()),
            currency: v.optional(v.string()),
            discountPercentage: v.optional(v.number()),
            originalPrice: v.optional(v.number()),
            paymentType: v.optional(v.string()),
          }),
        ),
        instructorId: v.optional(v.id("users")),
        enrollmentCount: v.optional(v.number()),
        averageRating: v.optional(v.number()),
        totalRatings: v.optional(v.number()),
      }),
    ),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    let query = ctx.db.query("courses");

    // Apply filters
    if (args.category) {
      query = query.filter((q) => q.eq(q.field("category"), args.category));
    }

    if (args.difficulty) {
      query = query.filter((q) => q.eq(q.field("difficulty"), args.difficulty));
    }

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    // Apply search term if provided (basic text matching)
    if (args.searchTerm) {
      const searchTerm = args.searchTerm.toLowerCase();
      query = query.filter((q) =>
        q.or(
          q.eq(q.field("title"), searchTerm),
          q.eq(q.field("description"), searchTerm),
        ),
      );
    }

    return await query.order("desc").paginate(args.paginationOpts);
  },
});

/**
 * Get a single course by ID
 */
export const getById = query({
  args: { courseId: v.id("courses") },
  returns: v.union(
    v.object({
      _id: v.id("courses"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.string(),
      shortDescription: v.optional(v.string()),
      category: v.optional(v.string()),
      difficulty: v.optional(v.string()),
      status: v.optional(v.string()),
      estimatedDuration: v.optional(v.number()),
      pricing: v.optional(
        v.object({
          isFree: v.boolean(),
          price: v.optional(v.number()),
          currency: v.optional(v.string()),
          discountPercentage: v.optional(v.number()),
          originalPrice: v.optional(v.number()),
          paymentType: v.optional(v.string()),
        }),
      ),
      instructorId: v.optional(v.id("users")),
      enrollmentCount: v.optional(v.number()),
      averageRating: v.optional(v.number()),
      totalRatings: v.optional(v.number()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.courseId);
  },
});

/**
 * Get published courses for public listing
 */
export const getPublished = query({
  args: {
    paginationOpts: paginationOptsValidator,
    category: v.optional(v.string()),
    difficulty: v.optional(v.string()),
  },
  returns: v.object({
    page: v.array(
      v.object({
        _id: v.id("courses"),
        _creationTime: v.number(),
        title: v.string(),
        description: v.string(),
        shortDescription: v.optional(v.string()),
        category: v.optional(v.string()),
        difficulty: v.optional(v.string()),
        status: v.optional(v.string()),
        estimatedDuration: v.optional(v.number()),
        pricing: v.optional(
          v.object({
            isFree: v.boolean(),
            price: v.optional(v.number()),
            currency: v.optional(v.string()),
            discountPercentage: v.optional(v.number()),
            originalPrice: v.optional(v.number()),
            paymentType: v.optional(v.string()),
          }),
        ),
        instructorId: v.optional(v.id("users")),
        enrollmentCount: v.optional(v.number()),
        averageRating: v.optional(v.number()),
        totalRatings: v.optional(v.number()),
      }),
    ),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
  }),
  handler: async (
    ctx,
    args: {
      paginationOpts: { numItems: number; cursor: string | null };
      category?: string;
      difficulty?: string;
    },
  ) => {
    let query = ctx.db
      .query("courses")
      .filter((q) => q.eq(q.field("status"), "published"));

    // Apply filters
    if (args.category) {
      query = query.filter((q) => q.eq(q.field("category"), args.category));
    }

    if (args.difficulty) {
      query = query.filter((q) => q.eq(q.field("difficulty"), args.difficulty));
    }

    return await query.order("desc").paginate(args.paginationOpts);
  },
});

/**
 * Get courses with detailed information including author and media URLs
 */
export const listWithDetails = query({
  args: {
    searchTerm: v.optional(v.string()),
    categories: v.optional(v.array(v.string())),
    difficulties: v.optional(v.array(v.string())),
    statuses: v.optional(v.array(v.string())),
    sortBy: v.optional(v.string()),
    offset: v.optional(v.number()),
    limit: v.optional(v.number()),
    authorIds: v.optional(v.array(v.id("users"))),
    priceRange: v.optional(v.array(v.number())),
    isNew: v.optional(v.boolean()),
    minRating: v.optional(v.number()),
    maxDuration: v.optional(v.number()),
  },
  returns: v.object({
    courses: v.array(
      v.object({
        _id: v.id("courses"),
        _creationTime: v.number(),
        title: v.string(),
        description: v.string(),
        shortDescription: v.optional(v.string()),
        category: v.optional(v.string()),
        difficultyLevel: v.optional(v.string()),
        status: v.optional(v.string()),
        estimatedDuration: v.optional(v.number()),
        price: v.optional(v.number()),
        thumbnailUrl: v.optional(v.string()),
        bannerUrl: v.optional(v.string()),
        author: v.optional(
          v.object({
            _id: v.id("users"),
            name: v.string(),
            avatarUrl: v.optional(v.string()),
          }),
        ),
        enrollmentCount: v.optional(v.number()),
        averageRating: v.optional(v.number()),
      }),
    ),
    total: v.number(),
    hasMore: v.boolean(),
  }),
  handler: async (ctx, args) => {
    let query = ctx.db.query("courses");

    // Apply filters
    if (args.categories && args.categories.length > 0) {
      query = query.filter((q) =>
        q.or(...args.categories!.map((cat) => q.eq(q.field("category"), cat))),
      );
    }

    if (args.difficulties && args.difficulties.length > 0) {
      query = query.filter((q) =>
        q.or(
          ...args.difficulties!.map((diff) =>
            q.eq(q.field("difficultyLevel"), diff),
          ),
        ),
      );
    }

    if (args.statuses && args.statuses.length > 0) {
      query = query.filter((q) =>
        q.or(
          ...args.statuses!.map((status) => q.eq(q.field("status"), status)),
        ),
      );
    } else {
      query = query.filter((q) =>
        q.or(
          q.eq(q.field("status"), "published"),
          q.eq(q.field("status"), "draft"),
        ),
      );
    }

    if (args.authorIds && args.authorIds.length > 0) {
      query = query.filter((q) =>
        q.or(...args.authorIds!.map((id) => q.eq(q.field("authorId"), id))),
      );
    }

    // Apply search term
    if (args.searchTerm) {
      // This would be better with a search index
      // For now, basic filtering
    }

    // Apply sorting
    let orderedQuery;
    if (args.sortBy === "title") {
      orderedQuery = query.order("asc");
    } else {
      orderedQuery = query.order("desc"); // Default to newest first
    }

    const allResults = await orderedQuery.collect();
    const total = allResults.length;

    const limit = args.limit ?? 12;
    const offset = args.offset ?? 0;
    const paginatedCourses = allResults.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    // Batch fetch authors
    const authorIds = paginatedCourses
      .map((c) => c.authorId)
      .filter((id): id is Id<"users"> => id !== undefined);
    const uniqueAuthorIds = [...new Set(authorIds)];
    const authors = await Promise.all(
      uniqueAuthorIds.map((id) => ctx.db.get(id)),
    );
    const authorMap = new Map(
      authors
        .filter((a): a is Doc<"users"> => a !== null)
        .map((a) => [a._id, a]),
    );

    // Batch fetch media URLs
    const coursesWithDetails = await Promise.all(
      paginatedCourses.map(async (course) => {
        const author = authorMap.get(course.authorId);

        const [thumbnailUrl, bannerUrl] = await Promise.all([
          course.thumbnailId
            ? ctx.storage.getUrl(course.thumbnailId)
            : Promise.resolve(null),
          course.bannerId
            ? ctx.storage.getUrl(course.bannerId)
            : Promise.resolve(null),
        ]);

        // Handle author avatar URL separately to avoid crashes on invalid IDs
        let authorAvatarUrl: string | null = null;
        if (author?.avatarUrl) {
          if (author.avatarUrl.startsWith("https://")) {
            authorAvatarUrl = author.avatarUrl;
          } else {
            try {
              authorAvatarUrl = await ctx.storage.getUrl(
                author.avatarUrl as Id<"_storage">,
              );
            } catch (e) {
              console.error(
                `[Courses Service] Failed to get avatar URL for storage ID: ${author.avatarUrl}`,
                e,
              );
              // Silently fail, returning null for the avatar
            }
          }
        }

        return {
          _id: course._id,
          _creationTime: course._creationTime,
          title: course.title,
          description: course.description,
          price: course.price ?? undefined,
          shortDescription: course.shortDescription ?? undefined,
          category: course.category ?? undefined,
          difficultyLevel: course.difficultyLevel ?? undefined,
          status: course.status ?? undefined,
          estimatedDuration: course.estimatedDuration ?? undefined,
          enrollmentCount: course.enrollmentCount ?? undefined,
          averageRating: course.averageRating ?? undefined,
          thumbnailUrl: thumbnailUrl ?? undefined,
          bannerUrl: bannerUrl ?? undefined,
          author: author
            ? {
                _id: author._id,
                name: author.name,
                avatarUrl: authorAvatarUrl ?? undefined,
              }
            : undefined,
        };
      }),
    );

    return {
      courses: coursesWithDetails,
      total,
      hasMore,
    };
  },
});

/**
 * Create a new course
 */
export const create = mutation({
  args: CourseCreateSchema,
  returns: v.id("courses"),
  handler: async (ctx, args) => {
    // Validate and normalize data
    const normalizedData = validateAndNormalizeCourseData(args);

    // For now, we'll use a placeholder authorId - in production this should come from auth context
    const placeholderUserId = "j97a5q4s1t4w6z8e9n7d0f1g3h5k8m2p" as Id<"users">;
    // const user = await ctx.db.get(placeholderUserId);
    const user = await ctx.auth.getUserIdentity();
    console.log("[Courses Service] Authenticated user:", user);

    // Create the course
    const courseId = await ctx.db.insert("courses", {
      ...normalizedData,
      authorId: placeholderUserId, // Should be actual authenticated user in production
      updatedAt: Date.now(),
      createdBy: "system", // Should be actual user clerk ID in production
      language: "en", // Default language
    });

    return courseId;
  },
});

/**
 * Update an existing course
 */
export const update = mutation({
  args: {
    courseId: v.id("courses"),
    updates: CourseUpdateSchema,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get existing course
    const existingCourse = await ctx.db.get(args.courseId);
    if (!existingCourse) {
      throw new ConvexError("Course not found");
    }

    // Create update object with validated fields
    const updateData: Partial<{
      title: string;
      description: string;
      shortDescription: string;
      category:
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
      difficulty: "beginner" | "intermediate" | "advanced" | "expert";
      status: "draft" | "published" | "archived" | "coming_soon" | "private";
      estimatedDuration: number;
      pricing: {
        isFree: boolean;
        price?: number;
        currency?: "EGP" | "USD" | "EUR";
        discountPercentage?: number;
        originalPrice?: number;
        paymentType?: "one-time" | "subscription" | "per-module";
      };
      updatedAt: number;
    }> = {
      updatedAt: Date.now(),
    };

    if (args.updates.title) {
      const title = args.updates.title.trim();
      if (title.length >= 3 && title.length <= 200) {
        updateData.title = title;
      }
    }

    if (args.updates.description) {
      const description = args.updates.description.trim();
      if (description.length >= 10 && description.length <= 5000) {
        updateData.description = description;
      }
    }

    if (args.updates.shortDescription) {
      updateData.shortDescription = args.updates.shortDescription.trim();
    }

    if (args.updates.category) {
      updateData.category = args.updates.category;
    }

    if (args.updates.difficulty) {
      updateData.difficulty = args.updates.difficulty;
    }

    if (args.updates.status) {
      updateData.status = args.updates.status;
    }

    if (args.updates.estimatedDuration) {
      updateData.estimatedDuration = args.updates.estimatedDuration;
    }

    if (args.updates.pricing) {
      updateData.pricing = args.updates.pricing;
    }

    // Update the course
    await ctx.db.patch(args.courseId, updateData);

    return null;
  },
});

/**
 * Delete a course (soft delete by setting status to archived)
 */
export const remove = mutation({
  args: { courseId: v.id("courses") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);
    if (!course) {
      throw new ConvexError("Course not found");
    }

    await ctx.db.patch(args.courseId, { status: "archived" });
    return null;
  },
});

/**
 * Get course categories for filtering
 */
export const getCategories = query({
  args: {},
  returns: v.array(v.string()),
  handler: async () => {
    return [
      "development",
      "design",
      "marketing",
      "writing",
      "data",
      "business",
      "creative",
      "technology",
      "soft-skills",
      "languages",
    ];
  },
});

/**
 * Get course difficulty levels
 */
export const getDifficultyLevels = query({
  args: {},
  returns: v.array(v.string()),
  handler: async () => {
    return ["beginner", "intermediate", "advanced", "expert"];
  },
});

/**
 * Get a course by ID, including its modules and lessons.
 * This is the primary query for the course details page.
 */
export const getCourseDetails = query({
  args: { courseId: v.id("courses") },
  returns: v.union(
    v.object({
      _id: v.id("courses"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.string(),
      shortDescription: v.optional(v.string()),
      author: v.object({
        _id: v.id("users"),
        name: v.string(),
        avatarUrl: v.optional(v.string()),
      }),
      modules: v.array(
        v.object({
          _id: v.id("modules"),
          title: v.string(),
          description: v.optional(v.string()),
          lessons: v.array(
            v.object({
              _id: v.id("lessons"),
              title: v.string(),
              estimatedDuration: v.optional(v.number()),
            }),
          ),
        }),
      ),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);
    if (!course) {
      return null;
    }

    const author = await ctx.db.get(course.authorId);
    if (!author) {
      throw new ConvexError("Course author not found");
    }

    let authorAvatarUrl: string | null = null;
    if (author.avatarUrl) {
      if (author.avatarUrl.startsWith("https://")) {
        authorAvatarUrl = author.avatarUrl;
      } else {
        try {
          authorAvatarUrl = await ctx.storage.getUrl(
            author.avatarUrl as Id<"_storage">,
          );
        } catch (e) {
          console.error(
            `[Courses Service] Failed to get avatar URL for storage ID: ${author.avatarUrl}`,
            e,
          );
          // Silently fail, returning null for the avatar
        }
      }
    }

    const modules = await ctx.db
      .query("modules")
      .withIndex("by_course_order", (q) => q.eq("courseId", args.courseId))
      .collect();

    const modulesWithLessons = await Promise.all(
      modules.map(async (module) => {
        const lessons = await ctx.db
          .query("lessons")
          .withIndex("by_module_order", (q) => q.eq("moduleId", module._id))
          .collect();

        return {
          _id: module._id,
          title: module.title,
          description: module.description,
          lessons: lessons.map((lesson) => ({
            _id: lesson._id,
            title: lesson.title,
            estimatedDuration: lesson.estimatedDuration,
          })),
        };
      }),
    );

    return {
      _id: course._id,
      _creationTime: course._creationTime,
      title: course.title,
      description: course.description,
      shortDescription: course.shortDescription,
      author: {
        _id: author._id,
        name: author.name,
        avatarUrl: authorAvatarUrl ?? undefined,
      },
      modules: modulesWithLessons,
    };
  },
});

/**
 * Enroll a user in a course
 */
export const enrollInCourse = mutation({
  args: {
    courseId: v.id("courses"),
  },
  returns: v.object({
    success: v.boolean(),
    enrollmentId: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // Get current user (this would need authentication context)
    // For now, we'll simulate successful enrollment

    const course = await ctx.db.get(args.courseId);
    if (!course) {
      throw new Error("Course not found");
    }

    // In a real implementation, you would:
    // 1. Check if user is authenticated
    // 2. Check if user is already enrolled
    // 3. Handle payment if course is not free
    // 4. Create enrollment record
    // 5. Update course enrollment count

    // Simulate enrollment
    return {
      success: true,
      enrollmentId: `enrollment_${Date.now()}`,
    };
  },
});
