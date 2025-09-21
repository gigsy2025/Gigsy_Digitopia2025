/**
 * LESSON SIDEBAR COMPONENT
 *
 * Sticky sidebar for lesson navigation, resources, and supplementary content.
 * Responsive design with mobile collapsible interface.
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-09-20
 */

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  Clock,
  CheckCircle2,
  PlayCircle,
  FileText,
  Menu,
  X,
} from "lucide-react";
import type { LessonWithNavigation, Module, Resource } from "@/types/course";

interface LessonSidebarProps {
  lesson: LessonWithNavigation;
  modules: Module[];
  courseProgress?: {
    completedLessons: string[];
    totalLessons: number;
    progressPercentage: number;
  };
  className?: string;
}

interface ResourceListProps {
  resources: Resource[];
}

/**
 * Resource List Component
 */
const ResourceList: React.FC<ResourceListProps> = ({ resources }) => {
  if (!resources || resources.length === 0) {
    return (
      <div className="text-muted-foreground text-sm">
        No resources available for this lesson.
      </div>
    );
  }

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="h-4 w-4" />;
      case "link":
        return <ExternalLink className="h-4 w-4" />;
      default:
        return <Download className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-3">
      {resources.map((resource) => (
        <div
          key={resource.id}
          className="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors"
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="text-muted-foreground">
              {getResourceIcon(resource.type ?? "other")}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">
                {resource.title}
              </div>
              {resource.sizeBytes && (
                <div className="text-muted-foreground text-xs">
                  {formatFileSize(resource.sizeBytes)}
                </div>
              )}
            </div>
          </div>
          <Button size="sm" variant="ghost" asChild className="shrink-0">
            <a href={resource.url} target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4" />
            </a>
          </Button>
        </div>
      ))}
    </div>
  );
};

/**
 * Module Navigation Component
 */
const ModuleNavigation: React.FC<{
  modules: Module[];
  currentLessonId: string;
  completedLessons: string[];
  courseId: string; // Add courseId as a prop
}> = ({ modules, currentLessonId, completedLessons, courseId }) => {
  const [expandedModules, setExpandedModules] = useState<string[]>(() => {
    // Expand module containing current lesson by default
    const currentModule = modules.find((module) =>
      module.lessons.some((lesson) => lesson.id === currentLessonId),
    );
    return currentModule ? [currentModule.id] : [];
  });

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId],
    );
  };

  return (
    <div className="space-y-2">
      {modules.map((module) => {
        const isExpanded = expandedModules.includes(module.id);
        const moduleProgress = module.lessons.filter((lesson) =>
          completedLessons.includes(lesson.id),
        ).length;
        const modulePercentage = (moduleProgress / module.lessons.length) * 100;

        return (
          <div key={module.id} className="rounded-lg border">
            <Button
              variant="ghost"
              onClick={() => toggleModule(module.id)}
              className="h-auto w-full justify-between p-3"
            >
              <div className="space-y-1 text-left">
                <div className="text-sm font-medium">{module.title}</div>
                <div className="text-muted-foreground flex items-center gap-2 text-xs">
                  <span>
                    {moduleProgress}/{module.lessons.length} lessons
                  </span>
                  <Progress value={modulePercentage} className="h-1 w-16" />
                </div>
              </div>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>

            {isExpanded && (
              <div className="border-t">
                {module.lessons.map((lesson, index) => {
                  const isCompleted = completedLessons.includes(lesson.id);
                  const isCurrent = lesson.id === currentLessonId;

                  return (
                    <Link
                      key={lesson.id}
                      href={`/app/courses/${courseId}/modules/${module.id}/lessons/${lesson.id}`}
                      className={cn(
                        "flex items-center gap-3 border-b p-3 text-sm transition-colors last:border-b-0",
                        isCurrent
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted/50",
                        isCompleted && !isCurrent && "text-muted-foreground",
                      )}
                    >
                      <div className="shrink-0">
                        {isCompleted ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : lesson.videoUrl ? (
                          <PlayCircle className="h-4 w-4" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="truncate">{lesson.title}</div>
                        {lesson.durationSeconds && (
                          <div className="text-muted-foreground flex items-center gap-1 text-xs">
                            <Clock className="h-3 w-3" />
                            <span>
                              {Math.ceil(lesson.durationSeconds / 60)} min
                            </span>
                          </div>
                        )}
                      </div>

                      {isCurrent && <Badge variant="default">Current</Badge>}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

/**
 * Main Lesson Sidebar Component
 */
export const LessonSidebar: React.FC<LessonSidebarProps> = ({
  lesson,
  modules,
  courseProgress = {
    completedLessons: [],
    totalLessons: 0,
    progressPercentage: 0,
  },
  className,
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const sidebarContent = (
    <>
      {/* Course Progress */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Course Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>
              {courseProgress.completedLessons.length} of{" "}
              {courseProgress.totalLessons} lessons
            </span>
            <span className="font-medium">
              {Math.round(courseProgress.progressPercentage)}%
            </span>
          </div>
          <Progress value={courseProgress.progressPercentage} />
        </CardContent>
      </Card>

      {/* Navigation */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Course Content</CardTitle>
            {lesson.previousLesson && (
              <Button size="sm" variant="ghost" asChild>
                <Link
                  href={`/app/courses/${lesson.courseId}/modules/${lesson.moduleId}/lessons/${lesson.previousLesson.id}`}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Link>
              </Button>
            )}
            {lesson.nextLesson && (
              <Button size="sm" variant="ghost" asChild>
                <Link
                  href={`/app/courses/${lesson.courseId}/modules/${lesson.moduleId}/lessons/${lesson.nextLesson.id}`}
                >
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <ModuleNavigation
              modules={modules}
              currentLessonId={lesson.id}
              completedLessons={courseProgress.completedLessons}
              courseId={lesson.courseId}
            />
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Resources */}
      {lesson.resources && lesson.resources.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Lesson Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <ResourceList resources={lesson.resources} />
          </CardContent>
        </Card>
      )}

      {/* Quick Navigation */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Navigation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {lesson.previousLesson && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="w-full justify-start"
            >
              <Link
                href={`/app/courses/${lesson.courseId}/modules/${lesson.moduleId}/lessons/${lesson.previousLesson.id}`}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous: {lesson.previousLesson.title}
              </Link>
            </Button>
          )}

          {lesson.nextLesson && (
            <Button
              variant="default"
              size="sm"
              asChild
              className="w-full justify-start"
            >
              <Link
                href={`/app/courses/${lesson.courseId}/modules/${lesson.moduleId}/lessons/${lesson.nextLesson.id}`}
              >
                Next: {lesson.nextLesson.title}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}

          <Separator className="my-2" />

          <Button
            variant="ghost"
            size="sm"
            asChild
            className="w-full justify-start"
          >
            <Link href={`/app/courses/${lesson.courseId}`}>Back to Course</Link>
          </Button>
        </CardContent>
      </Card>
    </>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-4 right-4 z-50 md:hidden"
      >
        {isMobileOpen ? (
          <X className="h-4 w-4" />
        ) : (
          <Menu className="h-4 w-4" />
        )}
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "w-80 space-y-4",
          "md:sticky md:top-4 md:h-fit",
          "md:translate-x-0 md:bg-transparent",
          "bg-background fixed top-0 right-0 z-50 h-full transform p-4 transition-transform",
          isMobileOpen ? "translate-x-0" : "translate-x-full",
          "md:block",
          className,
        )}
      >
        <ScrollArea className="h-full md:h-auto">
          <div className="space-y-4 md:space-y-4">{sidebarContent}</div>
        </ScrollArea>
      </aside>
    </>
  );
};

export default LessonSidebar;
