"use client";

import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { CourseHero } from "@/components/course/CourseHero";
import { ModuleList } from "@/components/course/ModuleList";
import { CourseSummaryCard } from "@/components/course/CourseSummaryCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Play, Users, Clock, Award, Star } from "lucide-react";
import {
  transformConvexCourses,
  type ConvexCourseData,
} from "@/utils/fetchers-client";

interface CourseDetailsWrapperProps {
  courseId: string;
}

export function CourseDetailsWrapper({ courseId }: CourseDetailsWrapperProps) {
  // Use direct Convex queries for real-time updates
  const convexCourse = useQuery(api.courses.getCourseDetails, {
    courseId: courseId as Id<"courses">,
  });

  const convexProgress = useQuery(api.lessons.getCourseProgress, {
    courseId: courseId as Id<"courses">,
    userId: undefined, // Mock user ID - in real app, get from auth context
  });

  // Transform Convex data to legacy format
  const course = convexCourse
    ? transformConvexCourses([convexCourse as ConvexCourseData])[0]
    : null;

  if (convexCourse === undefined) {
    return <div>Loading...</div>;
  }

  if (!course) {
    return <div>Course not found</div>;
  }

  const isEnrolled = Boolean(convexProgress);
  const completionPercentage = Array.isArray(convexProgress)
    ? convexProgress.reduce((sum, p) => sum + (p.percentage || 0), 0) /
      convexProgress.length
    : 0;

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-8 lg:col-span-2">
            {/* Course Hero Section */}
            <CourseHero course={course} />

            {/* Course Description */}
            {course.description && (
              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">About This Course</h2>
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <p className="text-muted-foreground leading-relaxed">
                    {course.description}
                  </p>
                </div>
              </section>
            )}

            {/* Course Modules */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Course Content</h2>
                <Badge variant="secondary">
                  {course.modules.reduce(
                    (total, module) => total + module.lessons.length,
                    0,
                  )}{" "}
                  lessons
                </Badge>
              </div>
              <ModuleList
                modules={course.modules}
                courseId={courseId}
                currentLessonId={convexProgress?.currentLessonId}
                completedLessons={convexProgress?.completedLessons ?? []}
                isEnrolled={isEnrolled}
              />
            </section>

            {/* Course Features */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">What You&apos;ll Learn</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex items-start gap-3 rounded-lg border p-4">
                  <Award className="text-primary mt-1 h-5 w-5" />
                  <div>
                    <h3 className="font-medium">Comprehensive Curriculum</h3>
                    <p className="text-muted-foreground text-sm">
                      Structured learning path with hands-on projects
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg border p-4">
                  <Users className="text-primary mt-1 h-5 w-5" />
                  <div>
                    <h3 className="font-medium">Expert Instruction</h3>
                    <p className="text-muted-foreground text-sm">
                      Learn from industry professionals and experts
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg border p-4">
                  <Clock className="text-primary mt-1 h-5 w-5" />
                  <div>
                    <h3 className="font-medium">Self-Paced Learning</h3>
                    <p className="text-muted-foreground text-sm">
                      Learn at your own pace with lifetime access
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg border p-4">
                  <Star className="text-primary mt-1 h-5 w-5" />
                  <div>
                    <h3 className="font-medium">Certificate</h3>
                    <p className="text-muted-foreground text-sm">
                      Earn a certificate upon successful completion
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Course Summary Card */}
              <CourseSummaryCard
                course={course}
                isEnrolled={isEnrolled}
                userProgress={completionPercentage}
              />

              {/* Enrollment Actions */}
              <div className="bg-card space-y-4 rounded-lg border p-6">
                {isEnrolled ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-muted-foreground mb-2 text-sm">
                        Your Progress
                      </p>
                      <div className="text-2xl font-bold">
                        {Math.round(completionPercentage)}%
                      </div>
                    </div>

                    <Separator />

                    <Button className="w-full" size="lg">
                      <Play className="mr-2 h-4 w-4" />
                      Continue Learning
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold">
                        {course.price ? `$${course.price}` : "Free"}
                      </div>
                      <p className="text-muted-foreground text-sm">
                        One-time payment • Lifetime access
                      </p>
                    </div>

                    <Button className="w-full" size="lg">
                      {course.price ? "Enroll Now" : "Start Learning"}
                    </Button>

                    <p className="text-muted-foreground text-center text-xs">
                      30-day money-back guarantee
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
