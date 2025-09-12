/**
 * ENTERPRISE LOGGING SERVICE
 *
 * Centralized logging service implementing SOLID principles with comprehensive
 * error handling, performance optimization, and structured logging capabilities.
 *
 * ARCHITECTURE:
 * - Single Responsibility: Handles only logging concerns
 * - Open/Closed: Extensible through configuration and plugins
 * - Liskov Substitution: Implements ILogger interface consistently
 * - Interface Segregation: Clean, focused interface design
 * - Dependency Inversion: Depends on abstractions, not concretions
 *
 * PERFORMANCE FEATURES:
 * - Async logging with buffering
 * - Intelligent sampling for production
 * - Memory-efficient structured logging
 * - Non-blocking error handling
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-09-12
 */

import { Logtail as BetterStackLogger } from "@logtail/browser";
import * as Sentry from "@sentry/nextjs";
import type {
  ILogger,
  LogLevel,
  LogCategory,
  LogContext,
  StructuredLogEntry,
  ErrorSeverity,
  LoggerConfig,
  LoggerMetrics,
  CorrelationContext,
  UserContext,
  BusinessContext,
} from "@/types/logging";

/**
 * Production-grade logging service with enterprise features
 */
export class EnterpriseLogger implements ILogger {
  private readonly config: LoggerConfig;
  private readonly betterStackLogger?: BetterStackLogger;
  private readonly logBuffer: StructuredLogEntry[] = [];
  private readonly metrics: LoggerMetrics;
  private flushTimer?: NodeJS.Timeout;
  private baseContext: Partial<LogContext>;

  constructor(
    config?: Partial<LoggerConfig>,
    baseContext?: Partial<LogContext>,
  ) {
    this.config = this.createConfig(config);
    this.baseContext = baseContext ?? {};
    this.metrics = this.initializeMetrics();

    // Initialize Better Stack logger for client-side logging
    if (this.config.enableRemote && typeof window !== "undefined") {
      try {
        const sourceToken = this.getBetterStackToken();
        const customEndpoint = this.getBetterStackEndpoint();
        if (sourceToken) {
          console.log(
            "[LOGGING DEBUG] Initializing Better Stack with token:",
            sourceToken.substring(0, 8) + "...",
          );
          console.log("[LOGGING DEBUG] Using custom endpoint:", customEndpoint);
          this.betterStackLogger = new BetterStackLogger(sourceToken, {
            sendLogsToConsoleOutput: this.config.enableConsole,
            endpoint: customEndpoint,
          });
        } else {
          console.warn("[LOGGING DEBUG] No Better Stack token found");
        }
      } catch (error) {
        console.warn("Failed to initialize Better Stack logger:", error);
      }
    }

    // Start flush timer if buffering is enabled
    if (this.config.enableBuffering) {
      this.startFlushTimer();
    }
  }

  /**
   * Safely get environment variables for both client and server
   */
  private getCurrentEnvironment(): string {
    if (typeof window !== "undefined") {
      // Client-side: use process.env which is available at build time
      return process.env.NODE_ENV || "development";
    } else {
      // Server-side: can access process.env directly
      return process.env.NODE_ENV || "development";
    }
  }

  /**
   * Safely get Better Stack source token
   */
  private getBetterStackToken(): string | undefined {
    if (typeof window !== "undefined") {
      // Client-side: use public environment variable
      return process.env.NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN;
    } else {
      // Server-side: prefer private token, fallback to public
      return (
        process.env.BETTER_STACK_SOURCE_TOKEN ??
        process.env.NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN
      );
    }
  }

  /**
   * Safely get Better Stack ingesting endpoint
   */
  private getBetterStackEndpoint(): string {
    if (typeof window !== "undefined") {
      // Client-side: use public environment variable
      return (
        process.env.NEXT_PUBLIC_BETTER_STACK_INGESTING_URL ??
        "https://in.logs.betterstack.com"
      );
    } else {
      // Server-side: prefer private endpoint, fallback to public
      return (
        process.env.BETTER_STACK_INGESTING_HOST ??
        process.env.NEXT_PUBLIC_BETTER_STACK_INGESTING_URL ??
        "https://in.logs.betterstack.com"
      );
    }
  }

  /**
   * Create configuration with environment-aware defaults
   */
  private createConfig(userConfig?: Partial<LoggerConfig>): LoggerConfig {
    const currentEnv = this.getCurrentEnvironment();
    const isDevelopment = currentEnv === "development";
    const isProduction = currentEnv === "production";

    return {
      isEnabled: true,
      logLevel:
        (process.env.LOG_LEVEL as LogLevel) ??
        (isDevelopment ? "debug" : "info"),
      enableConsole: isDevelopment,
      enableRemote: true,
      enableSampling: isProduction,
      samplingRate: isProduction ? 0.1 : 1.0, // 10% in production, 100% in development
      enableBuffering: true,
      bufferSize: 100,
      flushInterval: 5000, // 5 seconds
      environment: currentEnv,
      serviceName: process.env.APP_NAME ?? "gigsy",
      serviceVersion: process.env.APP_VERSION ?? "1.0.0",
      ...userConfig,
    };
  }

  /**
   * Initialize metrics tracking
   */
  private initializeMetrics(): LoggerMetrics {
    return {
      logsGenerated: 0,
      logsSent: 0,
      logsBuffered: 0,
      errors: 0,
      avgProcessingTime: 0,
      lastFlushTime: new Date().toISOString(),
    };
  }

  /**
   * Generate correlation ID for request tracking
   */
  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Classify error severity based on error type and context
   */
  private classifyErrorSeverity(
    error?: Error,
    _context?: Partial<LogContext>,
  ): ErrorSeverity {
    if (!error) return "low";

    // Business-critical errors
    if (error.name.includes("Payment") || error.name.includes("Auth")) {
      return "critical";
    }

    // High-impact errors
    if (error.name.includes("Database") || error.name.includes("Network")) {
      return "high";
    }

    // Medium-impact errors
    if (error.name.includes("Validation") || error.name.includes("Business")) {
      return "medium";
    }

    return "low";
  }

  /**
   * Check if log should be sampled (performance optimization)
   */
  private shouldSample(): boolean {
    if (!this.config.enableSampling) return true;
    return Math.random() < this.config.samplingRate;
  }

  /**
   * Check if log level should be processed
   */
  private shouldLog(level: LogLevel): boolean {
    if (!this.config.isEnabled) return false;

    const levels: LogLevel[] = ["debug", "info", "warn", "error", "fatal"];
    const currentLevelIndex = levels.indexOf(this.config.logLevel);
    const logLevelIndex = levels.indexOf(level);

    return logLevelIndex >= currentLevelIndex;
  }

  /**
   * Create structured log entry with full context
   */
  private createLogEntry(
    level: LogLevel,
    category: LogCategory,
    message: string,
    error?: Error,
    context?: Partial<LogContext>,
  ): StructuredLogEntry {
    const mergedContext: LogContext = {
      correlation: {
        requestId: this.generateCorrelationId(),
        traceId: undefined, // TODO: Integrate with Sentry tracing
        ...this.baseContext.correlation,
        ...context?.correlation,
      },
      user: {
        ...this.baseContext.user,
        ...context?.user,
      },
      business: {
        feature: "unknown",
        action: "log",
        ...this.baseContext.business,
        ...context?.business,
      },
      technical: {
        component: "logger",
        version: this.config.serviceVersion,
        environment: this.config.environment,
        ...this.baseContext.technical,
        ...context?.technical,
      },
      performance: {
        ...this.baseContext.performance,
        ...context?.performance,
      },
      custom: {
        ...this.baseContext.custom,
        ...context?.custom,
      },
    };

    const logEntry: StructuredLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      context: mergedContext,
      metadata: {
        serviceName: this.config.serviceName,
        serviceVersion: this.config.serviceVersion,
        loggerVersion: "1.0.0",
      },
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
          cause: error.cause,
          severity: this.classifyErrorSeverity(error, context),
        },
      }),
    };

    return logEntry;
  }

  /**
   * Process log entry with performance tracking
   */
  private async processLogEntry(
    level: LogLevel,
    category: LogCategory,
    message: string,
    error?: Error,
    context?: Partial<LogContext>,
  ): Promise<void> {
    const startTime = performance.now();

    try {
      if (!this.shouldLog(level) || !this.shouldSample()) {
        return;
      }

      const logEntry = this.createLogEntry(
        level,
        category,
        message,
        error,
        context,
      );

      // Update metrics
      this.metrics.logsGenerated++;

      // Console logging for development
      if (this.config.enableConsole) {
        this.logToConsole(logEntry);
      }

      // Buffer for remote logging
      if (this.config.enableRemote) {
        this.addToBuffer(logEntry);
      }

      // Send critical errors immediately to Sentry
      if (level === "error" || level === "fatal") {
        this.sendToSentry(logEntry);
      }

      // Update performance metrics
      const processingTime = performance.now() - startTime;
      this.metrics.avgProcessingTime =
        (this.metrics.avgProcessingTime + processingTime) / 2;
    } catch (processingError) {
      this.metrics.errors++;
      console.error("Logging system error:", processingError);

      // Fallback to basic console logging
      console.log(`[${level.toUpperCase()}] ${message}`, { error, context });
    }
  }

  /**
   * Enhanced console logging with formatting
   */
  private logToConsole(logEntry: StructuredLogEntry): void {
    const timestamp = new Date(logEntry.timestamp).toLocaleTimeString();
    const prefix = `[${timestamp}] [${logEntry.level.toUpperCase()}] [${logEntry.category}]`;

    const style = this.getConsoleStyle(logEntry.level);

    if (logEntry.error) {
      console.group(`%c${prefix} ${logEntry.message}`, style);
      console.error("Error:", logEntry.error);
      console.log("Context:", logEntry.context);
      console.groupEnd();
    } else {
      console.log(`%c${prefix} ${logEntry.message}`, style, logEntry.context);
    }
  }

  /**
   * Get console styling based on log level
   */
  private getConsoleStyle(level: LogLevel): string {
    const styles = {
      debug: "color: #888",
      info: "color: #007acc",
      warn: "color: #ff8c00; font-weight: bold",
      error: "color: #dc3545; font-weight: bold",
      fatal:
        "color: #fff; background-color: #dc3545; font-weight: bold; padding: 2px 4px",
    };
    return styles[level];
  }

  /**
   * Add log entry to buffer for batch processing
   */
  private addToBuffer(logEntry: StructuredLogEntry): void {
    this.logBuffer.push(logEntry);
    this.metrics.logsBuffered++;

    // Flush immediately if buffer is full
    if (this.logBuffer.length >= this.config.bufferSize) {
      void this.flush();
    }
  }

  /**
   * Send critical errors to Sentry for immediate alerting
   */
  private sendToSentry(logEntry: StructuredLogEntry): void {
    try {
      if (logEntry.error) {
        const error = new Error(logEntry.error.message);
        error.name = logEntry.error.name;
        error.stack = logEntry.error.stack;

        Sentry.captureException(error, {
          level: logEntry.level === "fatal" ? "fatal" : "error",
          tags: {
            category: logEntry.category,
            feature: logEntry.context.business?.feature,
            component: logEntry.context.technical?.component,
          },
          extra: {
            context: logEntry.context,
            logEntry,
          },
          fingerprint: [
            logEntry.category,
            logEntry.error.name,
            logEntry.context.business?.feature ?? "unknown",
          ],
        });
      }
    } catch (sentryError) {
      console.warn("Failed to send error to Sentry:", sentryError);
    }
  }

  /**
   * Start automatic buffer flushing
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      void this.flush();
    }, this.config.flushInterval);
  }

  // Public API Implementation

  async debug(message: string, context?: Partial<LogContext>): Promise<void> {
    await this.processLogEntry(
      "debug",
      "technical",
      message,
      undefined,
      context,
    );
  }

  async info(message: string, context?: Partial<LogContext>): Promise<void> {
    await this.processLogEntry("info", "business", message, undefined, context);
  }

  async warn(message: string, context?: Partial<LogContext>): Promise<void> {
    await this.processLogEntry(
      "warn",
      "technical",
      message,
      undefined,
      context,
    );
  }

  async error(
    message: string,
    error?: Error,
    context?: Partial<LogContext>,
  ): Promise<void> {
    await this.processLogEntry("error", "technical", message, error, context);
  }

  async fatal(
    message: string,
    error?: Error,
    context?: Partial<LogContext>,
  ): Promise<void> {
    await this.processLogEntry("fatal", "technical", message, error, context);
  }

  withContext(context: Partial<LogContext>): ILogger {
    const newBaseContext = {
      ...this.baseContext,
      ...context,
      correlation: {
        requestId: this.generateCorrelationId(),
        ...this.baseContext.correlation,
        ...context.correlation,
      },
    };
    return new EnterpriseLogger(this.config, newBaseContext);
  }

  withUser(user: UserContext): ILogger {
    return this.withContext({ user });
  }

  withBusiness(business: BusinessContext): ILogger {
    return this.withContext({ business });
  }

  withCorrelation(correlation: CorrelationContext): ILogger {
    return this.withContext({ correlation });
  }

  /**
   * Flush buffered logs to remote service
   */
  async flush(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    const logsToFlush = [...this.logBuffer];
    this.logBuffer.length = 0; // Clear buffer

    try {
      if (this.betterStackLogger) {
        console.log(
          "[LOGGING DEBUG] Flushing",
          logsToFlush.length,
          "logs to Better Stack",
        );

        // Send logs to Better Stack
        await Promise.all(
          logsToFlush.map((logEntry) =>
            this.betterStackLogger!.log(
              logEntry.message,
              logEntry.level,
              logEntry,
            ),
          ),
        );

        await this.betterStackLogger.flush();
        this.metrics.logsSent += logsToFlush.length;
        console.log("[LOGGING DEBUG] Successfully sent logs to Better Stack");
      }

      this.metrics.lastFlushTime = new Date().toISOString();
      this.metrics.logsBuffered -= logsToFlush.length;
    } catch (flushError) {
      console.error(
        "[LOGGING DEBUG] Failed to flush logs to Better Stack:",
        flushError,
      );
      this.metrics.errors++;

      // Re-add logs to buffer for retry
      this.logBuffer.unshift(...logsToFlush);
    }
  }

  /**
   * Clean shutdown of logging service
   */
  async close(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    await this.flush();

    if (this.betterStackLogger) {
      await this.betterStackLogger.flush();
    }
  }

  /**
   * Get current metrics for monitoring
   */
  getMetrics(): LoggerMetrics {
    return { ...this.metrics };
  }
}

/**
 * Singleton logger instance for application-wide use
 */
let globalLogger: EnterpriseLogger;

/**
 * Get or create the global logger instance
 */
export function getLogger(context?: Partial<LogContext>): ILogger {
  if (!globalLogger) {
    globalLogger = new EnterpriseLogger();
  }

  return context ? globalLogger.withContext(context) : globalLogger;
}

/**
 * Create a logger with specific configuration
 */
export function createLogger(
  config?: Partial<LoggerConfig>,
  context?: Partial<LogContext>,
): ILogger {
  return new EnterpriseLogger(config, context);
}

/**
 * Specialized loggers for common use cases
 */
export const BusinessLogger = {
  userAction: (
    action: string,
    userId?: string,
    context?: Partial<LogContext>,
  ) =>
    getLogger({
      business: { feature: "user-interaction", action },
      user: { id: userId },
      ...context,
    }),

  apiCall: (endpoint: string, method: string, context?: Partial<LogContext>) =>
    getLogger({
      business: { feature: "api", action: `${method} ${endpoint}` },
      ...context,
    }),

  dataOperation: (operation: string, entityType: string, entityId?: string) =>
    getLogger({
      business: { feature: "data", action: operation, entityType, entityId },
    }),
};

export const SecurityLogger = {
  authEvent: (
    eventType: string,
    outcome: "success" | "failure",
    userId?: string,
  ) =>
    getLogger({
      business: { feature: "authentication", action: eventType },
      user: { id: userId },
    }),

  accessControl: (resource: string, action: string, userId?: string) =>
    getLogger({
      business: { feature: "authorization", action: `${action} ${resource}` },
      user: { id: userId },
    }),
};

export const PerformanceLogger = {
  operationTiming: (
    operation: string,
    duration: number,
    context?: Partial<LogContext>,
  ) =>
    getLogger({
      business: { feature: "performance", action: operation },
      performance: { duration },
      ...context,
    }),
};
