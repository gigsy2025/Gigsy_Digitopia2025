/**
 * PROGRESS TRACKING HOOKS
 *
 * Client-side hooks for tracking and managing course and lesson progress.
 * Includes optimistic updates and server synchronization.
 * Enhanced with comprehensive debugging logging.
 *
 * @author Principal Engineer
 * @version 1.1.0
 * @since 2025-09-20
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { throttle } from "@/utils/time";
import type { LessonProgress, CourseProgress } from "@/types/course";
import type { Id } from "convex/_generated/dataModel";

// Enhanced debugging logger for progress tracking
const createProgressLogger = (context: string) => ({
  info: (message: string, data?: Record<string, unknown>) => {
    console.log(
      `🔵 [ProgressTracker:${context}] ${message}`,
      data ? JSON.stringify(data, null, 2) : "",
    );
  },
  warn: (message: string, data?: Record<string, unknown>) => {
    console.warn(
      `🟡 [ProgressTracker:${context}] ${message}`,
      data ? JSON.stringify(data, null, 2) : "",
    );
  },
  error: (message: string, error?: Error | unknown) => {
    console.error(`🔴 [ProgressTracker:${context}] ${message}`, error);
  },
  debug: (message: string, data?: Record<string, unknown>) => {
    if (
      typeof window !== "undefined" &&
      window.localStorage.getItem("debug-progress") === "true"
    ) {
      console.debug(`🟣 [ProgressTracker:${context}] ${message}`, data);
    }
  },
});

interface UseProgressOptions {
  lessonId: string;
  courseId: string;
  moduleId: string;
  userId: string;
  onProgressUpdate?: (progress: LessonProgress) => void;
  onComplete?: () => void;
  syncInterval?: number; // How often to sync with server (ms)
}

interface ProgressState {
  progressSeconds: number;
  completed: boolean;
  watchedPercentage: number;
  lastSyncedAt: number;
  isDirty: boolean; // Has unsaved changes
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook for tracking lesson progress
 */
export function useProgress({
  lessonId,
  courseId,
  moduleId,
  userId,
  onProgressUpdate,
  onComplete,
  syncInterval = 5000,
}: UseProgressOptions) {
  const logger = createProgressLogger("useProgress");

  // Log initialization
  useEffect(() => {
    logger.info("🚀 Progress tracking initialized", {
      lessonId,
      courseId,
      moduleId,
      userId,
      syncInterval,
      timestamp: new Date().toISOString(),
    });
  }, [lessonId, courseId, moduleId, userId, syncInterval, logger]);

  // Convex mutations and queries
  const updateProgressMutation = useMutation(api.lessons.updateProgress);
  const markCompleteMutation = useMutation(api.lessons.markComplete);

  // Enhanced query logging
  const progressQuery = useQuery(api.lessons.getProgress, {
    lessonId: lessonId as Id<"lessons">,
  });

  // Log query state changes
  useEffect(() => {
    logger.debug("📊 Progress query state changed", {
      queryStatus:
        progressQuery === undefined
          ? "loading"
          : progressQuery === null
            ? "no-data"
            : "has-data",
      queryData: progressQuery,
      lessonId,
    });
  }, [progressQuery, lessonId, logger]);
  const [state, setState] = useState<ProgressState>({
    progressSeconds: 0,
    completed: false,
    watchedPercentage: 0,
    lastSyncedAt: 0,
    isDirty: false,
    isLoading: true,
    error: null,
  });

  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastProgressRef = useRef<LessonProgress | null>(null);

  // Load initial progress from Convex query
  useEffect(() => {
    logger.debug("🔄 Processing progress query result", {
      queryUndefined: progressQuery === undefined,
      queryNull: progressQuery === null,
      queryData: progressQuery,
    });

    if (progressQuery !== undefined) {
      if (progressQuery) {
        // Progress exists - use it
        logger.info("✅ Existing progress found, loading state", {
          progressId: progressQuery._id,
          watchedDuration: progressQuery.watchedDuration,
          percentage: progressQuery.percentage,
          isCompleted: progressQuery.isCompleted,
          lastWatchedAt: progressQuery.lastWatchedAt,
        });

        setState({
          progressSeconds: progressQuery.watchedDuration ?? 0,
          completed: progressQuery.isCompleted ?? false,
          watchedPercentage: progressQuery.percentage ?? 0,
          lastSyncedAt: Date.now(),
          isDirty: false,
          isLoading: false,
          error: null,
        });

        lastProgressRef.current = {
          lessonId,
          userId,
          completed: progressQuery.isCompleted ?? false,
          isCompleted: progressQuery.isCompleted ?? false,
          watchedDuration: progressQuery.watchedDuration ?? 0,
          totalDuration: progressQuery.totalDuration ?? 0,
          progressPercentage: progressQuery.percentage ?? 0,
          progressSeconds: progressQuery.watchedDuration ?? 0,
          watchedPercentage: progressQuery.percentage ?? 0,
          lastWatchedAt: new Date(progressQuery.lastWatchedAt).toISOString(),
          completedAt: progressQuery.completedAt
            ? new Date(progressQuery.completedAt).toISOString()
            : undefined,
        };
      } else {
        // No progress exists yet - start fresh
        logger.info("🆕 No existing progress found, starting fresh", {
          lessonId,
          userId,
          message: "This is expected for new lessons",
        });
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    } else {
      logger.debug("⌛ Progress query still loading...", { lessonId });
    }
  }, [progressQuery, lessonId, userId, logger]);

  const syncOptionsRef = useRef<{
    seekEvents?: number;
    pauseEvents?: number;
    playbackSpeed?: number;
    totalDuration?: number;
  }>({});

  // Sync progress to server using Convex mutations
  const syncProgress = useCallback(
    async (force = false) => {
      const shouldSync = state.isDirty || force;
      logger.debug("🔄 Sync attempt", {
        isDirty: state.isDirty,
        force,
        shouldSync,
        currentState: {
          progressSeconds: state.progressSeconds,
          watchedPercentage: state.watchedPercentage,
          completed: state.completed,
        },
      });

      if (!shouldSync) {
        logger.debug("⏭️ Skipping sync - no changes to save");
        return;
      }

      try {
        const progressData = {
          lessonId: lessonId as Id<"lessons">,
          courseId: courseId as Id<"courses">,
          moduleId: moduleId as Id<"modules">,
          watchedDuration: state.progressSeconds,
          totalDuration: syncOptionsRef.current.totalDuration ?? 0,
          percentage: state.watchedPercentage,
          currentPosition: state.progressSeconds,
          seekEvents: syncOptionsRef.current.seekEvents ?? 0,
          pauseEvents: syncOptionsRef.current.pauseEvents ?? 0,
          playbackSpeed: syncOptionsRef.current.playbackSpeed ?? 1.0,
        };

        logger.info("🚀 Syncing progress to Convex", {
          progressData,
          mutationName: "api.lessons.updateProgress",
          timestamp: new Date().toISOString(),
        });

        // Use Convex mutation directly
        const result = await updateProgressMutation(progressData);

        logger.info("✅ Progress sync successful", {
          result,
          syncedAt: new Date().toISOString(),
          progressData: {
            watchedDuration: progressData.watchedDuration,
            percentage: progressData.percentage,
            totalDuration: progressData.totalDuration,
          },
        });

        setState((prev) => ({
          ...prev,
          lastSyncedAt: Date.now(),
          isDirty: false,
          error: null,
        }));

        // Reset sync options
        syncOptionsRef.current = {};

        // Create updated progress object for callback
        const updatedProgress: LessonProgress = {
          lessonId,
          userId,
          completed: state.completed,
          isCompleted: state.completed,
          watchedDuration: state.progressSeconds,
          totalDuration: progressData.totalDuration,
          progressPercentage: state.watchedPercentage,
          progressSeconds: state.progressSeconds,
          watchedPercentage: state.watchedPercentage,
          lastWatchedAt: new Date().toISOString(),
          completedAt: state.completed ? new Date().toISOString() : undefined,
        };

        lastProgressRef.current = updatedProgress;
        onProgressUpdate?.(updatedProgress);
      } catch (error) {
        logger.error("❌ Progress sync failed", {
          error: error instanceof Error ? error.message : "Unknown error",
          errorObject: error,
          progressData: {
            lessonId,
            courseId,
            moduleId,
            watchedDuration: state.progressSeconds,
            percentage: state.watchedPercentage,
          },
        });

        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Sync failed",
        }));
      }
    },
    [
      lessonId,
      courseId,
      moduleId,
      state.progressSeconds,
      state.watchedPercentage,
      state.isDirty,
      state.completed,
      updateProgressMutation,
      onProgressUpdate,
      logger,
      userId,
    ],
  );

  // Throttled sync function
  const throttledSync = useCallback(
    throttle(() => {
      void syncProgress();
    }, syncInterval),
    [syncProgress, syncInterval],
  );

  // Update progress with optimistic updates
  const updateProgress = useCallback(
    (
      currentTime: number,
      duration: number,
      options?: {
        seekEvents?: number;
        pauseEvents?: number;
        playbackSpeed?: number;
        totalDuration?: number;
      },
    ) => {
      const watchedPercentage =
        duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;
      const wasCompleted = state.completed;
      const isNowCompleted = watchedPercentage >= 90; // Consider completed at 90%

      logger.debug("📊 Updating progress", {
        currentTime,
        duration,
        watchedPercentage: Math.round(watchedPercentage * 100) / 100,
        wasCompleted,
        isNowCompleted,
        options,
        trigger: "video-timeupdate",
      });

      setState((prev) => ({
        ...prev,
        progressSeconds: currentTime,
        watchedPercentage,
        completed: isNowCompleted,
        isDirty: true,
      }));

      // Store options for sync
      syncOptionsRef.current = {
        ...options,
        totalDuration: options?.totalDuration ?? duration, // Include total duration
      };

      // Trigger completion callback if newly completed
      if (!wasCompleted && isNowCompleted) {
        logger.info("🎉 Lesson completed!", {
          lessonId,
          completionPercentage: watchedPercentage,
          timeWatched: currentTime,
          totalDuration: duration,
        });
        onComplete?.();
      }

      // Schedule sync
      logger.debug("⏰ Scheduling progress sync via throttle");
      throttledSync();
    },
    [state.completed, throttledSync, onComplete, logger, lessonId],
  );

  // Mark lesson as completed manually
  const markCompleted = useCallback(async () => {
    logger.info("🎯 Manually marking lesson as completed", {
      lessonId,
      courseId,
      moduleId,
      currentProgress: state.progressSeconds,
      currentPercentage: state.watchedPercentage,
    });

    try {
      const result = await markCompleteMutation({
        lessonId: lessonId as Id<"lessons">,
        courseId: courseId as Id<"courses">,
        moduleId: moduleId as Id<"modules">,
      });

      logger.info("✅ Manual completion successful", {
        result,
        completedAt: new Date().toISOString(),
      });

      setState((prev) => ({
        ...prev,
        completed: true,
        watchedPercentage: 100,
        isDirty: false,
      }));

      onComplete?.();
    } catch (error) {
      logger.error("❌ Manual completion failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        errorObject: error,
      });

      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Mark complete failed",
      }));
    }
  }, [
    markCompleteMutation,
    lessonId,
    courseId,
    moduleId,
    onComplete,
    logger,
    state.progressSeconds,
    state.watchedPercentage,
  ]);

  // Reset progress
  const resetProgress = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      progressSeconds: 0,
      watchedPercentage: 0,
      completed: false,
      isDirty: true,
    }));

    await syncProgress(true);
  }, [syncProgress]);

  // Sync on component unmount
  useEffect(() => {
    return () => {
      if (state.isDirty) {
        // Best effort sync on unmount
        void syncProgress(true);
      }
    };
  }, [state.isDirty, syncProgress]);

  // Periodic sync for long sessions
  useEffect(() => {
    if (state.isDirty) {
      syncTimeoutRef.current = setTimeout(() => {
        void syncProgress();
      }, syncInterval);
    }

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [state.isDirty, syncProgress, syncInterval]);

  return {
    // Current state
    progressSeconds: state.progressSeconds,
    completed: state.completed,
    watchedPercentage: state.watchedPercentage,
    isLoading: state.isLoading,
    error: state.error,
    isDirty: state.isDirty,

    // Actions
    updateProgress,
    markCompleted,
    resetProgress,
    syncProgress: () => syncProgress(true),

    // Last synced progress from server
    lastSyncedProgress: lastProgressRef.current,
  };
}

/**
 * Hook for tracking overall course progress
 */
export function useCourseProgress(courseId: string, userId: string) {
  const logger = createProgressLogger("useCourseProgress");

  // Log initialization
  useEffect(() => {
    logger.info("🚀 Course progress tracking initialized", {
      courseId,
      userId,
      timestamp: new Date().toISOString(),
    });
  }, [courseId, userId, logger]);

  // Use Convex query for course progress
  const progressQuery = useQuery(api.lessons.getCourseProgress, {
    courseId: courseId as Id<"courses">,
  });

  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Transform Convex progress data to legacy CourseProgress format
  useEffect(() => {
    logger.debug("🔄 Processing course progress query", {
      queryStatus:
        progressQuery === undefined
          ? "loading"
          : progressQuery === null
            ? "no-data"
            : "has-data",
      recordCount: Array.isArray(progressQuery) ? progressQuery.length : 0,
    });

    if (progressQuery !== undefined) {
      if (progressQuery && progressQuery.length > 0) {
        const completedLessons = progressQuery.filter(
          (p) => p.isCompleted,
        ).length;
        const totalLessons = progressQuery.length;
        const totalWatchTime = progressQuery.reduce(
          (sum, p) => sum + (p.watchedDuration || 0),
          0,
        );
        const progressPercentage =
          totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
        const lastAccessedAt = Math.max(
          ...progressQuery.map((p) => p.lastWatchedAt),
        );

        const courseProgress: CourseProgress = {
          courseId,
          userId,
          progressPercentage: Math.round(progressPercentage),
          completedLessons,
          totalLessons,
          lastAccessedAt: new Date(lastAccessedAt).toISOString(),
          enrolledAt: new Date().toISOString(), // Fallback
          estimatedTimeRemaining: 0,
        };

        setProgress(courseProgress);
      } else {
        setProgress(null); // No progress yet
      }
      setError(null);
    }
  }, [progressQuery, courseId, userId, logger]);

  // Refresh progress data
  const refreshProgress = useCallback(async () => {
    // For Convex, progress refreshes automatically via reactivity
    // This is a no-op for compatibility
  }, []);

  return {
    progress,
    isLoading: progressQuery === undefined,
    error,
    refreshProgress,
  };
}

/**
 * Hook for prefetching next lesson
 */
export function usePrefetchNextLesson(
  currentLessonId: string,
  nextLessonId?: string,
) {
  const prefetchedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!nextLessonId || prefetchedRef.current.has(nextLessonId)) {
      return;
    }

    // Prefetch next lesson data
    const prefetchUrl = `/api/lessons/${nextLessonId}`;

    // Use link prefetch for browser-level caching
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = prefetchUrl;
    document.head.appendChild(link);

    // Mark as prefetched
    prefetchedRef.current.add(nextLessonId);

    // Cleanup
    return () => {
      document.head.removeChild(link);
    };
  }, [nextLessonId]);

  // Prefetch video content for next lesson
  const prefetchNextVideo = useCallback((videoUrl: string) => {
    if (prefetchedRef.current.has(videoUrl)) return;

    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "video";
    link.href = videoUrl;
    document.head.appendChild(link);

    prefetchedRef.current.add(videoUrl);

    // Cleanup after 30 seconds to avoid memory bloat
    setTimeout(() => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    }, 30000);
  }, []);

  return {
    prefetchNextVideo,
  };
}
