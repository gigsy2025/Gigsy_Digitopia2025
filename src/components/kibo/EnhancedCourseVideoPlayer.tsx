/**
 * ENHANCED COURSE VIDEO PLAYER
 *
 * Next-generation course video player built on media-chrome foundation
 * with comprehensive progress tracking, analytics, and learning features.
 * Integrates with Convex backend for progress persistence and analytics.
 *
 * @author Principal Engineer
 * @version 2.0.0
 * @since 2025-01-20
 */

"use client";

import React, { useState, useRef, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  MediaController,
  MediaControlBar,
  MediaTimeRange,
  MediaTimeDisplay,
  MediaVolumeRange,
  MediaPlayButton,
  MediaSeekForwardButton,
  MediaSeekBackwardButton,
  MediaMuteButton,
  MediaFullscreenButton,
  MediaPlaybackRateButton,
} from "media-chrome/react";
import { api } from "convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle,
  Clock,
  Play,
  BookOpen,
  Award,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Id } from "convex/_generated/dataModel";
import type { CourseLesson } from "@/types/courses";
import {
  useVideoPlayer,
  useVideoProgress,
  useVideoAnalytics,
  useVideoControls,
  useVideoTime,
  useAutoSave,
  formatTime,
  generateSessionId,
} from "@/lib/video-player-utils";

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface EnhancedCourseVideoPlayerProps {
  lesson: CourseLesson;
  courseId: Id<"courses">;
  moduleId: Id<"modules">;
  currentProgress?: number;
  isCompleted?: boolean;
  onProgressUpdate?: (progress: number) => void;
  onComplete?: () => void;
  className?: string;
}

interface VideoAnalytics {
  totalPlayTime: number;
  seekCount: number;
  pauseCount: number;
  resumeCount: number;
  completionRate: number;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function getVideoSource(lesson: CourseLesson): string | undefined {
  // Handle modern content structure
  if (lesson.contentData?.type === "video" && lesson.contentData.data) {
    return lesson.contentData.data as string;
  }

  // Handle content field for video lessons
  if (lesson.content && lesson.contentType === "video") {
    return lesson.content;
  }

  // Handle legacy video URL field
  if (lesson.videoUrl) {
    return lesson.videoUrl;
  }

  return undefined;
}

function isConvexStorageId(src: string): boolean {
  return src.includes("_storage") || src.includes("convex");
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function EnhancedCourseVideoPlayer({
  lesson,
  courseId,
  moduleId,
  currentProgress = 0,
  isCompleted = false,
  onProgressUpdate,
  onComplete,
  className,
}: EnhancedCourseVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaControllerRef = useRef<HTMLElement>(null);

  // State management
  const [watchProgress, setWatchProgress] = useState({
    watchedDuration: 0,
    totalDuration: lesson.estimatedDuration || 0,
    percentage: currentProgress,
    isCompleted,
    lastWatchedAt: new Date(),
  });

  const [sessionId] = useState(() => generateSessionId());
  const [isTracking, setIsTracking] = useState(false);
  const [showCompletionBadge, setShowCompletionBadge] = useState(false);
  const [lastProgressUpdate, setLastProgressUpdate] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Convex queries and mutations
  const fileUrl = useQuery(
    api.files.getFileUrl,
    lesson.content &&
      lesson.contentType === "video" &&
      isConvexStorageId(lesson.content)
      ? { storageId: lesson.content as Id<"_storage"> }
      : "skip",
  );

  const updateLessonProgress = useMutation(api.lessons.updateProgress);
  const markLessonComplete = useMutation(api.lessons.markComplete);
  const trackVideoAnalytics = useMutation(api.analytics.trackVideoEvent);

  // Get video source with fallback handling
  const videoSrc = fileUrl ?? getVideoSource(lesson);

  // Analytics state
  const [analytics, setAnalytics] = useState<VideoAnalytics>({
    totalPlayTime: 0,
    seekCount: 0,
    pauseCount: 0,
    resumeCount: 0,
    completionRate: 0,
  });

  // Custom hooks for video functionality
  const { state: videoState } = useVideoPlayer(
    videoRef as React.RefObject<HTMLVideoElement>,
  );
  const { currentTime, duration, isPlaying } = videoState;
  const {
    play,
    pause,
    seek,
    setVolume,
    setPlaybackRate,
    skipForward,
    skipBackward,
  } = useVideoControls(videoRef as React.RefObject<HTMLVideoElement>);

  const { trackEvent } = useVideoAnalytics(lesson.id.toString());

  const { handleProgressUpdate: handleAutoSave, lastSaveTime } = useAutoSave(
    lesson.id.toString(),
  );

  // Progress tracking with backend integration
  const handleProgressUpdate = useCallback(
    async (currentTime: number, duration: number) => {
      if (!duration || duration === 0) return;

      const percentage = Math.min((currentTime / duration) * 100, 100);
      const now = Date.now();

      // Throttle progress updates to avoid too many API calls
      if (now - lastProgressUpdate < 5000 && percentage < 95) return;

      try {
        await updateLessonProgress({
          lessonId: lesson.id,
          courseId,
          moduleId,
          watchedDuration: currentTime,
          totalDuration: duration,
          percentage,
        });

        await trackVideoAnalytics({
          lessonId: lesson.id,
          eventType: "progress_update",
          data: {
            courseId,
            moduleId,
            eventData: {
              currentTime,
              duration,
              percentage,
              sessionId,
              timestamp: Date.now(),
              createdAt: Date.now(),
            },
          },
        });

        setLastProgressUpdate(now);
        setWatchProgress((prev) => ({
          ...prev,
          watchedDuration: currentTime,
          totalDuration: duration,
          percentage,
          lastWatchedAt: new Date(),
        }));

        onProgressUpdate?.(percentage);

        // Mark as complete if watched 95% or more
        if (percentage >= 95 && !watchProgress.isCompleted) {
          await handleCompletion();
        }
      } catch (error) {
        console.error("Failed to save progress:", error);
      }
    },
    [
      lesson.id,
      courseId,
      moduleId,
      lastProgressUpdate,
      watchProgress.isCompleted,
      updateLessonProgress,
      trackVideoAnalytics,
      sessionId,
      onProgressUpdate,
    ],
  );

  // Handle lesson completion
  const handleCompletion = useCallback(async () => {
    try {
      await markLessonComplete({
        lessonId: lesson.id,
        courseId,
        moduleId,
      });

      await trackVideoAnalytics({
        lessonId: lesson.id,
        eventType: "lesson_completed",
        data: {
          courseId,
          moduleId,
          sessionId,
          eventData: {
            totalWatchTime: watchProgress.watchedDuration,
            completionRate: 100,
            currentTime,
            duration,
            sessionId,
            timestamp: Date.now(),
            createdAt: Date.now(),
          },
        },
      });

      setWatchProgress((prev) => ({ ...prev, isCompleted: true }));
      setShowCompletionBadge(true);
      onComplete?.();

      toast.success("🎉 Lesson Completed!", {
        description: "Great job! You've finished this lesson.",
      });

      // Hide completion badge after 3 seconds
      setTimeout(() => setShowCompletionBadge(false), 3000);
    } catch (error) {
      console.error("Failed to mark lesson complete:", error);
    }
  }, [
    lesson.id,
    courseId,
    moduleId,
    markLessonComplete,
    trackVideoAnalytics,
    sessionId,
    watchProgress.watchedDuration,
    onComplete,
  ]);

  // Video event handlers
  const handlePlay = useCallback(() => {
    setIsTracking(true);
    trackEvent("video_play", {
      lessonId: lesson.id,
      currentTime: currentTime,
      sessionId,
    });
  }, [lesson.id, trackEvent, currentTime, sessionId]);

  const handlePause = useCallback(() => {
    setIsTracking(false);
    if (currentTime && duration) {
      handleAutoSave(currentTime, duration);
    }
    trackEvent("video_pause", {
      lessonId: lesson.id,
      currentTime: currentTime,
      sessionId,
    });
  }, [lesson.id, handleAutoSave, trackEvent, currentTime, duration, sessionId]);

  const handleTimeUpdate = useCallback(() => {
    if (!isTracking || !currentTime || !duration) return;

    // Update local state immediately for smooth UI
    const percentage = Math.min((currentTime / duration) * 100, 100);
    setWatchProgress((prev) => ({
      ...prev,
      watchedDuration: currentTime,
      percentage,
    }));

    // Save to backend periodically
    handleProgressUpdate(currentTime, duration).catch((error) => {
      console.error("Failed to update progress:", error);
    });
  }, [isTracking, currentTime, duration, handleProgressUpdate]);

  const handleEnded = useCallback(() => {
    setIsTracking(false);
    if (!watchProgress.isCompleted) {
      handleCompletion().catch((error) => {
        console.error("Failed to complete lesson:", error);
      });
    }
    trackEvent("video_ended", {
      lessonId: lesson.id,
      totalWatchTime: currentTime,
      completionRate: 100,
      sessionId,
    });
  }, [
    lesson.id,
    watchProgress.isCompleted,
    handleCompletion,
    trackEvent,
    currentTime,
    sessionId,
  ]);

  const handleError = useCallback(() => {
    setError("Failed to load video");
    trackEvent("video_error", {
      lessonId: lesson.id,
      error: "Video load failed",
      sessionId,
    });
  }, [lesson.id, trackEvent, sessionId]);

  // Action handlers
  const handleResumeVideo = useCallback(() => {
    if (watchProgress.watchedDuration > 30 && videoRef.current) {
      videoRef.current.currentTime = watchProgress.watchedDuration;
      play().catch((error) => {
        console.error("Failed to play video:", error);
      });
      toast.info(`Resumed from ${formatTime(watchProgress.watchedDuration)}`);
    }
  }, [watchProgress.watchedDuration, play]);

  const handleResetProgress = useCallback(() => {
    setWatchProgress((prev) => ({
      ...prev,
      watchedDuration: 0,
      percentage: 0,
      isCompleted: false,
    }));
    seek(0);
    toast.info("Progress reset");
  }, [seek]);

  // Error handling
  if (error) {
    return (
      <div className={cn("space-y-4", className)}>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Failed to load video content</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!videoSrc) {
    return (
      <div className={cn("space-y-4", className)}>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3 text-gray-600">
              <AlertCircle className="h-5 w-5" />
              <span>No video content available for this lesson</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Progress Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{lesson.title}</CardTitle>
            <div className="flex items-center space-x-2">
              {watchProgress.isCompleted ? (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Completed
                </Badge>
              ) : watchProgress.percentage > 0 ? (
                <Badge variant="secondary">
                  <Clock className="mr-1 h-3 w-3" />
                  {Math.round(watchProgress.percentage)}% Complete
                </Badge>
              ) : (
                <Badge variant="outline">
                  <Play className="mr-1 h-3 w-3" />
                  Not Started
                </Badge>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={watchProgress.percentage} className="h-2" />
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>{formatTime(watchProgress.watchedDuration)} watched</span>
              <span>{formatTime(watchProgress.totalDuration)} total</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="flex items-center space-x-2">
            {watchProgress.watchedDuration > 30 &&
              !watchProgress.isCompleted && (
                <Button size="sm" variant="outline" onClick={handleResumeVideo}>
                  <Play className="mr-2 h-4 w-4" />
                  Resume
                </Button>
              )}

            {watchProgress.percentage > 0 && (
              <Button size="sm" variant="outline" onClick={handleResetProgress}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset Progress
              </Button>
            )}

            {watchProgress.isCompleted && (
              <Button size="sm" variant="outline" onClick={() => seek(0)}>
                <BookOpen className="mr-2 h-4 w-4" />
                Watch Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Video Player */}
      <div className="relative">
        <MediaController className="w-full overflow-hidden rounded-lg bg-black">
          <video
            ref={videoRef}
            src={videoSrc}
            poster={lesson.thumbnailUrl}
            className="h-auto w-full"
            crossOrigin="anonymous"
            onPlay={handlePlay}
            onPause={handlePause}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            onError={handleError}
            onLoadedMetadata={() => {
              if (videoRef.current) {
                setWatchProgress((prev) => ({
                  ...prev,
                  totalDuration: videoRef.current!.duration,
                }));
              }
            }}
          />

          <MediaControlBar className="bg-gradient-to-t from-black/80 to-transparent">
            <MediaPlayButton />
            <MediaSeekBackwardButton seekOffset={10} />
            <MediaSeekForwardButton seekOffset={10} />
            <MediaTimeDisplay showDuration />
            <MediaTimeRange />
            <MediaMuteButton />
            <MediaVolumeRange />
            <MediaPlaybackRateButton rates={[0.5, 0.75, 1, 1.25, 1.5, 2]} />
            <MediaFullscreenButton />
          </MediaControlBar>
        </MediaController>

        {/* Completion Overlay */}
        {showCompletionBadge && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
            <div className="space-y-3 rounded-lg bg-white p-6 text-center dark:bg-gray-800">
              <Award className="mx-auto h-12 w-12 text-yellow-500" />
              <h3 className="text-lg font-semibold">Lesson Complete!</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Great job! You&apos;ve successfully completed this lesson.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Lesson Description */}
      {lesson.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">About This Lesson</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="leading-relaxed text-gray-700 dark:text-gray-300">
              {lesson.description}
            </p>

            {lesson.estimatedDuration && (
              <div className="mt-4 flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Clock className="mr-2 h-4 w-4" />
                <span>
                  Estimated duration:{" "}
                  {Math.floor(lesson.estimatedDuration / 60)} minutes
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default EnhancedCourseVideoPlayer;
