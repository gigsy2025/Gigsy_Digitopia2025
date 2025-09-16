/**
 * KIBO VIDEO PLAYER UTILITIES
 *
 * Utility functions and hooks to simplify Kibo Video Player integration
 * throughout the Gigsy platform with consistent behavior and best practices.
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-09-16
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import type { Id } from "convex/_generated/dataModel";

// =============================================================================
// TYPES
// =============================================================================

export interface VideoPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isLoading: boolean;
  error: string | null;
  progress: number;
}

export interface VideoAnalytics {
  videoId: string;
  sessionId: string;
  startTime: number;
  endTime?: number;
  totalWatchTime: number;
  completionRate: number;
  seekEvents: number;
  pauseEvents: number;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Format time in MM:SS or HH:MM:SS format
 */
export function formatVideoTime(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds)) return "0:00";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Calculate video progress percentage
 */
export function calculateProgress(
  currentTime: number,
  duration: number,
): number {
  if (!duration || duration === 0) return 0;
  return Math.min((currentTime / duration) * 100, 100);
}

/**
 * Determine if video source is from Convex storage
 */
export function isConvexVideo(src: string): boolean {
  return src.includes("_storage") || src.includes("convex");
}

/**
 * Generate a unique session ID for analytics
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Throttle function to limit API calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;

  return (...args: Parameters<T>) => {
    const currentTime = Date.now();

    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(
        () => {
          func(...args);
          lastExecTime = Date.now();
        },
        delay - (currentTime - lastExecTime),
      );
    }
  };
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook for managing video player state
 */
export function useVideoPlayer(videoRef: React.RefObject<HTMLVideoElement>) {
  const [state, setState] = useState<VideoPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    isLoading: true,
    error: null,
    progress: 0,
  });

  const updateState = useCallback((updates: Partial<VideoPlayerState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      updateState({
        duration: videoRef.current.duration,
        isLoading: false,
        error: null,
      });
    }
  }, [videoRef, updateState]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      const duration = videoRef.current.duration;
      const progress = calculateProgress(currentTime, duration);

      updateState({
        currentTime,
        progress,
      });
    }
  }, [videoRef, updateState]);

  const handlePlay = useCallback(() => {
    updateState({ isPlaying: true });
  }, [updateState]);

  const handlePause = useCallback(() => {
    updateState({ isPlaying: false });
  }, [updateState]);

  const handleVolumeChange = useCallback(() => {
    if (videoRef.current) {
      updateState({
        volume: videoRef.current.volume,
        isMuted: videoRef.current.muted,
      });
    }
  }, [videoRef, updateState]);

  const handleError = useCallback(() => {
    updateState({
      error: "Failed to load video",
      isLoading: false,
    });
  }, [updateState]);

  const handleLoadStart = useCallback(() => {
    updateState({ isLoading: true });
  }, [updateState]);

  return {
    state,
    handlers: {
      onLoadedMetadata: handleLoadedMetadata,
      onTimeUpdate: handleTimeUpdate,
      onPlay: handlePlay,
      onPause: handlePause,
      onVolumeChange: handleVolumeChange,
      onError: handleError,
      onLoadStart: handleLoadStart,
    },
  };
}

/**
 * Hook for video progress tracking with automatic saving
 */
export function useVideoProgress(
  videoId: string,
  onProgressSave?: (progress: number) => Promise<void>,
) {
  const [lastSaveTime, setLastSaveTime] = useState(0);
  const saveIntervalRef = useRef<NodeJS.Timeout>();

  const saveProgress = useCallback(
    throttle(async (progress: number) => {
      if (onProgressSave) {
        try {
          await onProgressSave(progress);
          setLastSaveTime(Date.now());
        } catch (error) {
          console.error("Failed to save video progress:", error);
          toast.error("Failed to save progress");
        }
      }
    }, 5000),
    [onProgressSave],
  );

  const handleProgressUpdate = useCallback(
    (currentTime: number, duration: number) => {
      const progress = calculateProgress(currentTime, duration);
      saveProgress(progress);
    },
    [saveProgress],
  );

  useEffect(() => {
    return () => {
      if (saveIntervalRef.current) {
        clearTimeout(saveIntervalRef.current);
      }
    };
  }, []);

  return {
    handleProgressUpdate,
    lastSaveTime,
  };
}

/**
 * Hook for video analytics tracking
 */
export function useVideoAnalytics(videoId: string) {
  const [analytics, setAnalytics] = useState<VideoAnalytics>({
    videoId,
    sessionId: generateSessionId(),
    startTime: Date.now(),
    totalWatchTime: 0,
    completionRate: 0,
    seekEvents: 0,
    pauseEvents: 0,
  });

  const trackEvent = useCallback(
    (eventType: string, data?: any) => {
      console.log(`Video Analytics: ${eventType}`, { videoId, data });

      // Update analytics based on event type
      setAnalytics((prev) => {
        switch (eventType) {
          case "seek":
            return { ...prev, seekEvents: prev.seekEvents + 1 };
          case "pause":
            return { ...prev, pauseEvents: prev.pauseEvents + 1 };
          case "ended":
            return {
              ...prev,
              endTime: Date.now(),
              completionRate: 100,
            };
          default:
            return prev;
        }
      });
    },
    [videoId],
  );

  const updateWatchTime = useCallback((currentTime: number) => {
    setAnalytics((prev) => ({
      ...prev,
      totalWatchTime: Math.max(prev.totalWatchTime, currentTime),
    }));
  }, []);

  return {
    analytics,
    trackEvent,
    updateWatchTime,
  };
}

/**
 * Hook for video playback controls
 */
export function useVideoControls(videoRef: React.RefObject<HTMLVideoElement>) {
  const play = useCallback(async () => {
    if (videoRef.current) {
      try {
        await videoRef.current.play();
      } catch (error) {
        console.error("Failed to play video:", error);
        toast.error("Failed to play video");
      }
    }
  }, [videoRef]);

  const pause = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
  }, [videoRef]);

  const seek = useCallback(
    (time: number) => {
      if (videoRef.current) {
        videoRef.current.currentTime = time;
      }
    },
    [videoRef],
  );

  const setVolume = useCallback(
    (volume: number) => {
      if (videoRef.current) {
        videoRef.current.volume = Math.max(0, Math.min(1, volume));
      }
    },
    [videoRef],
  );

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
    }
  }, [videoRef]);

  const setPlaybackRate = useCallback(
    (rate: number) => {
      if (videoRef.current) {
        videoRef.current.playbackRate = rate;
      }
    },
    [videoRef],
  );

  const skipForward = useCallback(
    (seconds: number = 10) => {
      if (videoRef.current) {
        const newTime = Math.min(
          videoRef.current.currentTime + seconds,
          videoRef.current.duration,
        );
        videoRef.current.currentTime = newTime;
      }
    },
    [videoRef],
  );

  const skipBackward = useCallback(
    (seconds: number = 10) => {
      if (videoRef.current) {
        const newTime = Math.max(videoRef.current.currentTime - seconds, 0);
        videoRef.current.currentTime = newTime;
      }
    },
    [videoRef],
  );

  return {
    play,
    pause,
    seek,
    setVolume,
    toggleMute,
    setPlaybackRate,
    skipForward,
    skipBackward,
  };
}

/**
 * Hook for keyboard shortcuts
 */
export function useVideoKeyboardShortcuts(
  videoRef: React.RefObject<HTMLVideoElement>,
  containerRef?: React.RefObject<HTMLElement>,
) {
  const controls = useVideoControls(videoRef);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only handle shortcuts when video container is focused
      if (
        containerRef?.current &&
        !containerRef.current.contains(document.activeElement)
      ) {
        return;
      }

      switch (event.code) {
        case "Space":
          event.preventDefault();
          if (videoRef.current?.paused) {
            controls.play();
          } else {
            controls.pause();
          }
          break;
        case "ArrowLeft":
          event.preventDefault();
          controls.skipBackward();
          break;
        case "ArrowRight":
          event.preventDefault();
          controls.skipForward();
          break;
        case "ArrowUp":
          event.preventDefault();
          if (videoRef.current) {
            controls.setVolume(videoRef.current.volume + 0.1);
          }
          break;
        case "ArrowDown":
          event.preventDefault();
          if (videoRef.current) {
            controls.setVolume(videoRef.current.volume - 0.1);
          }
          break;
        case "KeyM":
          event.preventDefault();
          controls.toggleMute();
          break;
        case "KeyF":
          event.preventDefault();
          if (videoRef.current) {
            if (document.fullscreenElement) {
              document.exitFullscreen();
            } else {
              videoRef.current.requestFullscreen();
            }
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [videoRef, containerRef, controls]);

  return controls;
}

/**
 * Hook for video resume functionality
 */
export function useVideoResume(
  videoRef: React.RefObject<HTMLVideoElement>,
  savedProgress: number = 0,
) {
  const [showResumePrompt, setShowResumePrompt] = useState(false);

  useEffect(() => {
    if (savedProgress > 30 && videoRef.current) {
      setShowResumePrompt(true);
    }
  }, [savedProgress, videoRef]);

  const handleResume = useCallback(() => {
    if (videoRef.current && savedProgress > 0) {
      videoRef.current.currentTime = savedProgress;
      setShowResumePrompt(false);
      toast.success(`Resumed from ${formatVideoTime(savedProgress)}`);
    }
  }, [videoRef, savedProgress]);

  const handleStartFromBeginning = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setShowResumePrompt(false);
    }
  }, [videoRef]);

  return {
    showResumePrompt,
    handleResume,
    handleStartFromBeginning,
    dismissPrompt: () => setShowResumePrompt(false),
  };
}

// =============================================================================
// COMPONENT HELPERS
// =============================================================================

/**
 * Generate video player props with common defaults
 */
export function getVideoPlayerProps(overrides: any = {}) {
  return {
    crossOrigin: "" as const,
    preload: "metadata" as const,
    slot: "media" as const,
    ...overrides,
  };
}

/**
 * Generate responsive video player classes
 */
export function getVideoPlayerClasses(
  aspectRatio: "16:9" | "4:3" | "1:1" = "16:9",
  additionalClasses: string = "",
) {
  const aspectClass = {
    "16:9": "aspect-video",
    "4:3": "aspect-[4/3]",
    "1:1": "aspect-square",
  }[aspectRatio];

  return `overflow-hidden rounded-lg border ${aspectClass} ${additionalClasses}`.trim();
}

export default {
  formatVideoTime,
  calculateProgress,
  isConvexVideo,
  generateSessionId,
  throttle,
  useVideoPlayer,
  useVideoProgress,
  useVideoAnalytics,
  useVideoControls,
  useVideoKeyboardShortcuts,
  useVideoResume,
  getVideoPlayerProps,
  getVideoPlayerClasses,
};
