/**
 * KIBO VIDEO PLAYER EXAMPLES
 *
 * Comprehensive examples demonstrating best practices for implementing
 * the media-chrome based Kibo Video Player in different scenarios.
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-09-16
 */

"use client";

import React, { useRef, useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// =============================================================================
// BASIC VIDEO PLAYER EXAMPLE
// =============================================================================

export function BasicVideoExample() {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Basic Video Player</CardTitle>
      </CardHeader>
      <CardContent>
        <VideoPlayer className="overflow-hidden rounded-lg border">
          <VideoPlayerContent
            crossOrigin=""
            muted
            preload="auto"
            slot="media"
            src="https://stream.mux.com/DS00Spx1CV902MCtPj5WknGlR102V5HFkDe/high.mp4"
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
  );
}

// =============================================================================
// ADVANCED VIDEO PLAYER WITH EVENTS
// =============================================================================

export function AdvancedVideoExample() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  const handlePlay = () => {
    setIsPlaying(true);
    toast.success("Video started playing");
  };

  const handlePause = () => {
    setIsPlaying(false);
    toast.info("Video paused");
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleVolumeChange = () => {
    if (videoRef.current) {
      setVolume(videoRef.current.volume);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full max-w-2xl space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Advanced Video Player with Events</CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant={isPlaying ? "default" : "secondary"}>
                {isPlaying ? "Playing" : "Paused"}
              </Badge>
              <Badge variant="outline">
                Volume: {Math.round(volume * 100)}%
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Video Player */}
          <VideoPlayer className="overflow-hidden rounded-lg border">
            <VideoPlayerContent
              ref={videoRef}
              crossOrigin=""
              preload="metadata"
              slot="media"
              src="https://stream.mux.com/DS00Spx1CV902MCtPj5WknGlR102V5HFkDe/high.mp4"
              onPlay={handlePlay}
              onPause={handlePause}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onVolumeChange={handleVolumeChange}
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

          {/* Video Stats */}
          <div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Current Time
              </p>
              <p className="font-medium">{formatTime(currentTime)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Duration
              </p>
              <p className="font-medium">{formatTime(duration)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Progress
              </p>
              <p className="font-medium">
                {duration > 0 ? Math.round((currentTime / duration) * 100) : 0}%
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
              <p className="font-medium">{isPlaying ? "Playing" : "Paused"}</p>
            </div>
          </div>

          {/* Custom Controls */}
          <div className="flex items-center justify-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.currentTime = 0;
                }
              }}
            >
              Restart
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.currentTime += 15;
                }
              }}
            >
              Skip +15s
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.playbackRate = 1.5;
                }
              }}
            >
              1.5x Speed
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.playbackRate = 1;
                }
              }}
            >
              Normal Speed
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================================================
// RESPONSIVE VIDEO PLAYER
// =============================================================================

export function ResponsiveVideoExample() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Responsive Video Player</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Main Video */}
          <div className="space-y-4">
            <VideoPlayer className="overflow-hidden rounded-lg border">
              <VideoPlayerContent
                crossOrigin=""
                preload="metadata"
                slot="media"
                src="https://stream.mux.com/DS00Spx1CV902MCtPj5WknGlR102V5HFkDe/high.mp4"
              />
              <VideoPlayerControlBar>
                <VideoPlayerPlayButton />
                <VideoPlayerTimeRange />
                <VideoPlayerTimeDisplay showDuration />
                <VideoPlayerMuteButton />
                <VideoPlayerVolumeRange />
              </VideoPlayerControlBar>
            </VideoPlayer>
          </div>

          {/* Compact Video */}
          <div className="space-y-4">
            <h3 className="font-semibold">Compact Version</h3>
            <VideoPlayer className="aspect-video overflow-hidden rounded-lg border">
              <VideoPlayerContent
                crossOrigin=""
                muted
                preload="metadata"
                slot="media"
                src="https://stream.mux.com/DS00Spx1CV902MCtPj5WknGlR102V5HFkDe/high.mp4"
              />
              <VideoPlayerControlBar>
                <VideoPlayerPlayButton />
                <VideoPlayerTimeRange />
                <VideoPlayerMuteButton />
              </VideoPlayerControlBar>
            </VideoPlayer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// COURSE LESSON VIDEO EXAMPLE
// =============================================================================

export function CourseLessonVideoExample() {
  const [watchProgress, setWatchProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const progress =
        (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setWatchProgress(progress);

      // Mark as completed at 95%
      if (progress >= 95 && !isCompleted) {
        setIsCompleted(true);
        toast.success("🎉 Lesson completed!");
      }
    }
  };

  const handleMarkComplete = () => {
    setIsCompleted(true);
    setWatchProgress(100);
    toast.success("Lesson marked as complete!");
  };

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Introduction to React Hooks</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant={isCompleted ? "default" : "secondary"}>
              {isCompleted
                ? "Completed"
                : `${Math.round(watchProgress)}% Complete`}
            </Badge>
            <Badge variant="outline">5:32 duration</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Video Player */}
        <VideoPlayer className="overflow-hidden rounded-lg border">
          <VideoPlayerContent
            ref={videoRef}
            crossOrigin=""
            preload="metadata"
            slot="media"
            src="https://stream.mux.com/DS00Spx1CV902MCtPj5WknGlR102V5HFkDe/high.mp4"
            onTimeUpdate={handleTimeUpdate}
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

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Progress</span>
            <span>{Math.round(watchProgress)}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-2 rounded-full bg-blue-600 transition-all duration-300"
              style={{ width: `${watchProgress}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t pt-4">
          <div className="space-x-2">
            <Button variant="outline" size="sm">
              ← Previous Lesson
            </Button>
          </div>
          <div className="space-x-2">
            {!isCompleted && (
              <Button variant="outline" size="sm" onClick={handleMarkComplete}>
                Mark Complete
              </Button>
            )}
            <Button
              size="sm"
              disabled={!isCompleted}
              className={isCompleted ? "bg-green-600 hover:bg-green-700" : ""}
            >
              Next Lesson →
            </Button>
          </div>
        </div>

        {/* Lesson Description */}
        <div className="border-t pt-4">
          <h4 className="mb-2 font-medium">About this lesson</h4>
          <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            Learn the fundamentals of React Hooks including useState, useEffect,
            and custom hooks. This lesson covers practical examples and best
            practices for modern React development.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// EXAMPLE SHOWCASE COMPONENT
// =============================================================================

export function KiboVideoPlayerExamples() {
  const [activeExample, setActiveExample] = useState<string>("basic");

  const examples = [
    { id: "basic", label: "Basic Player", component: BasicVideoExample },
    {
      id: "advanced",
      label: "Advanced with Events",
      component: AdvancedVideoExample,
    },
    {
      id: "responsive",
      label: "Responsive Layout",
      component: ResponsiveVideoExample,
    },
    {
      id: "course",
      label: "Course Lesson",
      component: CourseLessonVideoExample,
    },
  ];

  const ActiveComponent =
    examples.find((ex) => ex.id === activeExample)?.component ||
    BasicVideoExample;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Kibo Video Player Examples</CardTitle>
          <p className="text-gray-600 dark:text-gray-400">
            Choose an example to see different implementations of the Kibo Video
            Player
          </p>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-wrap gap-2">
            {examples.map((example) => (
              <Button
                key={example.id}
                variant={activeExample === example.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveExample(example.id)}
              >
                {example.label}
              </Button>
            ))}
          </div>

          <div className="flex justify-center">
            <ActiveComponent />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default KiboVideoPlayerExamples;
