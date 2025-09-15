"use client";

import React from "react";
import { useMemo, useCallback } from "react";
import type {
  CourseSummary,
  CourseFiltersType,
  CourseCategoryType,
  CourseDifficultyLevel,
} from "@/types/courses";

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const CACHE_SIZE_LIMIT = 1000; // Maximum number of cached items

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hits: number;
}

class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;

  constructor(maxSize: number = CACHE_SIZE_LIMIT) {
    this.maxSize = maxSize;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if cache entry is expired
    if (Date.now() - entry.timestamp > CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    // Update hit count and move to end (most recently used)
    entry.hits++;
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.data;
  }

  set(key: string, data: T): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      hits: 0,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      totalHits: Array.from(this.cache.values()).reduce(
        (sum, entry) => sum + entry.hits,
        0,
      ),
    };
  }
}

// Global cache instances
const courseCache = new LRUCache<CourseSummary[]>();
const filterCache = new LRUCache<CourseSummary[]>();

// Utility functions for performance optimization
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number,
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number,
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};

// Memoized course filtering
export const useOptimizedCourseFiltering = (
  courses: CourseSummary[],
  filters: CourseFiltersType,
) => {
  const filteredCourses = useMemo(() => {
    // Create cache key from filters
    const cacheKey = JSON.stringify({
      search: filters.search,
      categories: filters.categories,
      difficulties: filters.difficulties,
      priceRange: filters.priceRange,
      duration: filters.duration,
      rating: filters.rating,
      isFree: filters.isFree,
      sortBy: filters.sortBy,
      coursesLength: courses.length,
    });

    // Check cache first
    const cached = filterCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Apply filters
    let filtered = courses.filter((course) => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const searchMatch =
          course.title.toLowerCase().includes(searchTerm) ||
          course.shortDescription?.toLowerCase().includes(searchTerm) ||
          course.author.name.toLowerCase().includes(searchTerm) ||
          course.category.toLowerCase().includes(searchTerm);

        if (!searchMatch) return false;
      }

      // Category filter
      if (filters.categories && filters.categories.length > 0) {
        if (!filters.categories.includes(course.category as CourseCategoryType))
          return false;
      }

      // Difficulty filter
      if (filters.difficulties && filters.difficulties.length > 0) {
        if (
          !filters.difficulties.includes(
            course.difficulty as CourseDifficultyLevel,
          )
        )
          return false;
      }

      // Price filter
      if (filters.isFree !== undefined) {
        const isFree = course.pricing?.isFree ?? false;
        if (filters.isFree !== isFree) return false;
      }

      if (filters.priceRange) {
        const price = course.pricing?.price ?? 0;
        const priceRange = Array.isArray(filters.priceRange)
          ? { min: filters.priceRange[0], max: filters.priceRange[1] }
          : filters.priceRange;

        if (price < priceRange.min || price > priceRange.max) return false;
      }

      // Duration filter
      if (filters.duration) {
        if (
          course.estimatedDuration < filters.duration.min ||
          course.estimatedDuration > filters.duration.max
        )
          return false;
      }

      // Rating filter
      if (filters.rating && filters.rating > 0) {
        if (course.stats.averageRating < filters.rating) return false;
      }

      return true;
    });

    // Apply sorting
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        switch (filters.sortBy) {
          case "title":
            return a.title.localeCompare(b.title);
          case "price_low":
            return (a.pricing?.price ?? 0) - (b.pricing?.price ?? 0);
          case "price_high":
            return (b.pricing?.price ?? 0) - (a.pricing?.price ?? 0);
          case "rating":
            return b.stats.averageRating - a.stats.averageRating;
          case "duration":
            return a.estimatedDuration - b.estimatedDuration;
          case "students":
            return b.stats.enrollmentCount - a.stats.enrollmentCount;
          case "newest":
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          case "oldest":
            return (
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
          default:
            return 0;
        }
      });
    }

    // Cache the result
    filterCache.set(cacheKey, filtered);

    return filtered;
  }, [courses, filters]);

  return filteredCourses;
};

// Optimized course stats calculation
export const useOptimizedCourseStats = (courses: CourseSummary[]) => {
  return useMemo(() => {
    const cacheKey = `stats-${courses.length}-${courses.map((c) => c._id).join(",")}`;
    const cached = courseCache.get(cacheKey);

    if (cached) {
      return cached[0]; // Stats are stored as single item array
    }

    const stats = {
      totalCourses: courses.length,
      totalStudents: courses.reduce(
        (sum, course) => sum + course.stats.enrollmentCount,
        0,
      ),
      averageRating:
        courses.length > 0
          ? courses.reduce(
              (sum, course) => sum + course.stats.averageRating,
              0,
            ) / courses.length
          : 0,
      totalDuration: courses.reduce(
        (sum, course) => sum + course.estimatedDuration,
        0,
      ),
      categories: [...new Set(courses.map((course) => course.category))],
      difficulties: [...new Set(courses.map((course) => course.difficulty))],
      priceRange: {
        min: Math.min(...courses.map((c) => c.pricing?.price ?? 0)),
        max: Math.max(...courses.map((c) => c.pricing?.price ?? 0)),
      },
    };

    courseCache.set(cacheKey, [stats] as any);
    return stats;
  }, [courses]);
};

// Intersection Observer hook for lazy loading
export const useIntersectionObserver = (
  callback: () => void,
  options: IntersectionObserverInit = {},
) => {
  const targetRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          callback();
        }
      },
      {
        threshold: 0.1,
        rootMargin: "50px",
        ...options,
      },
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [callback, options]);

  return targetRef;
};

// Optimized search with debouncing
export const useOptimizedSearch = (
  initialValue: string = "",
  delay: number = 300,
) => {
  const [searchTerm, setSearchTerm] = React.useState(initialValue);
  const [debouncedSearchTerm, setDebouncedSearchTerm] =
    React.useState(initialValue);

  const debouncedSetSearch = useCallback(
    debounce((term: string) => {
      setDebouncedSearchTerm(term);
    }, delay),
    [delay],
  );

  React.useEffect(() => {
    debouncedSetSearch(searchTerm);
  }, [searchTerm, debouncedSetSearch]);

  return {
    searchTerm,
    debouncedSearchTerm,
    setSearchTerm,
  };
};

// Performance monitoring utilities
export const performanceMonitor = {
  measureRender: (
    componentName: string,
    renderFunction: () => React.ReactElement,
  ) => {
    const startTime = performance.now();
    const result = renderFunction();
    const endTime = performance.now();

    if (process.env.NODE_ENV === "development") {
      console.log(`${componentName} render time: ${endTime - startTime}ms`);
    }

    return result;
  },

  logCacheStats: () => {
    if (process.env.NODE_ENV === "development") {
      console.log("Course Cache Stats:", courseCache.getStats());
      console.log("Filter Cache Stats:", filterCache.getStats());
    }
  },

  clearCaches: () => {
    courseCache.clear();
    filterCache.clear();
  },
};

export { courseCache, filterCache };
