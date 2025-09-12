/**
 * User Balance Types and Utilities
 * Multi-currency balance management for global freelance platform
 */

import type { Doc, Id } from "../../convex/_generated/dataModel";

// Export the core User type from Convex
export type User = Doc<"users">;

// Supported currencies
export type Currency = "EGP" | "USD" | "EUR";

// User roles
export type UserRole = "user" | "admin" | "moderator" | "freelancer" | "client";

// Individual currency balance
export interface CurrencyBalance {
  currency: Currency;
  amount: number; // Balance amount (non-negative)
  lastUpdated: number; // Timestamp of last update
  isActive: boolean; // Whether this currency is actively used
}

// Multi-currency balance management
export interface UserBalances {
  balances: CurrencyBalance[];
}

// Balance operation types
export interface BalanceOperation {
  currency: Currency;
  amount: number; // Positive for credit, negative for debit
  description: string; // Human-readable description
  relatedEntityType?: string; // e.g., "gig", "application"
  relatedEntityId?: string; // Related entity ID
}

// Balance query interface
export interface BalanceQuery {
  userId: Id<"users">;
  currency?: Currency; // Filter by specific currency
  activeOnly?: boolean; // Only active balances
}

// Balance summary for display
export interface BalanceSummary {
  userId: Id<"users">;
  totalCurrencies: number; // Number of currencies with balances
  primaryCurrency: Currency; // Most frequently used currency
  balances: Array<{
    currency: Currency;
    amount: number;
    formatted: string; // Localized format (e.g., "1,234.56 EGP")
    isActive: boolean;
    lastUpdated: number;
  }>;
  totalValueUSD?: number; // Optional: converted to USD for comparison
}

// Balance update request
export interface UpdateBalanceRequest {
  userId: Id<"users">;
  currency: Currency;
  newAmount: number;
  reason: string; // Audit trail
  updatedBy: string; // User who initiated the update
}

// Multi-currency transaction context
export interface TransactionContext {
  fromCurrency?: Currency; // Source currency for conversions
  toCurrency?: Currency; // Target currency for conversions
  exchangeRate?: number; // Applied exchange rate
  fees?: Array<{
    type: string; // Fee type (conversion, processing, etc.)
    amount: number;
    currency: Currency;
  }>;
}

// Currency preference settings
export interface CurrencyPreferences {
  primaryCurrency: Currency; // Default currency for new transactions
  displayCurrencies: Currency[]; // Currencies to show in UI
  autoConvert: boolean; // Auto-convert small amounts to primary currency
  minimumBalance: Record<Currency, number>; // Minimum balance thresholds
}

// Balance validation rules
export interface BalanceValidation {
  minBalance: number; // Minimum allowed balance
  maxBalance: number; // Maximum allowed balance
  allowNegative: boolean; // Whether negative balances are permitted
  freezeThreshold?: number; // Balance below which account is frozen
}

// Utility functions type definitions
export interface BalanceUtils {
  // Get balance for specific currency
  getBalance: (balances: CurrencyBalance[], currency: Currency) => number;

  // Get all active currencies
  getActiveCurrencies: (balances: CurrencyBalance[]) => Currency[];

  // Check if user has sufficient balance
  hasSufficientBalance: (
    balances: CurrencyBalance[],
    currency: Currency,
    amount: number,
  ) => boolean;

  // Format balance for display
  formatBalance: (
    amount: number,
    currency: Currency,
    locale?: string,
  ) => string;

  // Get primary currency (most active or highest balance)
  getPrimaryCurrency: (balances: CurrencyBalance[]) => Currency | null;

  // Initialize new currency balance
  initializeCurrency: (
    currency: Currency,
    initialAmount?: number,
  ) => CurrencyBalance;

  // Update currency balance
  updateCurrencyBalance: (
    balances: CurrencyBalance[],
    currency: Currency,
    amount: number,
  ) => CurrencyBalance[];

  // Validate balance operation
  validateBalanceOperation: (
    balances: CurrencyBalance[],
    operation: BalanceOperation,
  ) => { isValid: boolean; errors: string[] };
}

// Default currency configuration
export const DEFAULT_CURRENCIES: Currency[] = ["EGP", "USD", "EUR"];

// Currency display configuration
export const CURRENCY_CONFIG: Record<
  Currency,
  {
    symbol: string;
    name: string;
    decimals: number;
    locale: string;
  }
> = {
  EGP: {
    symbol: "EGP",
    name: "Egyptian Pound",
    decimals: 2,
    locale: "ar-EG",
  },
  USD: {
    symbol: "$",
    name: "US Dollar",
    decimals: 2,
    locale: "en-US",
  },
  EUR: {
    symbol: "€",
    name: "Euro",
    decimals: 2,
    locale: "en-EU",
  },
};

// Balance operation types for transactions
export const BALANCE_OPERATION_TYPES = {
  DEPOSIT: "DEPOSIT",
  WITHDRAWAL: "WITHDRAWAL",
  ESCROW_HOLD: "ESCROW_HOLD",
  ESCROW_RELEASE: "ESCROW_RELEASE",
  PAYMENT: "PAYMENT",
  REFUND: "REFUND",
  FEE: "FEE",
  CONVERSION: "CONVERSION",
  ADJUSTMENT: "ADJUSTMENT",
} as const;

export type BalanceOperationType = keyof typeof BALANCE_OPERATION_TYPES;

// Helper type for user creation with initial balance
export interface CreateUserWithBalanceData {
  clerkId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  roles?: UserRole[]; // Optional, defaults to ["user"]
  initialCurrency: Currency;
  initialBalance?: number;
}

// Export utility types
export type UserId = Id<"users">;
export type UserData = User;
