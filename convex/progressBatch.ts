/**
 * BATCH PROGRESS TRACKING MUTATIONS
 *
 * Optimized Convex mutations for batch processing of progress updates.
 * Reduces database load by processing multiple progress updates in efficient batches.
 *
 * FEATURES:
 * - Batch processing of multiple progress updates
 * - Intelligent deduplication and compression
 * - Transaction-safe operations
 * - Comprehensive error handling
 * - Performance monitoring and logging
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-01-14
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserId } from "./users";
import type { Id } from "./_generated/dataModel";

// =============================================================================
// BATCH PROGRESS UPDATE MUTATION
// =============================================================================

/**
 * Batch update progress for multiple lessons
 * Processes up to 50 progress updates in a single transaction
 * Implements intelligent deduplication and compression
 */
export const updateProgressBatch = mutation({
  args: {
    updates: v.array(
      v.object({
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
        timestamp: v.number(),
      }),
    ),
  },
  returns: v.object({
    success: v.boolean(),
    processedCount: v.number(),
    skippedCount: v.number(),
    errorCount: v.number(),
    results: v.array(v.id("lessonProgress")),
  }),
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    // Validate batch size
    if (args.updates.length > 50) {
      throw new Error("Batch size cannot exceed 50 updates");
    }

    const now = Date.now();
    const results: Id<"lessonProgress">[] = [];
    let processedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Deduplicate updates by lessonId (keep latest)
    const deduplicatedUpdates = new Map<string, (typeof args.updates)[0]>();
    for (const update of args.updates) {
      const key = update.lessonId;
      const existing = deduplicatedUpdates.get(key);

      if (!existing || update.timestamp > existing.timestamp) {
        deduplicatedUpdates.set(key, update);
      } else {
        skippedCount++;
      }
    }

    console.log(
      `[BatchProgress] Processing ${deduplicatedUpdates.size} unique updates (${skippedCount} duplicates skipped)`,
    );

    // Process each unique update
    for (const update of deduplicatedUpdates.values()) {
      try {
        // Validate update data
        if (update.percentage < 0 || update.percentage > 100) {
          console.warn(
            `[BatchProgress] Invalid percentage for lesson ${update.lessonId}: ${update.percentage}`,
          );
          errorCount++;
          continue;
        }

        if (update.watchedDuration < 0 || update.totalDuration < 0) {
          console.warn(
            `[BatchProgress] Invalid duration for lesson ${update.lessonId}`,
          );
          errorCount++;
          continue;
        }

        // Check if progress already exists
        const existingProgress = await ctx.db
          .query("lessonProgress")
          .withIndex("by_user_lesson", (q) =>
            q.eq("userId", userId).eq("lessonId", update.lessonId),
          )
          .unique();

        const currentPosition =
          update.currentPosition ?? update.watchedDuration;
        const isCompleted = update.percentage >= 95;

        if (existingProgress) {
          // Update existing progress with intelligent merging
          const newWatchedDuration = Math.max(
            existingProgress.watchedDuration,
            update.watchedDuration,
          );

          const newMaxPosition = Math.max(
            existingProgress.maxWatchedPosition,
            currentPosition,
          );

          await ctx.db.patch(existingProgress._id, {
            watchedDuration: newWatchedDuration,
            totalDuration: update.totalDuration,
            percentage: update.percentage,
            maxWatchedPosition: newMaxPosition,
            seekEvents: existingProgress.seekEvents + (update.seekEvents ?? 0),
            pauseCount: existingProgress.pauseCount + (update.pauseEvents ?? 0),
            playbackSpeed:
              update.playbackSpeed ?? existingProgress.playbackSpeed,
            lastWatchedAt: now,
            isCompleted: isCompleted || existingProgress.isCompleted,
            completedAt: isCompleted ? now : existingProgress.completedAt,
            updatedAt: now,
          });

          results.push(existingProgress._id);
        } else {
          // Create new progress record
          const progressId = await ctx.db.insert("lessonProgress", {
            userId,
            lessonId: update.lessonId,
            courseId: update.courseId,
            moduleId: update.moduleId,
            watchedDuration: update.watchedDuration,
            totalDuration: update.totalDuration,
            percentage: update.percentage,
            isCompleted,
            maxWatchedPosition: currentPosition,
            watchCount: 1,
            sessionDuration: 0,
            seekEvents: update.seekEvents ?? 0,
            pauseCount: update.pauseEvents ?? 0,
            playbackSpeed: update.playbackSpeed ?? 1.0,
            firstWatchedAt: now,
            lastWatchedAt: now,
            completedAt: isCompleted ? now : undefined,
            sessionStartedAt: now,
            updatedAt: now,
            createdBy: userId.toString(),
          });

          results.push(progressId);
        }

        processedCount++;
      } catch (error) {
        console.error(
          `[BatchProgress] Error processing update for lesson ${update.lessonId}:`,
          error,
        );
        errorCount++;
      }
    }

    console.log(
      `[BatchProgress] Batch completed: ${processedCount} processed, ${skippedCount} skipped, ${errorCount} errors`,
    );

    return {
      success: errorCount === 0,
      processedCount,
      skippedCount,
      errorCount,
      results,
    };
  },
});

// =============================================================================
// COMPRESSED PROGRESS UPDATE MUTATION
// =============================================================================

/**
 * Compressed progress update for high-frequency scenarios
 * Uses delta compression to minimize data transfer
 */
export const updateProgressCompressed = mutation({
  args: {
    lessonId: v.id("lessons"),
    courseId: v.id("courses"),
    moduleId: v.id("modules"),
    deltaWatchedDuration: v.number(), // Change in watched duration
    totalDuration: v.number(),
    currentPosition: v.number(),
    seekEvents: v.optional(v.number()),
    pauseEvents: v.optional(v.number()),
    playbackSpeed: v.optional(v.number()),
    timestamp: v.number(),
  },
  returns: v.id("lessonProgress"),
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    const now = Date.now();

    // Get existing progress
    const existingProgress = await ctx.db
      .query("lessonProgress")
      .withIndex("by_user_lesson", (q) =>
        q.eq("userId", userId).eq("lessonId", args.lessonId),
      )
      .unique();

    if (existingProgress) {
      // Apply delta update
      const newWatchedDuration = Math.max(
        0,
        existingProgress.watchedDuration + args.deltaWatchedDuration,
      );

      const newPercentage =
        args.totalDuration > 0
          ? Math.min((newWatchedDuration / args.totalDuration) * 100, 100)
          : existingProgress.percentage;

      const newMaxPosition = Math.max(
        existingProgress.maxWatchedPosition,
        args.currentPosition,
      );

      const isCompleted = newPercentage >= 95;

      await ctx.db.patch(existingProgress._id, {
        watchedDuration: newWatchedDuration,
        totalDuration: args.totalDuration,
        percentage: newPercentage,
        maxWatchedPosition: newMaxPosition,
        seekEvents: existingProgress.seekEvents + (args.seekEvents ?? 0),
        pauseCount: existingProgress.pauseCount + (args.pauseEvents ?? 0),
        playbackSpeed: args.playbackSpeed ?? existingProgress.playbackSpeed,
        lastWatchedAt: now,
        isCompleted: isCompleted || existingProgress.isCompleted,
        completedAt: isCompleted ? now : existingProgress.completedAt,
        updatedAt: now,
      });

      return existingProgress._id;
    } else {
      // Create new progress record
      const percentage =
        args.totalDuration > 0
          ? Math.min(
              (args.deltaWatchedDuration / args.totalDuration) * 100,
              100,
            )
          : 0;

      const isCompleted = percentage >= 95;

      return await ctx.db.insert("lessonProgress", {
        userId,
        lessonId: args.lessonId,
        courseId: args.courseId,
        moduleId: args.moduleId,
        watchedDuration: Math.max(0, args.deltaWatchedDuration),
        totalDuration: args.totalDuration,
        percentage,
        isCompleted,
        maxWatchedPosition: args.currentPosition,
        watchCount: 1,
        sessionDuration: 0,
        seekEvents: args.seekEvents ?? 0,
        pauseCount: args.pauseEvents ?? 0,
        playbackSpeed: args.playbackSpeed ?? 1.0,
        firstWatchedAt: now,
        lastWatchedAt: now,
        completedAt: isCompleted ? now : undefined,
        sessionStartedAt: now,
        updatedAt: now,
        createdBy: userId.toString(),
      });
    }
  },
});

// =============================================================================
// BATCH COMPLETION MUTATION
// =============================================================================

/**
 * Mark multiple lessons as completed in a single transaction
 */
export const markLessonsCompleted = mutation({
  args: {
    lessonIds: v.array(v.id("lessons")),
    courseId: v.id("courses"),
    moduleId: v.id("modules"),
  },
  returns: v.object({
    success: v.boolean(),
    completedCount: v.number(),
    results: v.array(v.id("lessonProgress")),
  }),
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    const now = Date.now();
    const results: Id<"lessonProgress">[] = [];
    let completedCount = 0;

    for (const lessonId of args.lessonIds) {
      try {
        const existingProgress = await ctx.db
          .query("lessonProgress")
          .withIndex("by_user_lesson", (q) =>
            q.eq("userId", userId).eq("lessonId", lessonId),
          )
          .unique();

        if (existingProgress) {
          // Update existing progress to completed
          await ctx.db.patch(existingProgress._id, {
            isCompleted: true,
            percentage: 100,
            completedAt: now,
            lastWatchedAt: now,
            updatedAt: now,
          });
          results.push(existingProgress._id);
        } else {
          // Create new completed progress record
          const progressId = await ctx.db.insert("lessonProgress", {
            userId,
            lessonId,
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
            createdBy: userId.toString(),
          });
          results.push(progressId);
        }

        completedCount++;
      } catch (error) {
        console.error(
          `[BatchCompletion] Error completing lesson ${lessonId}:`,
          error,
        );
      }
    }

    return {
      success: completedCount === args.lessonIds.length,
      completedCount,
      results,
    };
  },
});

// =============================================================================
// PROGRESS ANALYTICS QUERIES
// =============================================================================

/**
 * Get progress statistics for a user across all courses
 */
export const getUserProgressStats = query({
  args: {
    userId: v.optional(v.string()),
  },
  returns: v.object({
    totalLessons: v.number(),
    completedLessons: v.number(),
    totalWatchTime: v.number(),
    averageCompletionRate: v.number(),
    coursesInProgress: v.number(),
    lastActivityAt: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    const userId = args.userId || (await getUserId(ctx));
    if (!userId) {
      throw new Error("Authentication required");
    }

    const allProgress = await ctx.db
      .query("lessonProgress")
      .withIndex("by_user", (q) => q.eq("userId", userId as Id<"users">))
      .collect();

    const totalLessons = allProgress.length;
    const completedLessons = allProgress.filter((p) => p.isCompleted).length;
    const totalWatchTime = allProgress.reduce(
      (sum, p) => sum + p.watchedDuration,
      0,
    );
    const averageCompletionRate =
      totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    const uniqueCourses = new Set(allProgress.map((p) => p.courseId)).size;
    const lastActivityAt = Math.max(...allProgress.map((p) => p.lastWatchedAt));

    return {
      totalLessons,
      completedLessons,
      totalWatchTime,
      averageCompletionRate: Math.round(averageCompletionRate * 100) / 100,
      coursesInProgress: uniqueCourses,
      lastActivityAt: lastActivityAt > 0 ? lastActivityAt : undefined,
    };
  },
});

/**
 * Get progress summary for a specific course
 */
export const getCourseProgressSummary = query({
  args: {
    courseId: v.id("courses"),
  },
  returns: v.object({
    totalLessons: v.number(),
    completedLessons: v.number(),
    totalWatchTime: v.number(),
    completionRate: v.number(),
    lastActivityAt: v.optional(v.number()),
    lessons: v.array(
      v.object({
        lessonId: v.id("lessons"),
        title: v.string(),
        isCompleted: v.boolean(),
        watchedDuration: v.number(),
        percentage: v.number(),
        lastWatchedAt: v.number(),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    const courseProgress = await ctx.db
      .query("lessonProgress")
      .withIndex("by_user_course", (q) =>
        q.eq("userId", userId).eq("courseId", args.courseId),
      )
      .collect();

    const totalLessons = courseProgress.length;
    const completedLessons = courseProgress.filter((p) => p.isCompleted).length;
    const totalWatchTime = courseProgress.reduce(
      (sum, p) => sum + p.watchedDuration,
      0,
    );
    const completionRate =
      totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
    const lastActivityAt = Math.max(
      ...courseProgress.map((p) => p.lastWatchedAt),
    );

    // Get lesson details
    const lessons = await Promise.all(
      courseProgress.map(async (progress) => {
        const lesson = await ctx.db.get(progress.lessonId);
        return {
          lessonId: progress.lessonId,
          title: lesson?.title || "Unknown Lesson",
          isCompleted: progress.isCompleted,
          watchedDuration: progress.watchedDuration,
          percentage: progress.percentage,
          lastWatchedAt: progress.lastWatchedAt,
        };
      }),
    );

    return {
      totalLessons,
      completedLessons,
      totalWatchTime,
      completionRate: Math.round(completionRate * 100) / 100,
      lastActivityAt: lastActivityAt > 0 ? lastActivityAt : undefined,
      lessons,
    };
  },
});
