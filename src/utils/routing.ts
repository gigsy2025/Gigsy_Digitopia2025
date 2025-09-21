/**
 * ROUTING MIGRATION UTILITIES
 *
 * Utility functions for generating hierarchical course routes
 * following the pattern: /app/courses/[courseId]/modules/[moduleId]/lessons/[lessonId]
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-09-21
 */

/**
 * Generate hierarchical lesson route
 * Following SOLID principles and type safety
 */
export function generateLessonRoute(
  courseId: string,
  moduleId: string,
  lessonId: string,
): string {
  // Input validation following defensive programming practices
  if (!courseId || !moduleId || !lessonId) {
    throw new Error(
      "generateLessonRoute: All parameters (courseId, moduleId, lessonId) are required",
    );
  }

  // Sanitize IDs to prevent injection attacks
  const sanitizedCourseId = encodeURIComponent(courseId);
  const sanitizedModuleId = encodeURIComponent(moduleId);
  const sanitizedLessonId = encodeURIComponent(lessonId);

  return `/app/courses/${sanitizedCourseId}/modules/${sanitizedModuleId}/lessons/${sanitizedLessonId}`;
}

/**
 * Generate module route
 */
export function generateModuleRoute(
  courseId: string,
  moduleId: string,
): string {
  if (!courseId || !moduleId) {
    throw new Error(
      "generateModuleRoute: Both courseId and moduleId are required",
    );
  }

  const sanitizedCourseId = encodeURIComponent(courseId);
  const sanitizedModuleId = encodeURIComponent(moduleId);

  return `/app/courses/${sanitizedCourseId}/modules/${sanitizedModuleId}`;
}

/**
 * Generate course route
 */
export function generateCourseRoute(courseId: string): string {
  if (!courseId) {
    throw new Error("generateCourseRoute: courseId is required");
  }

  const sanitizedCourseId = encodeURIComponent(courseId);
  return `/app/courses/${sanitizedCourseId}`;
}

/**
 * Parse lesson route to extract IDs
 * For reverse navigation and breadcrumb generation
 */
export function parseLessonRoute(route: string): {
  courseId: string;
  moduleId: string;
  lessonId: string;
} | null {
  const lessonRoutePattern =
    /^\/app\/courses\/([^\/]+)\/modules\/([^\/]+)\/lessons\/([^\/]+)$/;
  const match = route.match(lessonRoutePattern);

  if (!match) {
    return null;
  }

  return {
    courseId: decodeURIComponent(match[1]!),
    moduleId: decodeURIComponent(match[2]!),
    lessonId: decodeURIComponent(match[3]!),
  };
}

/**
 * Route validation utility
 */
export function isValidLessonRoute(route: string): boolean {
  return parseLessonRoute(route) !== null;
}

/**
 * Migration logging utility
 * For tracking route migrations in development
 */
export function logRouteMigration(
  oldRoute: string,
  newRoute: string,
  context: string = "migration",
): void {
  if (process.env.NODE_ENV === "development") {
    console.log(`🔄 [RouteMigration:${context}] ${oldRoute} → ${newRoute}`);
  }
}

/**
 * Legacy route migration helper
 * Maps old routes to new hierarchical routes
 */
export function migrateLegacyRoute(
  legacyRoute: string,
  moduleId: string,
): string | null {
  // Pattern: /app/courses/[courseId]/lessons/[lessonId]
  const legacyPattern = /^\/app\/courses\/([^\/]+)\/lessons\/([^\/]+)$/;
  const match = legacyRoute.match(legacyPattern);

  if (!match) {
    return null;
  }

  const courseId = match[1]!;
  const lessonId = match[2]!;
  const newRoute = generateLessonRoute(courseId, moduleId, lessonId);

  logRouteMigration(legacyRoute, newRoute, "legacy-migration");
  return newRoute;
}

/**
 * Type-safe route builder
 * Implements builder pattern for complex route construction
 */
export class RouteBuilder {
  private courseId?: string;
  private moduleId?: string;
  private lessonId?: string;

  static forCourse(courseId: string): RouteBuilder {
    const builder = new RouteBuilder();
    builder.courseId = courseId;
    return builder;
  }

  withModule(moduleId: string): RouteBuilder {
    this.moduleId = moduleId;
    return this;
  }

  withLesson(lessonId: string): RouteBuilder {
    this.lessonId = lessonId;
    return this;
  }

  build(): string {
    if (!this.courseId) {
      throw new Error("RouteBuilder: courseId is required");
    }

    if (this.lessonId) {
      if (!this.moduleId) {
        throw new Error(
          "RouteBuilder: moduleId is required when lessonId is provided",
        );
      }
      return generateLessonRoute(this.courseId, this.moduleId, this.lessonId);
    }

    if (this.moduleId) {
      return generateModuleRoute(this.courseId, this.moduleId);
    }

    return generateCourseRoute(this.courseId);
  }
}

/**
 * React hook for route generation
 * Following separation of concerns principle
 */
export function useRouteGeneration() {
  return {
    generateLessonRoute,
    generateModuleRoute,
    generateCourseRoute,
    parseLessonRoute,
    isValidLessonRoute,
    RouteBuilder,
  };
}

export default {
  generateLessonRoute,
  generateModuleRoute,
  generateCourseRoute,
  parseLessonRoute,
  isValidLessonRoute,
  logRouteMigration,
  migrateLegacyRoute,
  RouteBuilder,
  useRouteGeneration,
};
