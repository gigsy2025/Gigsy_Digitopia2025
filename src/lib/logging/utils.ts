/**
 * LOGGING UTILITIES AND HELPERS
 *
 * Utility functions for enterprise logging integration
 * with performance monitoring, error handling, and context management.
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-09-12
 */

import {
  getLogger,
  BusinessLogger,
  PerformanceLogger,
} from "@/services/observability/logging";
import type { LogContext } from "@/types/logging";

/**
 * Request logging helper for API routes
 */
export async function logApiRequest(
  method: string,
  path: string,
  userId?: string,
  duration?: number,
  statusCode?: number,
  context?: Partial<LogContext>,
): Promise<void> {
  const logger = BusinessLogger.apiCall(path, method, {
    user: { id: userId },
    performance: { duration },
    custom: { statusCode },
    ...context,
  });

  const message = `API ${method} ${path} - ${statusCode ?? "Unknown"} ${duration ? `(${duration}ms)` : ""}`;

  if (statusCode && statusCode >= 400) {
    await logger.warn(message);
  } else {
    await logger.info(message);
  }
}

/**
 * Database operation logging helper
 */
export async function logDatabaseOperation(
  operation: string,
  table: string,
  duration?: number,
  recordCount?: number,
  error?: Error,
): Promise<void> {
  const logger = BusinessLogger.dataOperation(operation, table);

  const context: Partial<LogContext> = {
    performance: { duration, dbQueryCount: 1 },
    custom: { recordCount, table },
  };

  if (error) {
    await logger.error(
      `Database ${operation} failed on ${table}`,
      error,
      context,
    );
  } else {
    await logger.info(
      `Database ${operation} on ${table}${recordCount ? ` (${recordCount} records)` : ""}${duration ? ` in ${duration}ms` : ""}`,
      context,
    );
  }
}

/**
 * User action logging helper
 */
export async function logUserAction(
  action: string,
  feature: string,
  userId?: string,
  sessionId?: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const logger = BusinessLogger.userAction(action, userId, {
    user: { id: userId, sessionId },
    business: { feature, action },
    custom: metadata,
  });

  await logger.info(`User action: ${action} in ${feature}`, {
    custom: { actionTimestamp: new Date().toISOString() },
  });
}

/**
 * External service call logging helper
 */
export async function logExternalServiceCall(
  serviceName: string,
  operation: string,
  duration?: number,
  success = true,
  error?: Error,
  responseSize?: number,
): Promise<void> {
  const logger = getLogger({
    business: {
      feature: "external-integration",
      action: `${serviceName}.${operation}`,
    },
    performance: { duration, networkLatency: duration },
    custom: { serviceName, responseSize },
  });

  if (success) {
    await logger.info(
      `External service call successful: ${serviceName}.${operation}${duration ? ` (${duration}ms)` : ""}`,
      {
        custom: { outcome: "success" },
      },
    );
  } else {
    await logger.error(
      `External service call failed: ${serviceName}.${operation}`,
      error,
      {
        custom: { outcome: "failure" },
      },
    );
  }
}

/**
 * Security event logging helper
 */
export async function logSecurityEvent(
  eventType: "authentication" | "authorization" | "dataAccess" | "suspicious",
  outcome: "success" | "failure" | "blocked",
  userId?: string,
  ipAddress?: string,
  userAgent?: string,
  details?: Record<string, unknown>,
): Promise<void> {
  const logger = getLogger({
    business: { feature: "security", action: eventType },
    user: { id: userId },
    custom: {
      eventType,
      outcome,
      ipAddress,
      userAgent,
      timestamp: new Date().toISOString(),
      ...details,
    },
  });

  const message = `Security event: ${eventType} - ${outcome}${userId ? ` for user ${userId}` : ""}`;

  if (outcome === "failure" || outcome === "blocked") {
    await logger.warn(message);
  } else {
    await logger.info(message);
  }
}

/**
 * Performance metrics helper
 */
export function createPerformanceTracker(feature: string, action: string) {
  const startTime = performance.now();
  let memoryStart: number | undefined;

  // Capture memory usage if available
  if (typeof window !== "undefined" && "memory" in performance) {
    memoryStart = (performance as { memory?: { usedJSHeapSize: number } })
      .memory?.usedJSHeapSize;
  }

  return {
    finish: async (
      success = true,
      error?: Error,
      metadata?: Record<string, unknown>,
    ) => {
      const duration = performance.now() - startTime;
      let memoryUsage: number | undefined;

      if (
        memoryStart &&
        typeof window !== "undefined" &&
        "memory" in performance
      ) {
        const currentMemory = (
          performance as { memory?: { usedJSHeapSize: number } }
        ).memory?.usedJSHeapSize;
        if (currentMemory) {
          memoryUsage = currentMemory - memoryStart;
        }
      }

      const logger = PerformanceLogger.operationTiming(action, duration, {
        business: { feature, action },
        performance: { duration, memoryUsage },
        custom: { success, ...metadata },
      });

      if (success) {
        await logger.info(
          `Performance tracking: ${feature}.${action} completed`,
          {
            performance: { duration, memoryUsage },
          },
        );
      } else {
        await logger.error(
          `Performance tracking: ${feature}.${action} failed`,
          error,
          {
            performance: { duration, memoryUsage },
          },
        );
      }

      return { duration, memoryUsage };
    },
  };
}

/**
 * Structured error logger with context preservation
 */
export async function logStructuredError(
  error: Error,
  context: {
    feature: string;
    action: string;
    component: string;
    userId?: string;
    correlationId?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  const logger = getLogger({
    business: { feature: context.feature, action: context.action },
    technical: {
      component: context.component,
      version: "1.0.0",
      environment: process.env.NODE_ENV ?? "development",
    },
    user: { id: context.userId },
    correlation: { requestId: context.correlationId ?? `error-${Date.now()}` },
    custom: {
      errorTimestamp: new Date().toISOString(),
      ...context.metadata,
    },
  });

  await logger.error(
    `Structured error in ${context.component}: ${error.message}`,
    error,
    {
      custom: {
        errorName: error.name,
        errorStack: error.stack,
        errorCause: error.cause,
      },
    },
  );
}

/**
 * Batch operation logging helper
 */
export function createBatchLogger(operation: string, feature: string) {
  const items: Array<{
    id: string;
    status: "pending" | "success" | "error";
    error?: Error;
  }> = [];
  const startTime = performance.now();

  return {
    addItem: (id: string) => {
      items.push({ id, status: "pending" });
    },

    markSuccess: (id: string) => {
      const item = items.find((i) => i.id === id);
      if (item) item.status = "success";
    },

    markError: (id: string, error: Error) => {
      const item = items.find((i) => i.id === id);
      if (item) {
        item.status = "error";
        item.error = error;
      }
    },

    finish: async () => {
      const duration = performance.now() - startTime;
      const successCount = items.filter((i) => i.status === "success").length;
      const errorCount = items.filter((i) => i.status === "error").length;
      const pendingCount = items.filter((i) => i.status === "pending").length;

      const logger = getLogger({
        business: { feature, action: operation },
        performance: { duration },
        custom: {
          totalItems: items.length,
          successCount,
          errorCount,
          pendingCount,
          successRate: items.length > 0 ? successCount / items.length : 0,
        },
      });

      await logger.info(
        `Batch operation ${operation} completed: ${successCount} success, ${errorCount} errors, ${pendingCount} pending`,
        {
          custom: {
            batchSummary: {
              operation,
              duration,
              items: items.map((i) => ({ id: i.id, status: i.status })),
            },
          },
        },
      );

      // Log individual errors
      for (const item of items.filter((i) => i.status === "error")) {
        if (item.error) {
          await logger.error(`Batch item ${item.id} failed`, item.error);
        }
      }

      return { successCount, errorCount, pendingCount, duration };
    },
  };
}

/**
 * Correlation ID utilities for request tracing
 */
export const CorrelationUtils = {
  generate: (): string =>
    `corr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,

  extract: (headers: Headers): string | undefined => {
    return (
      headers.get("x-correlation-id") ??
      headers.get("x-request-id") ??
      headers.get("x-trace-id") ??
      undefined
    );
  },

  inject: (headers: Headers, correlationId: string): void => {
    headers.set("x-correlation-id", correlationId);
  },
};
