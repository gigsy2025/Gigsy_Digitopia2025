import { internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { DatabaseReader, DatabaseWriter } from "../_generated/server";
import type { ObjectType } from "convex/values";

// --- Constants ---
const DEFAULT_CURRENCIES = ["EGP", "USD", "EUR"] as const;

type Currency = (typeof DEFAULT_CURRENCIES)[number];

// --- Validation Schema ---
const InitWalletSchema = v.object({
  userId: v.id("users"),
  clerkId: v.string(),
  currency: v.optional(
    v.union(v.literal("EGP"), v.literal("USD"), v.literal("EUR")),
  ),
  initialBalance: v.optional(v.number()),
  idempotencyKey: v.optional(v.string()),
});

// --- Internal Query: Check if wallet exists ---
const walletExists = internalQuery({
  args: {
    userId: v.id("users"),
    currency: v.union(v.literal("EGP"), v.literal("USD"), v.literal("EUR")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("wallets")
      .withIndex("by_user_currency", (q) =>
        q.eq("userId", args.userId).eq("currency", args.currency),
      )
      .first();

    return existing !== null;
  },
});

// --- Internal Mutation: Create a single wallet ---
const createWallet = internalMutation({
  args: {
    userId: v.id("users"),
    clerkId: v.string(),
    currency: v.union(v.literal("EGP"), v.literal("USD"), v.literal("EUR")),
    initialBalance: v.optional(v.number()),
    idempotencyKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, currency, initialBalance = 0, idempotencyKey } = args;
    const now = Date.now();

    // Check if wallet already exists
    const exists = await ctx.db
      .query("wallets")
      .withIndex("by_user_currency", (q) =>
        q.eq("userId", userId).eq("currency", currency),
      )
      .first()
      .then((wallet) => wallet !== null);

    if (exists) {
      // If wallet exists and we have an idempotency key, this is a retry - return success
      if (idempotencyKey) {
        const existingWallet = await ctx.db
          .query("wallets")
          .withIndex("by_user_currency", (q) =>
            q.eq("userId", userId).eq("currency", currency),
          )
          .first();
        return existingWallet?._id;
      }
      throw new ConvexError(
        `Wallet already exists for user ${userId} with currency ${currency}`,
      );
    }

    // Create the wallet with required fields
    const walletId = await ctx.db.insert("wallets", {
      userId,
      currency,
      balance: 0,
      isActive: true,
      metadata: {},
      updatedAt: now,
    });

    // If initial balance is provided, create an initial transaction
    if (initialBalance > 0) {
      await ctx.db.insert("transactions", {
        walletId,
        amount: Math.round(initialBalance * 100), // Convert to smallest unit
        currency,
        createdBy: `system:wallet-init:${userId}`,
        type: "DEPOSIT",
        status: "COMPLETED",
        description: "Initial wallet funding",
        idempotencyKey: idempotencyKey
          ? `${idempotencyKey}-initial`
          : undefined,
        relatedEntityType: "system",
        relatedEntityId: `user-${userId}`,
        createdAt: now,
      });
    }

    return walletId;
  },
});

// --- Public API: Initialize Wallets for New User ---
/**
 * Initialize wallets for a new user with specified or default currencies
 * This is an idempotent operation and can be safely retried
 */
// Internal mutation handler
const initializeUserWalletsHandler = internalMutation({
  args: {
    userId: v.id("users"),
    clerkId: v.string(),
    currencies: v.optional(
      v.array(v.union(v.literal("EGP"), v.literal("USD"), v.literal("EUR"))),
    ),
    initialBalances: v.optional(
      v.object({
        EGP: v.optional(v.number()),
        USD: v.optional(v.number()),
        EUR: v.optional(v.number()),
      }),
    ),
    idempotencyKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const {
      userId,
      clerkId,
      currencies = [...DEFAULT_CURRENCIES],
      initialBalances = {} as Record<"EGP" | "USD" | "EUR", number>,
      idempotencyKey,
    } = args;
    const results: Record<string, Id<"wallets">> = {};

    // Process each currency in parallel
    await Promise.all(
      currencies.map(async (currency) => {
        try {
          // Create wallet with all required fields
          const now = Date.now();
          const walletId = await ctx.db.insert("wallets", {
            userId,
            currency,
            balance: 0, // Will be updated by the transaction
            isActive: true,
            metadata: {},
            updatedAt: now,
          });

          // Create initial transaction if there's an initial balance
          const initialBalance = initialBalances[currency];
          if (initialBalance && initialBalance > 0) {
            await ctx.db.insert("transactions", {
              walletId,
              amount: Math.round(initialBalance * 100), // Convert to smallest unit
              currency,
              type: "DEPOSIT",
              status: "COMPLETED",
              description: "Initial wallet funding",
              idempotencyKey: idempotencyKey
                ? `${idempotencyKey}-${currency}`
                : undefined,
              relatedEntityType: "system",
              relatedEntityId: `user-${userId}`,
              createdAt: Date.now(),
              createdBy: `system:wallet-init:${userId}`,
            });

            // Update wallet balance
            await ctx.db.patch(walletId, {
              balance: Math.round(initialBalance * 100),
            });
          }

          if (walletId) {
            results[currency] = walletId;
          }
        } catch (error) {
          console.error(
            `Failed to create ${currency} wallet for user ${userId}:`,
            error,
          );
          // Continue with other currencies even if one fails
        }
      }),
    );

    return results;
  },
});

// --- Query to check if user needs wallet initialization ---
export const needsWalletInitialization = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const wallets = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return wallets.length === 0; // Returns true if user has no wallets
  },
});

// --- Query to get user wallets ---
export const getUserWallets = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// --- Exports ---
export const initializeUserWallets = initializeUserWalletsHandler;
export type { Currency };
