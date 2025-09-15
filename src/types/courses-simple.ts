/**
 * Simple course types for immediate resolution
 */

/**
 * Course difficulty levels for skill progression
 */
export type CourseDifficultyLevel =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "expert";

/**
 * Course categories for organization and filtering
 */
export type CourseCategoryType =
  | "development"
  | "design"
  | "marketing"
  | "writing"
  | "data"
  | "business"
  | "creative"
  | "technology"
  | "soft-skills"
  | "languages";

/**
 * Sort options for course listings
 */
export type SortOption =
  | "relevance"
  | "newest"
  | "popular"
  | "rating"
  | "price_low"
  | "price_high"
  | "title"
  | "date";

/**
 * Course filters interface for search and filtering
 */
export interface CourseFilters {
  /** Search term */
  searchTerm?: string;

  /** Selected categories */
  categories?: CourseCategoryType[];

  /** Selected difficulty levels */
  difficulties?: CourseDifficultyLevel[];

  /** Sort criteria */
  sortBy?: SortOption;

  /** Price range filter */
  priceRange?: [number, number];

  /** Minimum rating filter */
  minRating?: number;

  /** Maximum duration filter (hours) */
  maxDuration?: number;

  /** Show only new courses */
  isNew?: boolean;

  /** Show only featured courses */
  isFeatured?: boolean;

  /** Filter by instructor */
  instructorId?: string;

  /** Current page number */
  page?: number;

  /** Items per page */
  limit?: number;

  /** Additional statuses to filter by */
  statuses?: string[];

  /** Offset for pagination */
  offset?: number;
}

/**
 * Type alias for compatibility
 */
export type CourseFiltersType = CourseFilters;

/**
 * Course filters component props
 */
export interface CourseFiltersProps {
  /** Current filters */
  filters: CourseFilters;

  /** Filter change handler */
  onFiltersChange: (filters: CourseFilters) => void;

  /** Total results count */
  totalResults?: number;

  /** Layout variant */
  layout?: "horizontal" | "vertical";

  /** Show quick filters */
  showQuickFilters?: boolean;

  /** Show advanced filters */
  showAdvancedFilters?: boolean;
}

/**
 * Course summary for display in lists and cards
 */
export interface CourseSummary {
  id: string;
  title: string;
  description: string;
  shortDescription?: string;
  category?: string;
  difficulty?: string;
  status?: string;
  estimatedDuration?: number;
  pricing?: {
    isFree: boolean;
    price?: number;
    currency?: string;
    discountPercentage?: number;
    originalPrice?: number;
    paymentType?: string;
  };
  enrollmentCount?: number;
  rating?: number;
  reviewCount?: number;
  featured?: boolean;
  trending?: boolean;
  isNew?: boolean;
  modules?: Array<{
    id: string;
    title: string;
    description?: string;
    estimatedDuration?: number;
    lessonCount?: number;
  }>;
  author?: {
    name: string;
    title?: string;
    bio?: string;
    avatar?: string;
  };
  userProgress?: number;
}
