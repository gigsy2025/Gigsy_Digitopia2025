/**
 * Comprehensive logging system using Pino + Convex + Logtail (Better Stack)
 *
 * @fileoverview Enterprise-grade logging solution for Gigsy application with universal client/server support
 * @version 1.0.0
 * @author Principal Engineer - Gigsy Team
 */

import pino from "pino";
import { env } from "../../env.js";
import { sanitizeData, sanitizeError } from "../logging/sanitizer";
import { getCorrelationContext } from "../logging/correlation";
import type {
  LogLevel,
  LogContext,
  LoggerConfig,
  RequestMetadata,
  PerformanceMetadata,
  SecurityMetadata,
} from "../logging/types";

/**
 * Safely get server-side environment variables (client-safe)
 */
function getServerConfig() {
  // Only access server env vars on server side
  if (typeof window === "undefined") {
    try {
      return {
        nodeEnv: env.NODE_ENV ?? "development",
        logLevel: (env.LOG_LEVEL ?? "info") as LogLevel,
        appName: env.APP_NAME ?? "gigsy",
        appVersion: env.APP_VERSION ?? "1.0.0",
        enableBetterStack: !!env.BETTER_STACK_SOURCE_TOKEN,
        betterStackToken: env.BETTER_STACK_SOURCE_TOKEN,
      };
    } catch {
      // Fallback if env access fails
      return {
        nodeEnv: "development" as const,
        logLevel: "info" as LogLevel,
        appName: "gigsy",
        appVersion: "1.0.0",
        enableBetterStack: false,
        betterStackToken: undefined,
      };
    }
  }

  // Client-side fallbacks
  return {
    nodeEnv: "development" as const,
    logLevel: "info" as LogLevel,
    appName: "gigsy",
    appVersion: "1.0.0",
    enableBetterStack: false,
    betterStackToken: undefined,
  };
}

/**
 * Default logger configuration (client-safe)
 */
function createDefaultConfig(): LoggerConfig {
  const serverConfig = getServerConfig();

  return {
    level: serverConfig.logLevel,
    context: "system",
    service: serverConfig.appName,
    version: serverConfig.appVersion,
    environment: serverConfig.nodeEnv,
    enableConsole: serverConfig.nodeEnv === "development",
    enableBetterStack: serverConfig.enableBetterStack,
    enableSentry: false,
    sensitiveFields: [],
    correlationIdHeader: "x-correlation-id",
  };
}

/**
 * Detects if we're running in a server-side rendering context
 */
function isServerSide(): boolean {
  return typeof window === "undefined";
}

/**
 * Creates Pino logger with safe transport configuration for Next.js
 */
function createBaseLogger(config: LoggerConfig): pino.Logger {
  const serverConfig = getServerConfig();

  // Base logger configuration
  const baseOptions = {
    level: config.level,
    base: {
      service: config.service,
      version: config.version,
      environment: config.environment,
      context: config.context,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      log: (object: Record<string, unknown>) => {
        // Add correlation context to every log
        try {
          const correlationContext = getCorrelationContext();
          return {
            ...object,
            correlationId: correlationContext?.correlationId,
            requestId: correlationContext?.requestId,
            userId: correlationContext?.userId,
            sessionId: correlationContext?.sessionId,
          };
        } catch {
          // Fallback if correlation context fails
          return object;
        }
      },
    },
  };

  // Server-side: Use transport with Better Stack integration
  if (isServerSide()) {
    try {
      if (serverConfig.enableBetterStack && serverConfig.betterStackToken) {
        // Better Stack transport for production server logging
        return pino(
          baseOptions,
          pino.transport({
            target: "@logtail/pino",
            options: {
              sourceToken: serverConfig.betterStackToken as string,
            },
          }) as pino.DestinationStream,
        );
      } else if (config.enableConsole) {
        // Pretty console transport for development server logging
        return pino(
          baseOptions,
          pino.transport({
            target: "pino-pretty",
            options: {
              colorize: true,
              singleLine: true,
              translateTime: "SYS:standard",
            },
          }) as pino.DestinationStream,
        );
      }
    } catch (error) {
      // Fallback if transport setup fails
      console.warn("Pino transport setup failed, using basic logger:", error);
    }
  }

  // Client-side: Basic logger without transport
  // Browser environments don't support pino.transport()
  if (!isServerSide()) {
    return pino({
      ...baseOptions,
      browser: {
        asObject: true,
        serialize: true,
      },
    });
  }

  // Final fallback: Basic logger without transport
  return pino(baseOptions);
}

/**
 * Enhanced Pino logger with automatic sanitization, context injection,
 * and structured logging for the Gigsy application
 */
export class GigsyLogger {
  private readonly logger: pino.Logger;
  private readonly config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    const defaultConfig = createDefaultConfig();
    this.config = { ...defaultConfig, ...config };
    this.logger = createBaseLogger(this.config);
  }

  /**
   * Sanitizes log data before logging
   */
  private sanitizeLogData(data: unknown): unknown {
    return sanitizeData(data, {
      sensitiveFields: this.config.sensitiveFields ?? [],
    });
  }

  /**
   * Logs to Convex transport for universal client/server logging
   * NOTE: This is now handled by our clean browser logger + Convex actions
   * Server-side logs go directly to Better Stack via Pino transport
   */
  private logToConvex(
    _level: LogLevel,
    _message: string,
    _metadata?: unknown,
  ): void {
    // For the clean simple approach, we removed the complex transport
    // Browser logging now uses ConvexBrowserLogger -> Convex actions -> GigsyLogger
    // Server logging goes directly to Better Stack via Pino transport
    // This method is kept for compatibility but does nothing
  }

  /**
   * Fatal level logging
   */
  fatal(objOrMsg: unknown, msg?: string): void {
    try {
      if (typeof objOrMsg === "string") {
        this.logger.fatal(objOrMsg);
        this.logToConvex("fatal", objOrMsg);
      } else if (objOrMsg instanceof Error) {
        const sanitized = sanitizeError(objOrMsg);
        this.logger.fatal(sanitized, msg ?? objOrMsg.message);
        this.logToConvex("fatal", msg ?? objOrMsg.message, sanitized);
      } else {
        this.logger.fatal(this.sanitizeLogData(objOrMsg), msg);
        this.logToConvex("fatal", msg ?? "Fatal error occurred", objOrMsg);
      }
    } catch {
      // Fallback to console if logger fails
      console.error("[FATAL]", objOrMsg, msg);
    }
  }

  /**
   * Error level logging
   */
  error(objOrMsg: unknown, msg?: string): void {
    try {
      if (typeof objOrMsg === "string") {
        this.logger.error(objOrMsg);
        this.logToConvex("error", objOrMsg);
      } else if (objOrMsg instanceof Error) {
        const sanitized = sanitizeError(objOrMsg);
        this.logger.error(sanitized, msg ?? objOrMsg.message);
        this.logToConvex("error", msg ?? objOrMsg.message, sanitized);
      } else {
        this.logger.error(this.sanitizeLogData(objOrMsg), msg);
        this.logToConvex("error", msg ?? "Error occurred", objOrMsg);
      }
    } catch {
      // Fallback to console if logger fails
      console.error("[ERROR]", objOrMsg, msg);
    }
  }

  /**
   * Warning level logging
   */
  warn(objOrMsg: unknown, msg?: string): void {
    try {
      if (typeof objOrMsg === "string") {
        this.logger.warn(objOrMsg);
        this.logToConvex("warn", objOrMsg);
      } else {
        this.logger.warn(this.sanitizeLogData(objOrMsg), msg);
        this.logToConvex("warn", msg ?? "Warning occurred", objOrMsg);
      }
    } catch {
      // Fallback to console if logger fails
      console.warn("[WARN]", objOrMsg, msg);
    }
  }

  /**
   * Info level logging
   */
  info(objOrMsg: unknown, msg?: string): void {
    try {
      if (typeof objOrMsg === "string") {
        this.logger.info(objOrMsg);
        this.logToConvex("info", objOrMsg);
      } else {
        this.logger.info(this.sanitizeLogData(objOrMsg), msg);
        this.logToConvex("info", msg ?? "Info message", objOrMsg);
      }
    } catch {
      // Fallback to console if logger fails
      console.info("[INFO]", objOrMsg, msg);
    }
  }

  /**
   * Debug level logging
   */
  debug(objOrMsg: unknown, msg?: string): void {
    try {
      if (typeof objOrMsg === "string") {
        this.logger.debug(objOrMsg);
        this.logToConvex("debug", objOrMsg);
      } else {
        this.logger.debug(this.sanitizeLogData(objOrMsg), msg);
        this.logToConvex("debug", msg ?? "Debug message", objOrMsg);
      }
    } catch {
      // Fallback to console if logger fails
      console.debug("[DEBUG]", objOrMsg, msg);
    }
  }

  /**
   * Trace level logging
   */
  trace(objOrMsg: unknown, msg?: string): void {
    try {
      if (typeof objOrMsg === "string") {
        this.logger.trace(objOrMsg);
        this.logToConvex("trace", objOrMsg);
      } else {
        this.logger.trace(this.sanitizeLogData(objOrMsg), msg);
        this.logToConvex("trace", msg ?? "Trace message", objOrMsg);
      }
    } catch {
      // Fallback to console if logger fails
      console.log("[TRACE]", objOrMsg, msg);
    }
  }

  /**
   * Log API request with detailed metadata
   */
  logRequest(metadata: RequestMetadata): void {
    const sanitized = this.sanitizeLogData(metadata);
    this.info(sanitized, `${metadata.method} ${metadata.url}`);
  }

  /**
   * Log API response with performance data
   */
  logResponse(
    metadata: RequestMetadata,
    performance: PerformanceMetadata,
  ): void {
    const sanitizedMetadata = this.sanitizeLogData(metadata) as Record<
      string,
      unknown
    >;
    const logData = {
      ...sanitizedMetadata,
      ...performance,
    };

    if (performance.duration > 1000) {
      this.warn(logData, `Slow response: ${metadata.method} ${metadata.url}`);
    } else {
      this.info(logData, `${metadata.method} ${metadata.url} completed`);
    }
  }

  /**
   * Log security events
   */
  logSecurity(event: SecurityMetadata): void {
    const sanitized = this.sanitizeLogData(event);

    if (event.severity === "high" || event.severity === "critical") {
      this.error(sanitized, `Security event: ${event.event}`);
    } else {
      this.warn(sanitized, `Security event: ${event.event}`);
    }
  }

  /**
   * Log database operations
   */
  logDatabase(
    operation: string,
    table: string,
    duration: number,
    metadata?: unknown,
  ): void {
    const logData = {
      operation,
      table,
      duration,
      metadata: metadata ? this.sanitizeLogData(metadata) : undefined,
    };

    if (duration > 500) {
      this.warn(logData, `Slow database operation: ${operation} on ${table}`);
    } else {
      this.debug(logData, `Database operation: ${operation} on ${table}`);
    }
  }

  /**
   * Log authentication events
   */
  logAuth(event: string, userId?: string, metadata?: unknown): void {
    const logData = {
      event,
      userId,
      metadata: metadata ? this.sanitizeLogData(metadata) : undefined,
    };

    this.info(logData, `Authentication event: ${event}`);
  }

  /**
   * Log business logic events
   */
  logBusiness(event: string, context: LogContext, metadata?: unknown): void {
    const logData = {
      event,
      context,
      metadata: metadata ? this.sanitizeLogData(metadata) : undefined,
    };

    this.info(logData, `Business event: ${event}`);
  }

  /**
   * Create a child logger with additional context
   */
  child(bindings: Record<string, unknown>): GigsyLogger {
    const childLogger = new GigsyLogger(this.config);
    childLogger.logger.setBindings(
      this.sanitizeLogData(bindings) as Record<string, unknown>,
    );
    return childLogger;
  }

  /**
   * Update logger configuration
   */
  configure(newConfig: Partial<LoggerConfig>): void {
    Object.assign(this.config, newConfig);
  }

  /**
   * Get current logger configuration
   */
  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  /**
   * Flush pending logs (useful for graceful shutdown)
   * NOTE: In our clean simple approach, no transport to flush
   * Server-side logs go directly to Better Stack via Pino transport
   * Browser logs are sent immediately through Convex actions
   */
  async flush(): Promise<void> {
    try {
      // Flush Better Stack transport if available
      if (this.logger && "flush" in this.logger) {
        this.logger.flush();
      }

      // No convex transport to flush in clean approach
      // Browser logging happens immediately through Convex actions
    } catch (error) {
      console.error("Failed to flush logs:", error);
    }
  }
}

// Create default logger instance
export const logger = new GigsyLogger();

// Export for testing and advanced usage
export { createBaseLogger, createDefaultConfig };
