import { internalQuery } from "../_generated/server";

export const getHealthCheckCounts = internalQuery({
  args: {},
  handler: async (ctx) => {
    const [wallets, transactions, balances] = await Promise.all([
      ctx.db.query("wallets").collect(),
      ctx.db.query("transactions").collect(),
      ctx.db.query("walletBalances").collect(),
    ]);

    return {
      walletCount: wallets.length,
      transactionCount: transactions.length,
      balanceProjectionCount: balances.length,
    };
  },
});
