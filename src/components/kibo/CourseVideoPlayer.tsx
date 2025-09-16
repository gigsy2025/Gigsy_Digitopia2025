/**
 * COURSE VIDEO PLAYER - ENHANCED
 *
 * Next-generation course video player built on media-chrome foundation
 * with comprehensive progress tracking, analytics, and learning features.
 * Replaces custom KiboVideoPlayer with web standards-based solution.
 *
 * @author Principal Engineer
 * @version 2.0.0
 * @since 2025-01-20
 */

"use client";

import React from "react";
import type { Id } from "convex/_generated/dataModel";
import type { CourseLesson } from "@/types/courses";
import { EnhancedCourseVideoPlayer } from "./EnhancedCourseVideoPlayer";

// =============================================================================
// LEGACY COMPATIBILITY WRAPPER
// =============================================================================

interface CourseVideoPlayerProps {
  lesson: CourseLesson;
  courseId: Id<"courses">;
  moduleId: Id<"modules">;
  currentProgress?: number;
  isCompleted?: boolean;
  onProgressUpdate?: (progress: number) => void;
  onComplete?: () => void;
  className?: string;
}

/**
 * CourseVideoPlayer - Legacy Compatibility Wrapper
 *
 * This component maintains backward compatibility while leveraging
 * the enhanced video player implementation built on media-chrome.
 * All new features are available through the enhanced version.
 */
export function CourseVideoPlayer(props: CourseVideoPlayerProps) {
  return <EnhancedCourseVideoPlayer {...props} />;
}

export default CourseVideoPlayer;
