/**
 * MODULE LIST COMPONENT
 *
 * Displays course modules with lessons in an accordion layout.
 * Supports progress tracking, lesson navigation, and responsive design.
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-09-20
 */

"use client";

import React from "react";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/utils/time";
import {
  PlayCircle,
  FileText,
  Clock,
  CheckCircle,
  Lock,
  Download,
  Eye,
} from "lucide-react";
import type { Module, Lesson } from "@/types/course";

interface ModuleListProps {
  modules: Module[];
  courseId: string;
  currentLessonId?: string;
  userProgress?: Record<string, number>; // lessonId -> progress percentage
  completedLessons?: string[];
  isEnrolled?: boolean;
  className?: string;
  onLessonSelect?: (lessonId: string) => void;
}

interface LessonCardProps {
  lesson: Lesson;
  courseId: string;
  moduleId: string;
  isActive?: boolean;
  isCompleted?: boolean;
  progress?: number;
  isEnrolled?: boolean;
  canAccess?: boolean;
  onSelect?: (lessonId: string) => void;
}

/**
 * Individual lesson card component
 */
const LessonCard: React.FC<LessonCardProps> = ({
  lesson,
  courseId,
  moduleId,
  isActive = false,
  isCompleted = false,
  progress = 0,
  isEnrolled = false,
  canAccess = true,
  onSelect,
}) => {
  const hasVideo = Boolean(lesson.videoUrl);
  const hasContent = Boolean(lesson.contentHtml);
  const isLocked = lesson.isLocked && !isEnrolled && !lesson.isFree;
  const canView =
    canAccess && (isEnrolled ?? lesson.isFree ?? !lesson.isLocked);

  const handleClick = () => {
    if (canView) {
      onSelect?.(lesson.id);
    }
  };

  // Enhanced routing with hierarchical structure: /courses/[courseId]/modules/[moduleId]/lessons/[lessonId]
  const lessonHref = `/app/courses/${courseId}/modules/${moduleId}/lessons/${lesson.id}`;

  return canView ? (
    <Link href={lessonHref}>
      <div
        className={cn(
          "group flex items-center gap-4 rounded-lg border p-4 transition-all duration-200",
          "hover:bg-muted/50 hover:shadow-sm",
          isActive && "border-primary bg-primary/5 shadow-sm",
          "cursor-pointer",
        )}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-current={isActive ? "page" : undefined}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        {/* Status Icon */}
        <div className="flex-shrink-0">
          {isLocked ? (
            <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-full">
              <Lock className="text-muted-foreground h-4 w-4" />
            </div>
          ) : isCompleted ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          ) : hasVideo ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
              <PlayCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </div>
          )}
        </div>

        {/* Lesson Info */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h4
              className={cn(
                "leading-tight font-medium",
                isActive && "text-primary",
              )}
            >
              {lesson.title}
            </h4>

            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              {lesson.isFree && !isEnrolled && (
                <Badge variant="secondary" className="text-xs">
                  <Eye className="mr-1 h-3 w-3" />
                  Preview
                </Badge>
              )}

              {lesson.durationSeconds && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatDuration(lesson.durationSeconds, "short")}</span>
                </div>
              )}
            </div>
          </div>

          {lesson.description && (
            <p className="text-muted-foreground line-clamp-2 text-sm">
              {lesson.description}
            </p>
          )}

          {/* Progress Bar */}
          {isEnrolled && progress > 0 && !isCompleted && (
            <div className="mt-2">
              <Progress value={progress} className="h-1" />
            </div>
          )}

          {/* Resources */}
          {lesson.resources && lesson.resources.length > 0 && (
            <div className="text-muted-foreground flex items-center gap-1 text-xs">
              <Download className="h-3 w-3" />
              <span>
                {lesson.resources.length} resource
                {lesson.resources.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>

        {/* Sequence Number */}
        <div className="text-muted-foreground flex-shrink-0 text-sm font-medium">
          {lesson.sequenceIndex + 1}
        </div>
      </div>
    </Link>
  ) : (
    <div
      className={cn(
        "group flex items-center gap-4 rounded-lg border p-4 transition-all duration-200",
        "cursor-not-allowed opacity-60",
      )}
      role="button"
      tabIndex={-1}
    >
      {/* Same content as above for locked lessons */}
      <div className="flex-shrink-0">
        <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-full">
          <Lock className="text-muted-foreground h-4 w-4" />
        </div>
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-muted-foreground leading-tight font-medium">
            {lesson.title}
          </h4>
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            {lesson.durationSeconds && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{formatDuration(lesson.durationSeconds, "short")}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="text-muted-foreground flex-shrink-0 text-sm font-medium">
        {lesson.sequenceIndex + 1}
      </div>
    </div>
  );
};

/**
 * Main ModuleList component
 */
export const ModuleList: React.FC<ModuleListProps> = ({
  modules,
  courseId,
  currentLessonId,
  userProgress = {},
  completedLessons = [],
  isEnrolled = false,
  className,
  onLessonSelect,
}) => {
  // Calculate module progress
  const getModuleProgress = (module: Module) => {
    if (!isEnrolled || module.lessons.length === 0) return 0;

    const completedCount = module.lessons.filter((lesson) =>
      completedLessons.includes(lesson.id),
    ).length;

    return (completedCount / module.lessons.length) * 100;
  };

  // Find current lesson's module for default expansion
  const currentModule = modules.find((module) =>
    module.lessons.some((lesson) => lesson.id === currentLessonId),
  );

  const defaultValue = currentModule?.id;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Course Content</h2>
        <div className="text-muted-foreground text-sm">
          {modules.length} module{modules.length !== 1 ? "s" : ""} •{" "}
          {modules.reduce((total, module) => total + module.lessons.length, 0)}{" "}
          lessons
        </div>
      </div>

      <Accordion
        type="single"
        collapsible
        className="w-full space-y-2"
        defaultValue={defaultValue}
      >
        {modules.map((module, moduleIndex) => {
          const moduleProgress = getModuleProgress(module);
          const isModuleCompleted = moduleProgress === 100;
          const hasAccessibleLessons = module.lessons.some(
            (lesson) => isEnrolled || lesson.isFree || !lesson.isLocked,
          );

          return (
            <AccordionItem
              key={module.id}
              value={module.id}
              className="bg-card rounded-lg border"
            >
              <AccordionTrigger className="px-6 py-4 text-left hover:no-underline">
                <div className="flex w-full items-center justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold">
                        {moduleIndex + 1}
                      </span>

                      <h3 className="leading-tight font-semibold">
                        {module.title}
                      </h3>

                      {isModuleCompleted && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                    </div>

                    {module.description && (
                      <p className="text-muted-foreground ml-11 line-clamp-1 text-sm">
                        {module.description}
                      </p>
                    )}
                  </div>

                  <div className="text-muted-foreground flex items-center gap-4 text-sm">
                    <span>
                      {module.lessons.length} lesson
                      {module.lessons.length !== 1 ? "s" : ""}
                    </span>

                    {module.durationSeconds && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>
                          {formatDuration(module.durationSeconds, "short")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-6 pb-4">
                {/* Module Progress */}
                {isEnrolled && moduleProgress > 0 && (
                  <div className="mb-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">
                        {Math.round(moduleProgress)}%
                      </span>
                    </div>
                    <Progress value={moduleProgress} className="h-2" />
                  </div>
                )}

                {/* Lessons */}
                <div className="space-y-2">
                  {module.lessons.map((lesson) => {
                    const isActive = lesson.id === currentLessonId;
                    const isCompleted = completedLessons.includes(lesson.id);
                    const progress = userProgress[lesson.id] ?? 0;
                    const canAccess = hasAccessibleLessons;

                    return (
                      <LessonCard
                        key={lesson.id}
                        lesson={lesson}
                        courseId={courseId}
                        moduleId={module.id}
                        isActive={isActive}
                        isCompleted={isCompleted}
                        progress={progress}
                        isEnrolled={isEnrolled}
                        canAccess={canAccess}
                        onSelect={onLessonSelect}
                      />
                    );
                  })}
                </div>

                {/* Module completion message */}
                {isModuleCompleted && (
                  <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <CheckCircle className="h-4 w-4" />
                      Module completed! Great job!
                    </div>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* Overall Progress Summary */}
      {isEnrolled && completedLessons.length > 0 && (
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Your Progress</h3>
              <p className="text-muted-foreground text-sm">
                {completedLessons.length} of{" "}
                {modules.reduce(
                  (total, module) => total + module.lessons.length,
                  0,
                )}{" "}
                lessons completed
              </p>
            </div>
            <div className="text-right">
              <div className="text-primary text-2xl font-bold">
                {Math.round(
                  (completedLessons.length /
                    modules.reduce(
                      (total, module) => total + module.lessons.length,
                      0,
                    )) *
                    100,
                )}
                %
              </div>
              <div className="text-muted-foreground text-sm">Complete</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModuleList;
