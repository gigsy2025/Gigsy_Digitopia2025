import { action } from "./_generated/server";
import { v } from "convex/values";

/**
 * Clean Convex action for browser logging that forwards to Better Stack
 * Server-only logging to keep API tokens secure
 */
export const log = action({
  args: {
    level: v.string(),
    message: v.string(),
    metadata: v.optional(v.record(v.string(), v.any())),
    timestamp: v.optional(v.string()),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      // Dynamic import to keep GigsyLogger server-side only
      const { logger } = await import("../src/lib/utils/PinoLogger");

      // Structure the log context
      const logContext = {
        source: args.source ?? "browser",
        timestamp: args.timestamp ?? new Date().toISOString(),
        ...(args.metadata ?? {}),
      };

      // Forward to Better Stack via GigsyLogger
      switch (args.level.toLowerCase()) {
        case "error":
          logger.error(logContext, args.message);
          break;
        case "warn":
          logger.warn(logContext, args.message);
          break;
        case "info":
          logger.info(logContext, args.message);
          break;
        case "debug":
          logger.debug(logContext, args.message);
          break;
        default:
          logger.info(logContext, args.message);
      }
    } catch (error) {
      // Fallback to console if GigsyLogger fails
      console.error("Failed to log via GigsyLogger:", error);
      console.log(`[${args.level}] ${args.message}`, args.metadata);
    }
  },
});

/**
 * Batch logging action for efficiency
 */
export const logBatch = action({
  args: {
    logs: v.array(
      v.object({
        level: v.string(),
        message: v.string(),
        metadata: v.optional(v.record(v.string(), v.any())),
        timestamp: v.optional(v.string()),
        source: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    try {
      const { logger } = await import("../src/lib/utils/PinoLogger");

      for (const logEntry of args.logs) {
        const logContext = {
          source: logEntry.source ?? "browser",
          timestamp: logEntry.timestamp ?? new Date().toISOString(),
          ...(logEntry.metadata ?? {}),
        };

        switch (logEntry.level.toLowerCase()) {
          case "error":
            logger.error(logContext, logEntry.message);
            break;
          case "warn":
            logger.warn(logContext, logEntry.message);
            break;
          case "info":
            logger.info(logContext, logEntry.message);
            break;
          case "debug":
            logger.debug(logContext, logEntry.message);
            break;
          default:
            logger.info(logContext, logEntry.message);
        }
      }
    } catch (error) {
      console.error("Failed to batch log via GigsyLogger:", error);
      args.logs.forEach((log) => {
        console.log(`[${log.level}] ${log.message}`, log.metadata);
      });
    }
  },
});
