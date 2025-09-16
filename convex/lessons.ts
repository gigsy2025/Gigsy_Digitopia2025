/**
 * LESSON PROGRESS TRACKING
 *
 * Convex functions for tracking lesson progress, completion status,
 * and learning analytics. Supports detailed progress tracking with
 * video watch time, completion percentage, and learning streaks.
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-09-16
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { getUserId } from "./users";
import type { Id } from "./_generated/dataModel";

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

    const progressData = {
      userId,
      lessonId: args.lessonId,
      courseId: args.courseId,
      moduleId: args.moduleId,
      watchedDuration: args.watchedDuration,
      totalDuration: args.totalDuration,
      percentage: args.percentage,
      lastWatchedAt: Date.now(),
      isCompleted: args.percentage >= 95,
    };

    if (existingProgress) {
      // Update existing progress
      await ctx.db.patch(existingProgress._id, {
        ...progressData,
        updatedAt: Date.now(),
      });
      return existingProgress._id;
    } else {
      // Create new progress record
      return await ctx.db.insert("lessonProgress", {
        ...progressData,
        updatedAt: Date.now(),
        createdBy: userId,
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

    const completionData = {
      userId,
      lessonId: args.lessonId,
      courseId: args.courseId,
      moduleId: args.moduleId,
      percentage: 100,
      isCompleted: true,
      completedAt: Date.now(),
      lastWatchedAt: Date.now(),
    };

    if (existingProgress) {
      // Update existing progress
      await ctx.db.patch(existingProgress._id, {
        ...completionData,
        updatedAt: Date.now(),
      });

      // Update analytics
      await updateCompletionAnalytics(ctx, userId, args.courseId);

      return existingProgress._id;
    } else {
      // Create new progress record
      const progressId = await ctx.db.insert("lessonProgress", {
        ...completionData,
        watchedDuration: 0,
        totalDuration: 0,
        updatedAt: Date.now(),
        createdBy: userId,
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
    const userId = await getUserId(ctx);
    if (!userId) {
      return null;
    }

    return await ctx.db
      .query("lessonProgress")
      .withIndex("by_user_lesson", (q) =>
        q.eq("userId", userId).eq("lessonId", args.lessonId),
      )
      .unique();
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
      if (date === today || date === yesterday) {
        tempStreak++;
        if (
          i === activityDates.length - 1 ||
          new Date(activityDates[i + 1]).getTime() - new Date(date).getTime() <=
            24 * 60 * 60 * 1000
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
        if (
          new Date(activityDates[j]).getTime() -
            new Date(activityDates[j - 1]).getTime() <=
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

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

async function updateCompletionAnalytics(
  ctx: MutationCtx,
  userId: Id<"users">,
  _courseId: string,
) {
  // This could be expanded to update user analytics, achievements, etc.
  // For now, it's a placeholder for future enhancements

  // Example: Update user's completion count in profile
  const user = await ctx.db.get(userId);
  if (user) {
    // Access completion count safely with optional chaining and nullish coalescing
    const currentCompletions = user.profile?.lessonsCompleted ?? 0;

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
      lessonsCompleted: currentCompletions + 1,
      lastActivityAt: Date.now(),
      completeness: user.profile?.completeness,
      lastUpdated: Date.now(),
      version: user.profile?.version,
    };

    await ctx.db.patch(userId, {
      profile: updatedProfile,
      updatedAt: Date.now(),
    });
  }
}
