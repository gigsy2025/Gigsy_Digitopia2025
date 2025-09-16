/**
 * PERFORMANCE OPTIMIZATION EXPORTS
 *
 * Central export point for all performance optimization utilities
 * including image optimization, video preloading, and monitoring.
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-01-14
 */

// Image optimization exports
export {
  ImageOptimizer,
  ImageCache,
  useProgressiveImage,
  useIntersectionObserver,
  preloadCriticalImages,
  DEFAULT_IMAGE_CONFIG,
  type ImageOptimizationConfig,
} from "./image-optimization";

// Video optimization exports
export {
  VideoOptimizer,
  useVideoPreload,
  useOptimalVideoSource,
  useVideoLazyLoading,
  DEFAULT_VIDEO_CONFIG,
  type VideoOptimizationConfig,
  type VideoSource,
  type VideoMetadata,
  type ConnectionQuality,
} from "./video-optimization";

// Performance monitoring exports
export {
  PerformanceMonitor,
  usePerformanceMonitor,
  withPerformanceTracking,
  CORE_WEB_VITALS_THRESHOLDS,
  DEFAULT_PERFORMANCE_CONFIG,
  DEFAULT_PERFORMANCE_BUDGET,
  type PerformanceMetric,
  type PerformanceConfig,
  type PerformanceBudget,
  type MetricType,
} from "./monitoring";

// Caching utilities
export {
  CacheManager,
  useCachedData,
  useCachedQuery,
  withCache,
  type CacheConfig,
  type CacheEntry,
  type CacheStats,
} from "./caching";

/**
 * Initialize all performance optimizations
 */
export function initializePerformanceOptimizations(config?: {
  image?: Partial<ImageOptimizationConfig>;
  video?: Partial<VideoOptimizationConfig>;
  performance?: Partial<PerformanceConfig>;
  cache?: Partial<CacheConfig>;
}) {
  // Initialize image optimizer
  const imageOptimizer = ImageOptimizer.getInstance(config?.image);

  // Initialize video optimizer
  const videoOptimizer = VideoOptimizer.getInstance(config?.video);

  // Initialize performance monitor
  const performanceMonitor = PerformanceMonitor.getInstance(
    config?.performance,
  );

  // Initialize cache manager
  const cacheManager = CacheManager.getInstance(config?.cache);

  return {
    imageOptimizer,
    videoOptimizer,
    performanceMonitor,
    cacheManager,
  };
}

/**
 * Get comprehensive performance report
 */
export function getPerformanceReport() {
  const performanceMonitor = PerformanceMonitor.getInstance();
  const cacheManager = CacheManager.getInstance();

  return {
    performance: performanceMonitor.getSummary(),
    cache: cacheManager.getStats(),
    timestamp: new Date().toISOString(),
  };
}
