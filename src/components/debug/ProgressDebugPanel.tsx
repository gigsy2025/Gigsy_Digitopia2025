/**
 * PROGRESS DEBUG PANEL
 *
 * Development-only debug UI component with test controls for manual progress tracking operations.
 * Visible when debug flags are enabled to facilitate testing of progress synchronization
 * between frontend and backend systems.
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-09-21
 */

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Bug,
  Play,
  Pause,
  RotateCcw,
  Save,
  ChevronDown,
  ChevronUp,
  Clock,
  Database,
  Zap,
} from "lucide-react";

interface ProgressDebugPanelProps {
  // Progress hook return values
  progressSeconds: number;
  completed: boolean;
  watchedPercentage: number;
  isLoading: boolean;
  error: string | null;
  isDirty: boolean;
  lastSyncedProgress: any;
  _debug?: {
    lastSyncTime: number;
    syncInterval: number;
    timeSinceLastSync: number;
    canSyncNow: boolean;
  };

  // Progress hook actions
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
  syncProgress: () => Promise<void>;

  // Component props
  lessonId: string;
  userId: string;
  className?: string;
}

/**
 * Development-only Progress Debug Panel
 */
export const ProgressDebugPanel: React.FC<ProgressDebugPanelProps> = ({
  progressSeconds,
  completed,
  watchedPercentage,
  isLoading,
  error,
  isDirty,
  lastSyncedProgress,
  _debug,
  updateProgress,
  markCompleted,
  resetProgress,
  syncProgress,
  lessonId,
  userId,
  className = "",
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [testDuration, setTestDuration] = useState(600); // 10 minutes default
  const [testCurrentTime, setTestCurrentTime] = useState([0]);
  const [autoPlay, setAutoPlay] = useState(false);
  const [playInterval, setPlayInterval] = useState<NodeJS.Timeout | null>(null);

  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  // Check if debug mode is enabled
  const debugEnabled =
    typeof window !== "undefined" &&
    (window.localStorage.getItem("debug-progress") === "true" ||
      window.localStorage.getItem("debug-module") === "true");

  if (!debugEnabled) {
    return (
      <Card className={`border-dashed border-orange-200 ${className}`}>
        <CardContent className="pt-6 text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              localStorage.setItem("debug-progress", "true");
              localStorage.setItem("debug-module", "true");
              window.location.reload();
            }}
          >
            <Bug className="mr-2 h-4 w-4" />
            Enable Progress Debug Mode
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handleTestProgress = (currentTime: number) => {
    updateProgress(currentTime, testDuration, {
      seekEvents: Math.floor(Math.random() * 5),
      pauseEvents: Math.floor(Math.random() * 3),
      playbackSpeed: 1.0,
      totalDuration: testDuration,
    });
  };

  const startAutoPlay = () => {
    if (playInterval) return;

    setAutoPlay(true);
    const interval = setInterval(() => {
      setTestCurrentTime(([current]) => {
        const newTime = Math.min((current ?? 0) + 1, testDuration);
        handleTestProgress(newTime);

        if (newTime >= testDuration) {
          clearInterval(interval);
          setPlayInterval(null);
          setAutoPlay(false);
        }

        return [newTime];
      });
    }, 1000);

    setPlayInterval(interval);
  };

  const stopAutoPlay = () => {
    if (playInterval) {
      clearInterval(playInterval);
      setPlayInterval(null);
    }
    setAutoPlay(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card className={`border-dashed border-orange-200 ${className}`}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <Bug className="h-5 w-5" />
                Progress Debug Panel
                {isDirty && <Badge variant="destructive">Unsaved</Badge>}
                {isLoading && <Badge variant="secondary">Loading</Badge>}
                {error && <Badge variant="destructive">Error</Badge>}
              </CardTitle>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Current State */}
            <div className="space-y-3">
              <h4 className="flex items-center gap-2 font-medium">
                <Database className="h-4 w-4" />
                Current State
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Progress:</strong> {Math.round(watchedPercentage)}%
                </div>
                <div>
                  <strong>Seconds:</strong> {Math.round(progressSeconds)}
                </div>
                <div>
                  <strong>Completed:</strong>{" "}
                  <Badge variant={completed ? "default" : "secondary"}>
                    {completed ? "Yes" : "No"}
                  </Badge>
                </div>
                <div>
                  <strong>Dirty:</strong>{" "}
                  <Badge variant={isDirty ? "destructive" : "default"}>
                    {isDirty ? "Unsaved" : "Synced"}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Debug Info */}
            {_debug && (
              <>
                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 font-medium">
                    <Clock className="h-4 w-4" />
                    Sync Debug Info
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Last Sync:</strong>{" "}
                      {_debug.lastSyncTime
                        ? formatTime(
                            Math.floor(
                              (Date.now() - _debug.lastSyncTime) / 1000,
                            ),
                          ) + " ago"
                        : "Never"}
                    </div>
                    <div>
                      <strong>Sync Interval:</strong>{" "}
                      {_debug.syncInterval / 1000}s
                    </div>
                    <div>
                      <strong>Time Since Sync:</strong>{" "}
                      {formatTime(Math.floor(_debug.timeSinceLastSync / 1000))}
                    </div>
                    <div>
                      <strong>Can Sync Now:</strong>{" "}
                      <Badge
                        variant={_debug.canSyncNow ? "default" : "secondary"}
                      >
                        {_debug.canSyncNow ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Separator />
              </>
            )}

            {/* Test Controls */}
            <div className="space-y-4">
              <h4 className="flex items-center gap-2 font-medium">
                <Zap className="h-4 w-4" />
                Test Controls
              </h4>

              {/* Duration Setting */}
              <div className="space-y-2">
                <Label htmlFor="duration">Test Duration (seconds)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={testDuration}
                  onChange={(e) => setTestDuration(Number(e.target.value))}
                  min={60}
                  max={3600}
                />
              </div>

              {/* Progress Slider */}
              <div className="space-y-2">
                <Label>
                  Test Progress: {formatTime(testCurrentTime[0] ?? 0)} /{" "}
                  {formatTime(testDuration)}
                </Label>
                <Slider
                  value={testCurrentTime}
                  onValueChange={(value) => {
                    setTestCurrentTime(value);
                    handleTestProgress(value[0] ?? 0);
                  }}
                  max={testDuration}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Auto Play Controls */}
              <div className="flex gap-2">
                {!autoPlay ? (
                  <Button onClick={startAutoPlay} size="sm" variant="outline">
                    <Play className="mr-2 h-4 w-4" />
                    Auto Play
                  </Button>
                ) : (
                  <Button onClick={stopAutoPlay} size="sm" variant="outline">
                    <Pause className="mr-2 h-4 w-4" />
                    Stop Auto Play
                  </Button>
                )}

                <Button
                  onClick={() => {
                    setTestCurrentTime([0]);
                    handleTestProgress(0);
                  }}
                  size="sm"
                  variant="outline"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              </div>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button onClick={syncProgress} size="sm" variant="outline">
                <Save className="mr-2 h-4 w-4" />
                Force Sync
              </Button>

              <Button onClick={markCompleted} size="sm" variant="outline">
                <Badge className="mr-2 h-4 w-4" />
                Mark Complete
              </Button>

              <Button onClick={resetProgress} size="sm" variant="outline">
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset Progress
              </Button>

              <Button
                onClick={() => {
                  localStorage.removeItem("debug-progress");
                  localStorage.removeItem("debug-module");
                  window.location.reload();
                }}
                size="sm"
                variant="ghost"
              >
                Disable Debug
              </Button>
            </div>

            {/* Last Synced Data */}
            {lastSyncedProgress && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-medium">Last Synced Progress</h4>
                  <pre className="bg-muted overflow-auto rounded p-2 text-xs">
                    {JSON.stringify(lastSyncedProgress, null, 2)}
                  </pre>
                </div>
              </>
            )}

            {/* Error Display */}
            {error && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-medium text-red-600">Error</h4>
                  <div className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
                    {error}
                  </div>
                </div>
              </>
            )}

            {/* Meta Info */}
            <Separator />
            <div className="text-muted-foreground text-xs">
              <div>Lesson ID: {lessonId}</div>
              <div>User ID: {userId}</div>
              <div>Build: {process.env.NODE_ENV}</div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default ProgressDebugPanel;
