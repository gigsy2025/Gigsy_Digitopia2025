"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, CheckCircle, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useCourseProgress } from "@/hooks/useProgress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Enhanced debugging logger for module pages
const createModuleLogger = (context: string) => ({
  info: (message: string, data?: Record<string, unknown>) => {
    console.log(
      `📚 [ModulePage:${context}] ${message}`,
      data ? JSON.stringify(data, null, 2) : "",
    );
  },
  warn: (message: string, data?: Record<string, unknown>) => {
    console.warn(
      `⚠️ [ModulePage:${context}] ${message}`,
      data ? JSON.stringify(data, null, 2) : "",
    );
  },
  error: (message: string, error?: Error) => {
    console.error(`❌ [ModulePage:${context}] ${message}`, error);
  },
  debug: (message: string, data?: Record<string, unknown>) => {
    if (
      typeof window !== "undefined" &&
      window.localStorage.getItem("debug-module") === "true"
    ) {
      console.debug(`🔍 [ModulePage:${context}] ${message}`, data);
    }
  },
});

type ModuleDetailPageProps = {
  params: Promise<{
    courseId: string;
    moduleId: string;
  }>;
};

/**
 * Module Detail Page
 *
 * Displays the details of a specific module, including its title,
 * description, and a list of lessons it contains.
 *
 * @param params - The route parameters containing course and module IDs.
 * @returns The rendered module detail page.
 */
export default function ModuleDetailPage(props: ModuleDetailPageProps) {
  const params = React.use(props.params);
  const router = useRouter();
  const { user } = useUser();
  const logger = createModuleLogger("ModuleDetail");

  // Enhanced logging for module initialization
  React.useEffect(() => {
    logger.info("🚀 Module page initialized", {
      moduleId: params.moduleId,
      courseId: params.courseId,
      userId: user?.id,
      timestamp: new Date().toISOString(),
    });
  }, [params, user?.id, logger]);

  const course = useQuery(api.courses.getCourseDetails, {
    courseId: params.courseId as Id<"courses">,
  });

  // Enhanced course progress tracking
  const { progress: courseProgress } = useCourseProgress(
    params.courseId,
    user?.id ?? "",
  );

  // Get module-specific progress
  const moduleProgress = useQuery(api.lessons.getModuleProgress, {
    moduleId: params.moduleId as Id<"modules">,
  });

  const currentModule = course?.modules?.find((m) => m._id === params.moduleId);
  const isLoading = course === undefined;

  // Enhanced logging for course and module data
  React.useEffect(() => {
    if (course) {
      logger.info("📚 Course data loaded", {
        courseId: course._id,
        title: course.title,
        modulesCount: course.modules?.length || 0,
        targetModuleId: params.moduleId,
        moduleFound: !!currentModule,
      });
    }
  }, [course, currentModule, params.moduleId, logger]);

  React.useEffect(() => {
    if (currentModule) {
      logger.info("📖 Module data loaded", {
        moduleId: currentModule._id,
        title: currentModule.title,
        lessonsCount: currentModule.lessons.length,
        lessons: currentModule.lessons.map((l) => ({
          id: l._id,
          title: l.title,
          duration: l.estimatedDuration,
        })),
      });
    }
  }, [currentModule, logger]);

  // Log progress data
  React.useEffect(() => {
    if (courseProgress) {
      logger.info("📊 Course progress loaded", {
        courseProgress,
        progressPercentage: courseProgress.progressPercentage,
        completedLessons: courseProgress.completedLessons,
        totalLessons: courseProgress.totalLessons,
      });
    }
  }, [courseProgress, logger]);

  React.useEffect(() => {
    if (moduleProgress !== undefined) {
      logger.info("📈 Module progress loaded", {
        moduleProgress,
        totalLessons: moduleProgress?.totalLessons || 0,
        completedLessons: moduleProgress?.completedLessons || 0,
        progressPercentage: moduleProgress?.progressPercentage || 0,
        totalWatchTime: moduleProgress?.totalWatchTime || 0,
      });
    }
  }, [moduleProgress, logger]);

  // Log authentication status
  React.useEffect(() => {
    logger.info("🔐 User authentication status", {
      isAuthenticated: !!user,
      userId: user?.id,
      userEmail: user?.emailAddresses?.[0]?.emailAddress,
      canTrackProgress: !!user?.id,
    });

    if (!user?.id) {
      logger.warn("⚠️ Progress tracking disabled - no authenticated user", {
        reason: "User not authenticated",
        recommendation: "User must be logged in for progress tracking",
      });
    }
  }, [user, logger]);

  const handleBack = () => {
    logger.debug("🔙 Navigating back from module");
    router.back();
  };

  if (isLoading) {
    logger.debug("⌛ Module data loading...");
    return <ModuleDetailSkeleton />;
  }

  if (!currentModule) {
    logger.error(
      "❌ Module not found",
      new Error(
        `Module not found: moduleId=${params.moduleId}, courseId=${params.courseId}`,
      ),
    );
    logger.info("Module not found context", {
      moduleId: params.moduleId,
      courseId: params.courseId,
      availableModules:
        course?.modules?.map((m) => ({ id: m._id, title: m.title })) ?? [],
    });
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
          Module Not Found
        </h1>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          The module you&apos;re looking for doesn&apos;t exist or has been
          moved.
        </p>
        <Button onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Course
        </Button>
        <Link
          href={`/app/courses/${params.courseId}`}
          className="text-primary text-sm font-medium hover:underline"
        >
          View Full Course
        </Link>
      </div>

      {/* Module Header */}
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          {currentModule.title}
        </h1>
        <p className="text-muted-foreground text-lg">
          {currentModule.description}
        </p>

        {/* Module Progress Indicator */}
        {moduleProgress && user?.id && (
          <div className="text-muted-foreground flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>
                {moduleProgress.completedLessons} of{" "}
                {moduleProgress.totalLessons} lessons completed
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>
                {Math.round(moduleProgress.totalWatchTime / 60)} minutes watched
              </span>
            </div>
            <div className="text-primary font-medium">
              {Math.round(moduleProgress.progressPercentage)}% complete
            </div>
          </div>
        )}
      </div>

      {/* Debug Progress Section - Remove in production */}
      {process.env.NODE_ENV === "development" && user?.id && (
        <Card className="border-dashed border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              🔧 Module Progress Debug
            </CardTitle>
            <CardDescription>
              Debug information for module progress tracking (development only)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>User ID:</strong> {user?.id || "Not authenticated"}
              </div>
              <div>
                <strong>Module Progress:</strong>{" "}
                {moduleProgress?.progressPercentage ?? 0}%
              </div>
              <div>
                <strong>Completed Lessons:</strong>{" "}
                {moduleProgress?.completedLessons ?? 0}
              </div>
              <div>
                <strong>Total Lessons:</strong>{" "}
                {moduleProgress?.totalLessons ?? 0}
              </div>
              <div>
                <strong>Watch Time:</strong>{" "}
                {Math.round((moduleProgress?.totalWatchTime ?? 0) / 60)} min
              </div>
              <div>
                <strong>Course Progress:</strong>{" "}
                {courseProgress?.progressPercentage ?? 0}%
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  localStorage.setItem("debug-progress", "true");
                  localStorage.setItem("debug-module", "true");
                  logger.info("🔧 Debug logging enabled for modules");
                }}
              >
                Enable Debug Logs
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lessons List */}
      <Card>
        <CardHeader>
          <CardTitle>Lessons in this Module</CardTitle>
          <CardDescription>Select a lesson to start learning.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {currentModule.lessons.map((lesson, index) => {
              // For now, we'll show all lessons as available
              // In the future, you could add logic to check individual lesson progress
              const handleLessonClick = () => {
                logger.info("📖 Lesson selected", {
                  lessonId: lesson._id,
                  lessonTitle: lesson.title,
                  lessonIndex: index,
                  estimatedDuration: lesson.estimatedDuration,
                  targetUrl: `/app/courses/${params.courseId}/modules/${params.moduleId}/lessons/${lesson._id}`,
                });
              };

              return (
                <li key={lesson._id}>
                  <Link
                    href={`/app/courses/${params.courseId}/modules/${params.moduleId}/lessons/${lesson._id}`}
                    className="hover:bg-muted flex items-center justify-between rounded-md p-3"
                    onClick={handleLessonClick}
                  >
                    <div className="flex items-center gap-4">
                      <BookOpen className="text-muted-foreground h-5 w-5" />
                      <span className="font-medium">{lesson.title}</span>
                    </div>
                    {lesson.estimatedDuration && (
                      <span className="text-muted-foreground text-sm">
                        {lesson.estimatedDuration} min
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Loading skeleton for the module detail page.
 */
const ModuleDetailSkeleton: React.FC = () => (
  <div className="mx-auto max-w-4xl space-y-8">
    <div className="flex items-center justify-between">
      <Skeleton className="h-9 w-36" />
      <Skeleton className="h-5 w-28" />
    </div>

    <div className="space-y-4">
      <Skeleton className="h-12 w-3/4" />
      <Skeleton className="h-6 w-full" />
    </div>

    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-64" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </CardContent>
    </Card>
  </div>
);
