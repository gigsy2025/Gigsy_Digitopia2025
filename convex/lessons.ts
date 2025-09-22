/**
 * LESSON PROGRESS TRACKING
 *
 * Convex functions for tracking lesson progress, completion status,
 * and learning analytics. Supports detailed progress tracking with
 * video watch time, completion percentage, and learning streaks.
 * Enhanced with comprehensive debugging logging.
 *
 * @author Principal Engineer
 * @version 1.1.0
 * @since 2025-09-16
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { getUserId } from "./users";
import type { Id } from "./_generated/dataModel";

// Enhanced debugging logger for Convex functions
const createConvexLogger = (functionName: string) => ({
  info: (message: string, data?: Record<string, unknown>) => {
    console.log(
      `🔵 [Convex:${functionName}] ${message}`,
      data ? JSON.stringify(data, null, 2) : "",
    );
  },
  warn: (message: string, data?: Record<string, unknown>) => {
    console.warn(
      `🟡 [Convex:${functionName}] ${message}`,
      data ? JSON.stringify(data, null, 2) : "",
    );
  },
  error: (message: string, error?: Error) => {
    console.error(`🔴 [Convex:${functionName}] ${message}`, error);
  },
  debug: (message: string, data?: Record<string, unknown>) => {
    console.debug(`🟣 [Convex:${functionName}] ${message}`, data);
  },
});

// =============================================================================
// PROGRESS TRACKING MUTATIONS
// =============================================================================

/**
 * Update lesson progress for a user
 * Tracks video watch time and completion percentage
 */
export const updateProgress = mutation({
  args: {
    lessonId: v.id("lessons"),
    courseId: v.id("courses"),
    moduleId: v.id("modules"),
    watchedDuration: v.number(),
    totalDuration: v.number(),
    percentage: v.number(),
    currentPosition: v.optional(v.number()),
    seekEvents: v.optional(v.number()),
    pauseEvents: v.optional(v.number()),
    playbackSpeed: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    // Validate inputs
    if (args.percentage < 0 || args.percentage > 100) {
      throw new Error("Invalid percentage value");
    }

    if (args.watchedDuration < 0 || args.totalDuration < 0) {
      throw new Error("Invalid duration values");
    }

    // Check if progress already exists
    const existingProgress = await ctx.db
      .query("lessonProgress")
      .withIndex("by_user_lesson", (q) =>
        q.eq("userId", userId).eq("lessonId", args.lessonId),
      )
      .unique();

    const now = Date.now();
    const currentPosition = args.currentPosition ?? args.watchedDuration;

    if (existingProgress) {
      // Update existing progress with enhanced tracking
      await ctx.db.patch(existingProgress._id, {
        watchedDuration: Math.max(
          existingProgress.watchedDuration,
          args.watchedDuration,
        ),
        totalDuration: args.totalDuration,
        percentage: args.percentage,
        maxWatchedPosition: Math.max(
          existingProgress.maxWatchedPosition,
          currentPosition,
        ),
        sessionDuration:
          existingProgress.sessionDuration +
          Math.max(0, now - existingProgress.sessionStartedAt),
        seekEvents: existingProgress.seekEvents + (args.seekEvents ?? 0),
        pauseCount: existingProgress.pauseCount + (args.pauseEvents ?? 0),
        playbackSpeed: args.playbackSpeed ?? existingProgress.playbackSpeed,
        lastWatchedAt: now,
        sessionStartedAt: now,
        isCompleted: args.percentage >= 95,
        completedAt: args.percentage >= 95 ? now : existingProgress.completedAt,
        updatedAt: now,
      });
      return existingProgress._id;
    } else {
      // Create new progress record with all required fields
      return await ctx.db.insert("lessonProgress", {
        userId,
        lessonId: args.lessonId,
        courseId: args.courseId,
        moduleId: args.moduleId,
        watchedDuration: args.watchedDuration,
        totalDuration: args.totalDuration,
        percentage: args.percentage,
        isCompleted: args.percentage >= 95,
        maxWatchedPosition: currentPosition,
        watchCount: 1,
        sessionDuration: 0,
        seekEvents: args.seekEvents ?? 0,
        pauseCount: args.pauseEvents ?? 0,
        playbackSpeed: args.playbackSpeed ?? 1.0,
        firstWatchedAt: now,
        lastWatchedAt: now,
        completedAt: args.percentage >= 95 ? now : undefined,
        sessionStartedAt: now,
        updatedAt: now,
        createdBy: userId.toString(), // Convert Id<"users"> to string
      });
    }
  },
});

/**
 * Mark lesson as complete
 * Sets completion status and triggers completion analytics
 */
export const markComplete = mutation({
  args: {
    lessonId: v.id("lessons"),
    courseId: v.id("courses"),
    moduleId: v.id("modules"),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    // Get or create progress record
    const existingProgress = await ctx.db
      .query("lessonProgress")
      .withIndex("by_user_lesson", (q) =>
        q.eq("userId", userId).eq("lessonId", args.lessonId),
      )
      .unique();

    const now = Date.now();

    if (existingProgress) {
      // Update existing progress to completed
      await ctx.db.patch(existingProgress._id, {
        percentage: 100,
        isCompleted: true,
        completedAt: now,
        lastWatchedAt: now,
        updatedAt: now,
      });

      // Update analytics
      await updateCompletionAnalytics(ctx, userId, args.courseId);

      return existingProgress._id;
    } else {
      // Create new progress record with completion
      const progressId = await ctx.db.insert("lessonProgress", {
        userId,
        lessonId: args.lessonId,
        courseId: args.courseId,
        moduleId: args.moduleId,
        watchedDuration: 0,
        totalDuration: 0,
        percentage: 100,
        isCompleted: true,
        maxWatchedPosition: 0,
        watchCount: 1,
        sessionDuration: 0,
        seekEvents: 0,
        pauseCount: 0,
        playbackSpeed: 1.0,
        firstWatchedAt: now,
        lastWatchedAt: now,
        completedAt: now,
        sessionStartedAt: now,
        updatedAt: now,
        createdBy: userId.toString(), // Convert Id<"users"> to string
      });

      // Update analytics
      await updateCompletionAnalytics(ctx, userId, args.courseId);

      return progressId;
    }
  },
});

/**
 * Reset lesson progress
 * Clears all progress data for a lesson
 */
export const resetProgress = mutation({
  args: {
    lessonId: v.id("lessons"),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    const progress = await ctx.db
      .query("lessonProgress")
      .withIndex("by_user_lesson", (q) =>
        q.eq("userId", userId).eq("lessonId", args.lessonId),
      )
      .unique();

    if (progress) {
      await ctx.db.patch(progress._id, {
        watchedDuration: 0,
        percentage: 0,
        isCompleted: false,
        completedAt: undefined,
        updatedAt: Date.now(),
      });
    }

    return progress?._id;
  },
});

// =============================================================================
// PROGRESS TRACKING QUERIES
// =============================================================================

/**
 * Get lesson progress for a user
 */
export const getProgress = query({
  args: {
    lessonId: v.id("lessons"),
  },
  handler: async (ctx, args) => {
    const logger = createConvexLogger("getProgress");

    logger.info("📋 Progress query requested", {
      lessonId: args.lessonId,
      timestamp: new Date().toISOString(),
    });

    const userId = await getUserId(ctx);
    logger.info("🔑 User authentication check", {
      userId: userId ? "authenticated" : "not-authenticated",
      userIdValue: userId,
    });

    if (!userId) {
      logger.warn("⚠️ No authenticated user, returning null", {
        reason: "User not authenticated",
        lessonId: args.lessonId,
      });
      return null;
    }

    logger.debug("🔍 Querying progress from database", {
      userId,
      lessonId: args.lessonId,
      indexUsed: "by_user_lesson",
    });

    const progress = await ctx.db
      .query("lessonProgress")
      .withIndex("by_user_lesson", (q) =>
        q.eq("userId", userId).eq("lessonId", args.lessonId),
      )
      .unique();

    logger.info("📊 Progress query result", {
      hasProgress: !!progress,
      progressId: progress?._id,
      percentage: progress?.percentage,
      watchedDuration: progress?.watchedDuration,
      isCompleted: progress?.isCompleted,
      lastWatchedAt: progress?.lastWatchedAt,
    });

    return progress;
  },
});

/**
 * Get all lesson progress for a course
 */
export const getCourseProgress = query({
  args: {
    courseId: v.id("courses"),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      return [];
    }

    return await ctx.db
      .query("lessonProgress")
      .withIndex("by_user_course", (q) =>
        q.eq("userId", userId).eq("courseId", args.courseId),
      )
      .collect();
  },
});

/**
 * Get module progress summary
 */
export const getModuleProgress = query({
  args: {
    moduleId: v.id("modules"),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      return {
        totalLessons: 0,
        completedLessons: 0,
        progressPercentage: 0,
        totalWatchTime: 0,
      };
    }

    // Get all lessons in the module
    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_module", (q) => q.eq("moduleId", args.moduleId))
      .collect();

    // Get progress for each lesson
    const progressRecords = await ctx.db
      .query("lessonProgress")
      .withIndex("by_user_module", (q) =>
        q.eq("userId", userId).eq("moduleId", args.moduleId),
      )
      .collect();

    const completedLessons = progressRecords.filter(
      (p) => p.isCompleted,
    ).length;
    const totalWatchTime = progressRecords.reduce(
      (sum, p) => sum + p.watchedDuration,
      0,
    );
    const progressPercentage =
      lessons.length > 0 ? (completedLessons / lessons.length) * 100 : 0;

    return {
      totalLessons: lessons.length,
      completedLessons,
      progressPercentage: Math.round(progressPercentage),
      totalWatchTime: Math.round(totalWatchTime),
    };
  },
});

/**
 * Get user's overall learning analytics
 */
export const getLearningAnalytics = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      return {
        totalCoursesEnrolled: 0,
        totalCoursesCompleted: 0,
        totalLessonsCompleted: 0,
        totalWatchTime: 0,
        currentStreak: 0,
        longestStreak: 0,
      };
    }

    // Get all progress records
    const progressRecords = await ctx.db
      .query("lessonProgress")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Get enrollments
    const enrollments = await ctx.db
      .query("enrollments")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Calculate metrics
    const totalLessonsCompleted = progressRecords.filter(
      (p) => p.isCompleted,
    ).length;
    const totalWatchTime = progressRecords.reduce(
      (sum, p) => sum + p.watchedDuration,
      0,
    );

    // Calculate completed courses
    const courseProgress = new Map<
      string,
      { total: number; completed: number }
    >();

    for (const progress of progressRecords) {
      const courseId = progress.courseId;
      if (!courseProgress.has(courseId)) {
        // Get total lessons in course
        const courseLessons = await ctx.db
          .query("lessons")
          .withIndex("by_course", (q) => q.eq("courseId", courseId))
          .collect();

        courseProgress.set(courseId, {
          total: courseLessons.length,
          completed: 0,
        });
      }

      if (progress.isCompleted) {
        const course = courseProgress.get(courseId)!;
        course.completed++;
      }
    }

    const totalCoursesCompleted = Array.from(courseProgress.values()).filter(
      (course) => course.completed >= course.total,
    ).length;

    // Calculate learning streaks (simplified - days with activity)
    const activityDates = progressRecords
      .map((p) => new Date(p.lastWatchedAt).toDateString())
      .filter((date, index, array) => array.indexOf(date) === index)
      .sort();

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

    for (let i = activityDates.length - 1; i >= 0; i--) {
      const date = activityDates[i];
      if (!date) continue;

      if (date === today || date === yesterday) {
        tempStreak++;
        const nextDate = activityDates[i + 1];
        if (
          i === activityDates.length - 1 ||
          (nextDate &&
            new Date(nextDate).getTime() - new Date(date).getTime() <=
              24 * 60 * 60 * 1000)
        ) {
          currentStreak = tempStreak;
        }
      } else {
        break;
      }
    }

    // Calculate longest streak
    for (let i = 0; i < activityDates.length; i++) {
      tempStreak = 1;
      for (let j = i + 1; j < activityDates.length; j++) {
        const currentDate = activityDates[j];
        const previousDate = activityDates[j - 1];

        if (
          currentDate &&
          previousDate &&
          new Date(currentDate).getTime() - new Date(previousDate).getTime() <=
            24 * 60 * 60 * 1000
        ) {
          tempStreak++;
        } else {
          break;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);
    }

    return {
      totalCoursesEnrolled: enrollments.length,
      totalCoursesCompleted,
      totalLessonsCompleted,
      totalWatchTime: Math.round(totalWatchTime),
      currentStreak,
      longestStreak,
    };
  },
});

/**
 * CONVEX LESSONS SERVICE
 *
 * Service for managing and retrieving individual lesson data.
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-09-16
 */

/**
 * Get a single lesson by its ID, including its content and associated quiz questions.
 *
 * PERFORMANCE: This query is optimized to fetch a lesson and its related quiz data efficiently.
 *
 * @param lessonId - The ID of the lesson to retrieve.
 * @returns A promise resolving to the lesson details with quiz, or null if not found.
 * @throws {ConvexError} When the lesson is not found.
 */
export const getLessonById = query({
  args: { lessonId: v.id("lessons") },
  returns: v.union(
    v.object({
      lesson: v.any(), // Using v.any() for the lesson doc for now
      quiz: v.optional(
        v.array(
          v.object({
            _id: v.id("quizzes"),
            question: v.string(),
            options: v.array(
              v.object({
                _id: v.id("quizOptions"),
                text: v.string(),
              }),
            ),
          }),
        ),
      ),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const lesson = await ctx.db.get(args.lessonId);

    if (!lesson) {
      return null;
    }

    // Fetch associated quizzes and their options
    const quizzes = await ctx.db
      .query("quizzes")
      .withIndex("by_lesson", (q) => q.eq("lessonId", args.lessonId))
      .collect();

    const quizWithWithOptions = await Promise.all(
      quizzes.map(async (quiz) => {
        const options = await ctx.db
          .query("quizOptions")
          .withIndex("by_quiz", (q) => q.eq("quizId", quiz._id))
          .collect();
        return {
          _id: quiz._id,
          question: quiz.question,
          options: options.map((o) => ({ _id: o._id, text: o.text })),
        };
      }),
    );

    return {
      lesson,
      quiz: quizWithWithOptions,
    };
  },
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

async function updateCompletionAnalytics(
  ctx: MutationCtx,
  userId: Id<"users">,
  _courseId: string,
) {
  const logger = createConvexLogger("updateCompletionAnalytics");

  logger.info("🗊 Updating completion analytics", {
    userId,
    courseId: _courseId,
    timestamp: new Date().toISOString(),
  });

  try {
    // Example: Update user's completion count in profile
    const user = await ctx.db.get(userId);

    logger.debug("👤 User profile lookup", {
      userId,
      hasUser: !!user,
      hasProfile: !!user?.profile,
      currentCompletions: user?.profile?.lessonsCompleted ?? 0,
    });

    if (user) {
      // Access completion count safely with optional chaining and nullish coalescing
      const currentCompletions = user.profile?.lessonsCompleted ?? 0;
      const newCompletions = currentCompletions + 1;

      // Ensure we have a valid profile structure
      const updatedProfile = {
        bio: user.profile?.bio,
        headline: user.profile?.headline,
        location: user.profile?.location,
        skills: user.profile?.skills ?? [],
        experienceLevel: user.profile?.experienceLevel ?? ("beginner" as const),
        education: user.profile?.education ?? [],
        workExperience: user.profile?.workExperience ?? [],
        portfolio: user.profile?.portfolio,
        lessonsCompleted: newCompletions,
        lastActivityAt: Date.now(),
        completeness: user.profile?.completeness,
        lastUpdated: Date.now(),
        version: user.profile?.version,
      };

      logger.info("📋 Updating user profile with completion", {
        userId,
        previousCompletions: currentCompletions,
        newCompletions,
        profileUpdateData: {
          lessonsCompleted: newCompletions,
          lastActivityAt: updatedProfile.lastActivityAt,
          lastUpdated: updatedProfile.lastUpdated,
        },
      });

      await ctx.db.patch(userId, {
        profile: updatedProfile,
        updatedAt: Date.now(),
      });

      logger.info("✅ User profile analytics updated successfully", {
        userId,
        newLessonsCompleted: newCompletions,
      });
    } else {
      logger.warn("⚠️ User not found for analytics update", {
        userId,
        reason: "User document does not exist",
      });
    }
  } catch (error) {
    logger.error(
      "❌ Failed to update completion analytics",
      error instanceof Error ? error : new Error("Unknown error"),
    );
    // Don't throw - analytics failure shouldn't block progress tracking
  }
}
