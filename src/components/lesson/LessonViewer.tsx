/**
 * LESSON VIEWER COMPONENT
 *
 * Content viewer for text-based lessons with reading progress tracking,
 * typography enhancements, and accessibility features.
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-09-20
 */

"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useProgress } from "@/hooks/useProgress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, CheckCircle2, BookOpen } from "lucide-react";
import type { LessonWithNavigation, PlayerEvent } from "@/types/course";

interface LessonViewerProps {
  lesson: LessonWithNavigation;
  userId: string;
  onProgress?: (event: PlayerEvent) => void;
  onComplete?: () => void;
  className?: string;
}

/**
 * Text Content Viewer with reading progress tracking
 */
export const LessonViewer: React.FC<LessonViewerProps> = ({
  lesson,
  userId,
  onProgress,
  onComplete,
  className,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const readingTimeRef = useRef(0);

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

  // Calculate estimated reading time (average 200 words per minute)
  const calculateReadingTime = useCallback((text: string): number => {
    const wordCount = text
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
    return Math.ceil(wordCount / 200); // minutes
  }, []);

  // Track reading progress based on scroll position
  const trackReadingProgress = useCallback(() => {
    const content = contentRef.current;
    if (!content) return;

    const scrollTop = content.scrollTop;
    const scrollHeight = content.scrollHeight;
    const clientHeight = content.clientHeight;

    const scrollPercentage =
      scrollHeight > clientHeight
        ? (scrollTop / (scrollHeight - clientHeight)) * 100
        : 100;

    const progressSeconds = Math.floor(
      (scrollPercentage / 100) * estimatedReadingSeconds,
    );

    // Update progress
    updateProgress(progressSeconds, estimatedReadingSeconds);

    // Fire progress event
    onProgress?.({
      type: "timeupdate",
      currentTime: progressSeconds,
      duration: estimatedReadingSeconds,
    });

    // Auto-complete when reaching 90% scroll
    if (scrollPercentage >= 90 && !completed) {
      void markCompleted();
      onProgress?.({ type: "ended" });
      onComplete?.();
    }
  }, [updateProgress, markCompleted, onProgress, onComplete, completed]);

  // Reading time tracking
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      readingTimeRef.current = Math.floor((Date.now() - startTime) / 1000);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Scroll tracking
  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const handleScroll = () => trackReadingProgress();

    content.addEventListener("scroll", handleScroll);

    // Initial progress check
    trackReadingProgress();

    return () => content.removeEventListener("scroll", handleScroll);
  }, [trackReadingProgress]);

  // Intersection observer for section visibility
  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Track which sections are being read
            const sectionId = entry.target.getAttribute("data-section");
            if (sectionId) {
              onProgress?.({
                type: "timeupdate",
                section: sectionId,
              } as any);
            }
          }
        });
      },
      { threshold: 0.5 },
    );

    // Observe all sections
    const sections = content.querySelectorAll("[data-section]");
    sections.forEach((section) => observerRef.current?.observe(section));

    return () => observerRef.current?.disconnect();
  }, [onProgress]);

  // Get content for display - prioritize contentHtml, fallback to content
  const getDisplayContent = () => {
    if (lesson.contentHtml) {
      return lesson.contentHtml;
    }

    if (
      lesson.content &&
      !lesson.content.startsWith("http") &&
      !lesson.content.includes("video")
    ) {
      // Assume it's text content, wrap in basic HTML if needed
      return lesson.content.includes("<")
        ? lesson.content
        : `<p>${lesson.content}</p>`;
    }

    return null;
  };

  const displayContent = getDisplayContent();

  const estimatedReadingTime = displayContent
    ? calculateReadingTime(displayContent.replace(/<[^>]*>/g, ""))
    : 0;

  const estimatedReadingSeconds = estimatedReadingTime * 60;

  if (!displayContent) {
    return (
      <div
        className={cn(
          "bg-muted text-muted-foreground flex h-64 flex-col items-center justify-center rounded-lg",
          className,
        )}
      >
        <BookOpen className="mb-2 h-8 w-8" />
        <div className="text-lg font-medium">No content available</div>
        <div className="text-sm">
          This lesson doesn&apos;t have text content to display.
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with lesson info */}
      <div className="bg-card flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">{lesson.title}</h1>
          <div className="text-muted-foreground flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{estimatedReadingTime} min read</span>
            </div>
            {completed && (
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Completed
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-muted-foreground text-right text-sm">
            Progress: {Math.round(watchedPercentage)}%
          </div>
          <Progress value={watchedPercentage} className="w-32" />
        </div>
      </div>

      {/* Content viewer */}
      <div
        ref={contentRef}
        className={cn(
          "prose prose-slate dark:prose-invert max-w-none",
          "bg-card max-h-[70vh] overflow-y-auto rounded-lg border p-6",
          "prose-headings:scroll-mt-4 prose-headings:font-semibold",
          "prose-p:leading-relaxed prose-p:text-foreground",
          "prose-a:text-primary prose-a:underline-offset-4",
          "prose-strong:text-foreground prose-code:text-foreground",
          "prose-pre:bg-muted prose-pre:border",
          "prose-blockquote:border-l-4 prose-blockquote:border-primary",
          "prose-img:rounded-lg prose-img:border",
        )}
      >
        <div
          dangerouslySetInnerHTML={{ __html: displayContent ?? "" }}
          className="space-y-4"
        />
      </div>

      {/* Quick actions */}
      <div className="bg-card flex items-center justify-between rounded-lg border p-4">
        <div className="text-muted-foreground text-sm">
          Reading time: {Math.floor(readingTimeRef.current / 60)}m{" "}
          {readingTimeRef.current % 60}s
        </div>

        <div className="flex gap-2">
          {!completed && (
            <Button
              onClick={() => {
                void markCompleted();
                onComplete?.();
              }}
              variant="outline"
              size="sm"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Mark Complete
            </Button>
          )}

          <Button
            onClick={() => {
              const content = contentRef.current;
              if (content) {
                content.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            variant="ghost"
            size="sm"
          >
            Back to Top
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LessonViewer;
