"use client";

import React, { useState, useCallback, useMemo } from "react";
import { cva } from "class-variance-authority";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type {
  CourseCategoryType,
  CourseDifficultyLevel,
  SortOption,
  CourseFiltersType,
} from "@/types/courses";

interface CourseFiltersProps {
  filters: CourseFiltersType;
  onFiltersChange: (filters: CourseFiltersType) => void;
  totalResults?: number;
  layout?: "horizontal" | "vertical";
  showQuickFilters?: boolean;
  showAdvancedFilters?: boolean;
  className?: string;
}
import {
  Search,
  X,
  ChevronDown,
  Star,
  Clock,
  Users,
  DollarSign,
  SlidersHorizontal,
  Zap,
} from "lucide-react";

// Filter section variants
const filterSectionVariants = cva("space-y-3", {
  variants: {
    layout: {
      vertical: "w-full",
      horizontal: "flex flex-wrap items-center gap-4",
      compact: "space-y-2",
    },
  },
  defaultVariants: {
    layout: "vertical",
  },
});

// Quick filter chips
const quickFilterChips = [
  { key: "free", label: "Free Courses", icon: DollarSign },
  { key: "new", label: "New Releases", icon: Zap },
  { key: "popular", label: "Most Popular", icon: Users },
  { key: "highly-rated", label: "Highly Rated", icon: Star },
  { key: "short", label: "Quick Learn", icon: Clock },
];

// Category options with icons and colors
const categoryOptions = [
  {
    value: "development" as CourseCategoryType,
    label: "Development",
    icon: "💻",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  },
  {
    value: "design" as CourseCategoryType,
    label: "Design",
    icon: "🎨",
    color: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  },
  {
    value: "marketing" as CourseCategoryType,
    label: "Marketing",
    icon: "📈",
    color:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  },
  {
    value: "business" as CourseCategoryType,
    label: "Business",
    icon: "💼",
    color:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  },
  {
    value: "technology" as CourseCategoryType,
    label: "Technology",
    icon: "⚡",
    color:
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  },
];

// Difficulty options
const difficultyOptions = [
  {
    value: "beginner" as CourseDifficultyLevel,
    label: "Beginner",
    icon: "🌱",
    description: "Perfect for getting started",
  },
  {
    value: "intermediate" as CourseDifficultyLevel,
    label: "Intermediate",
    icon: "⚡",
    description: "Build on existing knowledge",
  },
  {
    value: "advanced" as CourseDifficultyLevel,
    label: "Advanced",
    icon: "🔥",
    description: "Master complex concepts",
  },
  {
    value: "expert" as CourseDifficultyLevel,
    label: "Expert",
    icon: "💎",
    description: "Professional mastery level",
  },
];

// Sort options
const sortOptions = [
  {
    value: "relevance" as SortOption,
    label: "Most Relevant",
    description: "Best match for your search",
  },
  {
    value: "newest" as SortOption,
    label: "Newest First",
    description: "Latest courses",
  },
  {
    value: "popular" as SortOption,
    label: "Most Popular",
    description: "Highest enrollment",
  },
  {
    value: "rating" as SortOption,
    label: "Highest Rated",
    description: "Best reviewed courses",
  },
  {
    value: "price_low" as SortOption,
    label: "Price: Low to High",
    description: "Most affordable first",
  },
  {
    value: "price_high" as SortOption,
    label: "Price: High to Low",
    description: "Premium courses first",
  },
];

// Utility functions for handling priceRange union type
const getPriceRangeValues = (
  priceRange?: [number, number] | { min: number; max: number },
): [number, number] | null => {
  if (!priceRange) return null;
  if (Array.isArray(priceRange)) {
    return priceRange;
  }
  return [priceRange.min, priceRange.max];
};

const isPriceRangeEqual = (
  priceRange: [number, number] | { min: number; max: number } | undefined,
  min: number,
  max: number,
): boolean => {
  const values = getPriceRangeValues(priceRange);
  return values ? values[0] === min && values[1] === max : false;
};

const CourseFilters: React.FC<CourseFiltersProps> = ({
  filters,
  onFiltersChange,
  totalResults,
  layout = "vertical",
  showQuickFilters = true,
  showAdvancedFilters = true,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState(
    filters.searchTerm || "",
  );

  // Debounced search handler
  const debouncedSearch = useCallback(() => {
    let timeout: NodeJS.Timeout;
    return (searchTerm: string) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        onFiltersChange({ ...filters, searchTerm, page: 1 });
      }, 300);
    };
  }, [filters, onFiltersChange])();

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearchTerm(value);
    debouncedSearch(value);
  };

  // Handle filter changes
  const handleFilterChange = <K extends keyof CourseFiltersType>(
    key: K,
    value: CourseFiltersType[K],
  ) => {
    onFiltersChange({
      ...filters,
      [key]: value,
      page: 1, // Reset to first page when filters change
    });
  };

  // Handle quick filter toggle
  const handleQuickFilterToggle = (filterKey: string) => {
    const updatedFilters = { ...filters };

    switch (filterKey) {
      case "free":
        updatedFilters.priceRange = isPriceRangeEqual(filters.priceRange, 0, 0)
          ? undefined
          : [0, 0];
        break;
      case "new":
        updatedFilters.isNew = !filters.isNew;
        break;
      case "popular":
        updatedFilters.sortBy =
          filters.sortBy === "popular" ? "relevance" : "popular";
        break;
      case "highly-rated":
        updatedFilters.minRating = filters.minRating === 4.5 ? undefined : 4.5;
        break;
      case "short":
        updatedFilters.maxDuration = filters.maxDuration === 3 ? undefined : 3; // 3 hours
        break;
    }

    onFiltersChange({ ...updatedFilters, page: 1 });
  };

  // Clear all filters
  const clearAllFilters = () => {
    onFiltersChange({
      searchTerm: "",
      sortBy: "relevance",
      page: 1,
    });
    setLocalSearchTerm("");
  };

  // Check if quick filter is active
  const isQuickFilterActive = (filterKey: string): boolean => {
    switch (filterKey) {
      case "free":
        return isPriceRangeEqual(filters.priceRange, 0, 0);
      case "new":
        return !!filters.isNew;
      case "popular":
        return filters.sortBy === "popular";
      case "highly-rated":
        return filters.minRating === 4.5;
      case "short":
        return filters.maxDuration === 3;
      default:
        return false;
    }
  };

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.categories?.length) count++;
    if (filters.difficulties?.length) count++;
    if (filters.priceRange) count++;
    if (filters.minRating) count++;
    if (filters.maxDuration) count++;
    if (filters.isNew) count++;
    if (filters.isFeatured) count++;
    if (filters.instructorId) count++;
    return count;
  }, [filters]);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
        <Input
          type="text"
          placeholder="Search courses..."
          value={localSearchTerm}
          onChange={handleSearchChange}
          className="h-11 pr-4 pl-10 text-base"
        />
        {localSearchTerm && (
          <button
            onClick={() => {
              setLocalSearchTerm("");
              handleFilterChange("searchTerm", "");
            }}
            className="absolute top-1/2 right-3 -translate-y-1/2 transform text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Results Count and Sort */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {totalResults !== undefined && (
            <span>
              {totalResults.toLocaleString()} course
              {totalResults !== 1 ? "s" : ""} found
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Sort Dropdown */}
          <div className="relative">
            <Label htmlFor="sort-select" className="sr-only">
              Sort courses
            </Label>
            <select
              id="sort-select"
              value={filters.sortBy ?? "relevance"}
              onChange={(e) =>
                handleFilterChange("sortBy", e.target.value as SortOption)
              }
              className="appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2 pr-8 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
          </div>

          {/* Filter Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="relative"
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge className="ml-2 h-5 min-w-[20px] bg-blue-600 px-1 text-xs text-white">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Quick Filters */}
      {showQuickFilters && (
        <div className="flex flex-wrap gap-2">
          {quickFilterChips.map((chip) => {
            const Icon = chip.icon;
            const isActive = isQuickFilterActive(chip.key);

            return (
              <Button
                key={chip.key}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => handleQuickFilterToggle(chip.key)}
                className={cn(
                  "h-8 text-xs",
                  isActive && "bg-blue-600 text-white hover:bg-blue-700",
                )}
              >
                <Icon className="mr-1 h-3 w-3" />
                {chip.label}
              </Button>
            );
          })}
        </div>
      )}

      {/* Advanced Filters (Collapsible) */}
      {showAdvancedFilters && (
        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out",
            isExpanded ? "max-h-none opacity-100" : "max-h-0 opacity-0",
          )}
        >
          <div
            className={cn(
              filterSectionVariants({ layout }),
              "border-t border-gray-200 pt-4 dark:border-gray-700",
            )}
          >
            {/* Categories */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-900 dark:text-white">
                Categories
              </Label>
              <div className="flex flex-wrap gap-2">
                {categoryOptions.map((category) => {
                  const isSelected = filters.categories?.includes(
                    category.value,
                  );

                  return (
                    <Button
                      key={category.value}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        const currentCategories = filters.categories ?? [];
                        const newCategories = isSelected
                          ? currentCategories.filter(
                              (c) => c !== category.value,
                            )
                          : [...currentCategories, category.value];
                        handleFilterChange(
                          "categories",
                          newCategories.length ? newCategories : undefined,
                        );
                      }}
                      className={cn(
                        "h-8 text-xs",
                        isSelected &&
                          "bg-blue-600 text-white hover:bg-blue-700",
                      )}
                    >
                      <span className="mr-1">{category.icon}</span>
                      {category.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Difficulty Levels */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-900 dark:text-white">
                Difficulty Level
              </Label>
              <div className="flex flex-wrap gap-2">
                {difficultyOptions.map((difficulty) => {
                  const isSelected = filters.difficulties?.includes(
                    difficulty.value,
                  );

                  return (
                    <Button
                      key={difficulty.value}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        const currentDifficulties = filters.difficulties ?? [];
                        const newDifficulties = isSelected
                          ? currentDifficulties.filter(
                              (d) => d !== difficulty.value,
                            )
                          : [...currentDifficulties, difficulty.value];
                        handleFilterChange(
                          "difficulties",
                          newDifficulties.length ? newDifficulties : undefined,
                        );
                      }}
                      className={cn(
                        "h-8 text-xs",
                        isSelected &&
                          "bg-blue-600 text-white hover:bg-blue-700",
                      )}
                      title={difficulty.description}
                    >
                      <span className="mr-1">{difficulty.icon}</span>
                      {difficulty.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Price Range */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-900 dark:text-white">
                Price Range
              </Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={
                    isPriceRangeEqual(filters.priceRange, 0, 0)
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => handleFilterChange("priceRange", [0, 0])}
                  className="h-8 text-xs"
                >
                  Free
                </Button>
                <Button
                  variant={
                    isPriceRangeEqual(filters.priceRange, 1, 50)
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => handleFilterChange("priceRange", [1, 50])}
                  className="h-8 text-xs"
                >
                  $1 - $50
                </Button>
                <Button
                  variant={
                    isPriceRangeEqual(filters.priceRange, 51, 100)
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => handleFilterChange("priceRange", [51, 100])}
                  className="h-8 text-xs"
                >
                  $51 - $100
                </Button>
                <Button
                  variant={
                    isPriceRangeEqual(filters.priceRange, 101, 1000)
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => handleFilterChange("priceRange", [101, 1000])}
                  className="h-8 text-xs"
                >
                  $100+
                </Button>
              </div>
            </div>

            {/* Clear Filters */}
            {activeFiltersCount > 0 && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {activeFiltersCount} filter
                    {activeFiltersCount !== 1 ? "s" : ""} applied
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Clear all
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseFilters;
