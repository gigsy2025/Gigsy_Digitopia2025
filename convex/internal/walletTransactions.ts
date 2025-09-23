import { internalQuery } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";

export const getWalletTransactions = internalQuery({
  args: {
    walletId: v.id("wallets"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transactions")
      .withIndex("by_wallet", (q) => q.eq("walletId", args.walletId))
      .collect();
  },
});
