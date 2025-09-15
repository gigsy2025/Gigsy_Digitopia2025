"use client";

import React from "react";
import type { CourseSummary } from "@/types/courses";
import CourseCard from "./CourseCard";

interface VirtualizedCourseListProps {
  courses: CourseSummary[];
  height: number;
  itemsPerRow?: number;
  showProgress?: boolean;
  onCourseClick?: (course: CourseSummary) => void;
  className?: string;
}

/**
 * Virtualized Course List Component
 *
 * Temporary implementation using simple grid layout instead of react-window
 * TODO: Fix react-window import when package compatibility issue is resolved
 */
const VirtualizedCourseList: React.FC<VirtualizedCourseListProps> = ({
  courses,
  height,
  itemsPerRow = 3,
  showProgress = false,
  onCourseClick,
  className,
}) => {
  if (courses.length === 0) {
    return (
      <div className={className} style={{ height }}>
        <div className="flex h-full items-center justify-center text-gray-500">
          No courses found
        </div>
      </div>
    );
  }

  return (
    <div
      className={`overflow-y-auto ${className}`}
      style={{ height, maxHeight: height }}
    >
      <div
        className="grid gap-6 p-6"
        style={{
          gridTemplateColumns: `repeat(${itemsPerRow}, 1fr)`,
        }}
      >
        {courses.map((course) => (
          <div key={course._id} className="min-w-0">
            <CourseCard
              course={course}
              showProgress={showProgress}
              onClick={onCourseClick}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default React.memo(VirtualizedCourseList);
