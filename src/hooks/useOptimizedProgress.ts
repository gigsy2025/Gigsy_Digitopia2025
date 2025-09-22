/**
 * OPTIMIZED PROGRESS TRACKING HOOK
 *
 * Enterprise-grade progress tracking hook that integrates with the professional
 * debouncer to reduce database load while maintaining real-time user experience.
 * Implements intelligent batching, retry logic, and optimistic updates.
 *
 * FEATURES:
 * - 3-minute debounced sync intervals
 * - Optimistic updates for immediate UI feedback
 * - Automatic retry with exponential backoff
 * - Memory-efficient cleanup
 * - Comprehensive error handling
 * - Real-time progress display
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-01-14
 */

"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import {
  ProgressDebouncer,
  type ProgressUpdate,
  type DebounceConfig,
} from "@/utils/progressDebouncer";

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface OptimizedProgressOptions {
  lessonId: string;
  courseId: string;
  moduleId: string;
  userId: string;
  debounceConfig?: Partial<DebounceConfig>;
  onProgressUpdate?: (progress: LessonProgress) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export interface LessonProgress {
  lessonId: string;
  userId: string;
  completed: boolean;
  isCompleted: boolean;
  watchedDuration: number;
  totalDuration: number;
  progressPercentage: number;
  progressSeconds: number;
  watchedPercentage: number;
  lastWatchedAt: string;
  completedAt?: string;
}

export interface OptimizedProgressState {
  // Current progress state
  progressSeconds: number;
  completed: boolean;
  watchedPercentage: number;
  isLoading: boolean;
  error: string | null;
  isDirty: boolean;

  // Debouncer state
  isPendingSync: boolean;
  lastSyncedAt: number;
  pendingUpdates: number;
  retryCount: number;

  // Actions
  updateProgress: (
    currentTime: number,
    duration: number,
    options?: {
      seekEvents?: number;
      pauseEvents?: number;
      playbackSpeed?: number;
      totalDuration?: number;
    },
  ) => void;
  markCompleted: () => Promise<void>;
  resetProgress: () => Promise<void>;
  forceSync: () => Promise<void>;
}

// =============================================================================
// ENHANCED PROGRESS TRACKING HOOK
// =============================================================================

export function useOptimizedProgress({
  lessonId,
  courseId,
  moduleId,
  userId,
  debounceConfig = {},
  onProgressUpdate,
  onComplete,
  onError,
}: OptimizedProgressOptions): OptimizedProgressState {
  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================

  const [state, setState] = useState({
    progressSeconds: 0,
    completed: false,
    watchedPercentage: 0,
    isLoading: true,
    error: null as string | null,
    isDirty: false,
  });

  const [debouncerState, setDebouncerState] = useState({
    isPendingSync: false,
    lastSyncedAt: 0,
    pendingUpdates: 0,
    retryCount: 0,
  });

  // =============================================================================
  // CONVEX INTEGRATION
  // =============================================================================

  const updateProgressMutation = useMutation(api.lessons.updateProgress);
  const markCompleteMutation = useMutation(api.lessons.markComplete);

  // Query for existing progress
  const progressQuery = useQuery(api.lessons.getProgress, {
    lessonId: lessonId as Id<"lessons">,
  });

  // =============================================================================
  // DEBOUNCER INSTANCE
  // =============================================================================

  const debouncerRef = useRef<ProgressDebouncer | null>(null);

  // Initialize debouncer with optimized config
  const debouncerConfig = useMemo(
    () => ({
      intervalMs: 180000, // 3 minutes
      maxRetries: 3,
      retryDelayMs: 5000,
      batchSize: 10,
      enableOptimisticUpdates: true,
      enableCompression: true,
      ...debounceConfig,
    }),
    [debounceConfig],
  );

  useEffect(() => {
    debouncerRef.current = new ProgressDebouncer(debouncerConfig, {
      onStateChange: (newState: any) => {
        setDebouncerState({
          isPendingSync: newState.isPending,
          lastSyncedAt: newState.lastSyncedAt,
          pendingUpdates: newState.pendingUpdates,
          retryCount: newState.retryCount,
        });
      },
      onProgressUpdate: (update: any) => {
        // Handle optimistic updates
        const progressPercentage = update.percentage;
        const isCompleted = progressPercentage >= 90;

        setState((prev) => ({
          ...prev,
          progressSeconds: update.watchedDuration,
          watchedPercentage: progressPercentage,
          completed: isCompleted,
        }));

        // Create progress object for callback
        const progress: LessonProgress = {
          lessonId: update.lessonId,
          userId,
          completed: isCompleted,
          isCompleted,
          watchedDuration: update.watchedDuration,
          totalDuration: update.totalDuration,
          progressPercentage,
          progressSeconds: update.watchedDuration,
          watchedPercentage: progressPercentage,
          lastWatchedAt: new Date(update.timestamp).toISOString(),
          completedAt: isCompleted
            ? new Date(update.timestamp).toISOString()
            : undefined,
        };

        onProgressUpdate?.(progress);
      },
      onError: (error: any) => {
        console.error("[OptimizedProgress] Debouncer error:", error);
        setState((prev) => ({ ...prev, error: error.message }));
        onError?.(error);
      },
    });

    return () => {
      debouncerRef.current?.destroy();
    };
  }, [debouncerConfig, userId, onProgressUpdate, onError]);

  // =============================================================================
  // PROGRESS QUERY HANDLING
  // =============================================================================

  useEffect(() => {
    if (progressQuery !== undefined) {
      if (progressQuery) {
        // Existing progress found
        setState((prev) => ({
          ...prev,
          progressSeconds: progressQuery.watchedDuration ?? 0,
          completed: progressQuery.isCompleted ?? false,
          watchedPercentage: progressQuery.percentage ?? 0,
          isLoading: false,
          error: null,
        }));
      } else {
        // No progress exists yet
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    }
  }, [progressQuery]);

  // =============================================================================
  // PROGRESS UPDATE FUNCTION
  // =============================================================================

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
      const isNowCompleted = watchedPercentage >= 90;

      // Update local state immediately for optimistic UI
      setState((prev) => ({
        ...prev,
        progressSeconds: currentTime,
        watchedPercentage,
        completed: isNowCompleted,
        isDirty: true,
      }));

      // Create progress update for debouncer
      const progressUpdate: ProgressUpdate = {
        lessonId,
        courseId,
        moduleId,
        watchedDuration: currentTime,
        totalDuration: options?.totalDuration ?? duration,
        percentage: watchedPercentage,
        currentPosition: currentTime,
        seekEvents: options?.seekEvents ?? 0,
        pauseEvents: options?.pauseEvents ?? 0,
        playbackSpeed: options?.playbackSpeed ?? 1.0,
        timestamp: Date.now(),
      };

      // Add to debouncer queue
      debouncerRef.current?.addUpdate(progressUpdate);

      // Trigger completion callback if newly completed
      if (!wasCompleted && isNowCompleted) {
        onComplete?.();
      }
    },
    [lessonId, courseId, moduleId, state.completed, onComplete],
  );

  // =============================================================================
  // MANUAL COMPLETION
  // =============================================================================

  const markCompleted = useCallback(async () => {
    try {
      await markCompleteMutation({
        lessonId: lessonId as Id<"lessons">,
        courseId: courseId as Id<"courses">,
        moduleId: moduleId as Id<"modules">,
      });

      setState((prev) => ({
        ...prev,
        completed: true,
        watchedPercentage: 100,
        isDirty: false,
      }));

      onComplete?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Mark complete failed";
      setState((prev) => ({ ...prev, error: errorMessage }));
      onError?.(error as Error);
    }
  }, [markCompleteMutation, lessonId, courseId, moduleId, onComplete, onError]);

  // =============================================================================
  // RESET PROGRESS
  // =============================================================================

  const resetProgress = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      progressSeconds: 0,
      watchedPercentage: 0,
      completed: false,
      isDirty: true,
    }));

    // Force sync to clear server state
    await debouncerRef.current?.forceSync();
  }, []);

  // =============================================================================
  // FORCE SYNC
  // =============================================================================

  const forceSync = useCallback(async () => {
    await debouncerRef.current?.forceSync();
  }, []);

  // =============================================================================
  // CLEANUP ON UNMOUNT
  // =============================================================================

  useEffect(() => {
    return () => {
      // Force sync any pending updates before unmounting
      if (state.isDirty) {
        void debouncerRef.current?.forceSync();
      }
    };
  }, [state.isDirty]);

  // =============================================================================
  // RETURN OPTIMIZED STATE
  // =============================================================================

  return {
    // Current progress state
    progressSeconds: state.progressSeconds,
    completed: state.completed,
    watchedPercentage: state.watchedPercentage,
    isLoading: state.isLoading,
    error: state.error,
    isDirty: state.isDirty,

    // Debouncer state
    isPendingSync: debouncerState.isPendingSync,
    lastSyncedAt: debouncerState.lastSyncedAt,
    pendingUpdates: debouncerState.pendingUpdates,
    retryCount: debouncerState.retryCount,

    // Actions
    updateProgress,
    markCompleted,
    resetProgress,
    forceSync,
  };
}

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/**
 * Hook for tracking multiple lessons with shared debouncer
 */
export function useMultiLessonProgress(
  lessons: Array<{
    lessonId: string;
    courseId: string;
    moduleId: string;
  }>,
  userId: string,
  options?: {
    debounceConfig?: Partial<DebounceConfig>;
    onProgressUpdate?: (lessonId: string, progress: LessonProgress) => void;
    onError?: (error: Error) => void;
  },
) {
  const debouncerRef = useRef<ProgressDebouncer | null>(null);
  const [progressStates, setProgressStates] = useState<
    Record<string, LessonProgress>
  >({});

  useEffect(() => {
    debouncerRef.current = new ProgressDebouncer(
      {
        intervalMs: 180000, // 3 minutes
        maxRetries: 3,
        retryDelayMs: 5000,
        batchSize: 20, // Larger batch for multiple lessons
        enableOptimisticUpdates: true,
        enableCompression: true,
        ...options?.debounceConfig,
      },
      {
        onProgressUpdate: (update: any) => {
          const progress: LessonProgress = {
            lessonId: update.lessonId,
            userId,
            completed: update.percentage >= 90,
            isCompleted: update.percentage >= 90,
            watchedDuration: update.watchedDuration,
            totalDuration: update.totalDuration,
            progressPercentage: update.percentage,
            progressSeconds: update.watchedDuration,
            watchedPercentage: update.percentage,
            lastWatchedAt: new Date(update.timestamp).toISOString(),
            completedAt:
              update.percentage >= 90
                ? new Date(update.timestamp).toISOString()
                : undefined,
          };

          setProgressStates((prev) => ({
            ...prev,
            [update.lessonId]: progress,
          }));

          options?.onProgressUpdate?.(update.lessonId, progress);
        },
        onError: options?.onError,
      },
    );

    return () => {
      debouncerRef.current?.destroy();
    };
  }, [userId, options]);

  const updateLessonProgress = useCallback(
    (
      lessonId: string,
      currentTime: number,
      duration: number,
      options?: {
        seekEvents?: number;
        pauseEvents?: number;
        playbackSpeed?: number;
        totalDuration?: number;
      },
    ) => {
      const lesson = lessons.find((l) => l.lessonId === lessonId);
      if (!lesson) return;

      const progressUpdate: ProgressUpdate = {
        lessonId: lesson.lessonId,
        courseId: lesson.courseId,
        moduleId: lesson.moduleId,
        watchedDuration: currentTime,
        totalDuration: options?.totalDuration ?? duration,
        percentage:
          duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0,
        currentPosition: currentTime,
        seekEvents: options?.seekEvents ?? 0,
        pauseEvents: options?.pauseEvents ?? 0,
        playbackSpeed: options?.playbackSpeed ?? 1.0,
        timestamp: Date.now(),
      };

      debouncerRef.current?.addUpdate(progressUpdate);
    },
    [lessons],
  );

  const forceSyncAll = useCallback(async () => {
    await debouncerRef.current?.forceSync();
  }, []);

  return {
    progressStates,
    updateLessonProgress,
    forceSyncAll,
  };
}

export default useOptimizedProgress;
