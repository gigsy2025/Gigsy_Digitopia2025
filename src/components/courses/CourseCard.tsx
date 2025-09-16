"use client";

import React, { useState, useCallback } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { cn, formatPrice, truncateText } from "@/lib/utils";
import type { CourseCardProps, CourseMediaAssets } from "@/types/courses";
import {
  Clock,
  Users,
  Star,
  BookOpen,
  Play,
  FileVideo,
  ImageIcon,
} from "lucide-react";

/**
 * Loading skeleton component for course images
 */
const CourseImageSkeleton: React.FC<{ className?: string }> = ({
  className,
}) => (
  <div
    className={cn(
      "animate-pulse bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800",
      className,
    )}
  >
    <div className="flex h-full w-full items-center justify-center">
      <ImageIcon className="h-12 w-12 text-gray-400 dark:text-gray-600" />
    </div>
  </div>
);

/**
 * Enhanced course image component with fallbacks and lazy loading
 */
const CourseImage: React.FC<{
  media: CourseMediaAssets;
  title: string;
  className?: string;
  priority?: boolean;
}> = ({ media, title, className, priority = false }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = useCallback(() => {
    setImageLoading(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoading(false);
  }, []);

  // Determine the best image source
  const getImageSource = (): string | null => {
    if (media.thumbnailUrl) return media.thumbnailUrl;
    if (media.bannerUrl) return media.bannerUrl;
    return null;
  };

  const imageSource = getImageSource();

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {imageLoading && (
        <CourseImageSkeleton className="absolute inset-0 z-10" />
      )}

      {imageSource && !imageError ? (
        <Image
          src={imageSource}
          alt={title}
          fill
          className={cn(
            "object-cover transition-all duration-500 group-hover:scale-105",
            imageLoading ? "opacity-0" : "opacity-100",
          )}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          loading={priority ? "eager" : "lazy"}
          priority={priority}
          quality={85}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900">
          <BookOpen className="h-16 w-16 text-gray-400 dark:text-gray-600" />
        </div>
      )}

      {/* Video indicator for intro videos */}
      {media.introVideoUrl && (
        <div className="absolute bottom-3 left-3">
          <Badge
            variant="secondary"
            className="border-0 bg-black/70 text-white"
          >
            <FileVideo className="mr-1 h-3 w-3" />
            Preview
          </Badge>
        </div>
      )}
    </div>
  );
};

// Difficulty level styling
const difficultyConfig = {
  beginner: {
    color:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    icon: "🌱",
    label: "Beginner",
  },
  intermediate: {
    color:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    icon: "⚡",
    label: "Intermediate",
  },
  advanced: {
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    icon: "🔥",
    label: "Advanced",
  },
  expert: {
    color:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    icon: "💎",
    label: "Expert",
  },
};

// Category color mapping
const categoryColors = {
  development:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  design: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  marketing:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  business:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  technology:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  default: "bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300",
};

const CourseCard: React.FC<CourseCardProps> = React.memo(
  ({
    course,
    variant = "default",
    showProgress = false,
    className,
    onClick,
  }) => {
    const difficultyInfo =
      difficultyConfig[course.difficulty] || difficultyConfig.beginner;
    const categoryColor =
      categoryColors[
        course.category.toLowerCase() as keyof typeof categoryColors
      ] || categoryColors.default;

    const handleCardClick = useCallback(() => {
      onClick?.(course);
    }, [onClick, course]);

    return (
      <div
        className={cn(
          "group relative cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 ease-out hover:shadow-lg dark:border-gray-700 dark:bg-gray-800",
          variant === "compact" && "p-4",
          variant === "featured" &&
            "shadow-lg ring-2 ring-blue-500/20 dark:ring-blue-400/20",
          variant === "default" && "p-6",
          className,
        )}
        onClick={handleCardClick}
      >
        {/* Enhanced Course Image with Media Assets */}
        <div className="relative mb-4 h-48 overflow-hidden rounded-lg">
          <CourseImage
            media={course.media}
            title={course.title}
            className="h-full w-full"
            priority={variant === "featured"}
          />

          {/* Price Badge */}
          {course.pricing && (
            <div className="absolute top-3 right-3">
              <Badge className="border-0 bg-white/95 font-semibold text-gray-900 shadow-sm backdrop-blur-sm">
                {course.pricing.isFree
                  ? "Free"
                  : formatPrice(course.pricing.price ?? 0)}
              </Badge>
            </div>
          )}

          {/* Featured Badge */}
          {variant === "featured" && (
            <div className="absolute top-3 left-3">
              <Badge className="border-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-sm">
                ⭐ Featured
              </Badge>
            </div>
          )}
        </div>

        {/* Course Content */}
        <div className="space-y-4">
          {/* Category and Difficulty */}
          <div className="flex items-center justify-between">
            <Badge variant="outline" className={cn("text-xs", categoryColor)}>
              {course.category}
            </Badge>
            <Badge
              variant="outline"
              className={cn("text-xs", difficultyInfo.color)}
            >
              <span className="mr-1">{difficultyInfo.icon}</span>
              {difficultyInfo.label}
            </Badge>
          </div>

          {/* Course Title */}
          <h3 className="text-lg leading-tight font-semibold text-gray-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
            {truncateText(course.title, 60)}
          </h3>

          {/* Course Description */}
          {course.shortDescription && (
            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              {truncateText(course.shortDescription, 120)}
            </p>
          )}

          {/* Enhanced Course Metadata with Modern Icons */}
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
            {course.estimatedDuration > 0 && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{course.estimatedDuration}h</span>
              </div>
            )}
            {course.lessonsCount > 0 && (
              <div className="flex items-center gap-1">
                <Play className="h-3 w-3" />
                <span>{course.lessonsCount} lessons</span>
              </div>
            )}
            {course.stats?.enrollmentCount > 0 && (
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>
                  {course.stats.enrollmentCount.toLocaleString()} students
                </span>
              </div>
            )}
            {course.stats?.averageRating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>{course.stats.averageRating.toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* Progress Bar (if applicable) */}
          {showProgress && course.progress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">
                  Progress
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {Math.round(course.progress.progressPercentage)}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 dark:from-blue-400 dark:to-blue-500"
                  style={{ width: `${course.progress.progressPercentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Enhanced Author Information with Modern Avatar */}
          <div className="flex items-center gap-3 border-t border-gray-100 pt-3 dark:border-gray-700">
            <Avatar className="h-9 w-9 ring-2 ring-gray-100 dark:ring-gray-700">
              {course.author.avatarUrl ? (
                <Image
                  src={course.author.avatarUrl}
                  alt={course.author.name}
                  width={36}
                  height={36}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500 text-sm font-medium text-white">
                  {course.author.name.charAt(0).toUpperCase()}
                </div>
              )}
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                {course.author.name}
              </p>
              {course.author.title && (
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                  {course.author.title}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  },
);

CourseCard.displayName = "CourseCard";

export default CourseCard;
