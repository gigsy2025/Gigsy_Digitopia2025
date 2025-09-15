// Core course components
export { default as CourseCard } from "./CourseCard";
export { default as CourseFilters } from "./CourseFilters";
export { default as CourseList } from "./CourseList";

// Re-export types from the main types file
export type {
  CourseFiltersType,
  CourseSummary,
  SortOption,
  CourseCardProps,
  CourseListProps,
} from "@/types/courses";
