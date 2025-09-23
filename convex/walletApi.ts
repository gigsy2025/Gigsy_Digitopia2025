import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

// Define types for the arguments
type NeedsWalletInitializationArgs = {
  userId: Id<"users">;
};

type InitializeUserWalletsArgs = {
  userId: Id<"users">;
  clerkId: string;
  currencies?: ("EGP" | "USD" | "EUR")[];
  initialBalances?: {
    EGP?: number;
    USD?: number;
    EUR?: number;
  };
  idempotencyKey?: string;
};

// Default currencies to use if none are provided
const DEFAULT_CURRENCIES: ("EGP" | "USD" | "EUR")[] = ["EGP", "USD", "EUR"];

// Define the needsWalletInitialization query with explicit types
export const needsWalletInitialization = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args: NeedsWalletInitializationArgs): Promise<boolean> => {
    // Check if the user has any wallets
    const wallets = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return wallets.length === 0;
  },
});

// Define the initializeUserWallets mutation with explicit types
export const initializeUserWallets = mutation({
  args: {
    userId: v.id("users"),
    clerkId: v.string(),
    currencies: v.optional(v.array(v.union(
      v.literal("EGP"),
      v.literal("USD"),
      v.literal("EUR")
    ))),
    initialBalances: v.optional(v.object({
      EGP: v.optional(v.number()),
      USD: v.optional(v.number()),
      EUR: v.optional(v.number()),
    })),
    idempotencyKey: v.optional(v.string()),
  },
  handler: async (ctx, args: InitializeUserWalletsArgs): Promise<void> => {
    const { userId, currencies = DEFAULT_CURRENCIES, initialBalances = {} } = args;
    
    // Create a wallet for each currency
    for (const currency of currencies) {
      const balance = initialBalances[currency as keyof typeof initialBalances] || 0;
      
      await ctx.db.insert("wallets", {
        userId,
        currency,
        balance,
        isActive: true,
        updatedAt: Date.now(),
        ...(args.idempotencyKey && { metadata: { idempotencyKey: args.idempotencyKey } })
      });
    }
  },
});
