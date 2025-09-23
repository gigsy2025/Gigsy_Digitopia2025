import { internalQuery } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";

export const getWalletById = internalQuery({
  args: { walletId: v.id('wallets') },
  handler: async (ctx, { walletId }) => {
    return await ctx.db.get(walletId);
  },
});

export const getAllWallets = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("wallets").collect();
  },
});

export const getWalletBalanceRecord = internalQuery({
  args: { walletId: v.id('wallets') },
  handler: async (ctx, { walletId }) => {
    return await ctx.db
      .query("walletBalances")
      .withIndex("by_wallet", (q) => q.eq("walletId", walletId))
      .first();
  },
});
