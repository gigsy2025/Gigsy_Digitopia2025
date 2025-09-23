import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";

// Define Currency type locally since we can't import from _generated/shared
type Currency = "EGP" | "USD" | "EUR";

// Schema for createTransaction arguments
const CreateTransactionArgs = {
  walletId: v.id("wallets"),
  amount: v.number(),
  currency: v.union(v.literal("EGP"), v.literal("USD"), v.literal("EUR")),
  type: v.union(
    v.literal("DEPOSIT"),
    v.literal("WITHDRAWAL"),
    v.literal("TRANSFER"),
  ),
  status: v.optional(
    v.union(v.literal("COMPLETED"), v.literal("PENDING"), v.literal("FAILED")),
  ),
  description: v.optional(v.string()),
  idempotencyKey: v.optional(v.string()),
  relatedEntityType: v.optional(v.string()),
  relatedEntityId: v.optional(v.string()),
  createdBy: v.optional(v.string()),
};

export const createTransaction = internalMutation({
  args: CreateTransactionArgs,
  handler: async (ctx, args) => {
    const {
      walletId,
      amount,
      currency,
      type,
      description,
      idempotencyKey,
      relatedEntityType,
      relatedEntityId,
    } = args;

    // Check for duplicate transaction using idempotencyKey if provided
    if (idempotencyKey) {
      // Search for existing transaction with the same idempotencyKey in the description or relatedEntityId
      const existing = await ctx.db
        .query("transactions")
        .filter((q) =>
          q.or(
            q.eq(q.field("idempotencyKey"), idempotencyKey),
            q.eq(q.field("relatedEntityId"), idempotencyKey),
          ),
        )
        .first();

      if (existing) {
        return {
          status: "already_processed" as const,
          transactionId: existing._id,
        };
      }
    }

    // Create transaction
    const transactionId = await ctx.db.insert("transactions", {
      walletId,
      amount,
      currency,
      type,
      status: (status ?? "COMPLETED") as
        | "PENDING"
        | "COMPLETED"
        | "FAILED"
        | "CANCELLED", // Use provided status or default to "COMPLETED"
      description,
      idempotencyKey,
      relatedEntityType,
      relatedEntityId,
      createdAt: Date.now(),
      createdBy: args.createdBy || "system", // Default to 'system' if not provided
    });

    // Update wallet balance in walletBalances collection
    const walletBalance = await ctx.db
      .query("walletBalances")
      .withIndex("by_wallet", (q) => q.eq("walletId", walletId))
      .first();

    if (walletBalance) {
      await ctx.db.patch(walletBalance._id, {
        balance: walletBalance.balance + amount,
        lastUpdated: Date.now(),
      });
    } else {
      // If no balance record exists, create one
      await ctx.db.insert("walletBalances", {
        walletId,
        balance: amount,
        lastUpdated: Date.now(),
        currency: currency as Currency, // Cast to Currency type
      });
    }

    return { status: "ok" as const, transactionId };
  },
});

export const updateWalletBalance = internalMutation({
  args: {
    walletId: v.id("wallets"),
    balance: v.number(),
    currency: v.union(v.literal("EGP"), v.literal("USD"), v.literal("EUR")),
  },
  handler: async (ctx, { walletId, balance, currency }) => {
    const existingBalance = await ctx.db
      .query("walletBalances")
      .withIndex("by_wallet", (q) => q.eq("walletId", walletId))
      .first();

    if (existingBalance) {
      await ctx.db.patch(existingBalance._id, {
        balance,
        currency,
        lastUpdated: Date.now(),
      });
    } else {
      await ctx.db.insert("walletBalances", {
        walletId,
        balance,
        currency,
        lastUpdated: Date.now(),
      });
    }
  },
});
