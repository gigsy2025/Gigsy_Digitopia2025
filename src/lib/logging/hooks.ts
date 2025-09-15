/**
 * REACT LOGGING HOOKS
 *
 * Custom React hooks for enterprise logging with context management,
 * performance tracking, and user interaction monitoring.
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-09-12
 */

"use client";

import { useCallback, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { getLogger } from "@/services/observability/logging";
import {
  logUserAction,
  createPerformanceTracker,
  logStructuredError,
} from "@/lib/logging/utils";
import type { LogContext, ILogger } from "@/types/logging";

/**
 * Enhanced logging hook with user context integration
 */
export function useEnterpriseLogger(
  baseContext?: Partial<LogContext>,
): ILogger {
  const { user } = useUser();

  const logger = getLogger({
    user: {
      id: user?.id,
      role: user?.organizationMemberships?.[0]?.role,
      sessionId: user?.lastSignInAt?.toISOString(),
    },
    technical: {
      component: "react-component",
      version: "1.0.0",
      environment: process.env.NODE_ENV ?? "development",
    },
    ...baseContext,
  });

  return logger;
}

/**
 * Performance tracking hook for React components
 */
export function usePerformanceTracking(feature: string, action: string) {
  const trackerRef = useRef<ReturnType<typeof createPerformanceTracker> | null>(
    null,
  );

  const startTracking = useCallback(() => {
    trackerRef.current = createPerformanceTracker(feature, action);
  }, [feature, action]);

  const finishTracking = useCallback(
    async (
      success = true,
      error?: Error,
      metadata?: Record<string, unknown>,
    ) => {
      if (trackerRef.current) {
        const result = await trackerRef.current.finish(
          success,
          error,
          metadata,
        );
        trackerRef.current = null;
        return result;
      }
      return null;
    },
    [],
  );

  // Auto-start tracking on mount
  useEffect(() => {
    startTracking();

    return () => {
      // Auto-finish tracking on unmount if still active
      if (trackerRef.current) {
        void finishTracking();
      }
    };
  }, [startTracking, finishTracking]);

  return { startTracking, finishTracking };
}

/**
 * User action logging hook
 */
export function useUserActionLogger(feature: string) {
  const { user } = useUser();

  const logAction = useCallback(
    async (action: string, metadata?: Record<string, unknown>) => {
      await logUserAction(
        action,
        feature,
        user?.id,
        user?.lastSignInAt?.toISOString(),
        metadata,
      );
    },
    [feature, user?.id, user?.lastSignInAt],
  );

  return { logAction };
}

/**
 * Form interaction logging hook
 */
export function useFormLogger(formName: string, feature: string) {
  const { logAction } = useUserActionLogger(feature);
  const { startTracking, finishTracking } = usePerformanceTracking(
    feature,
    `form-${formName}`,
  );

  const logFormStart = useCallback(async () => {
    await logAction(`form-start-${formName}`, { formName });
    startTracking();
  }, [logAction, formName, startTracking]);

  const logFormSubmit = useCallback(
    async (
      success: boolean,
      error?: Error,
      formData?: Record<string, unknown>,
    ) => {
      await logAction(`form-submit-${formName}`, {
        formName,
        success,
        fieldCount: formData ? Object.keys(formData).length : 0,
      });

      await finishTracking(success, error, {
        formSubmission: true,
        formData: formData ? Object.keys(formData) : [],
      });
    },
    [logAction, formName, finishTracking],
  );

  const logFormFieldInteraction = useCallback(
    async (
      fieldName: string,
      interactionType: "focus" | "blur" | "change" | "validation",
    ) => {
      await logAction(`form-field-${interactionType}`, {
        formName,
        fieldName,
        interactionType,
      });
    },
    [logAction, formName],
  );

  return {
    logFormStart,
    logFormSubmit,
    logFormFieldInteraction,
  };
}

/**
 * Error boundary logging hook
 */
export function useErrorLogger(component: string, feature: string) {
  const { user } = useUser();

  const logError = useCallback(
    async (
      error: Error,
      errorInfo?: { componentStack?: string; errorBoundary?: string },
      metadata?: Record<string, unknown>,
    ) => {
      await logStructuredError(error, {
        feature,
        action: "error-boundary-catch",
        component,
        userId: user?.id,
        metadata: {
          componentStack: errorInfo?.componentStack,
          errorBoundary: errorInfo?.errorBoundary,
          ...metadata,
        },
      });
    },
    [component, feature, user?.id],
  );

  return { logError };
}

/**
 * Navigation logging hook
 */
export function useNavigationLogger() {
  const { logAction } = useUserActionLogger("navigation");

  const logPageView = useCallback(
    async (
      pathname: string,
      referrer?: string,
      metadata?: Record<string, unknown>,
    ) => {
      await logAction("page-view", {
        pathname,
        referrer,
        timestamp: new Date().toISOString(),
        ...metadata,
      });
    },
    [logAction],
  );

  const logNavigation = useCallback(
    async (
      from: string,
      to: string,
      navigationMethod: "link" | "button" | "programmatic" | "browser",
      metadata?: Record<string, unknown>,
    ) => {
      await logAction("navigation", {
        from,
        to,
        navigationMethod,
        timestamp: new Date().toISOString(),
        ...metadata,
      });
    },
    [logAction],
  );

  return { logPageView, logNavigation };
}

/**
 * API call logging hook
 */
export function useApiLogger() {
  const logger = useEnterpriseLogger();

  const logApiCall = useCallback(
    async (
      method: string,
      endpoint: string,
      duration?: number,
      statusCode?: number,
      error?: Error,
      metadata?: Record<string, unknown>,
    ) => {
      const context: Partial<LogContext> = {
        business: { feature: "api-client", action: `${method} ${endpoint}` },
        performance: { duration, networkLatency: duration },
        custom: {
          statusCode,
          endpoint,
          method,
          timestamp: new Date().toISOString(),
          ...metadata,
        },
      };

      if (error || (statusCode && statusCode >= 400)) {
        await logger.error(
          `API call failed: ${method} ${endpoint} - ${statusCode ?? "Unknown"}`,
          error,
          context,
        );
      } else {
        await logger.info(
          `API call successful: ${method} ${endpoint} - ${statusCode ?? "Unknown"}${duration ? ` (${duration}ms)` : ""}`,
          context,
        );
      }
    },
    [logger],
  );

  return { logApiCall };
}

/**
 * Business logic operation logging hook
 */
export function useBusinessLogger(feature: string) {
  const logger = useEnterpriseLogger({
    business: { feature, action: "unknown" },
  });

  const logBusinessOperation = useCallback(
    async (
      operation: string,
      entityType?: string,
      entityId?: string,
      metadata?: Record<string, unknown>,
    ) => {
      const businessLogger = logger.withBusiness({
        feature,
        action: operation,
        entityType,
        entityId,
      });

      await businessLogger.info(`Business operation: ${operation}`, {
        custom: {
          operationTimestamp: new Date().toISOString(),
          ...metadata,
        },
      });
    },
    [logger, feature],
  );

  const logBusinessSuccess = useCallback(
    async (
      operation: string,
      result?: unknown,
      metadata?: Record<string, unknown>,
    ) => {
      await logger.info(`Business operation successful: ${operation}`, {
        business: { feature, action: operation },
        custom: {
          outcome: "success",
          result: typeof result,
          timestamp: new Date().toISOString(),
          ...metadata,
        },
      });
    },
    [logger, feature],
  );

  const logBusinessError = useCallback(
    async (
      operation: string,
      error: Error,
      metadata?: Record<string, unknown>,
    ) => {
      await logger.error(`Business operation failed: ${operation}`, error, {
        business: { feature, action: operation },
        custom: {
          outcome: "failure",
          timestamp: new Date().toISOString(),
          ...metadata,
        },
      });
    },
    [logger, feature],
  );

  return {
    logBusinessOperation,
    logBusinessSuccess,
    logBusinessError,
  };
}

/**
 * Component lifecycle logging hook
 */
export function useComponentLifecycleLogger(
  componentName: string,
  feature: string,
  logRenders = false,
) {
  const renderCountRef = useRef(0);
  const logger = useEnterpriseLogger({
    business: { feature, action: "component-lifecycle" },
    technical: {
      component: componentName,
      version: "1.0.0",
      environment: process.env.NODE_ENV ?? "development",
    },
  });

  // Track component mount and unmount
  useEffect(() => {
    void logger.info(`Component mounted: ${componentName}`, {
      custom: { lifecycleEvent: "mount", componentName },
    });

    return () => {
      void logger.info(`Component unmounted: ${componentName}`, {
        custom: {
          lifecycleEvent: "unmount",
          componentName,
        },
      });
    };
  }, [logger, componentName]);

  // Track renders if enabled
  useEffect(() => {
    renderCountRef.current++;
    const currentRenderCount = renderCountRef.current;

    if (logRenders) {
      void logger.debug(
        `Component rendered: ${componentName} (${currentRenderCount})`,
        {
          custom: {
            lifecycleEvent: "render",
            componentName,
            renderCount: currentRenderCount,
          },
        },
      );
    }
  });

  return {
    getRenderCount: () => renderCountRef.current,
  };
}
