/**
 * User Balance Utility Functions
 * Comprehensive multi-currency balance management utilities
 */

import type {
  CurrencyBalance,
  Currency,
  BalanceOperation,
  BalanceSummary,
  BalanceValidation,
  UserId,
} from "../../types/users";

// Currency display configuration
const CURRENCY_CONFIG: Record<
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

/**
 * Get balance for a specific currency
 * @param balances - Array of currency balances
 * @param currency - Target currency
 * @returns Balance amount or 0 if currency not found
 */
export const getBalance = (
  balances: CurrencyBalance[],
  currency: Currency,
): number => {
  const balance = balances.find((b) => b.currency === currency);
  return balance?.amount ?? 0;
};

/**
 * Get all active currencies for a user
 * @param balances - Array of currency balances
 * @returns Array of active currencies
 */
export const getActiveCurrencies = (
  balances: CurrencyBalance[],
): Currency[] => {
  return balances.filter((b) => b.isActive).map((b) => b.currency);
};

/**
 * Check if user has sufficient balance for an operation
 * @param balances - Array of currency balances
 * @param currency - Currency to check
 * @param amount - Required amount
 * @returns True if sufficient balance exists
 */
export const hasSufficientBalance = (
  balances: CurrencyBalance[],
  currency: Currency,
  amount: number,
): boolean => {
  const currentBalance = getBalance(balances, currency);
  return currentBalance >= amount;
};

/**
 * Format balance for display with proper localization
 * @param amount - Balance amount
 * @param currency - Currency code
 * @param locale - Optional locale override
 * @returns Formatted balance string
 */
export const formatBalance = (
  amount: number,
  currency: Currency,
  locale?: string,
): string => {
  const config = CURRENCY_CONFIG[currency];
  const formatLocale = locale ?? config.locale;

  return new Intl.NumberFormat(formatLocale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  }).format(amount);
};

/**
 * Get primary currency (most frequently used or highest balance)
 * @param balances - Array of currency balances
 * @returns Primary currency or null if no balances
 */
export const getPrimaryCurrency = (
  balances: CurrencyBalance[],
): Currency | null => {
  if (balances.length === 0) return null;

  // Prefer active currencies
  const activeBalances = balances.filter((b) => b.isActive);
  const targetBalances = activeBalances.length > 0 ? activeBalances : balances;

  // Return currency with highest balance
  const sorted = targetBalances.sort((a, b) => b.amount - a.amount);
  return sorted[0]?.currency ?? null;
};

/**
 * Initialize a new currency balance
 * @param currency - Currency to initialize
 * @param initialAmount - Optional initial amount (default: 0)
 * @returns New currency balance object
 */
export const initializeCurrency = (
  currency: Currency,
  initialAmount = 0,
): CurrencyBalance => {
  return {
    currency,
    amount: Math.max(0, initialAmount), // Ensure non-negative
    lastUpdated: Date.now(),
    isActive: true,
  };
};

/**
 * Update currency balance in balances array
 * @param balances - Current balances array
 * @param currency - Currency to update
 * @param amount - New amount
 * @returns Updated balances array
 */
export const updateCurrencyBalance = (
  balances: CurrencyBalance[],
  currency: Currency,
  amount: number,
): CurrencyBalance[] => {
  const updatedBalances = [...balances];
  const existingIndex = updatedBalances.findIndex(
    (b) => b.currency === currency,
  );

  const updatedBalance: CurrencyBalance = {
    currency,
    amount: Math.max(0, amount), // Ensure non-negative
    lastUpdated: Date.now(),
    isActive: true,
  };

  if (existingIndex >= 0) {
    updatedBalances[existingIndex] = updatedBalance;
  } else {
    updatedBalances.push(updatedBalance);
  }

  return updatedBalances;
};

/**
 * Validate a balance operation
 * @param balances - Current balances
 * @param operation - Operation to validate
 * @returns Validation result with errors
 */
export const validateBalanceOperation = (
  balances: CurrencyBalance[],
  operation: BalanceOperation,
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check for negative amount (debit operation)
  if (operation.amount < 0) {
    const requiredAmount = Math.abs(operation.amount);
    const currentBalance = getBalance(balances, operation.currency);

    if (currentBalance < requiredAmount) {
      errors.push(
        `Insufficient balance. Required: ${formatBalance(requiredAmount, operation.currency)}, ` +
          `Available: ${formatBalance(currentBalance, operation.currency)}`,
      );
    }
  }

  // Check for reasonable amounts
  if (Math.abs(operation.amount) > 1000000) {
    errors.push("Operation amount exceeds maximum limit of 1,000,000");
  }

  // Validate description
  if (!operation.description || operation.description.trim().length < 3) {
    errors.push("Operation description must be at least 3 characters");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Create a balance summary for display
 * @param userId - User ID
 * @param balances - User's currency balances
 * @returns Formatted balance summary
 */
export const createBalanceSummary = (
  userId: UserId,
  balances: CurrencyBalance[],
): BalanceSummary => {
  const activeCurrencies = getActiveCurrencies(balances);
  const primaryCurrency = getPrimaryCurrency(balances) ?? "USD";

  return {
    userId,
    totalCurrencies: activeCurrencies.length,
    primaryCurrency,
    balances: balances.map((balance) => ({
      currency: balance.currency,
      amount: balance.amount,
      formatted: formatBalance(balance.amount, balance.currency),
      isActive: balance.isActive,
      lastUpdated: balance.lastUpdated,
    })),
  };
};

/**
 * Apply balance operation to balances array
 * @param balances - Current balances
 * @param operation - Operation to apply
 * @returns Updated balances array or null if operation invalid
 */
export const applyBalanceOperation = (
  balances: CurrencyBalance[],
  operation: BalanceOperation,
): CurrencyBalance[] | null => {
  const validation = validateBalanceOperation(balances, operation);

  if (!validation.isValid) {
    console.error("Balance operation validation failed:", validation.errors);
    return null;
  }

  const currentBalance = getBalance(balances, operation.currency);
  const newAmount = currentBalance + operation.amount;

  return updateCurrencyBalance(balances, operation.currency, newAmount);
};

/**
 * Check if balances meet validation rules
 * @param balances - Balances to validate
 * @param rules - Validation rules
 * @returns Validation result
 */
export const validateBalances = (
  balances: CurrencyBalance[],
  rules: BalanceValidation,
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  for (const balance of balances) {
    if (balance.amount < rules.minBalance) {
      errors.push(
        `${balance.currency} balance ${formatBalance(balance.amount, balance.currency)} ` +
          `is below minimum of ${formatBalance(rules.minBalance, balance.currency)}`,
      );
    }

    if (balance.amount > rules.maxBalance) {
      errors.push(
        `${balance.currency} balance ${formatBalance(balance.amount, balance.currency)} ` +
          `exceeds maximum of ${formatBalance(rules.maxBalance, balance.currency)}`,
      );
    }

    if (!rules.allowNegative && balance.amount < 0) {
      errors.push(`${balance.currency} balance cannot be negative`);
    }

    if (rules.freezeThreshold && balance.amount < rules.freezeThreshold) {
      errors.push(
        `${balance.currency} balance ${formatBalance(balance.amount, balance.currency)} ` +
          `is below freeze threshold of ${formatBalance(rules.freezeThreshold, balance.currency)}`,
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Merge multiple balance arrays (useful for aggregation)
 * @param balanceArrays - Arrays of balances to merge
 * @returns Merged balances with totals by currency
 */
export const mergeBalances = (
  ...balanceArrays: CurrencyBalance[][]
): CurrencyBalance[] => {
  const merged = new Map<Currency, CurrencyBalance>();

  for (const balances of balanceArrays) {
    for (const balance of balances) {
      const existing = merged.get(balance.currency);

      if (existing) {
        merged.set(balance.currency, {
          currency: balance.currency,
          amount: existing.amount + balance.amount,
          lastUpdated: Math.max(existing.lastUpdated, balance.lastUpdated),
          isActive: existing.isActive || balance.isActive,
        });
      } else {
        merged.set(balance.currency, { ...balance });
      }
    }
  }

  return Array.from(merged.values());
};

// Export all utility functions as a cohesive object
export const BalanceUtils = {
  getBalance,
  getActiveCurrencies,
  hasSufficientBalance,
  formatBalance,
  getPrimaryCurrency,
  initializeCurrency,
  updateCurrencyBalance,
  validateBalanceOperation,
  createBalanceSummary,
  applyBalanceOperation,
  validateBalances,
  mergeBalances,
} as const;
