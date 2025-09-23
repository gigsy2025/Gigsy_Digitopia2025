import { internalQuery } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";

export const getWalletBalance = internalQuery({
  args: { 
    walletId: v.id('wallets') 
  },
  handler: async (ctx, args) => {
    const balance = await ctx.db
      .query("walletBalances")
      .withIndex("by_wallet", (q) => q.eq("walletId", args.walletId))
      .first();
    
    return balance ? balance.balance : 0;
  },
});
