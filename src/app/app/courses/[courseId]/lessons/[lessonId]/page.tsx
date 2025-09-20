/**
 * LESSON DETAIL PAGE
 *
 * Modern LMS lesson page with content player/viewer, lesson navigation,
 * resources, progress tracking, and interactive elements.
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-09-20
 */

import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getLessonWithNavigation,
  getCourseModules,
  getCourseProgress,
} from "@/utils/fetchers";
import { LessonSidebar } from "@/components/lesson";
import { LessonContent, CommentsSection } from "./LessonClientWrapper";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import type { LessonWithNavigation } from "@/types/course";

interface LessonPageProps {
  params: Promise<{
    courseId: string;
    lessonId: string;
  }>;
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: LessonPageProps): Promise<Metadata> {
  try {
    const { courseId, lessonId } = await params;
    const lesson = await getLessonWithNavigation(courseId, lessonId);

    if (!lesson) {
      return {
        title: "Lesson Not Found",
        description: "The requested lesson could not be found.",
      };
    }

    const courseTitle = lesson.course?.title ?? "Course";
    const lessonTitle = `${lesson.title} | ${courseTitle}`;
    const description =
      lesson.description ??
      `Learn ${lesson.title} in this comprehensive lesson.`;

    return {
      title: lessonTitle,
      description,
      openGraph: {
        title: lessonTitle,
        description,
        images: lesson.thumbnailUrl ? [{ url: lesson.thumbnailUrl }] : [],
        type: "video.other",
      },
      twitter: {
        card: "summary_large_image",
        title: lessonTitle,
        description,
        images: lesson.thumbnailUrl ? [lesson.thumbnailUrl] : [],
      },
    };
  } catch {
    return {
      title: "Lesson Not Found",
      description: "The requested lesson could not be found.",
    };
  }
}

/**
 * Lesson Navigation Component
 */
const LessonNavigation: React.FC<{
  lesson: LessonWithNavigation;
}> = ({ lesson }) => (
  <div className="bg-card flex items-center justify-between rounded-lg border p-4">
    <div className="flex items-center gap-4">
      {/* Back to Course */}
      <Button variant="outline" size="sm" asChild>
        <Link href={`/app/courses/${lesson.courseId}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Course
        </Link>
      </Button>

      {/* Breadcrumb */}
      <div className="text-muted-foreground hidden items-center gap-2 text-sm md:flex">
        <Link
          href={`/app/courses/${lesson.courseId}`}
          className="hover:text-foreground transition-colors"
        >
          {lesson.course?.title ?? "Course"}
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{lesson.title}</span>
      </div>
    </div>

    <div className="flex items-center gap-2">
      {/* Previous Lesson */}
      {lesson.previousLesson && (
        <Button variant="outline" size="sm" asChild>
          <Link
            href={`/app/courses/${lesson.courseId}/lessons/${lesson.previousLesson.id}`}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Previous</span>
          </Link>
        </Button>
      )}

      {/* Next Lesson */}
      {lesson.nextLesson && (
        <Button size="sm" asChild>
          <Link
            href={`/app/courses/${lesson.courseId}/lessons/${lesson.nextLesson.id}`}
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      )}
    </div>
  </div>
);

/**
 * Lesson Header Component
 */
const LessonHeader: React.FC<{
  lesson: LessonWithNavigation;
}> = ({ lesson }) => (
  <div className="space-y-3">
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl leading-tight font-bold lg:text-3xl">
          {lesson.title}
        </h1>

        {lesson.description && (
          <p className="text-muted-foreground mt-2">{lesson.description}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="secondary">Lesson {lesson.sequenceIndex + 1}</Badge>

        {lesson.isFree && (
          <Badge variant="outline" className="border-green-600 text-green-600">
            Free
          </Badge>
        )}
      </div>
    </div>

    {/* Lesson Meta */}
    <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
      <div className="flex items-center gap-2">
        <span>Module:</span>
        <span className="text-foreground font-medium">
          {lesson.module?.title ?? "Module"}
        </span>
      </div>

      {lesson.durationSeconds && (
        <div className="flex items-center gap-2">
          <span>Duration:</span>
          <span className="text-foreground font-medium">
            {Math.ceil(lesson.durationSeconds / 60)} minutes
          </span>
        </div>
      )}

      <div className="flex items-center gap-2">
        <span>Progress:</span>
        <span className="text-foreground font-medium">
          {lesson.course?.totalLessons ?? 0} lessons total
        </span>
      </div>
    </div>
  </div>
);

/**
 * Main Lesson Detail Page Component
 */
export default async function LessonPage({ params }: LessonPageProps) {
  try {
    const { courseId, lessonId } = await params;

    // Validate lesson ID format before attempting to fetch
    if (!lessonId || typeof lessonId !== "string") {
      console.error("[LessonPage] Invalid lesson ID:", {
        lessonId,
        type: typeof lessonId,
      });
      notFound();
    }

    // Check if lesson ID looks like a storage ID (common issue)
    if (lessonId.length > 40 || lessonId.includes("_storage")) {
      console.error(
        "[LessonPage] Lesson ID appears to be a storage ID, not a lesson ID:",
        {
          lessonId,
          length: lessonId.length,
          suggestion:
            "Check if content field is being used instead of _id field",
        },
      );
      notFound();
    }

    // Fetch lesson data with navigation context
    const lesson = await getLessonWithNavigation(courseId, lessonId);

    console.log("[LessonPage] Lesson fetch result:", lesson);

    if (!lesson) {
      console.error("[LessonPage] No lesson found for ID:", {
        courseId,
        lessonId,
      });
      notFound();
    }

    // Fetch course modules for sidebar navigation
    const modules = await getCourseModules(courseId);

    // Mock user ID - in real app, get from auth context
    const userId = "user-123";

    // Fetch user progress
    let courseProgress;
    try {
      courseProgress = await getCourseProgress(courseId, userId);
    } catch {
      // User not enrolled or progress not available
      courseProgress = null;
    }

    // Preconnect to next lesson for better performance
    const nextLessonUrl = lesson.nextLesson
      ? `/app/courses/${courseId}/lessons/${lesson.nextLesson.id}`
      : null;

    return (
      <>
        {/* Preload next lesson */}
        {nextLessonUrl && (
          <head>
            <link rel="prefetch" href={nextLessonUrl} />
            {lesson.nextLesson && lesson.videoUrl && (
              <link rel="preload" as="video" href={lesson.videoUrl} />
            )}
          </head>
        )}

        <div className="bg-background min-h-screen">
          <div className="container mx-auto px-4 py-6">
            {/* Navigation */}
            <div className="mb-6">
              <LessonNavigation lesson={lesson} />
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
              {/* Main Content */}
              <div className="space-y-8 lg:col-span-3">
                {/* Lesson Header */}
                <LessonHeader lesson={lesson} />

                {/* Lesson Content */}
                <LessonContent lesson={lesson} userId={userId} />

                {/* Additional Resources */}
                {lesson.resources && lesson.resources.length > 0 && (
                  <div className="bg-card space-y-4 rounded-lg border p-6">
                    <h2 className="text-lg font-semibold">Lesson Resources</h2>
                    <div className="grid gap-3">
                      {lesson.resources.map((resource) => (
                        <div
                          key={resource.id}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-medium">{resource.title}</div>
                            {resource.sizeBytes && (
                              <div className="text-muted-foreground text-sm">
                                {Math.round(resource.sizeBytes / 1024)} KB
                              </div>
                            )}
                          </div>
                          <Button size="sm" variant="outline" asChild>
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comments Section */}
                <CommentsSection lessonId={lesson.id} userId={userId} />
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <LessonSidebar
                  lesson={lesson}
                  modules={modules}
                  courseProgress={{
                    completedLessons: Array.isArray(
                      courseProgress?.completedLessons,
                    )
                      ? courseProgress.completedLessons
                      : [],
                    totalLessons: lesson.course?.totalLessons ?? 0,
                    progressPercentage: courseProgress?.progressPercentage ?? 0,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  } catch (error) {
    console.error("Error loading lesson:", error);
    notFound();
  }
}
