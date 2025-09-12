/**
 * ENHANCED BUTTON FETCHER COMPONENT
 *
 * Demonstrates enterprise logging integration with user interaction tracking,
 * performance monitoring, and comprehensive error handling.
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-09-12
 */

"use client";

import { useState } from "react";
import { useUserActionLogger, useApiLogger } from "@/lib/logging/hooks";
import { createPerformanceTracker } from "@/lib/logging/utils";

interface HealthCheckResponse {
  status: string;
  timestamp: string;
  version: string;
  environment: string;
  correlationId: string;
  metrics: {
    uptime: number;
    memoryUsage: Record<string, number>;
  };
}

interface CustomLogResponse {
  success: boolean;
  correlationId: string;
  processed: {
    level: string;
    message: string;
    timestamp: string;
  };
}

const ButtonFetcher = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Enterprise logging hooks
  const { logAction } = useUserActionLogger("logging-demo");
  const { logApiCall } = useApiLogger();

  const handleFetchInfoLog = async () => {
    // Clear previous state
    setError(null);
    setLastResponse(null);
    setIsLoading(true);

    // Log user interaction
    await logAction("button-click-fetch-log", {
      buttonType: "fetch-info-log",
      timestamp: new Date().toISOString(),
    });
    console.log("Action logged: button-click-fetch-log");

    // Start performance tracking for the entire operation
    const performanceTracker = createPerformanceTracker(
      "logging-demo",
      "api-call-sequence",
    );

    console.log("Performance tracking started for logging-demo");

    try {
      // First, call the GET endpoint (health check)
      const getStartTime = performance.now();
      const getResponse = await fetch("/api/logging", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const getDuration = performance.now() - getStartTime;
      const getResult = (await getResponse.json()) as HealthCheckResponse;

      // Log the GET API call
      await logApiCall(
        "GET",
        "/api/logging",
        getDuration,
        getResponse.status,
        getResponse.ok
          ? undefined
          : new Error(`API Error: ${getResponse.status}`),
        {
          responseSize: JSON.stringify(getResult).length,
          correlationId: getResult.correlationId,
        },
      );

      if (!getResponse.ok) {
        throw new Error(
          `Health check failed: ${getResponse.status} ${getResponse.statusText}`,
        );
      }

      // Then, call the POST endpoint with custom log data
      const postStartTime = performance.now();
      const postResponse = await fetch("/api/logging", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          level: "info",
          message: "User triggered logging demo from ButtonFetcher component",
          context: {
            feature: "logging-demo",
            action: "button-interaction",
            componentName: "ButtonFetcher",
            userTriggered: true,
            sessionData: {
              timestamp: new Date().toISOString(),
              userAgent: navigator.userAgent,
              url: window.location.href,
            },
          },
        }),
      });
      const postDuration = performance.now() - postStartTime;
      const postResult = (await postResponse.json()) as CustomLogResponse;

      // Log the POST API call
      await logApiCall(
        "POST",
        "/api/logging",
        postDuration,
        postResponse.status,
        postResponse.ok
          ? undefined
          : new Error(`API Error: ${postResponse.status}`),
        {
          requestSize: JSON.stringify({
            level: "info",
            message: "User triggered logging demo from ButtonFetcher component",
          }).length,
          responseSize: JSON.stringify(postResult).length,
          correlationId: postResult.correlationId,
        },
      );

      if (!postResponse.ok) {
        throw new Error(
          `Custom log failed: ${postResponse.status} ${postResponse.statusText}`,
        );
      }

      // Success handling
      const successMessage = `Successfully completed logging demo! Health: ${getResult.status}, Custom log processed: ${postResult.success}`;
      setLastResponse(successMessage);

      await logAction("fetch-log-success", {
        getStatus: getResult.status,
        postSuccess: postResult.success,
        totalDuration: getDuration + postDuration,
        getCorrelationId: getResult.correlationId,
        postCorrelationId: postResult.correlationId,
      });

      // Finish performance tracking with success
      await performanceTracker.finish(true, undefined, {
        operationsCompleted: 2,
        totalApiCalls: 2,
        healthCheckStatus: getResult.status,
        customLogProcessed: postResult.success,
      });

      console.log("✅ Logging demo completed successfully:", {
        healthCheck: getResult,
        customLog: postResult,
        totalDuration: getDuration + postDuration,
      });
    } catch (fetchError) {
      const errorMessage =
        fetchError instanceof Error
          ? fetchError.message
          : "Unknown error occurred";
      setError(errorMessage);

      await logAction("fetch-log-error", {
        errorMessage,
        errorType:
          fetchError instanceof Error
            ? fetchError.constructor.name
            : "UnknownError",
        timestamp: new Date().toISOString(),
      });

      // Finish performance tracking with error
      await performanceTracker.finish(false, fetchError as Error, {
        operationFailed: true,
        errorMessage,
      });

      console.error("❌ Logging demo failed:", fetchError);
    } finally {
      setIsLoading(false);

      // Log completion of user interaction
      await logAction("button-interaction-complete", {
        success: !error,
        hasResponse: !!lastResponse,
        duration: performance.now(),
      });
    }
  };

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Enterprise Logging Demo</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Click the button to demonstrate comprehensive logging with performance
          tracking, error handling, and structured context.
        </p>
      </div>

      <button
        onClick={handleFetchInfoLog}
        disabled={isLoading}
        className={`w-full rounded-md px-4 py-2 font-medium text-white transition-colors ${
          isLoading
            ? "cursor-not-allowed bg-gray-400"
            : "bg-blue-500 hover:bg-blue-600 active:bg-blue-700"
        } `}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            Processing Logging Demo...
          </span>
        ) : (
          "Execute Logging Demo"
        )}
      </button>

      {/* Response Display */}
      {lastResponse && (
        <div className="rounded bg-green-50 p-3 dark:bg-green-900/20">
          <h4 className="font-medium text-green-800 dark:text-green-200">
            Success:
          </h4>
          <p className="text-sm text-green-700 dark:text-green-300">
            {lastResponse}
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="rounded bg-red-50 p-3 dark:bg-red-900/20">
          <h4 className="font-medium text-red-800 dark:text-red-200">Error:</h4>
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Technical Details */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        <p>This demo performs:</p>
        <ul className="ml-4 list-disc space-y-1">
          <li>User interaction logging</li>
          <li>API performance monitoring</li>
          <li>Error handling and logging</li>
          <li>Structured context tracking</li>
          <li>Correlation ID management</li>
        </ul>
      </div>
    </div>
  );
};

export default ButtonFetcher;
