/**
 * LESSON PLAYER COMPONENT
 *
 * Interactive video/content player for lessons with progress tracking,
 * playback controls, and accessibility features.
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-09-20
 */

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/utils/time";
import { useProgress } from "@/hooks/useProgress";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  SkipBack,
  SkipForward,
  RotateCcw,
} from "lucide-react";
import type { LessonWithNavigation, PlayerEvent } from "@/types/course";

interface LessonPlayerProps {
  lesson: LessonWithNavigation;
  userId: string;
  autoPlay?: boolean;
  onProgress?: (event: PlayerEvent) => void;
  onComplete?: () => void;
  onError?: (error: string) => void;
  className?: string;
  watchedPercentage?: number;
}

interface VideoPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  playbackRate: number;
  buffered: number;
  isLoading: boolean;
  error: string | null;
}

/**
 * Video Player Component with full controls
 */
export const LessonPlayer: React.FC<LessonPlayerProps> = ({
  lesson,
  userId,
  autoPlay = false,
  onProgress,
  onComplete,
  onError,
  className,
  watchedPercentage: initialWatchedPercentage,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [state, setState] = useState<VideoPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    isFullscreen: false,
    playbackRate: 1,
    buffered: 0,
    isLoading: true,
    error: null,
  });

  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // Progress tracking hook
  const {
    updateProgress,
    markCompleted,
    progressSeconds,
    completed,
    watchedPercentage,
  } = useProgress({
    lessonId: lesson.id,
    courseId: lesson.courseId,
    userId,
    onComplete,
  });
  const displayWatchedPercentage =
    initialWatchedPercentage ?? watchedPercentage;

  // Video event handlers
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const currentTime = video.currentTime;
    const duration = video.duration;

    setState((prev) => ({
      ...prev,
      currentTime,
      duration: duration || 0,
    }));

    // Update progress (throttled internally)
    updateProgress(currentTime, duration);

    // Fire progress event
    onProgress?.({
      type: "timeupdate",
      currentTime,
      duration,
    });
  }, [updateProgress, onProgress]);

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    setState((prev) => ({
      ...prev,
      duration: video.duration,
      isLoading: false,
    }));

    // Resume from last position
    if (progressSeconds > 0 && progressSeconds < video.duration - 30) {
      video.currentTime = progressSeconds;
    }
  }, [progressSeconds]);

  const handleEnded = useCallback(() => {
    setState((prev) => ({ ...prev, isPlaying: false }));
    void markCompleted();
    onProgress?.({ type: "ended" });
    onComplete?.();
  }, [markCompleted, onProgress, onComplete]);

  const handleError = useCallback(() => {
    const video = videoRef.current;
    const errorMessage = video?.error?.message ?? "Video playback error";

    setState((prev) => ({
      ...prev,
      error: errorMessage,
      isLoading: false,
    }));

    onError?.(errorMessage);
    onProgress?.({ type: "error", error: errorMessage });
  }, [onError, onProgress]);

  // Playback controls
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      void video.play();
      setState((prev) => ({ ...prev, isPlaying: true }));
      onProgress?.({ type: "play", currentTime: video.currentTime });
    } else {
      video.pause();
      setState((prev) => ({ ...prev, isPlaying: false }));
      onProgress?.({ type: "pause", currentTime: video.currentTime });
    }
  }, [onProgress]);

  const seekTo = useCallback(
    (time: number) => {
      const video = videoRef.current;
      if (!video) return;

      video.currentTime = Math.max(0, Math.min(time, video.duration));
      onProgress?.({ type: "timeupdate", currentTime: time });
    },
    [onProgress],
  );

  const skip = useCallback(
    (seconds: number) => {
      const video = videoRef.current;
      if (!video) return;

      const newTime = video.currentTime + seconds;
      seekTo(newTime);
    },
    [seekTo],
  );

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const newMuted = !video.muted;
    video.muted = newMuted;
    setState((prev) => ({ ...prev, isMuted: newMuted }));
  }, []);

  const setVolume = useCallback((volume: number) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = Math.max(0, Math.min(1, volume));
    video.volume = newVolume;
    setState((prev) => ({
      ...prev,
      volume: newVolume,
      isMuted: newVolume === 0,
    }));
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = rate;
    setState((prev) => ({ ...prev, playbackRate: rate }));
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setState((prev) => ({ ...prev, isFullscreen: false }));
      } else {
        await container.requestFullscreen();
        setState((prev) => ({ ...prev, isFullscreen: true }));
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
    }
  }, []);

  // Controls visibility
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);

    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    controlsTimeoutRef.current = setTimeout(() => {
      if (state.isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  }, [state.isPlaying]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target !== document.body) return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          skip(-10);
          break;
        case "ArrowRight":
          e.preventDefault();
          skip(10);
          break;
        case "ArrowUp":
          e.preventDefault();
          setVolume(state.volume + 0.1);
          break;
        case "ArrowDown":
          e.preventDefault();
          setVolume(state.volume - 0.1);
          break;
        case "KeyM":
          e.preventDefault();
          toggleMute();
          break;
        case "KeyF":
          e.preventDefault();
          void toggleFullscreen();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, skip, setVolume, state.volume, toggleMute, toggleFullscreen]);

  // Auto-hide controls
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = () => showControlsTemporarily();
    const handleMouseLeave = () => {
      if (state.isPlaying) {
        setShowControls(false);
      }
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [showControlsTemporarily, state.isPlaying]);

  // Determine video source URL
  const getVideoUrl = () => {
    // Check legacy videoUrl field first
    if (lesson.videoUrl) {
      return lesson.videoUrl;
    }

    // Check if content field contains a video URL
    if (
      lesson.content &&
      (lesson.content.startsWith("http") ||
        lesson.content.startsWith("blob:") ||
        lesson.content.includes("video"))
    ) {
      return lesson.content;
    }

    return null;
  };

  const videoUrl = getVideoUrl();

  if (!videoUrl) {
    return (
      <div className="bg-muted text-muted-foreground flex h-64 items-center justify-center rounded-lg">
        No video available for this lesson
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="bg-muted text-muted-foreground flex h-64 flex-col items-center justify-center rounded-lg">
        <div className="mb-2 text-lg font-medium">Video Error</div>
        <div className="text-sm">{state.error}</div>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "group relative aspect-video w-full overflow-hidden rounded-lg bg-black",
        className,
      )}
      onMouseMove={showControlsTemporarily}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={videoUrl ?? undefined}
        className="h-full w-full"
        autoPlay={autoPlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={handleError}
        onPlay={() => setState((prev) => ({ ...prev, isPlaying: true }))}
        onPause={() => setState((prev) => ({ ...prev, isPlaying: false }))}
        preload="metadata"
        playsInline
        data-testid="lesson-video"
      />

      {/* Loading Overlay */}
      {state.isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
        </div>
      )}

      {/* Click to Play Overlay */}
      {!state.isPlaying && !state.isLoading && (
        <div
          className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/20"
          onClick={togglePlay}
        >
          <Button
            size="lg"
            className="h-16 w-16 rounded-full bg-white/90 p-0 text-black hover:bg-white"
          >
            <Play className="h-8 w-8" />
          </Button>
        </div>
      )}

      {/* Controls */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0",
        )}
      >
        {/* Progress Bar */}
        <div className="mb-4 space-y-2">
          <Slider
            value={[state.currentTime]}
            max={state.duration}
            step={0.1}
            onValueChange={(value: number[]) => seekTo(value[0] ?? 0)}
            className="w-full"
          />
          <div className="flex items-center justify-between text-xs text-white">
            <span>{formatDuration(state.currentTime, "minimal")}</span>
            <span>{formatDuration(state.duration, "minimal")}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlay}
              className="h-10 w-10 p-0 text-white hover:bg-white/20"
            title={state.isPlaying ? "Pause" : "Play"}
            >
              {state.isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => skip(-10)}
              className="h-8 w-8 p-0 text-white hover:bg-white/20"
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => skip(10)}
              className="h-8 w-8 p-0 text-white hover:bg-white/20"
            >
              <SkipForward className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
              >
                {state.isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>

              <Slider
                value={[state.isMuted ? 0 : state.volume]}
                max={1}
                step={0.01}
                onValueChange={(value: number[]) => setVolume(value[0] ?? 0)}
                className="w-20"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={state.playbackRate}
              onChange={(e) => setPlaybackRate(Number(e.target.value))}
              className="rounded bg-white/20 px-2 py-1 text-xs text-white"
            >
              <option value={0.5}>0.5x</option>
              <option value={0.75}>0.75x</option>
              <option value={1}>1x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2x</option>
            </select>

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="h-8 w-8 p-0 text-white hover:bg-white/20"
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      {displayWatchedPercentage > 0 && (
        <div className="absolute top-4 right-4">
          <div className="rounded-full bg-black/50 px-2 py-1 text-xs text-white">
            {Math.round(displayWatchedPercentage)}% watched
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonPlayer;
