/**
 * ENTERPRISE LOGGING API ROUTE
 *
 * Demonstrates production-grade API logging with comprehensive error handling,
 * performance monitoring, and structured logging patterns.
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-09-12
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getLogger } from "@/services/observability/logging";
import {
  logApiRequest,
  CorrelationUtils,
  createPerformanceTracker,
} from "@/lib/logging/utils";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
  const startTime = performance.now();
  const correlationId =
    CorrelationUtils.extract(request.headers) ?? CorrelationUtils.generate();

  // Initialize logger with correlation context
  const logger = getLogger({
    correlation: { requestId: correlationId },
    business: { feature: "logging-api", action: "health-check" },
    technical: {
      component: "api-route",
      version: "1.0.0",
      environment: process.env.NODE_ENV ?? "development",
    },
  });

  const performanceTracker = createPerformanceTracker(
    "logging-api",
    "health-check",
  );

  try {
    // Get user context if available
    const { userId } = await auth();

    // Log API request start
    await logger.info("Logging API health check started", {
      custom: {
        endpoint: "/api/logging",
        method: "GET",
        correlationId,
        userAgent: request.headers.get("user-agent"),
        ip:
          request.headers.get("x-forwarded-for") ??
          request.headers.get("x-real-ip"),
      },
    });

    // Simulate some business logic
    const healthData = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      environment: process.env.NODE_ENV,
      correlationId,
      metrics: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      },
    };

    // Log successful operation
    await logger.info("Health check completed successfully", {
      business: { feature: "logging-api", action: "health-check" },
      custom: {
        healthStatus: healthData.status,
        responseSize: JSON.stringify(healthData).length,
      },
    });

    const duration = performance.now() - startTime;

    // Log API metrics
    await logApiRequest(
      "GET",
      "/api/logging",
      userId ?? undefined,
      duration,
      200,
      { correlation: { requestId: correlationId } },
    );

    // Finish performance tracking
    await performanceTracker.finish(true, undefined, {
      responseSize: JSON.stringify(healthData).length,
      statusCode: 200,
    });

    // Set correlation ID in response headers
    const response = NextResponse.json(healthData, { status: 200 });
    response.headers.set("x-correlation-id", correlationId);
    response.headers.set("x-response-time", `${duration.toFixed(2)}ms`);

    return response;
  } catch (error) {
    const duration = performance.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Log error with full context
    await logger.error("Logging API health check failed", error as Error, {
      custom: {
        correlationId,
        duration,
        errorType:
          error instanceof Error ? error.constructor.name : "UnknownError",
      },
    });

    // Log API error metrics
    await logApiRequest("GET", "/api/logging", undefined, duration, 500, {
      correlation: { requestId: correlationId },
    });

    // Finish performance tracking with error
    await performanceTracker.finish(false, error as Error, {
      statusCode: 500,
      errorMessage,
    });

    // Return error response with correlation ID
    const errorResponse = NextResponse.json(
      {
        error: "Internal Server Error",
        correlationId,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );

    errorResponse.headers.set("x-correlation-id", correlationId);
    errorResponse.headers.set("x-response-time", `${duration.toFixed(2)}ms`);

    return errorResponse;
  }
}

export async function POST(request: NextRequest) {
  const startTime = performance.now();
  const correlationId =
    CorrelationUtils.extract(request.headers) ?? CorrelationUtils.generate();

  const logger = getLogger({
    correlation: { requestId: correlationId },
    business: { feature: "logging-api", action: "custom-log" },
    technical: {
      component: "api-route",
      version: "1.0.0",
      environment: process.env.NODE_ENV ?? "development",
    },
  });

  const performanceTracker = createPerformanceTracker(
    "logging-api",
    "custom-log",
  );

  try {
    const { userId } = await auth();
    const body = (await request.json()) as {
      level?: "debug" | "info" | "warn" | "error";
      message?: string;
      context?: Record<string, unknown>;
    };

    // Validate request
    if (!body.message) {
      await logger.warn("Invalid request: missing message", {
        custom: {
          validationError: "missing_message",
          bodyKeys: Object.keys(body),
        },
      });

      const response = NextResponse.json(
        { error: "Message is required", correlationId },
        { status: 400 },
      );
      response.headers.set("x-correlation-id", correlationId);
      return response;
    }

    // Process custom log
    const logLevel = body.level ?? "info";
    const logMessage = body.message;
    const logContext = {
      ...body.context,
      user: { id: userId ?? undefined },
      custom: {
        ...body.context,
        source: "api-custom-log",
        correlationId,
      },
    };

    // Create contextual logger and log the custom message
    const contextualLogger = logger.withContext(logContext);

    switch (logLevel) {
      case "debug":
        await contextualLogger.debug(logMessage);
        break;
      case "info":
        await contextualLogger.info(logMessage);
        break;
      case "warn":
        await contextualLogger.warn(logMessage);
        break;
      case "error":
        await contextualLogger.error(logMessage, new Error(logMessage));
        break;
    }

    await logger.info("Custom log processed successfully", {
      custom: {
        logLevel,
        messageLength: logMessage.length,
        hasContext: !!body.context,
        contextKeys: body.context ? Object.keys(body.context) : [],
      },
    });

    const duration = performance.now() - startTime;

    await logApiRequest(
      "POST",
      "/api/logging",
      userId ?? undefined,
      duration,
      200,
      { correlation: { requestId: correlationId } },
    );

    await performanceTracker.finish(true, undefined, {
      logLevel,
      messageProcessed: true,
      statusCode: 200,
    });

    const response = NextResponse.json({
      success: true,
      correlationId,
      processed: {
        level: logLevel,
        message: logMessage,
        timestamp: new Date().toISOString(),
      },
    });

    response.headers.set("x-correlation-id", correlationId);
    response.headers.set("x-response-time", `${duration.toFixed(2)}ms`);

    return response;
  } catch (error) {
    const duration = performance.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await logger.error("Custom log processing failed", error as Error, {
      custom: {
        correlationId,
        duration,
        errorType:
          error instanceof Error ? error.constructor.name : "UnknownError",
      },
    });

    await logApiRequest("POST", "/api/logging", undefined, duration, 500, {
      correlation: { requestId: correlationId },
    });

    await performanceTracker.finish(false, error as Error, {
      statusCode: 500,
      errorMessage,
    });

    const errorResponse = NextResponse.json(
      {
        error: "Failed to process custom log",
        correlationId,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );

    errorResponse.headers.set("x-correlation-id", correlationId);
    errorResponse.headers.set("x-response-time", `${duration.toFixed(2)}ms`);

    return errorResponse;
  }
}
