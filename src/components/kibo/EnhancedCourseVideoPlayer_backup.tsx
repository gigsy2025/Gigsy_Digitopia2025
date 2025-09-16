/**
 * ENHANCED COURSE VIDEO PLAYER
 *
 * Next-generation video player using media-chrome based Kibo UI components
 * with progress tracking, completion detection, and learning analytics.
 *
 * FEATURES:
 * - Media-chrome web components for optimal performance
 * - Automatic progress tracking and persistence
 * - Learning analytics integration
 * - Accessibility compliance (WCAG 2.1)
 * - Resume functionality with smart prompts
 * - Error handling and fallback states
 * - Responsive design with adaptive quality
 *
 * @author Principal Engineer
 * @version 2.0.0
 * @since 2025-09-16
 */

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  VideoPlayer,
  VideoPlayerContent,
  VideoPlayerControlBar,
  VideoPlayerMuteButton,
  VideoPlayerPlayButton,
  VideoPlayerSeekBackwardButton,
  VideoPlayerSeekForwardButton,
  VideoPlayerTimeDisplay,
  VideoPlayerTimeRange,
  VideoPlayerVolumeRange,
} from "@/components/ui/kibo-ui/video-player";
import {
  CheckCircle,
  Clock,
  Play,
  RotateCcw,
  Download,
  Share2,
  AlertCircle,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Id } from "convex/_generated/dataModel";
import type { CourseLesson } from "@/types/courses";

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
  onNext?: () => void;
  onPrevious?: () => void;
  className?: string;
}

interface WatchProgress {
  watchedDuration: number;
  totalDuration: number;
  percentage: number;
  isCompleted: boolean;
  lastWatchedAt: Date;
  completionBadgeShown: boolean;
}

interface VideoAnalytics {
  watchSessions: number;
  totalWatchTime: number;
  averageEngagement: number;
  completionRate: number;
  skipRate: number;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function formatTime(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds)) return "0:00";

  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

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
  onNext,
  onPrevious,
  className,
}: EnhancedCourseVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // State management
  const [watchProgress, setWatchProgress] = useState<WatchProgress>({
    watchedDuration: 0,
    totalDuration: lesson.estimatedDuration || 0,
    percentage: currentProgress,
    isCompleted,
    lastWatchedAt: new Date(),
    completionBadgeShown: false,
  });

  const [analytics, setAnalytics] = useState<VideoAnalytics>({
    watchSessions: 0,
    totalWatchTime: 0,
    averageEngagement: 0,
    completionRate: 0,
    skipRate: 0,
  });

  const [isTracking, setIsTracking] = useState(false);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
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
  const videoSrc = fileUrl || getVideoSource(lesson);

  // =============================================================================
  // PROGRESS TRACKING AND ANALYTICS
  // =============================================================================

  const saveProgress = useCallback(
    async (currentTime: number, duration: number) => {
      if (!duration || duration === 0) return;

      const percentage = Math.min((currentTime / duration) * 100, 100);
      const now = Date.now();

      // Throttle progress updates to avoid too many API calls (every 5 seconds or at 95% completion)
      if (now - lastProgressUpdate < 5000 && percentage < 95) return;

      try {
        await updateLessonProgress({
          lessonId: lesson._id,
          courseId,
          moduleId,
          watchedDuration: currentTime,
          totalDuration: duration,
          percentage,
        });

        // Track analytics
        await trackVideoAnalytics({
          lessonId: lesson._id,
          eventType: "progress_update",
          data: {
            currentTime,
            duration,
            percentage,
            sessionId: crypto.randomUUID(),
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

        // Auto-complete at 95% watched
        if (percentage >= 95 && !watchProgress.isCompleted) {
          await handleCompletion();
        }
      } catch (error) {
        console.error("Failed to save progress:", error);
        setError("Failed to save progress. Please check your connection.");
      }
    },
    [
      lesson._id,
      courseId,
      moduleId,
      lastProgressUpdate,
      watchProgress.isCompleted,
      updateLessonProgress,
      trackVideoAnalytics,
      onProgressUpdate,
    ],
  );

  const handleCompletion = useCallback(async () => {
    if (watchProgress.isCompleted) return;

    try {
      await markLessonComplete({
        lessonId: lesson._id,
        courseId,
        moduleId,
      });

      await trackVideoAnalytics({
        lessonId: lesson._id,
        eventType: "lesson_completed",
        data: {
          totalWatchTime: watchProgress.watchedDuration,
          completionTime: new Date().toISOString(),
        },
      });

      setWatchProgress((prev) => ({
        ...prev,
        isCompleted: true,
        completionBadgeShown: true,
      }));

      onComplete?.();

      toast.success("🎉 Lesson Completed!", {
        description: "Excellent work! You've finished this lesson.",
        action: onNext
          ? {
              label: "Next Lesson",
              onClick: onNext,
            }
          : undefined,
      });

      // Hide completion badge after 5 seconds
      setTimeout(() => {
        setWatchProgress((prev) => ({ ...prev, completionBadgeShown: false }));
      }, 5000);
    } catch (error) {
      console.error("Failed to mark lesson complete:", error);
      toast.error("Failed to save completion status. Please try again.");
    }
  }, [
    lesson._id,
    courseId,
    moduleId,
    watchProgress.isCompleted,
    watchProgress.watchedDuration,
    markLessonComplete,
    trackVideoAnalytics,
    onComplete,
    onNext,
  ]);

  // =============================================================================
  // VIDEO EVENT HANDLERS
  // =============================================================================

  const handlePlay = useCallback(() => {
    setIsTracking(true);
    setError(null);

    trackVideoAnalytics({
      lessonId: lesson._id,
      eventType: "video_play",
      data: { currentTime: videoRef.current?.currentTime || 0 },
    });
  }, [lesson._id, trackVideoAnalytics]);

  const handlePause = useCallback(() => {
    setIsTracking(false);

    // Save progress when pausing
    if (videoRef.current) {
      saveProgress(videoRef.current.currentTime, videoRef.current.duration);
    }

    trackVideoAnalytics({
      lessonId: lesson._id,
      eventType: "video_pause",
      data: { currentTime: videoRef.current?.currentTime || 0 },
    });
  }, [lesson._id, saveProgress, trackVideoAnalytics]);

  const handleTimeUpdate = useCallback(() => {
    if (!isTracking || !videoRef.current) return;

    const currentTime = videoRef.current.currentTime;
    const duration = videoRef.current.duration;

    if (duration) {
      // Update local state immediately for smooth UI
      const percentage = Math.min((currentTime / duration) * 100, 100);
      setWatchProgress((prev) => ({
        ...prev,
        watchedDuration: currentTime,
        percentage,
      }));

      // Save to backend periodically
      saveProgress(currentTime, duration);
    }
  }, [isTracking, saveProgress]);

  const handleEnded = useCallback(() => {
    setIsTracking(false);

    trackVideoAnalytics({
      lessonId: lesson._id,
      eventType: "video_ended",
      data: {
        totalDuration: videoRef.current?.duration || 0,
        watchedDuration: videoRef.current?.currentTime || 0,
      },
    });

    if (!watchProgress.isCompleted) {
      handleCompletion();
    }
  }, [
    lesson._id,
    watchProgress.isCompleted,
    handleCompletion,
    trackVideoAnalytics,
  ]);

  const handleError = useCallback(() => {
    setError(
      "Video failed to load. Please refresh the page or try again later.",
    );
    setIsTracking(false);

    trackVideoAnalytics({
      lessonId: lesson._id,
      eventType: "video_error",
      data: { error: "Video load failed" },
    });
  }, [lesson._id, trackVideoAnalytics]);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      const duration = videoRef.current.duration;
      setWatchProgress((prev) => ({ ...prev, totalDuration: duration }));

      // Show resume prompt if there's significant progress
      if (watchProgress.watchedDuration > 30 && !watchProgress.isCompleted) {
        setShowResumePrompt(true);
      }
    }
  }, [watchProgress.watchedDuration, watchProgress.isCompleted]);

  // =============================================================================
  // USER ACTIONS
  // =============================================================================

  const handleResumeVideo = useCallback(() => {
    if (videoRef.current && watchProgress.watchedDuration > 0) {
      videoRef.current.currentTime = watchProgress.watchedDuration;
      setShowResumePrompt(false);
      toast.success(
        `Resumed from ${formatTime(watchProgress.watchedDuration)}`,
      );
    }
  }, [watchProgress.watchedDuration]);

  const handleResetProgress = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }

    setWatchProgress((prev) => ({
      ...prev,
      watchedDuration: 0,
      percentage: 0,
      isCompleted: false,
    }));

    setShowResumePrompt(false);
    toast.info("Progress reset to beginning");
  }, []);

  const handleDownload = useCallback(() => {
    if (videoSrc && fileUrl) {
      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = `${lesson.title}.mp4`;
      link.click();
      toast.success("Download started");
    } else {
      toast.error("Download not available for this video");
    }
  }, [videoSrc, fileUrl, lesson.title]);

  const handleShare = useCallback(async () => {
    const shareData = {
      title: lesson.title,
      text: `Check out this lesson: ${lesson.title}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        // User cancelled or error occurred
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  }, [lesson.title]);

  // =============================================================================
  // RENDER METHODS
  // =============================================================================

  if (!videoSrc) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No video source available for this lesson. Please contact support if
          this error persists.
        </AlertDescription>
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Progress Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <span>{lesson.title}</span>
              {watchProgress.completionBadgeShown && (
                <Trophy className="h-5 w-5 animate-bounce text-yellow-500" />
              )}
            </CardTitle>

            <div className="flex items-center space-x-2">
              {watchProgress.isCompleted ? (
                <Badge
                  variant="default"
                  className="bg-green-600 hover:bg-green-700"
                >
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

              {lesson.isFree && (
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-800"
                >
                  Free Preview
                </Badge>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress
              value={watchProgress.percentage}
              className="h-2 transition-all duration-300"
            />
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>{formatTime(watchProgress.watchedDuration)} watched</span>
              <span>{formatTime(watchProgress.totalDuration)} total</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* Resume Button */}
              {showResumePrompt && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResumeVideo}
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  <Play className="mr-1 h-3 w-3" />
                  Resume from {formatTime(watchProgress.watchedDuration)}
                </Button>
              )}

              {/* Reset Progress */}
              {watchProgress.percentage > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetProgress}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <RotateCcw className="mr-1 h-3 w-3" />
                  Start Over
                </Button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {/* Download Button */}
              {fileUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <Download className="mr-1 h-3 w-3" />
                  Download
                </Button>
              )}

              {/* Share Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="text-gray-600 hover:text-gray-800"
              >
                <Share2 className="mr-1 h-3 w-3" />
                Share
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Kibo Video Player */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <VideoPlayer className="aspect-video w-full">
            <VideoPlayerContent
              ref={videoRef}
              crossOrigin=""
              preload="metadata"
              poster={lesson.thumbnailId ? `${lesson.thumbnailId}` : undefined}
              slot="media"
              src={videoSrc}
              onPlay={handlePlay}
              onPause={handlePause}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleEnded}
              onError={handleError}
              onLoadedMetadata={handleLoadedMetadata}
            />

            <VideoPlayerControlBar>
              <VideoPlayerPlayButton />
              <VideoPlayerSeekBackwardButton />
              <VideoPlayerSeekForwardButton />
              <VideoPlayerTimeRange />
              <VideoPlayerTimeDisplay showDuration />
              <VideoPlayerMuteButton />
              <VideoPlayerVolumeRange />
            </VideoPlayerControlBar>
          </VideoPlayer>
        </CardContent>
      </Card>

      {/* Lesson Description */}
      {lesson.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">About This Lesson</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 leading-relaxed text-gray-700 dark:text-gray-300">
              {lesson.description}
            </p>

            {lesson.estimatedDuration && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Clock className="mr-1 h-4 w-4" />
                <span>
                  Estimated duration: {formatTime(lesson.estimatedDuration)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      {(onPrevious || onNext) && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between">
              <div>
                {onPrevious && (
                  <Button variant="outline" onClick={onPrevious}>
                    ← Previous Lesson
                  </Button>
                )}
              </div>
              <div>
                {onNext && (
                  <Button
                    onClick={onNext}
                    disabled={!watchProgress.isCompleted}
                    className={
                      watchProgress.isCompleted
                        ? "bg-green-600 hover:bg-green-700"
                        : ""
                    }
                  >
                    {watchProgress.isCompleted
                      ? "Next Lesson →"
                      : "Complete to Continue →"}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default EnhancedCourseVideoPlayer;
