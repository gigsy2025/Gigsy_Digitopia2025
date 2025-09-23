// convex/wallet.ts
import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import type { Id } from "./_generated/dataModel";

// --- Constants ---
const DEFAULT_CURRENCIES = ["EGP", "USD", "EUR"] as const;

// --- Public API ---

export const getMyWallets = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    return await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const createWallet = mutation({
  args: {
    currency: v.union(
      v.literal("EGP"),
      v.literal("USD"),
      v.literal("EUR")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    // Check if wallet already exists
    const existing = await ctx.db
      .query("wallets")
      .withIndex("by_user_currency", (q) =>
        q.eq("userId", user._id).eq("currency", args.currency)
      )
      .first();

    if (existing) {
      throw new ConvexError(`Wallet for ${args.currency} already exists`);
    }

    const now = Date.now();
    return await ctx.db.insert("wallets", {
      userId: user._id,
      currency: args.currency,
      balance: 0,
      isActive: true,
      updatedAt: now,
    });
  },
});

// --- Internal API ---

export const createTransaction = internalMutation({
  args: {
    walletId: v.id("wallets"),
    amount: v.number(),
    type: v.union(
      v.literal("DEPOSIT"),
      v.literal("WITHDRAWAL"),
      v.literal("TRANSFER"),
      v.literal("ESCROW_HOLD"),
      v.literal("ESCROW_RELEASE"),
      v.literal("PAYOUT"),
      v.literal("FEE"),
      v.literal("REFUND")
    ),
    description: v.optional(v.string()),
    metadata: v.optional(v.any()),
    relatedEntityType: v.optional(v.string()),
    relatedEntityId: v.optional(v.string()),
    idempotencyKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { walletId, amount, idempotencyKey } = args;

    // Check for duplicate transaction
    if (idempotencyKey) {
      const existing = await ctx.db
        .query("transactions")
        .withIndex("by_idempotency_key", (q) =>
          q.eq("idempotencyKey", idempotencyKey)
        )
        .first();

      if (existing) {
        return existing._id;
      }
    }

    const wallet = await ctx.db.get(walletId);
    if (!wallet || !wallet.isActive) {
      throw new ConvexError("Wallet not found or inactive");
    }

    // Validate balance for withdrawals
    if (amount < 0 && wallet.balance < Math.abs(amount)) {
      throw new ConvexError("Insufficient funds");
    }

    const now = Date.now();

    // Create transaction
    const transactionId = await ctx.db.insert("transactions", {
      walletId,
      amount: Math.abs(amount),
      currency: wallet.currency,
      type: args.type,
      status: "COMPLETED",
      description: args.description,
      metadata: args.metadata,
      relatedEntityType: args.relatedEntityType,
      relatedEntityId: args.relatedEntityId,
      idempotencyKey,
      createdAt: now,
      createdBy: wallet.userId, // Track which user initiated this transaction
    });

    // Update wallet balance
    await ctx.db.patch(walletId, {
      balance: wallet.balance + amount,
      updatedAt: now,
    });

    return transactionId;
  },
});

export const getWalletBalance = internalMutation({
  args: {
    walletId: v.id("wallets"),
  },
  handler: async (ctx, args) => {
    const wallet = await ctx.db.get(args.walletId);
    if (!wallet) {
      throw new ConvexError("Wallet not found");
    }
    return wallet.balance;
  },
});