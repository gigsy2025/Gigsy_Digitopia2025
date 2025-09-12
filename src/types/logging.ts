/**
 * ENTERPRISE LOGGING TYPE DEFINITIONS
 *
 * Provides comprehensive type safety for the logging system with support for
 * structured logging, error classification, and performance monitoring.
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-09-12
 */

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

export type LogCategory =
  | "business" // Business logic events
  | "technical" // System technical events
  | "security" // Authentication, authorization, security events
  | "performance" // Performance metrics and monitoring
  | "user" // User interaction events
  | "api" // API request/response events
  | "database" // Database operations
  | "external" // Third-party service interactions
  | "audit"; // Compliance and audit events

export type ErrorSeverity = "low" | "medium" | "high" | "critical";

export interface UserContext {
  readonly id?: string;
  readonly role?: string;
  readonly sessionId?: string;
  readonly organizationId?: string;
}

export interface BusinessContext {
  readonly feature: string;
  readonly action: string;
  readonly entityType?: string;
  readonly entityId?: string;
  readonly workflowStep?: string;
}

export interface TechnicalContext {
  readonly component: string;
  readonly version: string;
  readonly environment: string;
  readonly buildId?: string;
  readonly deploymentId?: string;
}

export interface CorrelationContext {
  readonly requestId: string;
  readonly traceId?: string;
  readonly spanId?: string;
  readonly parentId?: string;
  readonly causationId?: string;
}

export interface PerformanceMetrics {
  readonly duration?: number;
  readonly memoryUsage?: number;
  readonly cpuUsage?: number;
  readonly networkLatency?: number;
  readonly dbQueryCount?: number;
  readonly cacheHitRate?: number;
}

export interface LogContext {
  readonly user?: UserContext;
  readonly business?: BusinessContext;
  readonly technical?: TechnicalContext;
  readonly correlation: CorrelationContext;
  readonly performance?: PerformanceMetrics;
  readonly custom?: Record<string, unknown>;
}

export interface StructuredLogEntry {
  readonly timestamp: string;
  readonly level: LogLevel;
  readonly category: LogCategory;
  readonly message: string;
  readonly context: LogContext;
  readonly error?: {
    readonly name: string;
    readonly message: string;
    readonly stack?: string;
    readonly cause?: unknown;
    readonly severity: ErrorSeverity;
  };
  readonly metadata?: Record<string, unknown>;
}

export interface LoggerConfig {
  readonly isEnabled: boolean;
  readonly logLevel: LogLevel;
  readonly enableConsole: boolean;
  readonly enableRemote: boolean;
  readonly enableSampling: boolean;
  readonly samplingRate: number;
  readonly enableBuffering: boolean;
  readonly bufferSize: number;
  readonly flushInterval: number;
  readonly environment: string;
  readonly serviceName: string;
  readonly serviceVersion: string;
}

export interface ILogger {
  debug(message: string, context?: Partial<LogContext>): Promise<void>;
  info(message: string, context?: Partial<LogContext>): Promise<void>;
  warn(message: string, context?: Partial<LogContext>): Promise<void>;
  error(
    message: string,
    error?: Error,
    context?: Partial<LogContext>,
  ): Promise<void>;
  fatal(
    message: string,
    error?: Error,
    context?: Partial<LogContext>,
  ): Promise<void>;

  withContext(context: Partial<LogContext>): ILogger;
  withUser(user: UserContext): ILogger;
  withBusiness(business: BusinessContext): ILogger;
  withCorrelation(correlation: CorrelationContext): ILogger;

  flush(): Promise<void>;
  close(): Promise<void>;
}

export interface LoggerMetrics {
  logsGenerated: number;
  logsSent: number;
  logsBuffered: number;
  errors: number;
  avgProcessingTime: number;
  lastFlushTime: string;
}

/**
 * Performance monitoring integration
 */
export interface PerformanceLogEntry extends StructuredLogEntry {
  readonly category: "performance";
  readonly performance: Required<PerformanceMetrics>;
}

/**
 * Security event logging
 */
export interface SecurityLogEntry extends StructuredLogEntry {
  readonly category: "security";
  readonly security: {
    readonly eventType:
      | "authentication"
      | "authorization"
      | "dataAccess"
      | "suspicious";
    readonly outcome: "success" | "failure" | "blocked";
    readonly riskLevel: "low" | "medium" | "high" | "critical";
    readonly ipAddress?: string;
    readonly userAgent?: string;
    readonly location?: string;
  };
}

/**
 * Audit trail logging for compliance
 */
export interface AuditLogEntry extends StructuredLogEntry {
  readonly category: "audit";
  readonly audit: {
    readonly action: string;
    readonly resource: string;
    readonly outcome: "success" | "failure";
    readonly changes?: Record<string, { before: unknown; after: unknown }>;
    readonly reason?: string;
    readonly approver?: string;
  };
}
