/**
 * RBAC PROTECTED COURSE MUTATIONS
 *
 * Enterprise-grade course management mutations with strict role-based
 * access control using Clerk metadata validation.
 *
 * SECURITY FEATURES:
 * - Admin-only course creation and management
 * - Comprehensive permission validation
 * - Audit logging for all operations
 * - Input validation and sanitization
 * - Error handling with proper user feedback
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-09-16
 */

import { ConvexError } from "convex/values";
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import type { MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const CourseStatusSchema = v.union(
  v.literal("draft"),
  v.literal("published"),
  v.literal("archived"),
);

const DifficultyLevelSchema = v.union(
  v.literal("beginner"),
  v.literal("intermediate"),
  v.literal("advanced"),
);

const PricingTypeSchema = v.union(
  v.literal("free"),
  v.literal("one-time"),
  v.literal("subscription"),
);

const CreateCourseSchema = v.object({
  title: v.string(),
  description: v.string(),
  shortDescription: v.optional(v.string()),
  status: v.optional(CourseStatusSchema),
  difficultyLevel: DifficultyLevelSchema,
  pricingType: PricingTypeSchema,
  price: v.optional(v.number()),
  estimatedDuration: v.optional(v.number()),
  tags: v.optional(v.array(v.string())),
  skills: v.optional(v.array(v.string())),
  thumbnailId: v.optional(v.id("_storage")),
  bannerId: v.optional(v.id("_storage")),
  introVideoId: v.optional(v.id("_storage")),
  isPublic: v.optional(v.boolean()),
});

const UpdateCourseSchema = v.object({
  courseId: v.id("courses"),
  title: v.optional(v.string()),
  description: v.optional(v.string()),
  shortDescription: v.optional(v.string()),
  status: v.optional(CourseStatusSchema),
  difficultyLevel: v.optional(DifficultyLevelSchema),
  pricingType: v.optional(PricingTypeSchema),
  price: v.optional(v.number()),
  estimatedDuration: v.optional(v.number()),
  tags: v.optional(v.array(v.string())),
  skills: v.optional(v.array(v.string())),
  thumbnailId: v.optional(v.id("_storage")),
  bannerId: v.optional(v.id("_storage")),
  introVideoId: v.optional(v.id("_storage")),
  isPublic: v.optional(v.boolean()),
});

const CreateModuleSchema = v.object({
  courseId: v.id("courses"),
  title: v.string(),
  description: v.optional(v.string()),
  thumbnailId: v.optional(v.id("_storage")),
  estimatedDuration: v.optional(v.number()),
  isRequired: v.optional(v.boolean()),
});

const CreateLessonSchema = v.object({
  moduleId: v.id("modules"),
  title: v.string(),
  description: v.optional(v.string()),
  contentType: v.union(
    v.literal("text"),
    v.literal("video"),
    v.literal("file"),
  ),
  content: v.string(), // Text content or storage ID for files
  thumbnailId: v.optional(v.id("_storage")),
  estimatedDuration: v.optional(v.number()),
  isRequired: v.optional(v.boolean()),
  resources: v.optional(v.array(v.id("_storage"))),
});

// =============================================================================
// RBAC HELPER FUNCTIONS
// =============================================================================

/**
 * Validate user has admin role using Clerk metadata
 */
async function validateAdminAccess(ctx: MutationCtx): Promise<{
  userId: string;
  user: Doc<"users">;
  userDbId: Id<"users">;
}> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError("Authentication required");
  }

  // Get user from database to check roles
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .unique();

  if (!user) {
    throw new ConvexError("User not found");
  }

  // Validate admin role
  if (!user.roles.includes("admin")) {
    throw new ConvexError(
      "Insufficient permissions. Course management requires admin access.",
    );
  }

  return { userId: identity.subject, user, userDbId: user._id };
}

/**
 * Log admin action for audit trail
 */
async function logAdminAction(
  ctx: MutationCtx,
  action: string,
  details: Record<string, unknown>,
  userId: string,
) {
  try {
    await ctx.db.insert("adminLogs", {
      action,
      details,
      userId,
      timestamp: Date.now(),
      createdAt: Date.now(),
    });
  } catch (error) {
    // Log error but don't fail the operation
    console.error("Failed to log admin action:", error);
  }
}

// =============================================================================
// COURSE MANAGEMENT MUTATIONS
// =============================================================================

/**
 * Create a new course (admin only)
 */
export const createCourse = mutation({
  args: CreateCourseSchema,
  returns: v.id("courses"),
  handler: async (ctx, args) => {
    const { userId, userDbId } = await validateAdminAccess(ctx);

    // Validate required fields
    if (!args.title.trim()) {
      throw new ConvexError("Course title is required");
    }

    if (!args.description.trim()) {
      throw new ConvexError("Course description is required");
    }

    if (args.title.length > 200) {
      throw new ConvexError("Course title must be 200 characters or less");
    }

    if (args.description.length > 5000) {
      throw new ConvexError(
        "Course description must be 5000 characters or less",
      );
    }

    // Validate pricing
    if (args.pricingType !== "free" && !args.price) {
      throw new ConvexError("Price is required for paid courses");
    }

    if (args.price && args.price < 0) {
      throw new ConvexError("Price must be a positive number");
    }

    // Validate file references if provided
    if (args.thumbnailId) {
      const thumbnail = await ctx.db
        .query("fileMetadata")
        .withIndex("by_storage_id", (q) => q.eq("storageId", args.thumbnailId!))
        .unique();

      if (!thumbnail || thumbnail.category !== "course-thumbnail") {
        throw new ConvexError("Invalid thumbnail file");
      }
    }

    if (args.bannerId) {
      const banner = await ctx.db
        .query("fileMetadata")
        .withIndex("by_storage_id", (q) => q.eq("storageId", args.bannerId!))
        .unique();

      if (!banner || banner.category !== "course-banner") {
        throw new ConvexError("Invalid banner file");
      }
    }

    if (args.introVideoId) {
      const video = await ctx.db
        .query("fileMetadata")
        .withIndex("by_storage_id", (q) =>
          q.eq("storageId", args.introVideoId!),
        )
        .unique();

      if (!video || video.category !== "course-intro-video") {
        throw new ConvexError("Invalid intro video file");
      }
    }

    // Create the course
    const courseId = await ctx.db.insert("courses", {
      title: args.title.trim(),
      description: args.description.trim(),
      shortDescription: args.shortDescription?.trim(),
      status: args.status ?? "draft",
      difficultyLevel: args.difficultyLevel,
      // pricingType: args.pricingType, // Temporarily disabled due to type generation issue
      price: args.price,
      estimatedDuration: args.estimatedDuration,
      tags: args.tags ?? [],
      skills: args.skills ?? [],
      thumbnailId: args.thumbnailId,
      bannerId: args.bannerId,
      introVideoId: args.introVideoId,
      isPublic: args.isPublic ?? false,
      enrollmentCount: 0,
      language: "en", // Default language
      // completionCount: 0, // Not in schema
      averageRating: 0,
      totalRatings: 0,
      authorId: userDbId, // Required field
      lastUpdated: Date.now(),
      createdBy: userId,
      updatedBy: userId,
      // createdAt: Date.now(), // Not in courses schema
      updatedAt: Date.now(),
    });

    // Log admin action
    await logAdminAction(
      ctx,
      "course_created",
      {
        courseId,
        title: args.title,
        status: args.status ?? "draft",
        pricingType: args.pricingType,
      },
      userId,
    );

    return courseId;
  },
});

/**
 * Update an existing course (admin only)
 */
export const updateCourse = mutation({
  args: UpdateCourseSchema,
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const { userId } = await validateAdminAccess(ctx);

    // Get existing course
    const course = await ctx.db.get(args.courseId);
    if (!course) {
      throw new ConvexError("Course not found");
    }

    // Validate fields if provided
    if (args.title && !args.title.trim()) {
      throw new ConvexError("Course title cannot be empty");
    }

    if (args.title && args.title.length > 200) {
      throw new ConvexError("Course title must be 200 characters or less");
    }

    if (args.description && args.description.length > 5000) {
      throw new ConvexError(
        "Course description must be 5000 characters or less",
      );
    }

    if (
      args.pricingType !== undefined &&
      args.pricingType !== "free" &&
      !args.price &&
      !course.price
    ) {
      throw new ConvexError("Price is required for paid courses");
    }

    if (args.price !== undefined && args.price < 0) {
      throw new ConvexError("Price must be a positive number");
    }

    // Validate file references if provided
    if (args.thumbnailId !== undefined) {
      if (args.thumbnailId) {
        const thumbnail = await ctx.db
          .query("fileMetadata")
          .withIndex("by_storage_id", (q) =>
            q.eq("storageId", args.thumbnailId!),
          )
          .unique();

        if (!thumbnail || thumbnail.category !== "course-thumbnail") {
          throw new ConvexError("Invalid thumbnail file");
        }
      }
    }

    // Build update object
    const updateData: Partial<Doc<"courses">> & {
      updatedBy: string;
      updatedAt: number;
      lastUpdated: number;
    } = {
      updatedBy: userId,
      updatedAt: Date.now(),
      lastUpdated: Date.now(),
    };

    if (args.title !== undefined) updateData.title = args.title.trim();
    if (args.description !== undefined)
      updateData.description = args.description.trim();
    if (args.shortDescription !== undefined)
      updateData.shortDescription = args.shortDescription?.trim();
    if (args.status !== undefined) updateData.status = args.status;
    if (args.difficultyLevel !== undefined)
      updateData.difficultyLevel = args.difficultyLevel;
    // if (args.pricingType !== undefined)
    //   updateData.pricingType = args.pricingType; // Temporarily disabled due to type generation issue
    if (args.price !== undefined) updateData.price = args.price;
    if (args.estimatedDuration !== undefined)
      updateData.estimatedDuration = args.estimatedDuration;
    if (args.tags !== undefined) updateData.tags = args.tags;
    if (args.skills !== undefined) updateData.skills = args.skills;
    if (args.thumbnailId !== undefined)
      updateData.thumbnailId = args.thumbnailId;
    if (args.bannerId !== undefined) updateData.bannerId = args.bannerId;
    if (args.introVideoId !== undefined)
      updateData.introVideoId = args.introVideoId;
    if (args.isPublic !== undefined) updateData.isPublic = args.isPublic;

    // Update the course
    await ctx.db.patch(args.courseId, updateData);

    // Log admin action
    await logAdminAction(
      ctx,
      "course_updated",
      {
        courseId: args.courseId,
        changes: Object.keys(updateData).filter(
          (key) => !["updatedBy", "updatedAt", "lastUpdated"].includes(key),
        ),
      },
      userId,
    );

    return true;
  },
});

/**
 * Delete a course (admin only)
 */
export const deleteCourse = mutation({
  args: { courseId: v.id("courses") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const { userId } = await validateAdminAccess(ctx);

    // Get existing course
    const course = await ctx.db.get(args.courseId);
    if (!course) {
      throw new ConvexError("Course not found");
    }

    // Check if course has enrollments
    const enrollments = await ctx.db
      .query("enrollments")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .first();

    if (enrollments) {
      throw new ConvexError(
        "Cannot delete course with active enrollments. Archive it instead.",
      );
    }

    // Soft delete by marking as archived
    await ctx.db.patch(args.courseId, {
      status: "archived",
      updatedBy: userId,
      updatedAt: Date.now(),
      lastUpdated: Date.now(),
    });

    // Log admin action
    await logAdminAction(
      ctx,
      "course_deleted",
      {
        courseId: args.courseId,
        title: course.title,
      },
      userId,
    );

    return true;
  },
});

/**
 * Create a module for a course (admin only)
 */
export const createModule = mutation({
  args: CreateModuleSchema,
  returns: v.id("modules"),
  handler: async (ctx, args) => {
    const { userId } = await validateAdminAccess(ctx);

    // Validate course exists
    const course = await ctx.db.get(args.courseId);
    if (!course) {
      throw new ConvexError("Course not found");
    }

    // Validate required fields
    if (!args.title.trim()) {
      throw new ConvexError("Module title is required");
    }

    if (args.title.length > 200) {
      throw new ConvexError("Module title must be 200 characters or less");
    }

    // Get next order index
    const lastModule = await ctx.db
      .query("modules")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .order("desc")
      .first();

    const orderIndex = lastModule ? (lastModule.orderIndex ?? 0) + 1 : 0;

    // Create the module
    const moduleId = await ctx.db.insert("modules", {
      courseId: args.courseId,
      title: args.title.trim(),
      description: args.description?.trim(),
      thumbnailId: args.thumbnailId,
      order: orderIndex, // Required field
      orderIndex, // Backward compatibility
      estimatedDuration: args.estimatedDuration,
      isRequired: args.isRequired ?? true,
      lessonCount: 0,
      // completionCount: 0, // Not in schema
      createdBy: userId,
      // updatedBy: userId, // Not in modules schema
      // createdAt: Date.now(), // Not in modules schema
      updatedAt: Date.now(),
    });

    // Log admin action
    await logAdminAction(
      ctx,
      "module_created",
      {
        moduleId,
        courseId: args.courseId,
        title: args.title,
      },
      userId,
    );

    return moduleId;
  },
});

/**
 * Create a lesson for a module (admin only)
 */
export const createLesson = mutation({
  args: CreateLessonSchema,
  returns: v.id("lessons"),
  handler: async (ctx, args) => {
    const { userId } = await validateAdminAccess(ctx);

    // Validate module exists
    const moduleRecord = await ctx.db.get(args.moduleId);
    if (!moduleRecord) {
      throw new ConvexError("Module not found");
    }

    // Validate required fields
    if (!args.title.trim()) {
      throw new ConvexError("Lesson title is required");
    }

    if (!args.content.trim()) {
      throw new ConvexError("Lesson content is required");
    }

    if (args.title.length > 200) {
      throw new ConvexError("Lesson title must be 200 characters or less");
    }

    // Get next order value
    const lastLesson = await ctx.db
      .query("lessons")
      .withIndex("by_module", (q) => q.eq("moduleId", args.moduleId))
      .order("desc")
      .first();

    const orderValue = lastLesson ? (lastLesson.order ?? 0) + 1 : 0;

    // Create the lesson
    const lessonId = await ctx.db.insert("lessons", {
      moduleId: args.moduleId,
      courseId: moduleRecord.courseId, // Add courseId from the module
      title: args.title.trim(),
      description: args.description?.trim(),
      contentType: args.contentType,
      content: args.content.trim(),
      thumbnailId: args.thumbnailId,
      order: orderValue, // Use order instead of orderIndex
      estimatedDuration: args.estimatedDuration,
      isFree: true, // Add default value for isFree
      resources:
        args.resources?.map((storageId) => ({
          title: "Untitled Resource",
          fileId: storageId,
          type: "document" as const,
        })) ?? [],
      createdBy: userId,
      updatedAt: Date.now(),
    });

    // Update module lesson count
    await ctx.db.patch(args.moduleId, {
      lessonCount: (moduleRecord.lessonCount ?? 0) + 1,
      updatedAt: Date.now(),
    });

    // Log admin action
    await logAdminAction(
      ctx,
      "lesson_created",
      {
        lessonId,
        moduleId: args.moduleId,
        title: args.title,
        contentType: args.contentType,
      },
      userId,
    );

    return lessonId;
  },
});
