/**
 * COURSE HERO COMPONENT
 *
 * Hero section for course detail pages featuring cover image,
 * title, description, author info, and enrollment CTA.
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-09-20
 */

"use client";

import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AvatarStackWrapper } from "@/components/ui/AvatarStackWrapper";
import { ProgressRadial } from "@/components/ui/ProgressRadial";
import { cn } from "@/lib/utils";
import {
  formatDuration,
  formatPrice,
  formatDifficulty,
  formatCategory,
  formatNumber,
} from "@/utils/format";
import {
  Clock,
  Users,
  Star,
  BookOpen,
  PlayCircle,
  Award,
  Download,
  Share2,
  Heart,
  CheckCircle,
} from "lucide-react";
import type { Course } from "@/types/course";

interface CourseHeroProps {
  course: Course;
  isEnrolled?: boolean;
  userProgress?: number;
  onEnroll?: () => void;
  onContinue?: () => void;
  onShare?: () => void;
  onWishlist?: () => void;
  className?: string;
}

export const CourseHero: React.FC<CourseHeroProps> = ({
  course,
  isEnrolled = false,
  userProgress = 0,
  onEnroll,
  onContinue,
  onShare,
  onWishlist,
  className,
}) => {
  const stats = course.stats;
  const hasTrailer = Boolean(course.trailerVideoUrl);
  const estimatedHours = course.estimatedDurationMinutes
    ? Math.ceil(course.estimatedDurationMinutes / 60)
    : 0;

  return (
    <section
      className={cn(
        "from-background via-background to-muted/30 relative overflow-hidden bg-gradient-to-br",
        className,
      )}
    >
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Left Column - Course Info */}
          <div className="space-y-6">
            {/* Categories and Difficulty */}
            <div className="flex flex-wrap items-center gap-2">
              {course.category && (
                <Badge variant="secondary" className="text-sm">
                  {formatCategory(course.category)}
                </Badge>
              )}
              {course.difficulty && (
                <Badge variant="outline" className="text-sm">
                  {formatDifficulty(course.difficulty)}
                </Badge>
              )}
              {course.isFree && (
                <Badge className="bg-green-600 text-white hover:bg-green-700">
                  Free Course
                </Badge>
              )}
            </div>

            {/* Title and Description */}
            <div className="space-y-4">
              <h1 className="text-foreground text-4xl font-bold tracking-tight lg:text-5xl">
                {course.title}
              </h1>

              {course.shortDescription && (
                <p className="text-muted-foreground text-xl leading-relaxed">
                  {course.shortDescription}
                </p>
              )}
            </div>

            {/* Authors */}
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground text-sm font-medium">
                Created by:
              </span>
              <AvatarStackWrapper
                authors={course.authors}
                maxVisible={3}
                size="md"
                showTooltip={true}
              />
            </div>

            {/* Course Stats */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {estimatedHours > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="text-muted-foreground h-4 w-4" />
                  <span>{estimatedHours}h total</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm">
                <BookOpen className="text-muted-foreground h-4 w-4" />
                <span>{course.totalLessons} lessons</span>
              </div>

              {stats?.enrolledCount && (
                <div className="flex items-center gap-2 text-sm">
                  <Users className="text-muted-foreground h-4 w-4" />
                  <span>{formatNumber(stats.enrolledCount)} students</span>
                </div>
              )}

              {stats?.averageRating && (
                <div className="flex items-center gap-2 text-sm">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>
                    {stats.averageRating.toFixed(1)} ({stats.totalReviews})
                  </span>
                </div>
              )}
            </div>

            {/* Learning Outcomes */}
            {course.learningOutcomes && course.learningOutcomes.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">What you'll learn</h3>
                <ul className="space-y-2">
                  {course.learningOutcomes.slice(0, 4).map((outcome, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                      <span>{outcome}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {isEnrolled ? (
                <div className="flex items-center gap-3">
                  <Button
                    size="lg"
                    onClick={onContinue}
                    className="min-w-[140px]"
                  >
                    <PlayCircle className="mr-2 h-5 w-5" />
                    Continue Learning
                  </Button>
                  {userProgress > 0 && (
                    <div className="text-muted-foreground flex items-center gap-2 text-sm">
                      <ProgressRadial
                        value={userProgress}
                        size="sm"
                        showPercentage={false}
                      />
                      <span>{userProgress}% complete</span>
                    </div>
                  )}
                </div>
              ) : (
                <Button size="lg" onClick={onEnroll} className="min-w-[140px]">
                  {course.isFree
                    ? "Enroll Free"
                    : `Enroll for ${formatPrice(course.price ?? 0)}`}
                </Button>
              )}

              <Button variant="outline" size="lg" onClick={onShare}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>

              <Button variant="outline" size="lg" onClick={onWishlist}>
                <Heart className="mr-2 h-4 w-4" />
                Save
              </Button>
            </div>

            {/* Certificate Available */}
            {course.certificate?.available && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                <Award className="h-5 w-5" />
                <span className="text-sm font-medium">
                  Certificate of completion included
                </span>
              </div>
            )}
          </div>

          {/* Right Column - Media and Course Card */}
          <div className="space-y-6">
            {/* Course Preview/Cover */}
            <Card className="overflow-hidden">
              <div className="relative aspect-video">
                {course.coverImage ? (
                  <Image
                    src={course.coverImage}
                    alt={course.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                  />
                ) : (
                  <div className="from-muted to-muted/50 flex h-full w-full items-center justify-center bg-gradient-to-br">
                    <BookOpen className="text-muted-foreground h-16 w-16" />
                  </div>
                )}

                {/* Trailer Play Button */}
                {hasTrailer && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button
                      variant="secondary"
                      size="lg"
                      className="bg-black/80 text-white hover:bg-black/90"
                    >
                      <PlayCircle className="mr-2 h-6 w-6" />
                      Preview Course
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {/* Course Info Card */}
            <Card>
              <CardContent className="space-y-4 p-6">
                {/* Price */}
                <div className="text-center">
                  {course.isFree ? (
                    <div className="text-3xl font-bold text-green-600">
                      Free
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="text-3xl font-bold">
                        {formatPrice(course.price ?? 0)}
                      </div>
                      {course.currency && (
                        <div className="text-muted-foreground text-sm">
                          One-time payment
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Course includes */}
                <div className="space-y-3 border-t pt-4">
                  <h4 className="font-semibold">This course includes:</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <PlayCircle className="text-muted-foreground h-4 w-4" />
                      <span>{course.totalLessons} on-demand lessons</span>
                    </li>
                    {estimatedHours > 0 && (
                      <li className="flex items-center gap-2">
                        <Clock className="text-muted-foreground h-4 w-4" />
                        <span>{estimatedHours} hours of video content</span>
                      </li>
                    )}
                    <li className="flex items-center gap-2">
                      <Download className="text-muted-foreground h-4 w-4" />
                      <span>Downloadable resources</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Users className="text-muted-foreground h-4 w-4" />
                      <span>Full lifetime access</span>
                    </li>
                    {course.certificate?.available && (
                      <li className="flex items-center gap-2">
                        <Award className="text-muted-foreground h-4 w-4" />
                        <span>Certificate of completion</span>
                      </li>
                    )}
                  </ul>
                </div>

                {/* Tags/Skills */}
                {course.skills && course.skills.length > 0 && (
                  <div className="space-y-2 border-t pt-4">
                    <h4 className="text-sm font-semibold">
                      Skills you'll gain:
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {course.skills.slice(0, 6).map((skill, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CourseHero;
