/**
 * LESSON CLIENT WRAPPER
 *
 * Client Component wrapper for handling dynamic imports with ssr: false
 * while maintaining Server Component benefits for the main page.
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-09-20
 */

"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { useOptimizedProgress } from "@/hooks/useOptimizedProgress";
import { ProgressSyncIndicator } from "@/components/progress/ProgressSyncIndicator";
import type { LessonWithNavigation } from "@/types/course";

// Dynamically import heavy components with ssr: false
const LessonPlayer = dynamic(() => import("@/components/lesson/LessonPlayer"), {
  ssr: false,
  loading: () => <LessonPlayerSkeleton />,
});

const Comments = dynamic(() => import("@/components/lesson/Comments"), {
  ssr: false,
  loading: () => (
    <div className="text-muted-foreground py-8 text-center">
      Loading comments...
    </div>
  ),
});

// Also import LessonViewer dynamically for consistency
const LessonViewer = dynamic(
  () =>
    import("@/components/lesson").then((mod) => ({
      default: mod.LessonViewer,
    })),
  {
    ssr: false,
    loading: () => <div className="py-8 text-center">Loading content...</div>,
  },
);

/**
 * Lesson Player Skeleton
 */
const LessonPlayerSkeleton: React.FC = () => (
  <div className="aspect-video w-full">
    <Skeleton className="h-full w-full rounded-lg" />
  </div>
);

/**
 * Lesson Content Component
 */
interface LessonContentProps {
  lesson: LessonWithNavigation;
  userId: string;
}

export const LessonContent: React.FC<LessonContentProps> = ({
  lesson,
  userId,
}) => {
  // Initialize optimized progress tracking with 3-minute debounce
  const progressHook = useOptimizedProgress({
    lessonId: lesson.id,
    courseId: lesson.courseId,
    moduleId: lesson.moduleId,
    userId,
    debounceConfig: {
      intervalMs: 6000, // 3 minutes
      maxRetries: 3,
      retryDelayMs: 5000,
      batchSize: 10,
      enableOptimisticUpdates: true,
      enableCompression: true,
    },
    onProgressUpdate: (progress) => {
      console.log("[LessonClientWrapper] Progress updated:", {
        lessonId: progress.lessonId,
        percentage: progress.progressPercentage,
        watchedDuration: progress.watchedDuration,
        isCompleted: progress.isCompleted,
      });
    },
    onComplete: () => {
      console.log("[LessonClientWrapper] Lesson completed!");
    },
    onError: (error) => {
      console.error("[LessonClientWrapper] Progress tracking error:", error);
    },
  });

  // Determine content type and render appropriate component
  // Check for video content (either legacy videoUrl or new content structure)
  const hasVideo =
    lesson.videoUrl ??
    (lesson.content &&
      (lesson.content.startsWith("http") ||
        lesson.content.startsWith("blob:") ||
        lesson.content.includes("video")));

  return (
    <div className="space-y-6">
      {/* Progress Sync Status - Professional Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm font-medium">
            Progress Tracking:
          </span>
          <ProgressSyncIndicator
            state={{
              isPendingSync: progressHook.isPendingSync,
              lastSyncedAt: progressHook.lastSyncedAt,
              pendingUpdates: progressHook.pendingUpdates,
              retryCount: progressHook.retryCount,
              error: progressHook.error,
            }}
            onForceSync={progressHook.forceSync}
            compact={true}
          />
        </div>

        {/* Progress Stats */}
        <div className="text-muted-foreground flex items-center gap-4 text-xs">
          <span>{Math.round(progressHook.watchedPercentage)}% Complete</span>
          {progressHook.pendingUpdates > 0 && (
            <span className="text-orange-600">
              {progressHook.pendingUpdates} Updates Pending
            </span>
          )}
        </div>
      </div>

      {/* Debug Panel - Development Only */}
      {process.env.NODE_ENV === "development" && (
        <div className="rounded-lg border border-dashed border-orange-200 bg-orange-50 p-4">
          <h3 className="mb-2 text-sm font-medium text-orange-800">
            🔧 Progress Debug Info (Development)
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs text-orange-700">
            <div>Progress: {Math.round(progressHook.watchedPercentage)}%</div>
            <div>Completed: {progressHook.completed ? "Yes" : "No"}</div>
            <div>Pending Updates: {progressHook.pendingUpdates}</div>
            <div>
              Last Sync:{" "}
              {progressHook.lastSyncedAt
                ? new Date(progressHook.lastSyncedAt).toLocaleTimeString()
                : "Never"}
            </div>
            <div>Retry Count: {progressHook.retryCount}</div>
            <div>Error: {progressHook.error ?? "None"}</div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {hasVideo ? (
        <Suspense fallback={<LessonPlayerSkeleton />}>
          <LessonPlayer
            lesson={lesson}
            userId={userId}
            autoPlay={false}
            className="w-full"
          />
        </Suspense>
      ) : (lesson.contentHtml ?? (lesson.content && !hasVideo)) ? (
        <Suspense
          fallback={<div className="py-8 text-center">Loading content...</div>}
        >
          <LessonViewer lesson={lesson} userId={userId} className="w-full" />
        </Suspense>
      ) : (
        // No content available
        <div className="bg-muted/50 flex h-64 flex-col items-center justify-center rounded-lg border">
          <div className="text-muted-foreground text-lg font-medium">
            No content available
          </div>
          <div className="text-muted-foreground text-sm">
            This lesson is currently being prepared.
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Comments Section Component
 */
interface CommentsProps {
  lessonId: string;
  userId: string;
}

export const CommentsSection: React.FC<CommentsProps> = ({
  lessonId,
  userId,
}) => {
  return (
    <div className="bg-card space-y-4 rounded-lg border p-6">
      <h2 className="text-lg font-semibold">Discussion</h2>
      <Suspense
        fallback={
          <div className="text-muted-foreground py-8 text-center">
            Loading comments...
          </div>
        }
      >
        <Comments lessonId={lessonId} userId={userId} />
      </Suspense>
    </div>
  );
};
