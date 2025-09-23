/**
 * FINANCE TYPES - TYPE DEFINITIONS FOR BALANCE SYSTEM
 *
 * Comprehensive type definitions for the production-grade balance system.
 * Ensures type safety across client and server components.
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-01-22
 */

import type { Id } from "../../convex/_generated/dataModel";

// Define the Currency type to match the schema

type Currency = "EGP" | "USD" | "EUR";

// Re-export for backward compatibility
export type { Currency };

// --- Transaction Types ---
export type TransactionType = 
  | "DEPOSIT"
  | "ESCROW_HOLD"
  | "ESCROW_RELEASE"
  | "PAYOUT"
  | "FEE"
  | "WITHDRAWAL"
  | "REFUND"
  | "TRANSFER"
  | "ADJUSTMENT";

// --- Wallet Balance Interface ---
export interface WalletBalance {
  walletId: Id<"wallets">;
  currency: Currency;
  balance: number; // integer smallest unit (cents/piastres)
  lastTransactionAt?: number;
  lastUpdated: number;
}

// --- Transaction Interface ---
export interface Transaction {
  _id: Id<"transactions">;
  walletId: Id<"wallets">;
  amount: number; // integer smallest unit (positive for credit, negative for debit)
  currency: Currency;
  type: TransactionType;
  description?: string;
  idempotencyKey?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  createdAt: number;
  createdBy: string;
}

// --- Wallet Interface ---
export interface Wallet {
  _id: Id<"wallets">;
  userId: Id<"users">;
  currency: Currency;
  createdAt: number;
  createdBy: string;
  updatedAt: number;
}

// --- Balance Display Types ---
export interface FormattedBalance {
  currency: Currency;
  amount: string; // formatted for display (e.g., "123.45")
  symbol: string; // currency symbol (e.g., "£", "$", "€")
  raw: number; // raw integer amount
}

// --- Transaction Creation Types ---
export interface CreateTransactionRequest {
  walletId: Id<"wallets">;
  amount: number;
  currency: Currency;
  type: TransactionType;
  description?: string;
  idempotencyKey?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

export interface CreateTransactionResponse {
  status: "ok" | "already_processed";
  transactionId: Id<"transactions">;
  newBalance: number;
}

// --- Transfer Types ---
export interface TransferRequest {
  fromUserId: Id<"users">;
  toUserId: Id<"users">;
  currency: Currency;
  amount: number;
  idempotencyKey?: string;
  description?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

export interface TransferResponse {
  status: "ok" | "already_processed";
  debitTxId: Id<"transactions">;
  creditTxId: Id<"transactions">;
  fromBalance: number;
  toBalance: number;
}

// --- Balance Query Types ---
export interface BalanceQueryParams {
  userId: Id<"users">;
  currency?: Currency;
}

export interface TransactionHistoryParams {
  userId: Id<"users">;
  limit?: number;
  offset?: number;
  currency?: Currency;
  type?: TransactionType;
}

// --- Admin Types ---
export interface AdminAdjustmentRequest {
  userId: Id<"users">;
  currency: Currency;
  amount: number;
  auditReason: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

export interface AdminAdjustmentResponse {
  success: boolean;
  transactionId: Id<"transactions">;
  newBalance: number;
}

// --- Reconciliation Types ---
export interface ReconciliationRequest {
  batchSize?: number;
  dryRun?: boolean;
  walletIds?: Id<"wallets">[];
}

export interface ReconciliationResult {
  walletsProcessed: number;
  discrepanciesFound: number;
  discrepanciesFixed: number;
  errors: Array<{
    walletId: string;
    error: string;
    timestamp: number;
  }>;
  totalDriftAmount: number;
  processingTimeMs: number;
}

export interface ReconciliationResponse {
  success: boolean;
  result: ReconciliationResult;
  message: string;
}

// --- UI Component Types ---
export interface BalanceBadgeProps {
  primaryCurrency?: Currency;
  showAllCurrencies?: boolean;
  compact?: boolean;
  userId?: Id<"users">;
  className?: string;
}

export interface BalanceDisplayProps {
  balance: WalletBalance;
  showCurrency?: boolean;
  showLastUpdated?: boolean;
  format?: "compact" | "full";
}

// --- Hook Types ---
export interface UseBalancesResult {
  balances: WalletBalance[];
  isLoading: boolean;
  error: Error | null;
  formatted: (currency: Currency) => string;
  getBalance: (currency: Currency) => number;
  refresh: () => void;
  // Additional utility functions
  getFormattedWithSymbol: (currency: Currency) => string;
  getAllFormatted: () => FormattedBalance[];
  getPrimaryBalance: () => WalletBalance | null;
  hasSufficientBalance: (currency: Currency, amount: number) => boolean;
  getTotalInCurrency: (targetCurrency: Currency) => number;
}

export interface UseTransactionHistoryResult {
  transactions: Transaction[];
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
}

// --- Currency Configuration ---
export interface CurrencyConfig {
  code: Currency;
  symbol: string;
  name: string;
  decimals: number;
  smallestUnit: string; // e.g., "cents", "piastres"
}

export const CURRENCY_CONFIGS: Record<Currency, CurrencyConfig> = {
  EGP: {
    code: "EGP",
    symbol: "£",
    name: "Egyptian Pound",
    decimals: 2,
    smallestUnit: "piastres",
  },
  USD: {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
    decimals: 2,
    smallestUnit: "cents",
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    name: "Euro",
    decimals: 2,
    smallestUnit: "cents",
  },
};

// --- Utility Types ---
export interface MoneyAmount {
  amount: number; // integer smallest unit
  currency: Currency;
}

export interface FormattedMoneyAmount extends MoneyAmount {
  formatted: string; // human-readable format
  symbol: string;
}

// --- Error Types ---
export class FinanceError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = "FinanceError";
  }
}

export class InsufficientBalanceError extends FinanceError {
  constructor(
    currency: Currency,
    required: number,
    available: number
  ) {
    super(
      `Insufficient ${currency} balance: required ${required}, available ${available}`,
      "INSUFFICIENT_BALANCE",
      { currency, required, available }
    );
  }
}

export class InvalidAmountError extends FinanceError {
  constructor(amount: number, reason: string) {
    super(
      `Invalid amount ${amount}: ${reason}`,
      "INVALID_AMOUNT",
      { amount, reason }
    );
  }
}

export class WalletNotFoundError extends FinanceError {
  constructor(walletId: string) {
    super(
      `Wallet not found: ${walletId}`,
      "WALLET_NOT_FOUND",
      { walletId }
    );
  }
}

export class DuplicateTransactionError extends FinanceError {
  constructor(idempotencyKey: string) {
    super(
      `Transaction already processed: ${idempotencyKey}`,
      "DUPLICATE_TRANSACTION",
      { idempotencyKey }
    );
  }
}

// --- Validation Types ---
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface TransactionValidation extends ValidationResult {
  sanitizedAmount?: number;
  normalizedCurrency?: Currency;
}

// --- Audit Types ---
export interface AuditTrail {
  transactionId: Id<"transactions">;
  userId: string;
  action: string;
  timestamp: number;
  details: any;
  ipAddress?: string;
  userAgent?: string;
}

// --- Monitoring Types ---
export interface BalanceMetrics {
  totalBalanceByCurrency: Record<Currency, number>;
  activeWallets: number;
  transactionsToday: number;
  averageTransactionAmount: Record<Currency, number>;
  lastReconciliation?: number;
}

export interface SystemHealth {
  balanceIntegrity: boolean;
  reconciliationStatus: "healthy" | "warning" | "critical";
  lastReconciliation?: number;
  pendingTransactions: number;
  errorRate: number;
}

// --- Export all types ---
export type {
  Id,
};

// --- Constants ---
export const SUPPORTED_CURRENCIES: Currency[] = ["EGP", "USD", "EUR"];
export const DEFAULT_CURRENCY: Currency = "EGP";
export const MIN_TRANSACTION_AMOUNT = 1; // 1 cent/piastre
export const MAX_TRANSACTION_AMOUNT = 1000000000; // 10M in smallest unit
export const RECONCILIATION_BATCH_SIZE = 100;
export const TRANSACTION_HISTORY_PAGE_SIZE = 50;
