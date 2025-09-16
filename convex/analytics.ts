/**
 * LEARNING ANALYTICS AND VIDEO TRACKING
 *
 * Convex functions for tracking video engagement, learning analytics,
 * and user behavior patterns. Provides detailed insights for instructors
 * and learners about course engagement and learning progress.
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-09-16
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserId } from "./users";
import type { Id } from "./_generated/dataModel";

// =============================================================================
// VIDEO ANALYTICS TRACKING
// =============================================================================

/**
 * Track video events for analytics and engagement monitoring
 */
export const trackVideoEvent = mutation({
  args: {
    lessonId: v.id("lessons"),
    eventType: v.union(
      v.literal("video_play"),
      v.literal("video_pause"),
      v.literal("video_ended"),
      v.literal("video_error"),
      v.literal("progress_update"),
      v.literal("lesson_completed"),
      v.literal("video_seek"),
      v.literal("fullscreen_enter"),
      v.literal("fullscreen_exit"),
      v.literal("volume_change"),
      v.literal("playback_rate_change"),
    ),
    data: v.optional(v.any()), // Flexible data for different event types
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    // Get lesson and course information for context
    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) {
      throw new Error("Lesson not found");
    }

    // Create analytics record
    const analyticsId = await ctx.db.insert("videoAnalytics", {
      userId,
      lessonId: args.lessonId,
      courseId: lesson.courseId,
      moduleId: lesson.moduleId,
      eventType: args.eventType,
      eventData: args.data || {},
      timestamp: Date.now(),
      sessionId:
        args.data?.sessionId ||
        `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userAgent: args.data?.userAgent,
      deviceType: detectDeviceType(args.data?.userAgent),
      createdAt: Date.now(),
    });

    // Update real-time engagement metrics
    await updateEngagementMetrics(
      ctx,
      userId,
      args.lessonId,
      args.eventType,
      args.data,
    );

    return analyticsId;
  },
});

/**
 * Bulk track video analytics for performance optimization
 */
export const trackVideoEventsBulk = mutation({
  args: {
    events: v.array(
      v.object({
        lessonId: v.id("lessons"),
        eventType: v.union(
          v.literal("video_play"),
          v.literal("video_pause"),
          v.literal("video_ended"),
          v.literal("video_error"),
          v.literal("progress_update"),
          v.literal("lesson_completed"),
          v.literal("video_seek"),
        ),
        data: v.optional(v.any()),
        timestamp: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    const analyticsIds = [];

    for (const event of args.events) {
      // Get lesson for context
      const lesson = await ctx.db.get(event.lessonId);
      if (!lesson) continue;

      const analyticsId = await ctx.db.insert("videoAnalytics", {
        userId,
        lessonId: event.lessonId,
        courseId: lesson.courseId,
        moduleId: lesson.moduleId,
        eventType: event.eventType,
        eventData: event.data || {},
        timestamp: event.timestamp,
        sessionId:
          event.data?.sessionId ||
          `session_${event.timestamp}_${Math.random().toString(36).substr(2, 9)}`,
        deviceType: detectDeviceType(event.data?.userAgent),
        createdAt: Date.now(),
      });

      analyticsIds.push(analyticsId);
    }

    return analyticsIds;
  },
});

// =============================================================================
// ENGAGEMENT METRICS QUERIES
// =============================================================================

/**
 * Get video engagement metrics for a lesson
 */
export const getLessonEngagement = query({
  args: {
    lessonId: v.id("lessons"),
    timeRange: v.optional(
      v.union(
        v.literal("24h"),
        v.literal("7d"),
        v.literal("30d"),
        v.literal("all"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const timeRange = args.timeRange || "all";
    const cutoffTime = getTimeRangeCutoff(timeRange);

    // Get all analytics for this lesson
    const analytics = await ctx.db
      .query("videoAnalytics")
      .withIndex("by_lesson", (q) => q.eq("lessonId", args.lessonId))
      .filter((q) =>
        cutoffTime ? q.gte(q.field("timestamp"), cutoffTime) : true,
      )
      .collect();

    // Calculate engagement metrics
    const totalViews = analytics.filter(
      (a) => a.eventType === "video_play",
    ).length;
    const totalCompletions = analytics.filter(
      (a) => a.eventType === "video_ended",
    ).length;
    const totalErrors = analytics.filter(
      (a) => a.eventType === "video_error",
    ).length;

    // Calculate average watch time
    const progressEvents = analytics.filter(
      (a) => a.eventType === "progress_update",
    );
    const watchTimeData = progressEvents.map(
      (event) => event.eventData?.currentTime || 0,
    );
    const avgWatchTime =
      watchTimeData.length > 0
        ? watchTimeData.reduce((sum, time) => sum + time, 0) /
          watchTimeData.length
        : 0;

    // Calculate completion rate
    const completionRate =
      totalViews > 0 ? (totalCompletions / totalViews) * 100 : 0;

    // Device breakdown
    const deviceBreakdown = analytics.reduce(
      (acc, event) => {
        const device = event.deviceType || "unknown";
        acc[device] = (acc[device] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Peak viewing times
    const hourlyViews = analytics
      .filter((a) => a.eventType === "video_play")
      .reduce(
        (acc, event) => {
          const hour = new Date(event.timestamp).getHours();
          acc[hour] = (acc[hour] || 0) + 1;
          return acc;
        },
        {} as Record<number, number>,
      );

    return {
      totalViews,
      totalCompletions,
      totalErrors,
      avgWatchTime: Math.round(avgWatchTime),
      completionRate: Math.round(completionRate * 100) / 100,
      deviceBreakdown,
      hourlyViews,
      errorRate: totalViews > 0 ? (totalErrors / totalViews) * 100 : 0,
    };
  },
});

/**
 * Get course-wide engagement analytics
 */
export const getCourseEngagement = query({
  args: {
    courseId: v.id("courses"),
    timeRange: v.optional(
      v.union(
        v.literal("24h"),
        v.literal("7d"),
        v.literal("30d"),
        v.literal("all"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const timeRange = args.timeRange || "all";
    const cutoffTime = getTimeRangeCutoff(timeRange);

    // Get all analytics for this course
    const analytics = await ctx.db
      .query("videoAnalytics")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .filter((q) =>
        cutoffTime ? q.gte(q.field("timestamp"), cutoffTime) : true,
      )
      .collect();

    // Get unique users
    const uniqueUsers = new Set(analytics.map((a) => a.userId)).size;

    // Calculate overall metrics
    const totalViews = analytics.filter(
      (a) => a.eventType === "video_play",
    ).length;
    const totalCompletions = analytics.filter(
      (a) => a.eventType === "video_ended",
    ).length;

    // Lesson-level engagement
    const lessonEngagement = analytics.reduce(
      (acc, event) => {
        const lessonId = event.lessonId;
        if (!acc[lessonId]) {
          acc[lessonId] = {
            views: 0,
            completions: 0,
            errors: 0,
            totalWatchTime: 0,
          };
        }

        if (event.eventType === "video_play") acc[lessonId].views++;
        if (event.eventType === "video_ended") acc[lessonId].completions++;
        if (event.eventType === "video_error") acc[lessonId].errors++;
        if (event.eventType === "progress_update") {
          acc[lessonId].totalWatchTime += event.eventData?.currentTime || 0;
        }

        return acc;
      },
      {} as Record<string, any>,
    );

    // Most engaging lessons
    const mostEngagingLessons = Object.entries(lessonEngagement)
      .sort(([, a], [, b]) => b.views - a.views)
      .slice(0, 5)
      .map(([lessonId, metrics]) => ({ lessonId, ...metrics }));

    return {
      uniqueUsers,
      totalViews,
      totalCompletions,
      completionRate:
        totalViews > 0 ? (totalCompletions / totalViews) * 100 : 0,
      lessonEngagement,
      mostEngagingLessons,
      avgEngagementPerUser: uniqueUsers > 0 ? totalViews / uniqueUsers : 0,
    };
  },
});

/**
 * Get user's learning behavior analytics
 */
export const getUserLearningBehavior = query({
  args: {
    userId: v.optional(v.string()),
    timeRange: v.optional(
      v.union(
        v.literal("24h"),
        v.literal("7d"),
        v.literal("30d"),
        v.literal("all"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const userId = args.userId || (await getUserId(ctx));
    if (!userId) {
      return null;
    }

    const timeRange = args.timeRange || "30d";
    const cutoffTime = getTimeRangeCutoff(timeRange);

    // Get user's analytics
    const analytics = await ctx.db
      .query("videoAnalytics")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) =>
        cutoffTime ? q.gte(q.field("timestamp"), cutoffTime) : true,
      )
      .collect();

    // Calculate behavior patterns
    const sessionsData = analytics.reduce(
      (acc, event) => {
        const sessionId = event.sessionId;
        if (!acc[sessionId]) {
          acc[sessionId] = {
            startTime: event.timestamp,
            endTime: event.timestamp,
            events: 0,
            lessonsSeen: new Set(),
            coursesSeen: new Set(),
          };
        }

        acc[sessionId].endTime = Math.max(
          acc[sessionId].endTime,
          event.timestamp,
        );
        acc[sessionId].events++;
        acc[sessionId].lessonsSeen.add(event.lessonId);
        acc[sessionId].coursesSeen.add(event.courseId);

        return acc;
      },
      {} as Record<string, any>,
    );

    // Calculate session metrics
    const sessions = Object.values(sessionsData);
    const avgSessionDuration =
      sessions.length > 0
        ? sessions.reduce(
            (sum, session: any) => sum + (session.endTime - session.startTime),
            0,
          ) / sessions.length
        : 0;

    const avgLessonsPerSession =
      sessions.length > 0
        ? sessions.reduce(
            (sum, session: any) => sum + session.lessonsSeen.size,
            0,
          ) / sessions.length
        : 0;

    // Learning frequency patterns
    const dailyActivity = analytics.reduce(
      (acc, event) => {
        const date = new Date(event.timestamp).toDateString();
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Preferred learning times
    const hourlyActivity = analytics.reduce(
      (acc, event) => {
        const hour = new Date(event.timestamp).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      },
      {} as Record<number, number>,
    );

    // Device preferences
    const deviceUsage = analytics.reduce(
      (acc, event) => {
        const device = event.deviceType || "unknown";
        acc[device] = (acc[device] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalSessions: sessions.length,
      avgSessionDuration: Math.round(avgSessionDuration / 1000 / 60), // in minutes
      avgLessonsPerSession: Math.round(avgLessonsPerSession * 100) / 100,
      dailyActivity,
      hourlyActivity,
      deviceUsage,
      totalEvents: analytics.length,
      activeDays: Object.keys(dailyActivity).length,
    };
  },
});

// =============================================================================
// INSTRUCTOR ANALYTICS QUERIES
// =============================================================================

/**
 * Get comprehensive course analytics for instructors
 */
export const getInstructorCourseAnalytics = query({
  args: {
    courseId: v.id("courses"),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    // Verify instructor access
    const course = await ctx.db.get(args.courseId);
    if (!course || course.createdBy !== userId) {
      throw new Error("Access denied");
    }

    // Get all analytics for the course
    const analytics = await ctx.db
      .query("videoAnalytics")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();

    // Get enrollment data
    const enrollments = await ctx.db
      .query("enrollments")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();

    // Calculate comprehensive metrics
    const uniqueStudents = new Set(analytics.map((a) => a.userId)).size;
    const totalEnrollments = enrollments.length;
    const engagementRate =
      totalEnrollments > 0 ? (uniqueStudents / totalEnrollments) * 100 : 0;

    // Lesson performance breakdown
    const lessonPerformance = analytics.reduce(
      (acc, event) => {
        const lessonId = event.lessonId;
        if (!acc[lessonId]) {
          acc[lessonId] = {
            views: 0,
            completions: 0,
            dropOffs: 0,
            avgWatchTime: 0,
            errors: 0,
            progressEvents: [],
          };
        }

        if (event.eventType === "video_play") acc[lessonId].views++;
        if (event.eventType === "video_ended") acc[lessonId].completions++;
        if (event.eventType === "video_error") acc[lessonId].errors++;
        if (event.eventType === "video_pause") acc[lessonId].dropOffs++;
        if (event.eventType === "progress_update") {
          acc[lessonId].progressEvents.push(event.eventData?.currentTime || 0);
        }

        return acc;
      },
      {} as Record<string, any>,
    );

    // Calculate average watch times
    Object.keys(lessonPerformance).forEach((lessonId) => {
      const progressEvents = lessonPerformance[lessonId].progressEvents;
      if (progressEvents.length > 0) {
        lessonPerformance[lessonId].avgWatchTime =
          progressEvents.reduce((sum: number, time: number) => sum + time, 0) /
          progressEvents.length;
      }
      delete lessonPerformance[lessonId].progressEvents; // Clean up
    });

    // Student progress summary
    const studentProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        const userProgress = await ctx.db
          .query("lessonProgress")
          .withIndex("by_user_course", (q) =>
            q.eq("userId", enrollment.userId).eq("courseId", args.courseId),
          )
          .collect();

        const completedLessons = userProgress.filter(
          (p) => p.isCompleted,
        ).length;
        const totalWatchTime = userProgress.reduce(
          (sum, p) => sum + p.watchedDuration,
          0,
        );

        return {
          userId: enrollment.userId,
          enrolledAt: enrollment.createdAt,
          completedLessons,
          totalWatchTime,
          lastActivity: Math.max(
            ...userProgress.map((p) => p.lastWatchedAt),
            0,
          ),
        };
      }),
    );

    return {
      overview: {
        totalEnrollments,
        uniqueStudents,
        engagementRate: Math.round(engagementRate * 100) / 100,
        totalVideoViews: analytics.filter((a) => a.eventType === "video_play")
          .length,
        totalCompletions: analytics.filter((a) => a.eventType === "video_ended")
          .length,
      },
      lessonPerformance,
      studentProgress,
      recentActivity: analytics.slice(-50), // Last 50 events
    };
  },
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getTimeRangeCutoff(timeRange: string): number | null {
  const now = Date.now();
  switch (timeRange) {
    case "24h":
      return now - 24 * 60 * 60 * 1000;
    case "7d":
      return now - 7 * 24 * 60 * 60 * 1000;
    case "30d":
      return now - 30 * 24 * 60 * 60 * 1000;
    case "all":
    default:
      return null;
  }
}

function detectDeviceType(userAgent?: string): string {
  if (!userAgent) return "unknown";

  const ua = userAgent.toLowerCase();

  if (
    ua.includes("mobile") ||
    ua.includes("android") ||
    ua.includes("iphone")
  ) {
    return "mobile";
  } else if (ua.includes("tablet") || ua.includes("ipad")) {
    return "tablet";
  } else {
    return "desktop";
  }
}

async function updateEngagementMetrics(
  ctx: any,
  userId: string,
  lessonId: string,
  eventType: string,
  eventData: any,
) {
  // Update real-time engagement metrics in the lesson record
  const lesson = await ctx.db.get(lessonId);
  if (!lesson) return;

  // Update view count, completion count, etc.
  const updates: any = {};

  if (eventType === "video_play") {
    updates.viewCount = (lesson.viewCount || 0) + 1;
  } else if (eventType === "video_ended") {
    updates.completionCount = (lesson.completionCount || 0) + 1;
  }

  if (Object.keys(updates).length > 0) {
    updates.updatedAt = Date.now();
    await ctx.db.patch(lessonId, updates);
  }
}
