/**
 * RECONCILIATION SERVICE - BALANCE INTEGRITY MAINTENANCE
 *
 * Scheduled reconciliation system to ensure walletBalances projection
 * stays consistent with the canonical transactions ledger.
 *
 * RELIABILITY: Detects and corrects drift between ledger and projections
 * MONITORING: Alerts on discrepancies and reconciliation failures
 * PERFORMANCE: Batched processing with configurable limits
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-01-22
 */

import { action, internalAction } from "./_generated/server";
import { ConvexError } from "convex/values";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { DataModel } from "./_generated/dataModel";
import type { ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";

// Type for our custom context that extends the base Convex action context
type ReconcilationCtx = ActionCtx;

// --- Configuration ---
const RECONCILE_BATCH_SIZE = 100; // Process wallets in batches
const MAX_DRIFT_THRESHOLD = 1; // Alert if drift > 1 cent/piastre
const RECONCILE_TIMEOUT_MS = 30000; // 30 second timeout

// --- Type Definitions ---
interface ReconciliationResult {
  walletsProcessed: number;
  discrepanciesFound: number;
  discrepanciesFixed: number;
  errors: Array<{
    walletId: string;
    error: string;
    timestamp: number;
  }>;
  totalDriftAmount: number;
  processingTimeMs: number;
}

interface WalletDiscrepancy {
  walletId: Id<"wallets">;
  currency: "EGP" | "USD" | "EUR";
  ledgerBalance: number;
  projectionBalance: number;
  drift: number;
  transactionCount: number;
}

// --- Helper Functions ---

/**
 * Calculate actual balance from transaction ledger
 * @param ctx - Convex action context
 * @param walletId - Wallet ID to calculate balance for
 * @returns Actual balance from summing all transactions
 */
const calculateLedgerBalance = async (
  ctx: ReconcilationCtx,
  walletId: Id<"wallets">
): Promise<number> => {
  const transactions = await ctx.runQuery(
    internal.internal.walletTransactions.getWalletTransactions, 
    { walletId }
  );
  return transactions.reduce((sum: number, tx: DataModel["transactions"]["document"]) => sum + tx.amount, 0);
}

/**
 * Get current projection balance
 * @param ctx - Convex action context
 * @param walletId - Wallet ID
 * @returns Current balance from walletBalances table
 */
const getProjectionBalance = async (
  ctx: ReconcilationCtx,
  walletId: Id<"wallets">
): Promise<number> => {
  const balance = await ctx.runQuery(
    internal.internal.walletBalances.getWalletBalance, 
    { walletId }
  );
  return balance || 0;
}

/**
 * Log reconciliation event for monitoring
 * @param event - Event type
 * @param details - Event details
 * @param level - Log level
 */
function logReconciliation(event: string, details: any, level: "info" | "warn" | "error" = "info") {
  const logData = {
    service: "reconciliation",
    event,
    ...details,
    timestamp: new Date().toISOString(),
    correlationId: `reconcile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };

  if (level === "error") {
    console.error(`[RECONCILE] ${event}`, logData);
  } else if (level === "warn") {
    console.warn(`[RECONCILE] ${event}`, logData);
  } else {
    console.log(`[RECONCILE] ${event}`, logData);
  }
}

/**
 * Send alert for critical reconciliation issues
 * @param issue - Issue description
 * @param details - Issue details
 */
async function sendReconciliationAlert(issue: string, details: any) {
  // TODO: Integrate with your alerting system (Slack, PagerDuty, etc.)
  logReconciliation("CRITICAL_ALERT", { issue, ...details }, "error");
  
  // Example: Send to monitoring service
  // await notificationService.sendAlert({
  //   severity: "high",
  //   title: `Reconciliation Alert: ${issue}`,
  //   details,
  //   service: "gigsy-finance",
  // });
}

// --- Helper Functions for Reconciliation ---

// Define the reconciliation arguments type
type ReconciliationArgs = {
  batchSize?: number;
  dryRun?: boolean;
  walletIds?: Id<"wallets">[];
};

// Define the reconciliation result type
type ReconciliationReturnType = {
  success: boolean;
  result: {
    walletsProcessed: number;
    discrepanciesFound: number;
    discrepanciesFixed: number;
    errors: Array<{ walletId: string; error: string; timestamp: number }>;
    totalDriftAmount: number;
    processingTimeMs: number;
  };
  message: string;
};

/**
 * Core reconciliation logic that can be called from both actions and scheduled tasks
 */
async function performReconciliation(
  ctx: ReconcilationCtx,
  args: ReconciliationArgs
): Promise<ReconciliationReturnType> {
    const startTime = Date.now();
    const batchSize = args.batchSize ?? RECONCILE_BATCH_SIZE;
    const dryRun = args.dryRun ?? false;

    logReconciliation("RECONCILE_STARTED", {
      batchSize,
      dryRun,
      specificWallets: args.walletIds?.length ?? 0,
    });

    const result: ReconciliationResult = {
      walletsProcessed: 0,
      discrepanciesFound: 0,
      discrepanciesFixed: 0,
      errors: [],
      totalDriftAmount: 0,
      processingTimeMs: 0,
    };

    try {
      // Get wallets to process with proper error handling
      let wallets: Array<DataModel["wallets"]["document"]> = [];
      
      try {
        if (args.walletIds && args.walletIds.length > 0) {
          // Process specific wallets
          const walletPromises = args.walletIds.map(async (walletId) => {
            try {
              return await ctx.runQuery((internal as any).reconcileQueries.getWalletById, { walletId });
            } catch (error) {
              logReconciliation("WALLET_FETCH_ERROR", { 
                walletId, 
                error: error instanceof Error ? error.message : String(error) 
              }, "error");
              return null;
            }
          });
          
          const walletResults = await Promise.all(walletPromises);
          wallets = walletResults.filter((wallet: DataModel["wallets"]["document"] | null): wallet is DataModel["wallets"]["document"] => wallet !== null);
        } else {
          // Process all wallets using internal query
          wallets = await ctx.runQuery((internal as any).reconcileQueries.getAllWallets, {});
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error fetching wallets';
        logReconciliation("WALLET_FETCH_FAILED", { error: errorMessage }, "error");
        throw new ConvexError(`Failed to fetch wallets: ${errorMessage}`);
      }

      logReconciliation("WALLETS_FOUND", { count: wallets.length });

      // Process wallets in batches
      for (let i = 0; i < wallets.length; i += batchSize) {
        const batch = wallets.slice(i, i + batchSize);
        const discrepancies: WalletDiscrepancy[] = [];

        // Check each wallet in the batch
        for (const wallet of batch) {
          try {
            const ledgerBalance = await calculateLedgerBalance(ctx, wallet._id);
            const projectionBalance = await getProjectionBalance(ctx, wallet._id);
            const drift = Math.abs(ledgerBalance - projectionBalance);

            result.walletsProcessed++;

            if (drift > 0) {
              const discrepancy: WalletDiscrepancy = {
                walletId: wallet._id,
                currency: wallet.currency,
                ledgerBalance,
                projectionBalance,
                drift,
                transactionCount: 0, // Could calculate if needed
              };

              discrepancies.push(discrepancy);
              result.discrepanciesFound++;
              result.totalDriftAmount += drift;

              // Alert on significant drift
              if (drift > MAX_DRIFT_THRESHOLD) {
                await sendReconciliationAlert("SIGNIFICANT_BALANCE_DRIFT", {
                  walletId: wallet._id,
                  userId: wallet.userId,
                  currency: wallet.currency,
                  ledgerBalance,
                  projectionBalance,
                  drift,
                });
              }
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            result.errors.push({
              walletId: wallet._id,
              error: errorMessage,
              timestamp: Date.now(),
            });

            logReconciliation("WALLET_RECONCILE_ERROR", {
              walletId: wallet._id,
              error: errorMessage,
            }, "error");
          }
        }

        // Fix discrepancies if not dry run
        if (!dryRun && discrepancies.length > 0) {
          for (const discrepancy of discrepancies) {
            try {
              await ctx.runMutation(internal.internal.walletMutations.updateWalletBalance, {
                walletId: discrepancy.walletId,
                balance: discrepancy.ledgerBalance,
                currency: discrepancy.currency,
              });
              result.discrepanciesFixed++;

              logReconciliation("BALANCE_CORRECTED", {
                walletId: discrepancy.walletId,
                oldBalance: discrepancy.projectionBalance,
                newBalance: discrepancy.ledgerBalance,
                drift: discrepancy.drift,
              });

            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              result.errors.push({
                walletId: discrepancy.walletId,
                error: `Fix failed: ${errorMessage}`,
                timestamp: Date.now(),
              });

              logReconciliation("BALANCE_FIX_ERROR", {
                walletId: discrepancy.walletId,
                error: errorMessage,
              }, "error");
            }
          }
        }

        // Log batch progress
        logReconciliation("BATCH_PROCESSED", {
          batchNumber: Math.floor(i / batchSize) + 1,
          walletsInBatch: batch.length,
          discrepanciesInBatch: discrepancies.length,
          totalProcessed: result.walletsProcessed,
        });

        // Check timeout
        if (Date.now() - startTime > RECONCILE_TIMEOUT_MS) {
          logReconciliation("RECONCILE_TIMEOUT", {
            processedSoFar: result.walletsProcessed,
            totalWallets: wallets.length,
          }, "warn");
          break;
        }
      }

      result.processingTimeMs = Date.now() - startTime;

      // Final logging and alerting
      logReconciliation("RECONCILE_COMPLETED", {
        ...result,
        dryRun,
        successRate: result.errors.length === 0 ? 100 : 
          ((result.walletsProcessed - result.errors.length) / result.walletsProcessed) * 100,
      });

      // Alert on high error rate
      if (result.errors.length > result.walletsProcessed * 0.1) {
        await sendReconciliationAlert("HIGH_RECONCILIATION_ERROR_RATE", {
          errorRate: (result.errors.length / result.walletsProcessed) * 100,
          totalErrors: result.errors.length,
          totalProcessed: result.walletsProcessed,
        });
      }

      // Alert on high discrepancy rate
      if (result.discrepanciesFound > result.walletsProcessed * 0.05) {
        await sendReconciliationAlert("HIGH_BALANCE_DISCREPANCY_RATE", {
          discrepancyRate: (result.discrepanciesFound / result.walletsProcessed) * 100,
          totalDiscrepancies: result.discrepanciesFound,
          totalDrift: result.totalDriftAmount,
        });
      }

      const message = dryRun 
        ? `Dry run completed: ${result.discrepanciesFound} discrepancies found`
        : `Reconciliation completed: ${result.discrepanciesFixed}/${result.discrepanciesFound} discrepancies fixed`;

      return {
        success: true,
        result,
        message,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.processingTimeMs = Date.now() - startTime;

      logReconciliation("RECONCILE_FAILED", {
        error: errorMessage,
        partialResult: result,
      }, "error");

      await sendReconciliationAlert("RECONCILIATION_SYSTEM_FAILURE", {
        error: errorMessage,
        partialResult: result,
      });

      return {
        success: false,
        result,
        message: `Reconciliation failed: ${errorMessage}`,
      };
    }
  }

// Define the action with proper typing
export const reconcileBalances = action({
  args: {
    batchSize: v.optional(v.number()),
    dryRun: v.optional(v.boolean()),
    walletIds: v.optional(v.array(v.id("wallets"))),
  },
  handler: async (ctx: ReconcilationCtx, args: { batchSize?: number; dryRun?: boolean; walletIds?: Id<"wallets">[] }): Promise<ReconciliationReturnType> => {
    return performReconciliation(ctx, args);
  },
});

/**
 * Health check for reconciliation system
 * Verifies system is ready to perform reconciliation
 */
export const reconciliationHealthCheck = action({
  handler: async (ctx: ReconcilationCtx) => {
    try {
      const checks = {
        databaseConnectivity: true,
        walletCount: 0,
        transactionCount: 0,
        balanceProjectionCount: 0,
        lastReconcileTime: undefined as number | undefined,
      };

      // Check database connectivity and get counts
      try {
        // Use type assertion to access healthQueries
        const counts = await ctx.runQuery(
          (internal as any).healthQueries.getHealthCheckCounts, 
          {}
        ) as { walletCount: number; transactionCount: number; balanceProjectionCount: number };
        checks.walletCount = counts.walletCount;
        checks.transactionCount = counts.transactionCount;
        checks.balanceProjectionCount = counts.balanceProjectionCount;
      } catch (error) {
        checks.databaseConnectivity = false;
        logReconciliation("HEALTH_CHECK_DB_ERROR", { error }, "error");
      }

      // TODO: Get last reconcile time from a reconciliation log table
      // checks.lastReconcileTime = await getLastReconcileTime(ctx);

      const healthy = checks.databaseConnectivity && 
                     checks.walletCount >= 0 && 
                     checks.transactionCount >= 0;

      logReconciliation("HEALTH_CHECK", { healthy, checks });

      return {
        healthy,
        checks,
        message: healthy ? "Reconciliation system is healthy" : "Reconciliation system has issues",
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      logReconciliation("HEALTH_CHECK_FAILED", { error: errorMessage }, "error");

      return {
        healthy: false,
        checks: {
          databaseConnectivity: false,
          walletCount: 0,
          transactionCount: 0,
          balanceProjectionCount: 0,
          lastReconcileTime: undefined,
        },
        message: `Health check failed: ${errorMessage}`,
      };
    }
  },
});

/**
 * Emergency reconciliation for specific wallet
 * Used when a specific wallet balance issue is detected
 */
export const emergencyReconcileWallet = action({
  args: {
    walletId: v.id("wallets"),
    reason: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    oldBalance: v.number(),
    newBalance: v.number(),
    drift: v.number(),
    message: v.string(),
  }),
  handler: async (ctx: ReconcilationCtx, { walletId, reason }) => {
    try {
      logReconciliation("EMERGENCY_RECONCILE_STARTED", {
        walletId,
        reason,
      }, "warn");

      // Use internal query to get wallet
      const wallet = await ctx.runQuery((internal as any).reconcileQueries.getWalletById, { walletId });
      if (!wallet) {
        throw new ConvexError("Wallet not found");
      }

      const ledgerBalance = await calculateLedgerBalance(ctx, walletId);
      const projectionBalance = await getProjectionBalance(ctx, walletId);
      const drift = Math.abs(ledgerBalance - projectionBalance);

      if (drift === 0) {
        logReconciliation("EMERGENCY_RECONCILE_NO_DRIFT", {
          walletId,
          balance: ledgerBalance,
        });

        return {
          success: true,
          oldBalance: projectionBalance,
          newBalance: ledgerBalance,
          drift: 0,
          message: "No reconciliation needed - balances already match",
        };
      }

      // Update the projection using internal mutation
      await ctx.runMutation((internal as any).walletMutations.updateWalletBalance, {
        walletId,
        balance: ledgerBalance,
      });

      // Get the updated balance for logging
      const updatedBalance: number = await ctx.runQuery((internal as any).walletBalances.getWalletBalance, { walletId });
      
      logReconciliation("EMERGENCY_RECONCILE_COMPLETED", {
        walletId,
        oldBalance: projectionBalance,
        newBalance: updatedBalance,
        drift,
        reason,
      }, "info");

      // Alert on emergency reconciliation since we found a discrepancy
      await sendReconciliationAlert("EMERGENCY_RECONCILIATION_PERFORMED", {
        walletId,
        reason,
        drift,
        oldBalance: projectionBalance,
        newBalance: updatedBalance,
      });

      return {
        success: true,
        oldBalance: projectionBalance,
        newBalance: updatedBalance,
        drift,
        message: `Successfully reconciled wallet ${walletId} - corrected drift of ${drift}`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      logReconciliation("EMERGENCY_RECONCILE_FAILED", {
        walletId,
        reason,
        error: errorMessage,
      }, "error");

      await sendReconciliationAlert("EMERGENCY_RECONCILIATION_FAILED", {
        walletId,
        reason,
        error: errorMessage,
      });

      throw new ConvexError(`Emergency reconciliation failed: ${errorMessage}`);
    }
  },
});

/**
 * Internal action for scheduled reconciliation
 * Called by Convex scheduler or external orchestrator
 */
export const scheduledReconciliation = internalAction({
  handler: async (ctx: ReconcilationCtx) => {
    try {
      logReconciliation("SCHEDULED_RECONCILE_TRIGGERED", {
        scheduledAt: new Date().toISOString(),
      });

            // Call the main reconciliation action with the appropriate arguments
      interface ReconciliationResult {
        success: boolean;
        message: string;
        // Add other properties that reconcileBalances returns
        walletsProcessed?: number;
        discrepanciesFound?: number;
        discrepanciesFixed?: number;
      }

      const result = await performReconciliation(ctx, {
        batchSize: RECONCILE_BATCH_SIZE,
        dryRun: false,
      });

      return {
        success: result.success,
        message: `Scheduled reconciliation: ${result.message}`,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      logReconciliation("SCHEDULED_RECONCILE_FAILED", {
        error: errorMessage,
      }, "error");

      await sendReconciliationAlert("SCHEDULED_RECONCILIATION_FAILED", {
        error: errorMessage,
        timestamp: Date.now(),
      });

      return {
        success: false,
        message: `Scheduled reconciliation failed: ${errorMessage}`,
      };
    }
  },
});
