import { getWalletTransactions } from "./walletTransactions";
import { getWalletBalance } from "./walletBalances";
import { updateWalletBalance, createTransaction } from "./walletMutations";
import {
  getWalletById,
  getAllWallets,
  getWalletBalanceRecord,
} from "./reconcileQueries";
import { getHealthCheckCounts } from "./healthQueries";
import { initializeUserWallets, needsWalletInitialization } from "./walletInit";
import { ensureAssignmentConversation } from "./chatAssignments";

// Export the internal queries to be registered with Convex
const walletBalances = {
  getWalletBalance,
} as const;

const walletTransactions = {
  getWalletTransactions,
} as const;

const walletMutations = {
  updateWalletBalance,
  createTransaction,
} as const;

const reconcileQueries = {
  getWalletById,
  getAllWallets,
  getWalletBalanceRecord,
} as const;

const healthQueries = {
  getHealthCheckCounts,
} as const;

const chatAssignments = {
  ensureAssignmentConversation,
} as const;

// This is the object that will be imported by other files
// to access the internal queries and mutations
export const internal = {
  walletBalances,
  walletTransactions,
  walletMutations,
  reconcileQueries,
  healthQueries,
  walletInit: {
    initializeUserWallets,
    needsWalletInitialization,
  },
  chatAssignments,
} as const;
