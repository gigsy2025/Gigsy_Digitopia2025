"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, CheckCircle, HelpCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

type LessonDetailPageProps = {
  params: Promise<{
    courseId: string;
    moduleId: string;
    lessonId: string;
  }>;
};

/**
 * Lesson Detail Page
 *
 * Fetches and displays the content for a specific lesson, including
 * title, content, and an interactive quiz if available.
 *
 * @param params - The route parameters containing course, module, and lesson IDs.
 * @returns The rendered lesson detail page.
 */
export default function LessonDetailPage(props: LessonDetailPageProps) {
  const params = React.use(props.params);
  const router = useRouter();

  const lesson = useQuery(api.lessons.getLessonById, {
    lessonId: params.lessonId as Id<"lessons">,
  });

  const videoStorageId = lesson?.lesson?.content as Id<"_storage"> | undefined;

  const videoUrl = useQuery(
    api.files.getFileUrl,
    videoStorageId ? { storageId: videoStorageId } : "skip",
  );

  const isLoading = lesson === undefined;
  const isVideoLoading = !!videoStorageId && videoUrl === undefined;

  const handleBack = () => {
    router.back();
  };

  if (isLoading) {
    return <LessonDetailSkeleton />;
  }

  if (!lesson) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
          Lesson Not Found
        </h1>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          The lesson you&apos;re looking for doesn&apos;t exist or has been
          moved.
        </p>
        <Button onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  console.log("Lesson Data:", lesson);
  console.log("Video URL:", videoUrl);

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

      {/* Lesson Header */}
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          {lesson.lesson.title}
        </h1>
        {lesson.lesson.estimatedDuration && (
          <div className="text-muted-foreground flex items-center">
            <BookOpen className="mr-2 h-5 w-5" />
            <span>
              Estimated duration: {lesson.lesson.estimatedDuration} minutes
            </span>
          </div>
        )}
      </div>

      {/* Video Player Section */}
      {videoStorageId && (
        <Card>
          <CardContent className="p-2">
            {isVideoLoading ? (
              <Skeleton className="aspect-video w-full" />
            ) : videoUrl ? (
              <VideoPlayer src={videoUrl} />
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Lesson Content */}
      <Card>
        <CardContent className="p-6">
          <div
            className="prose prose-lg dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: lesson.lesson.content ?? "" }}
          />
        </CardContent>
      </Card>

      {/* Quiz Section */}
      {lesson.quiz && lesson.quiz.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="text-primary h-6 w-6" />
              Knowledge Check
            </CardTitle>
            <CardDescription>
              Test your understanding of the material.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {lesson.quiz.map((quizItem, qIndex) => (
              <div key={quizItem._id} className="space-y-4">
                <p className="font-semibold">
                  {qIndex + 1}. {quizItem.question}
                </p>
                <RadioGroup>
                  {quizItem.options.map((option) => (
                    <div
                      key={option._id}
                      className="flex items-center space-x-2"
                    >
                      <RadioGroupItem value={option._id} id={option._id} />
                      <Label htmlFor={option._id}>{option.text}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button>
              <CheckCircle className="mr-2 h-4 w-4" />
              Submit Answers
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

/**
 * Video Player Component
 *
 * Renders a responsive HTML5 video player with controls, optimized for performance.
 *
 * @param src - The URL of the video to play.
 * @returns A responsive video player component.
 */
const VideoPlayer = ({ src }: { src: string }) => {
  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
      <video src={src} controls preload="metadata" className="h-full w-full" />
    </div>
  );
};

/**
 * Loading skeleton for the lesson detail page.
 */
const LessonDetailSkeleton: React.FC = () => (
  <div className="mx-auto max-w-4xl space-y-8">
    <div className="flex items-center justify-between">
      <Skeleton className="h-9 w-36" />
      <Skeleton className="h-5 w-28" />
    </div>

    <div className="space-y-4">
      <Skeleton className="h-12 w-3/4" />
      <Skeleton className="h-5 w-48" />
    </div>

    {/* Video Skeleton */}
    <Card>
      <CardContent className="p-2">
        <Skeleton className="aspect-video w-full" />
      </CardContent>
    </Card>

    <Card>
      <CardContent className="space-y-4 p-6">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-5/6" />
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-64" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Skeleton className="h-6 w-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-5 w-1/2" />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="h-10 w-36" />
      </CardFooter>
    </Card>
  </div>
);
