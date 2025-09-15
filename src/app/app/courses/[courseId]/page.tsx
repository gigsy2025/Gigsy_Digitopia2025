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

import React, { useState, useCallback } from "react";
import type { CourseDetail } from "@/types/courses";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/utils";

import {
  ArrowLeft,
  Play,
  Clock,
  Users,
  Star,
  Download,
  Share2,
  Heart,
  CheckCircle,
  Globe,
  Award,
} from "lucide-react";

/**
 * Course Detail Page Component
 */
const CourseDetailPage: React.FC<{ params: { courseId: string } }> = ({
  params,
}) => {
  const router = useRouter();
  const [isEnrolling, setIsEnrolling] = useState(false);

  // Query course details - handle unknown type from Convex
  const courseData = useQuery(api.courses.getCourseById, {
    courseId: params.courseId as Id<"courses">,
  });

  // Type guard to ensure course is valid
  const isValidCourse = (data: unknown): data is CourseDetail => {
    return (
      data !== null &&
      data !== undefined &&
      typeof data === "object" &&
      "id" in data &&
      "title" in data
    );
  };

  const course = isValidCourse(courseData) ? courseData : undefined;

  // Enrollment mutation
  const enrollInCourse = useMutation(api.courses.enrollInCourse);

  const isLoading = courseData === undefined;

  // Handle enrollment
  const handleEnroll = useCallback(async () => {
    if (!course || isEnrolling) return;

    setIsEnrolling(true);
    try {
      await enrollInCourse({ courseId: course.id });
      // Could show success toast here
      router.push(`/app/courses/${course.id}/learn`);
    } catch (error) {
      console.error("Enrollment failed:", error);
      // Could show error toast here
    } finally {
      setIsEnrolling(false);
    }
  }, [course, isEnrolling, enrollInCourse, router]);

  // Handle back navigation
  const handleBack = () => {
    router.back();
  };

  // Handle share
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

  // Loading state
  if (isLoading) {
    return <CourseDetailSkeleton />;
  }

  // Error state
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

  // Calculate totals with safe type handling
  const totalDuration = course?.estimatedDuration ?? 0;
  const totalLessons = 0; // Would be calculated from actual modules when available

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
            <div className="flex flex-wrap items-center gap-3">
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
              >
                {course.category}
              </Badge>
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
              >
                {course.difficulty}
              </Badge>
              {course.featured && (
                <Badge className="bg-yellow-500 text-white">
                  <Award className="mr-1 h-3 w-3" />
                  Featured
                </Badge>
              )}
              {course.isNew && (
                <Badge className="bg-green-500 text-white">New</Badge>
              )}
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              {course.title}
            </h1>

            <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-400">
              {course.shortDescription}
            </p>

            {/* Course Stats */}
            <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
              {course.rating && typeof course.rating === "number" && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">
                    {(course.rating as unknown as number).toFixed(1)}
                  </span>
                  <span>({course.reviewCount ?? 0} reviews)</span>
                </div>
              )}
              {course.enrollmentCount && (
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>
                    {course.enrollmentCount.toLocaleString()} students
                  </span>
                </div>
              )}
              {totalDuration > 0 && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    {Math.round(totalDuration / 60)}h {totalDuration % 60}m
                  </span>
                </div>
              )}
              {totalLessons > 0 && (
                <div className="flex items-center gap-1">
                  <Play className="h-4 w-4" />
                  <span>{totalLessons} lessons</span>
                </div>
              )}
            </div>
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

          {/* Learning Objectives */}
          {course.learningObjectives &&
            course.learningObjectives.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  What You&apos;ll Learn
                </h2>
                <ul className="space-y-2">
                  {course.learningObjectives.map((objective, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {objective}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {/* Course Modules */}
          {course.modules && course.modules.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Course Content
              </h2>
              <div className="space-y-3">
                {course.modules.map((module, index) => {
                  const mod = module as unknown as Record<string, unknown>;
                  const moduleId =
                    typeof mod?.id === "string" || typeof mod?.id === "number"
                      ? String(mod.id)
                      : `module-${index}`;
                  const moduleTitle =
                    typeof mod?.title === "string" ? mod.title : "Untitled";
                  const moduleDescription =
                    typeof mod?.description === "string"
                      ? mod.description
                      : null;
                  const lessonCount =
                    typeof mod?.lessonCount === "number"
                      ? mod.lessonCount
                      : null;
                  const estimatedDuration =
                    typeof mod?.estimatedDuration === "number"
                      ? mod.estimatedDuration
                      : null;

                  return (
                    <div
                      key={moduleId}
                      className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            Module {index + 1}: {moduleTitle}
                          </h3>
                          {moduleDescription && (
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                              {moduleDescription}
                            </p>
                          )}
                          <div className="mt-2 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            {lessonCount && <span>{lessonCount} lessons</span>}
                            {estimatedDuration && (
                              <span>
                                {Math.round(estimatedDuration / 60)}h{" "}
                                {estimatedDuration % 60}m
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            {/* Enrollment Card */}
            <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              {course.pricing && (
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {(() => {
                      const pricing = course.pricing as unknown as Record<
                        string,
                        unknown
                      >;
                      const isFree = Boolean(pricing?.isFree);
                      const price = Number(
                        pricing?.price ?? pricing?.amount ?? 0,
                      );
                      return isFree ? "Free" : formatPrice(price);
                    })()}
                  </div>
                  {(() => {
                    const pricing = course.pricing as unknown as Record<
                      string,
                      unknown
                    >;
                    const originalPrice = Number(pricing?.originalPrice ?? 0);
                    const currentPrice = Number(
                      pricing?.price ?? pricing?.amount ?? 0,
                    );

                    return originalPrice > 0 && originalPrice > currentPrice ? (
                      <div className="text-sm text-gray-500 line-through">
                        {formatPrice(originalPrice)}
                      </div>
                    ) : null;
                  })()}
                </div>
              )}

              <Button
                onClick={handleEnroll}
                disabled={isEnrolling}
                className="h-12 w-full text-base font-medium"
              >
                {isEnrolling ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Enrolling...
                  </>
                ) : course.userProgress !== undefined ? (
                  "Continue Learning"
                ) : Boolean(
                    (course.pricing as unknown as Record<string, unknown>)
                      ?.isFree,
                  ) ? (
                  "Start Learning Free"
                ) : (
                  "Enroll Now"
                )}
              </Button>

              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  30-day money-back guarantee
                </p>
              </div>
            </div>

            {/* Course Features */}
            <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                This course includes:
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-3">
                  <Play className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {totalDuration > 0
                      ? `${Math.round(totalDuration / 60)} hours of video`
                      : "Video content"}
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Download className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Downloadable resources
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Access on mobile and desktop
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Award className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Certificate of completion
                  </span>
                </li>
              </ul>
            </div>

            {/* Instructor Info */}
            {course.author && (
              <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Instructor
                </h3>
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    {"avatarUrl" in course.author && course.author.avatarUrl ? (
                      <Image
                        src={course.author.avatarUrl}
                        alt={course.author.name}
                        width={48}
                        height={48}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500 font-medium text-white">
                        {course.author.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {course.author.name}
                    </h4>
                    {"title" in course.author && course.author.title && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {course.author.title}
                      </p>
                    )}
                    {"bio" in course.author && course.author.bio && (
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {course.author.bio}
                      </p>
                    )}
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
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-6 w-3/4" />
          <div className="flex items-center gap-6">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>

        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>

      <div className="space-y-6 lg:col-span-1">
        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <Skeleton className="mx-auto h-8 w-24" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="mx-auto h-4 w-32" />
        </div>
      </div>
    </div>
  </div>
);

export default CourseDetailPage;
