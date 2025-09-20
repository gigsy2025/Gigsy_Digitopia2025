/**
 * COURSE SUMMARY CARD COMPONENT
 *
 * Compact course information card for quick overview,
 * featuring key stats, enrollment status, and actions.
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-09-20
 */

"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AvatarStackWrapper } from "@/components/ui/AvatarStackWrapper";
import { cn } from "@/lib/utils";
import { formatPrice, formatNumber, formatDifficulty } from "@/utils/format";
import { formatDuration } from "@/utils/time";
import {
  Clock,
  Users,
  Star,
  BookOpen,
  Award,
  PlayCircle,
  CheckCircle,
  Heart,
  Share2,
} from "lucide-react";
import type { Course } from "@/types/course";

interface CourseSummaryCardProps {
  course: Course;
  isEnrolled?: boolean;
  userProgress?: number;
  showActions?: boolean;
  compact?: boolean;
  className?: string;
  onEnroll?: () => void;
  onContinue?: () => void;
  onShare?: () => void;
  onWishlist?: () => void;
}

export const CourseSummaryCard: React.FC<CourseSummaryCardProps> = ({
  course,
  isEnrolled = false,
  userProgress = 0,
  showActions = true,
  compact = false,
  className,
  onEnroll,
  onContinue,
  onShare,
  onWishlist,
}) => {
  const stats = course.stats;
  const estimatedHours = course.estimatedDurationMinutes
    ? Math.ceil(course.estimatedDurationMinutes / 60)
    : 0;

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className={cn("pb-4", compact && "pb-2")}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle
              className={cn(
                "line-clamp-2 leading-tight",
                compact && "text-base",
              )}
            >
              {course.title}
            </CardTitle>

            {!compact && course.shortDescription && (
              <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">
                {course.shortDescription}
              </p>
            )}
          </div>

          {/* Price/Free Badge */}
          <div className="flex-shrink-0">
            {course.isFree ? (
              <Badge className="bg-green-600 text-white">Free</Badge>
            ) : (
              <div className="text-right">
                <div className="text-lg font-bold">
                  {formatPrice(course.price ?? 0)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Categories and Difficulty */}
        <div className="flex flex-wrap items-center gap-2">
          {course.category && (
            <Badge variant="secondary" className="text-xs">
              {course.category}
            </Badge>
          )}
          {course.difficulty && (
            <Badge variant="outline" className="text-xs">
              {formatDifficulty(course.difficulty)}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Authors */}
        {!compact && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">By:</span>
            <AvatarStackWrapper
              authors={course.authors}
              maxVisible={2}
              size="sm"
            />
          </div>
        )}

        {/* Course Stats */}
        <div
          className={cn(
            "grid gap-3 text-sm",
            compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4",
          )}
        >
          {estimatedHours > 0 && (
            <div className="flex items-center gap-1.5">
              <Clock className="text-muted-foreground h-4 w-4" />
              <span>{estimatedHours}h</span>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <BookOpen className="text-muted-foreground h-4 w-4" />
            <span>{course.totalLessons} lessons</span>
          </div>

          {stats?.enrolledCount && (
            <div className="flex items-center gap-1.5">
              <Users className="text-muted-foreground h-4 w-4" />
              <span>{formatNumber(stats.enrolledCount)}</span>
            </div>
          )}

          {stats?.averageRating && (
            <div className="flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>{stats.averageRating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* User Progress */}
        {isEnrolled && userProgress > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{userProgress}% complete</span>
            </div>
            <Progress value={userProgress} className="h-2" />
          </div>
        )}

        {/* Skills Preview */}
        {!compact && course.skills && course.skills.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Skills you'll learn:</div>
            <div className="flex flex-wrap gap-1">
              {course.skills.slice(0, 3).map((skill, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {course.skills.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{course.skills.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Certificate Badge */}
        {course.certificate?.available && !compact && (
          <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
            <Award className="h-4 w-4" />
            <span>Certificate included</span>
          </div>
        )}

        {/* Action Buttons */}
        {showActions && (
          <div className="flex flex-wrap gap-2 pt-2">
            {isEnrolled ? (
              <Button onClick={onContinue} className="min-w-[120px] flex-1">
                <PlayCircle className="mr-2 h-4 w-4" />
                Continue
              </Button>
            ) : (
              <Button onClick={onEnroll} className="min-w-[120px] flex-1">
                {course.isFree ? "Enroll Free" : "Enroll Now"}
              </Button>
            )}

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onShare}>
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={onWishlist}>
                <Heart className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Quick Features List */}
        {!compact && (
          <div className="text-muted-foreground grid grid-cols-2 gap-2 border-t pt-3 text-xs">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              <span>Lifetime access</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              <span>Mobile friendly</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              <span>Downloadable resources</span>
            </div>
            {course.certificate?.available && (
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                <span>Certificate</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CourseSummaryCard;
