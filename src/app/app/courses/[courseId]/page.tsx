/**
 * COURSE DETAIL PAGE
 *
 * Comprehensive course detail view with enrollment functionality,
 * module/lesson breakdown, instructor information, and reviews.
 *
 * FEATURES:
 * - Full course information with rich content display
 * - Module and lesson structure visualization
 * - Instructor profile and credentials
 * - Student reviews and ratings
 * - Enrollment and progress tracking
 * - Social sharing capabilities
 * - Related courses recommendations
 *
 * @author GitHub Copilot
 * @version 1.0.0
 * @since 2024-01-15
 */

"use client";

import React, { useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { ArrowLeft, Share2, Heart, BookOpen } from "lucide-react";

type CourseDetailsProps = {
  params: Promise<{ courseId: string }>;
};

/**
 * Course Detail Page Component
 */
const CourseDetailPage: React.FC<CourseDetailsProps> = (props) => {
  const params = React.use(props.params);
  const router = useRouter();

  const course = useQuery(api.courses.getCourseDetails, {
    courseId: params.courseId as Id<"courses">,
  });

  const isLoading = course === undefined;

  const handleBack = () => {
    router.back();
  };

  const handleShare = useCallback(() => {
    if (navigator.share && course) {
      void navigator.share({
        title: course.title,
        text: course.shortDescription ?? course.description,
        url: window.location.href,
      });
    } else {
      void navigator.clipboard.writeText(window.location.href);
    }
  }, [course]);

  if (isLoading) {
    return <CourseDetailSkeleton />;
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
          Course not found
        </h1>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          The course you&apos;re looking for doesn&apos;t exist or has been
          removed.
        </p>
        <Button onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Navigation */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleBack}
          className="h-9"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Courses
        </Button>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="h-9"
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button variant="outline" size="sm" className="h-9">
            <Heart className="mr-2 h-4 w-4" />
            Save
          </Button>
        </div>
      </div>

      {/* Course Header */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Course Title and Meta */}
          <div className="space-y-4">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              {course.title}
            </h1>

            <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-400">
              {course.shortDescription}
            </p>
          </div>

          {/* Course Description */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Course Description
            </h2>
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <p className="leading-relaxed text-gray-600 dark:text-gray-400">
                {course.description}
              </p>
            </div>
          </div>

          {/* Course Modules */}
          {course.modules && course.modules.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Course Content
              </h2>
              <Accordion type="single" collapsible className="w-full">
                {course.modules.map((module, index) => {
                  const firstLesson =
                    module.lessons && module.lessons.length > 0
                      ? module.lessons[0]
                      : null;
                  const triggerContent = (
                    <div className="flex flex-col items-start text-left">
                      <span className="font-semibold">
                        Module {index + 1}: {module.title}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {module.lessons.length} lessons
                      </span>
                    </div>
                  );

                  return (
                    <AccordionItem key={module._id} value={`item-${index}`}>
                      <AccordionTrigger>
                        {firstLesson ? (
                          <Link
                            href={`/app/courses/${course._id}/modules/${module._id}/lessons/${firstLesson._id}`}
                            className="flex w-full items-center justify-between text-left"
                          >
                            {triggerContent}
                          </Link>
                        ) : (
                          triggerContent
                        )}
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2">
                          {module.lessons.map((lesson) => (
                            <li key={lesson._id}>
                              <Link
                                href={`/app/courses/${course._id}/modules/${module._id}/lessons/${lesson._id}`}
                                className="hover:bg-muted flex items-center justify-between rounded-md p-2"
                              >
                                <div className="flex items-center gap-3">
                                  <BookOpen className="text-muted-foreground h-4 w-4" />
                                  <span>{lesson.title}</span>
                                </div>
                                {lesson.estimatedDuration && (
                                  <span className="text-muted-foreground text-sm">
                                    {lesson.estimatedDuration} min
                                  </span>
                                )}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            {/* Instructor Info */}
            {course.author && (
              <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Instructor
                </h3>
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={course.author.avatarUrl}
                      alt={course.author.name}
                    />
                    <AvatarFallback>
                      {course.author.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {course.author.name}
                    </h4>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Loading skeleton component
const CourseDetailSkeleton: React.FC = () => (
  <div className="space-y-8">
    <div className="flex items-center gap-4">
      <Skeleton className="h-9 w-32" />
      <div className="ml-auto flex items-center gap-2">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-20" />
      </div>
    </div>

    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-6 w-3/4" />
        </div>

        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-20 w-full" />
        </div>

        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>

      <div className="space-y-6 lg:col-span-1">
        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <Skeleton className="h-12 w-full" />
        </div>
        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    </div>
  </div>
);

export default CourseDetailPage;
