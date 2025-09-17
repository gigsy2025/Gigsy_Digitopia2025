"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

  const course = useQuery(api.courses.getCourseDetails, {
    courseId: params.courseId as Id<"courses">,
  });

  const currentModule = course?.modules?.find((m) => m._id === params.moduleId);
  const isLoading = course === undefined;

  const handleBack = () => {
    router.back();
  };

  if (isLoading) {
    return <ModuleDetailSkeleton />;
  }

  if (!currentModule) {
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
      </div>

      {/* Lessons List */}
      <Card>
        <CardHeader>
          <CardTitle>Lessons in this Module</CardTitle>
          <CardDescription>Select a lesson to start learning.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {currentModule.lessons.map((lesson) => (
              <li key={lesson._id}>
                <Link
                  href={`/app/courses/${params.courseId}/modules/${params.moduleId}/lessons/${lesson._id}`}
                  className="hover:bg-muted flex items-center justify-between rounded-md p-3"
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
            ))}
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
