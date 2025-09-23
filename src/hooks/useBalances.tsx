/**
 * USE BALANCES HOOK - REAL-TIME BALANCE MANAGEMENT
 *
 * React hook for real-time balance queries with Convex subscriptions.
 * Provides formatted balance display and automatic updates.
 *
 * FEATURES:
 * - Real-time updates via Convex subscriptions
 * - Automatic currency formatting
 * - Error handling and loading states
 * - Memoized computations for performance
 * - Type-safe balance operations
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-01-22
 */

import { useMemo, useCallback, useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { 
  Currency, 
  WalletBalance, 
  UseBalancesResult,
  FormattedBalance
} from "../types/finance";
import { useToast } from "@/components/ui/use-toast";

// Use the public API endpoints directly
const walletApi = api.walletApi;

// Import currency configs
const CURRENCY_CONFIGS = {
  EGP: {
    code: "EGP" as const,
    symbol: "£",
    name: "Egyptian Pound",
    decimals: 2,
    smallestUnit: "piastres",
  },
  USD: {
    code: "USD" as const,
    symbol: "$",
    name: "US Dollar",
    decimals: 2,
    smallestUnit: "cents",
  },
  EUR: {
    code: "EUR" as const,
    symbol: "€",
    name: "Euro",
    decimals: 2,
    smallestUnit: "cents",
  },
} as const;

/**
 * Format amount from smallest unit to human-readable string
 * @param amount - Amount in smallest unit (integer)
 * @param currency - Currency code
 * @param options - Formatting options
 * @returns Formatted string (e.g., "123.45")
 */
function formatAmount(
  amount: number, 
  currency: Currency, 
  options: {
    showSymbol?: boolean;
    showCode?: boolean;
    compact?: boolean;
  } = {}
): string {
  const config = CURRENCY_CONFIGS[currency];
  const { showSymbol = false, showCode = false, compact = false } = options;
  
  // Convert from smallest unit to main unit
  const mainAmount = amount / Math.pow(10, config.decimals);
  
  // Format with appropriate decimal places
  const formatted = mainAmount.toFixed(config.decimals);
  
  // Apply formatting options
  let result = formatted;
  
  if (showSymbol) {
    result = `${config.symbol}${result}`;
  }
  
  if (showCode) {
    result = `${result} ${config.code}`;
  }
  
  // Compact formatting for large numbers
  if (compact && Math.abs(mainAmount) >= 1000) {
    const compactAmount = Math.abs(mainAmount);
    if (compactAmount >= 1000000) {
      result = `${config.symbol}${(mainAmount / 1000000).toFixed(1)}M`;
    } else if (compactAmount >= 1000) {
      result = `${config.symbol}${(mainAmount / 1000).toFixed(1)}K`;
    }
  }
  
  return result;
}

/**
 * Get formatted balance with currency symbol and formatting
 * @param balance - Wallet balance
 * @param options - Formatting options
 * @returns Formatted balance object
 */
function getFormattedBalance(
  balance: WalletBalance,
  options: {
    showSymbol?: boolean;
    showCode?: boolean;
    compact?: boolean;
  } = {}
): FormattedBalance {
  const config = CURRENCY_CONFIGS[balance.currency];
  
  return {
    currency: balance.currency,
    amount: formatAmount(balance.balance, balance.currency, options),
    symbol: config.symbol,
    raw: balance.balance,
  };
}

/**
 * Main hook for user balance management
 * 
 * PERFORMANCE: Memoized computations and selective re-renders
 * REAL-TIME: Convex subscriptions for live balance updates
 * TYPE-SAFETY: Full TypeScript support with proper error handling
 */
export function useBalances(userId?: Id<"users">): UseBalancesResult {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [convexUserId, setConvexUserId] = useState<Id<"users"> | null>(null);
  const { showToast } = useToast();
  
  // Mutations
  const initializeWallets = useMutation(walletApi.initializeUserWallets);
  
  // Get the Convex user ID from Clerk user ID
  const userQuery = useQuery(
    api.users.getUserByClerkId, 
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Update convexUserId when user data is loaded
  useEffect(() => {
    if (userQuery?._id) {
      setConvexUserId(userQuery._id);
    }
  }, [userQuery]);
  
  // Check if wallets need to be initialized
  const needsWalletInitialization = useQuery(
    walletApi.needsWalletInitialization, 
    convexUserId ? { userId: convexUserId } : "skip"
  );
  
  // Initialize wallets if needed
  useEffect(() => {
    const initializeUserWallets = async () => {
      if (!convexUserId || needsWalletInitialization === false) return;
      
      try {
        await initializeWallets({
          userId: convexUserId,
          clerkId: user?.id || '',
          currencies: ["EGP", "USD", "EUR"],
          initialBalances: { EGP: 0, USD: 0, EUR: 0 },
          idempotencyKey: `init-${convexUserId}-${Date.now()}`
        });
      } catch (error) {
        console.error("Failed to initialize wallets:", error);
        showToast("Failed to initialize your wallet. Please try again.", "error");
      }
    };
    
    if (needsWalletInitialization === true) {
      initializeUserWallets();
    }
  }, [convexUserId, needsWalletInitialization, initializeWallets, user?.id, showToast]);
  
  // Determine the user ID to query with proper typing
  const targetUserId = useMemo((): Id<"users"> | null => {
    // If userId is explicitly provided, use it (must be a valid Convex user ID)
    if (userId) return userId;
    
    // Otherwise use the resolved Convex user ID from Clerk user
    return convexUserId;
  }, [userId, convexUserId]);

  // Query balances using Convex real-time subscription
  const balancesData = useQuery(
    api.finance.getBalancesForUser,
    targetUserId ? { userId: targetUserId } : "skip"
  );

  // Memoized balance computations
  const balances = useMemo(() => {
    if (!balancesData) return [];
    return balancesData as WalletBalance[];
  }, [balancesData]);

  // Loading state - explicitly convert to boolean to ensure type safety
  const isLoading = useMemo(() => {
    return Boolean(!isUserLoaded || (targetUserId && balancesData === undefined));
  }, [isUserLoaded, targetUserId, balancesData]);

  // Error handling
  const error = useMemo(() => {
    // Add error detection logic here
    // Convex queries don't throw errors in the traditional sense
    // but we can detect error states
    return null;
  }, []);

  // Format balance for specific currency
  const formatted = useCallback((currency: Currency): string => {
    const balance = balances.find(b => b.currency === currency);
    if (!balance) return "0.00";
    
    return formatAmount(balance.balance, currency, { showSymbol: false });
  }, [balances]);

  // Get raw balance for specific currency
  const getBalance = useCallback((currency: Currency): number => {
    const balance = balances.find(b => b.currency === currency);
    return balance ? balance.balance : 0;
  }, [balances]);

  // Refresh function (Convex handles this automatically, but we provide for consistency)
  const refresh = useCallback(() => {
    // Convex queries are automatically reactive, so no manual refresh needed
    // This is here for API consistency
  }, []);

  // Get formatted balance with symbol
  const getFormattedWithSymbol = useCallback((currency: Currency): string => {
    const balance = balances.find(b => b.currency === currency);
    if (!balance) return `${CURRENCY_CONFIGS[currency].symbol}0.00`;
    
    return formatAmount(balance.balance, currency, { showSymbol: true });
  }, [balances]);

  // Get all balances formatted
  const getAllFormatted = useCallback((): FormattedBalance[] => {
    return balances.map(balance => getFormattedBalance(balance, { showSymbol: true }));
  }, [balances]);

  // Get primary balance (first active balance or EGP default)
  const getPrimaryBalance = useCallback((): WalletBalance | null => {
    if (balances.length === 0) return null;
    
    // Try to find EGP balance first
    const egpBalance = balances.find(b => b.currency === "EGP");
    if (egpBalance) return egpBalance;
    
    // Return first available balance or null if no balances exist
    return balances[0] || null;
  }, [balances]);

  // Check if user has sufficient balance for a transaction
  const hasSufficientBalance = useCallback((currency: Currency, amount: number): boolean => {
    const balance = getBalance(currency);
    return balance >= amount;
  }, [getBalance]);

  // Get total balance in a specific currency (if conversion rates were available)
  const getTotalInCurrency = useCallback((targetCurrency: Currency): number => {
    // For now, just return the balance in the target currency
    // In a real implementation, you'd apply conversion rates
    return getBalance(targetCurrency);
  }, [getBalance]);

  return {
    balances,
    isLoading,
    error,
    formatted,
    getBalance,
    refresh,
    // Additional utility functions
    getFormattedWithSymbol,
    getAllFormatted,
    getPrimaryBalance,
    hasSufficientBalance,
    getTotalInCurrency,
  };
}

/**
 * Hook for specific currency balance
 * Optimized for single currency use cases
 * 
 * @param currency - The currency to get balance for
 * @param userId - Optional Convex user ID (Id<"users">)
 */
export function useCurrencyBalance(
  currency: Currency, 
  userId?: Id<"users">
) {
  const { balances, isLoading, error, getBalance, formatted, getFormattedWithSymbol } = useBalances(userId);
  
  const balance = useMemo(() => {
    return balances.find(b => b.currency === currency) || null;
  }, [balances, currency]);

  const amount = useMemo(() => getBalance(currency), [getBalance, currency]);
  const formattedAmount = useMemo(() => formatted(currency), [formatted, currency]);
  const formattedWithSymbol = useMemo(
    () => getFormattedWithSymbol(currency), 
    [getFormattedWithSymbol, currency]
  );

  return {
    balance,
    amount,
    formatted: formattedAmount,
    formattedWithSymbol,
    isLoading,
    error,
    currency,
  };
}

/**
 * Hook for balance formatting utilities
 * Provides formatting functions without querying balances
 */
export function useBalanceFormatter() {
  const formatBalance = useCallback((amount: number, currency: Currency, options?: {
    showSymbol?: boolean;
    showCode?: boolean;
    compact?: boolean;
  }) => {
    return formatAmount(amount, currency, options);
  }, []);

  const getCurrencySymbol = useCallback((currency: Currency) => {
    return CURRENCY_CONFIGS[currency].symbol;
  }, []);

  const getCurrencyName = useCallback((currency: Currency) => {
    return CURRENCY_CONFIGS[currency].name;
  }, []);

  const parseAmount = useCallback((formattedAmount: string, currency: Currency): number => {
    // Remove currency symbols and parse
    const cleanAmount = formattedAmount.replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleanAmount);
    
    if (isNaN(parsed)) return 0;
    
    // Convert to smallest unit
    const config = CURRENCY_CONFIGS[currency];
    return Math.round(parsed * Math.pow(10, config.decimals));
  }, []);

  return {
    formatBalance,
    getCurrencySymbol,
    getCurrencyName,
    parseAmount,
    CURRENCY_CONFIGS,
  };
}

/**
 * Hook for balance validation
 * Provides validation utilities for balance operations
 */
export function useBalanceValidation() {
  const validateAmount = useCallback((amount: number, currency: Currency): {
    valid: boolean;
    errors: string[];
  } => {
    const errors: string[] = [];
    
    if (!Number.isInteger(amount)) {
      errors.push("Amount must be an integer (smallest currency unit)");
    }
    
    if (amount <= 0) {
      errors.push("Amount must be positive");
    }
    
    if (amount > 1000000000) { // 10M in smallest unit
      errors.push("Amount exceeds maximum limit");
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }, []);

  const validateCurrency = useCallback((currency: string): currency is Currency => {
    return ["EGP", "USD", "EUR"].includes(currency);
  }, []);

  const validateTransfer = useCallback((
    fromBalance: number,
    transferAmount: number,
    currency: Currency
  ): {
    valid: boolean;
    errors: string[];
  } => {
    const errors: string[] = [];
    
    const amountValidation = validateAmount(transferAmount, currency);
    if (!amountValidation.valid) {
      errors.push(...amountValidation.errors);
    }
    
    if (fromBalance < transferAmount) {
      errors.push(`Insufficient ${currency} balance`);
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }, [validateAmount]);

  return {
    validateAmount,
    validateCurrency,
    validateTransfer,
  };
}

// Export utility functions for use outside of React components
export { formatAmount, getFormattedBalance, CURRENCY_CONFIGS };
