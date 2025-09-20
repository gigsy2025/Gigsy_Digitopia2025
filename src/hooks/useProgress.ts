/**
 * PROGRESS TRACKING HOOKS
 *
 * Client-side hooks for tracking and managing course and lesson progress.
 * Includes optimistic updates and server synchronization.
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-09-20
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { throttle } from "@/utils/time";
import type { LessonProgress, CourseProgress } from "@/types/course";

interface UseProgressOptions {
  lessonId: string;
  courseId: string;
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
  userId,
  onProgressUpdate,
  onComplete,
  syncInterval = 5000,
}: UseProgressOptions) {
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

  // Load initial progress from server
  useEffect(() => {
    async function loadInitialProgress() {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        const response = await fetch(
          `/api/lessons/${lessonId}/progress?userId=${userId}`,
        );

        if (response.ok) {
          const progress = (await response.json()) as LessonProgress;
          setState({
            progressSeconds: progress.progressSeconds,
            completed: progress.completed,
            watchedPercentage: progress.watchedPercentage,
            lastSyncedAt: Date.now(),
            isDirty: false,
            isLoading: false,
            error: null,
          });
          lastProgressRef.current = progress;
        } else if (response.status === 404) {
          // No progress exists yet - start fresh
          setState((prev) => ({ ...prev, isLoading: false }));
        } else {
          throw new Error("Failed to load progress");
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }));
      }
    }

    void loadInitialProgress();
  }, [lessonId, userId]);

  // Sync progress to server
  const syncProgress = useCallback(
    async (force = false) => {
      if (!state.isDirty && !force) return;

      try {
        const progressData: Partial<LessonProgress> = {
          lessonId,
          courseId,
          userId,
          progressSeconds: state.progressSeconds,
          completed: state.completed,
          watchedPercentage: state.watchedPercentage,
          lastWatchedAt: new Date().toISOString(),
        };

        const response = await fetch(`/api/lessons/${lessonId}/progress`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(progressData),
        });

        if (!response.ok) {
          throw new Error("Failed to sync progress");
        }

        const updatedProgress = (await response.json()) as LessonProgress;

        setState((prev) => ({
          ...prev,
          lastSyncedAt: Date.now(),
          isDirty: false,
          error: null,
        }));

        lastProgressRef.current = updatedProgress;
        onProgressUpdate?.(updatedProgress);
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Sync failed",
        }));
      }
    },
    [
      lessonId,
      courseId,
      userId,
      state.progressSeconds,
      state.completed,
      state.watchedPercentage,
      state.isDirty,
      onProgressUpdate,
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
    (currentTime: number, duration: number) => {
      const watchedPercentage =
        duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;
      const wasCompleted = state.completed;
      const isNowCompleted = watchedPercentage >= 90; // Consider completed at 90%

      setState((prev) => ({
        ...prev,
        progressSeconds: currentTime,
        watchedPercentage,
        completed: isNowCompleted,
        isDirty: true,
      }));

      // Trigger completion callback if newly completed
      if (!wasCompleted && isNowCompleted) {
        onComplete?.();
      }

      // Schedule sync
      throttledSync();
    },
    [state.completed, throttledSync, onComplete],
  );

  // Mark lesson as completed manually
  const markCompleted = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      completed: true,
      isDirty: true,
    }));

    onComplete?.();
    await syncProgress(true); // Force immediate sync
  }, [syncProgress, onComplete]);

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
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load course progress
  useEffect(() => {
    async function loadCourseProgress() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `/api/courses/${courseId}/progress?userId=${userId}`,
        );

        if (response.ok) {
          const courseProgress = (await response.json()) as CourseProgress;
          setProgress(courseProgress);
        } else if (response.status === 404) {
          setProgress(null); // No progress yet
        } else {
          throw new Error("Failed to load course progress");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    }

    void loadCourseProgress();
  }, [courseId, userId]);

  // Refresh progress data
  const refreshProgress = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/courses/${courseId}/progress?userId=${userId}`,
      );
      if (response.ok) {
        const courseProgress = (await response.json()) as CourseProgress;
        setProgress(courseProgress);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refresh failed");
    }
  }, [courseId, userId]);

  return {
    progress,
    isLoading,
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
