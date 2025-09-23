import { internalQuery, internalMutation } from "../_generated/server";
import { getWalletTransactions } from "./walletTransactions";
import { getWalletBalance } from "./walletBalances";
import { updateWalletBalance, createTransaction } from "./walletMutations";
import { getWalletById, getAllWallets, getWalletBalanceRecord } from "./reconcileQueries";
import { getHealthCheckCounts } from "./healthQueries";

// Export the internal queries to be registered with Convex
export const walletBalances = {
  getWalletBalance,
} as const;

export const walletTransactions = {
  getWalletTransactions,
} as const;

export const walletMutations = {
  updateWalletBalance,
  createTransaction,
} as const;

export const reconcileQueries = {
  getWalletById,
  getAllWallets,
  getWalletBalanceRecord,
} as const;

export const healthQueries = {
  getHealthCheckCounts,
} as const;

// This is the object that will be imported by other files
// to access the internal queries and mutations
export const internal = {
  walletBalances,
  walletTransactions,
  walletMutations,
  reconcileQueries,
  healthQueries,
} as const;
