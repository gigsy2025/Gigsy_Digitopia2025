"use client";

import React from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { cn, formatPrice, truncateText } from "@/lib/utils";
import type { CourseCardProps } from "@/types/courses";
import { 
  Clock, 
  Users, 
  Star, 
  BookOpen, 
  Play
} from "lucide-react";

// Difficulty level styling
const difficultyConfig = {
  "beginner": {
    color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    icon: "🌱",
    label: "Beginner"
  },
  "intermediate": {
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    icon: "⚡",
    label: "Intermediate"
  },
  "advanced": {
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    icon: "🔥",
    label: "Advanced"
  },
  "expert": {
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    icon: "💎",
    label: "Expert"
  },
};

// Category color mapping
const categoryColors = {
  "development": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  "design": "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  "marketing": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  "business": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  "technology": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  "default": "bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300",
};

const CourseCard: React.FC<CourseCardProps> = React.memo(({
  course,
  variant = "default",
  showProgress = false,
  className,
  onClick,
}) => {
  const difficultyInfo = difficultyConfig[course.difficulty] || difficultyConfig.beginner;
  const categoryColor = categoryColors[course.category.toLowerCase() as keyof typeof categoryColors] || categoryColors.default;

  const handleCardClick = () => {
    onClick?.(course);
  };

  return (
    <div 
      className={cn(
        "group relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 ease-out overflow-hidden cursor-pointer p-6",
        variant === "compact" && "p-4",
        variant === "featured" && "ring-2 ring-blue-500/20 dark:ring-blue-400/20 shadow-lg",
        className
      )}
      onClick={handleCardClick}
    >
      {/* Course Image */}
      <div className="relative h-48 mb-4 rounded-lg overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900">
        {course.thumbnailUrl ? (
          <Image
            src={course.thumbnailUrl}
            alt={course.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            loading="lazy"
            quality={85}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-16 h-16 text-gray-400 dark:text-gray-600" />
          </div>
        )}

        {/* Price Badge */}
        {course.pricing && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-white/90 text-gray-900 border-0 font-semibold">
              {course.pricing.isFree ? "Free" : formatPrice(course.pricing.price ?? 0)}
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
          <Badge variant="outline" className={cn("text-xs", difficultyInfo.color)}>
            <span className="mr-1">{difficultyInfo.icon}</span>
            {difficultyInfo.label}
          </Badge>
        </div>

        {/* Course Title */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {truncateText(course.title, 60)}
        </h3>

        {/* Course Description */}
        {course.shortDescription && (
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            {truncateText(course.shortDescription, 120)}
          </p>
        )}

        {/* Course Metadata */}
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          {course.estimatedDuration > 0 && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{course.estimatedDuration}h</span>
            </div>
          )}
          {course.lessonsCount > 0 && (
            <div className="flex items-center gap-1">
              <Play className="w-3 h-3" />
              <span>{course.lessonsCount} lessons</span>
            </div>
          )}
          {course.stats.enrollmentCount > 0 && (
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{course.stats.enrollmentCount.toLocaleString()} students</span>
            </div>
          )}
          {course.stats.averageRating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span>{course.stats.averageRating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Progress Bar (if applicable) */}
        {showProgress && course.progress && (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-600 dark:text-gray-400">Progress</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {Math.round(course.progress.progressPercentage)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${course.progress.progressPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Author Information */}
        <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
          <Avatar className="w-8 h-8">
            {course.author.avatarUrl ? (
              <Image
                src={course.author.avatarUrl}
                alt={course.author.name}
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                {course.author.name.charAt(0).toUpperCase()}
              </div>
            )}
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {course.author.name}
            </p>
            {course.author.title && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {course.author.title}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

CourseCard.displayName = "CourseCard";

export default CourseCard;