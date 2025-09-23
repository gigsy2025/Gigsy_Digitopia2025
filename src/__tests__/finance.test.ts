/**
 * FINANCE SYSTEM TESTS - COMPREHENSIVE TEST SUITE
 *
 * Tests for production-grade balance system covering:
 * - Idempotency guarantees
 * - Concurrent transaction handling
 * - Reconciliation accuracy
 * - Balance integrity
 * - Error handling and edge cases
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-01-22
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConvexTestingHelper } from 'convex/testing';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import type { Currency, TransactionType } from '../types/finance';

// Mock Convex testing environment
const convexTest = new ConvexTestingHelper();

describe('Finance System - Core Functionality', () => {
  let testUserId: Id<"users">;
  let testWalletId: Id<"wallets">;

  beforeEach(async () => {
    // Setup test data
    testUserId = await convexTest.mutation(api.users.initializeUser, {
      clerkId: 'test-clerk-id',
      email: 'test@example.com',
      name: 'Test User',
      initialCurrency: 'EGP',
      initialBalance: 0,
    });

    // Create test wallet
    testWalletId = await convexTest.mutation(api.finance.createWallet, {
      userId: testUserId,
      currency: 'EGP',
    });
  });

  afterEach(async () => {
    // Cleanup test data
    await convexTest.cleanup();
  });

  describe('Transaction Creation', () => {
    it('should create a transaction and update balance projection', async () => {
      const amount = 10000; // 100.00 EGP in smallest unit
      
      const result = await convexTest.mutation(api.finance.createTransaction, {
        walletId: testWalletId,
        amount,
        currency: 'EGP',
        type: 'DEPOSIT',
        description: 'Test deposit',
      });

      expect(result.status).toBe('ok');
      expect(result.newBalance).toBe(amount);
      expect(result.transactionId).toBeDefined();

      // Verify balance projection was updated
      const balances = await convexTest.query(api.finance.getBalancesForUser, {
        userId: testUserId,
      });

      expect(balances).toHaveLength(1);
      expect(balances[0].balance).toBe(amount);
      expect(balances[0].currency).toBe('EGP');
    });

    it('should prevent negative balances for withdrawal transactions', async () => {
      const withdrawAmount = 5000; // 50.00 EGP

      await expect(
        convexTest.mutation(api.finance.createTransaction, {
          walletId: testWalletId,
          amount: -withdrawAmount,
          currency: 'EGP',
          type: 'WITHDRAWAL',
          description: 'Test withdrawal',
        })
      ).rejects.toThrow('Insufficient balance');
    });

    it('should validate transaction amounts', async () => {
      // Test zero amount
      await expect(
        convexTest.mutation(api.finance.createTransaction, {
          walletId: testWalletId,
          amount: 0,
          currency: 'EGP',
          type: 'DEPOSIT',
        })
      ).rejects.toThrow('Amount cannot be zero');

      // Test non-integer amount
      await expect(
        convexTest.mutation(api.finance.createTransaction, {
          walletId: testWalletId,
          amount: 100.5,
          currency: 'EGP',
          type: 'DEPOSIT',
        })
      ).rejects.toThrow('Amount must be an integer');
    });
  });

  describe('Idempotency', () => {
    it('should handle duplicate transactions with same idempotency key', async () => {
      const idempotencyKey = 'test-deposit-001';
      const amount = 5000;

      // First transaction
      const result1 = await convexTest.mutation(api.finance.createTransaction, {
        walletId: testWalletId,
        amount,
        currency: 'EGP',
        type: 'DEPOSIT',
        idempotencyKey,
      });

      expect(result1.status).toBe('ok');

      // Second transaction with same idempotency key
      const result2 = await convexTest.mutation(api.finance.createTransaction, {
        walletId: testWalletId,
        amount,
        currency: 'EGP',
        type: 'DEPOSIT',
        idempotencyKey,
      });

      expect(result2.status).toBe('already_processed');
      expect(result2.transactionId).toBe(result1.transactionId);

      // Verify balance was only updated once
      const balances = await convexTest.query(api.finance.getBalancesForUser, {
        userId: testUserId,
      });

      expect(balances[0].balance).toBe(amount); // Not doubled
    });

    it('should allow different transactions with different idempotency keys', async () => {
      const amount = 2500;

      const result1 = await convexTest.mutation(api.finance.createTransaction, {
        walletId: testWalletId,
        amount,
        currency: 'EGP',
        type: 'DEPOSIT',
        idempotencyKey: 'deposit-001',
      });

      const result2 = await convexTest.mutation(api.finance.createTransaction, {
        walletId: testWalletId,
        amount,
        currency: 'EGP',
        type: 'DEPOSIT',
        idempotencyKey: 'deposit-002',
      });

      expect(result1.status).toBe('ok');
      expect(result2.status).toBe('ok');
      expect(result1.transactionId).not.toBe(result2.transactionId);

      // Verify both transactions were processed
      const balances = await convexTest.query(api.finance.getBalancesForUser, {
        userId: testUserId,
      });

      expect(balances[0].balance).toBe(amount * 2);
    });
  });

  describe('Wallet Transfers', () => {
    let secondUserId: Id<"users">;

    beforeEach(async () => {
      // Create second user for transfer tests
      secondUserId = await convexTest.mutation(api.users.initializeUser, {
        clerkId: 'test-clerk-id-2',
        email: 'test2@example.com',
        name: 'Test User 2',
        initialCurrency: 'EGP',
        initialBalance: 0,
      });

      // Add initial balance to first user
      await convexTest.mutation(api.finance.createTransaction, {
        walletId: testWalletId,
        amount: 10000, // 100.00 EGP
        currency: 'EGP',
        type: 'DEPOSIT',
        description: 'Initial balance',
      });
    });

    it('should transfer funds between wallets atomically', async () => {
      const transferAmount = 3000; // 30.00 EGP

      const result = await convexTest.mutation(api.finance.transferBetweenWallets, {
        fromUserId: testUserId,
        toUserId: secondUserId,
        currency: 'EGP',
        amount: transferAmount,
        description: 'Test transfer',
      });

      expect(result.status).toBe('ok');
      expect(result.fromBalance).toBe(7000); // 70.00 EGP remaining
      expect(result.toBalance).toBe(3000); // 30.00 EGP received

      // Verify both balances
      const fromBalances = await convexTest.query(api.finance.getBalancesForUser, {
        userId: testUserId,
      });
      const toBalances = await convexTest.query(api.finance.getBalancesForUser, {
        userId: secondUserId,
      });

      expect(fromBalances[0].balance).toBe(7000);
      expect(toBalances[0].balance).toBe(3000);
    });

    it('should prevent transfers with insufficient balance', async () => {
      const transferAmount = 15000; // 150.00 EGP (more than available)

      await expect(
        convexTest.mutation(api.finance.transferBetweenWallets, {
          fromUserId: testUserId,
          toUserId: secondUserId,
          currency: 'EGP',
          amount: transferAmount,
        })
      ).rejects.toThrow('Insufficient balance');
    });

    it('should handle transfer idempotency', async () => {
      const transferAmount = 2000;
      const idempotencyKey = 'transfer-001';

      // First transfer
      const result1 = await convexTest.mutation(api.finance.transferBetweenWallets, {
        fromUserId: testUserId,
        toUserId: secondUserId,
        currency: 'EGP',
        amount: transferAmount,
        idempotencyKey,
      });

      // Second transfer with same key
      const result2 = await convexTest.mutation(api.finance.transferBetweenWallets, {
        fromUserId: testUserId,
        toUserId: secondUserId,
        currency: 'EGP',
        amount: transferAmount,
        idempotencyKey,
      });

      expect(result1.status).toBe('ok');
      expect(result2.status).toBe('already_processed');

      // Verify transfer only happened once
      const fromBalances = await convexTest.query(api.finance.getBalancesForUser, {
        userId: testUserId,
      });
      expect(fromBalances[0].balance).toBe(8000); // 10000 - 2000
    });
  });

  describe('Concurrent Transactions', () => {
    it('should handle concurrent deposits correctly', async () => {
      const depositAmount = 1000;
      const concurrentDeposits = 5;

      // Create multiple concurrent deposits
      const promises = Array.from({ length: concurrentDeposits }, (_, i) =>
        convexTest.mutation(api.finance.createTransaction, {
          walletId: testWalletId,
          amount: depositAmount,
          currency: 'EGP',
          type: 'DEPOSIT',
          idempotencyKey: `concurrent-deposit-${i}`,
        })
      );

      const results = await Promise.all(promises);

      // All should succeed
      results.forEach(result => {
        expect(result.status).toBe('ok');
      });

      // Final balance should be sum of all deposits
      const balances = await convexTest.query(api.finance.getBalancesForUser, {
        userId: testUserId,
      });

      expect(balances[0].balance).toBe(depositAmount * concurrentDeposits);
    });

    it('should handle concurrent transfers with balance constraints', async () => {
      // Setup initial balance
      await convexTest.mutation(api.finance.createTransaction, {
        walletId: testWalletId,
        amount: 5000, // 50.00 EGP
        currency: 'EGP',
        type: 'DEPOSIT',
      });

      const secondUserId = await convexTest.mutation(api.users.initializeUser, {
        clerkId: 'concurrent-test-user',
        email: 'concurrent@example.com',
        name: 'Concurrent Test User',
      });

      // Try to transfer more than available through concurrent requests
      const transferAmount = 3000; // 30.00 EGP each
      const promises = [
        convexTest.mutation(api.finance.transferBetweenWallets, {
          fromUserId: testUserId,
          toUserId: secondUserId,
          currency: 'EGP',
          amount: transferAmount,
          idempotencyKey: 'concurrent-transfer-1',
        }),
        convexTest.mutation(api.finance.transferBetweenWallets, {
          fromUserId: testUserId,
          toUserId: secondUserId,
          currency: 'EGP',
          amount: transferAmount,
          idempotencyKey: 'concurrent-transfer-2',
        }),
      ];

      // One should succeed, one should fail
      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      expect(successful).toBe(1);
      expect(failed).toBe(1);
    });
  });
});

describe('Reconciliation System', () => {
  let testUserId: Id<"users">;
  let testWalletId: Id<"wallets">;

  beforeEach(async () => {
    testUserId = await convexTest.mutation(api.users.initializeUser, {
      clerkId: 'reconcile-test-user',
      email: 'reconcile@example.com',
      name: 'Reconcile Test User',
    });

    testWalletId = await convexTest.mutation(api.finance.createWallet, {
      userId: testUserId,
      currency: 'EGP',
    });
  });

  it('should detect and fix balance discrepancies', async () => {
    // Create transactions
    await convexTest.mutation(api.finance.createTransaction, {
      walletId: testWalletId,
      amount: 5000,
      currency: 'EGP',
      type: 'DEPOSIT',
    });

    await convexTest.mutation(api.finance.createTransaction, {
      walletId: testWalletId,
      amount: -2000,
      currency: 'EGP',
      type: 'WITHDRAWAL',
    });

    // Manually corrupt the balance projection (simulate drift)
    const balanceRecord = await convexTest.query('walletBalances', {
      walletId: testWalletId,
    });
    
    if (balanceRecord) {
      await convexTest.mutation('patchWalletBalance', {
        balanceId: balanceRecord._id,
        newBalance: 1000, // Wrong balance
      });
    }

    // Run reconciliation
    const reconcileResult = await convexTest.action(api.reconcile.reconcileWalletBalances, {
      walletIds: [testWalletId],
      dryRun: false,
    });

    expect(reconcileResult.success).toBe(true);
    expect(reconcileResult.result.discrepanciesFound).toBe(1);
    expect(reconcileResult.result.discrepanciesFixed).toBe(1);

    // Verify balance was corrected
    const balances = await convexTest.query(api.finance.getBalancesForUser, {
      userId: testUserId,
    });

    expect(balances[0].balance).toBe(3000); // 5000 - 2000
  });

  it('should handle reconciliation dry run mode', async () => {
    // Create transaction
    await convexTest.mutation(api.finance.createTransaction, {
      walletId: testWalletId,
      amount: 1000,
      currency: 'EGP',
      type: 'DEPOSIT',
    });

    // Corrupt balance
    const balanceRecord = await convexTest.query('walletBalances', {
      walletId: testWalletId,
    });
    
    if (balanceRecord) {
      await convexTest.mutation('patchWalletBalance', {
        balanceId: balanceRecord._id,
        newBalance: 500, // Wrong balance
      });
    }

    // Run dry run reconciliation
    const reconcileResult = await convexTest.action(api.reconcile.reconcileWalletBalances, {
      walletIds: [testWalletId],
      dryRun: true,
    });

    expect(reconcileResult.success).toBe(true);
    expect(reconcileResult.result.discrepanciesFound).toBe(1);
    expect(reconcileResult.result.discrepanciesFixed).toBe(0); // Dry run doesn't fix

    // Verify balance wasn't changed
    const balances = await convexTest.query(api.finance.getBalancesForUser, {
      userId: testUserId,
    });

    expect(balances[0].balance).toBe(500); // Still wrong
  });

  it('should handle emergency wallet reconciliation', async () => {
    // Create transactions
    await convexTest.mutation(api.finance.createTransaction, {
      walletId: testWalletId,
      amount: 7500,
      currency: 'EGP',
      type: 'DEPOSIT',
    });

    // Run emergency reconciliation
    const result = await convexTest.action(api.reconcile.emergencyWalletReconcile, {
      walletId: testWalletId,
      reason: 'Test emergency reconciliation',
    });

    expect(result.success).toBe(true);
    expect(result.newBalance).toBe(7500);
    expect(result.drift).toBe(0); // No drift expected
  });
});

describe('Balance Formatting and Validation', () => {
  it('should format amounts correctly', () => {
    const { formatAmount } = require('../hooks/useBalances');

    expect(formatAmount(12345, 'EGP')).toBe('123.45');
    expect(formatAmount(100, 'USD')).toBe('1.00');
    expect(formatAmount(0, 'EUR')).toBe('0.00');
  });

  it('should validate transaction amounts', () => {
    const { useBalanceValidation } = require('../hooks/useBalances');
    const { validateAmount } = useBalanceValidation();

    // Valid amounts
    expect(validateAmount(100, 'EGP').valid).toBe(true);
    expect(validateAmount(1, 'USD').valid).toBe(true);

    // Invalid amounts
    expect(validateAmount(0, 'EGP').valid).toBe(false);
    expect(validateAmount(-100, 'USD').valid).toBe(false);
    expect(validateAmount(100.5, 'EUR').valid).toBe(false);
  });

  it('should validate currencies', () => {
    const { useBalanceValidation } = require('../hooks/useBalances');
    const { validateCurrency } = useBalanceValidation();

    expect(validateCurrency('EGP')).toBe(true);
    expect(validateCurrency('USD')).toBe(true);
    expect(validateCurrency('EUR')).toBe(true);
    expect(validateCurrency('GBP')).toBe(false);
    expect(validateCurrency('invalid')).toBe(false);
  });
});

describe('Error Handling', () => {
  it('should handle authentication errors', async () => {
    // Test without authentication context
    await expect(
      convexTest.mutation(api.finance.createTransaction, {
        walletId: 'invalid-wallet-id' as any,
        amount: 1000,
        currency: 'EGP',
        type: 'DEPOSIT',
      })
    ).rejects.toThrow('Authentication required');
  });

  it('should handle invalid wallet references', async () => {
    const invalidWalletId = 'invalid-wallet-id' as Id<"wallets">;

    await expect(
      convexTest.mutation(api.finance.createTransaction, {
        walletId: invalidWalletId,
        amount: 1000,
        currency: 'EGP',
        type: 'DEPOSIT',
      })
    ).rejects.toThrow('Wallet not found');
  });

  it('should handle currency mismatches', async () => {
    const testUserId = await convexTest.mutation(api.users.initializeUser, {
      clerkId: 'currency-test-user',
      email: 'currency@example.com',
      name: 'Currency Test User',
    });

    const egpWalletId = await convexTest.mutation(api.finance.createWallet, {
      userId: testUserId,
      currency: 'EGP',
    });

    await expect(
      convexTest.mutation(api.finance.createTransaction, {
        walletId: egpWalletId,
        amount: 1000,
        currency: 'USD', // Wrong currency
        type: 'DEPOSIT',
      })
    ).rejects.toThrow('Currency mismatch');
  });
});

describe('Performance and Scalability', () => {
  it('should handle large transaction volumes efficiently', async () => {
    const testUserId = await convexTest.mutation(api.users.initializeUser, {
      clerkId: 'performance-test-user',
      email: 'performance@example.com',
      name: 'Performance Test User',
    });

    const walletId = await convexTest.mutation(api.finance.createWallet, {
      userId: testUserId,
      currency: 'EGP',
    });

    const transactionCount = 100;
    const startTime = Date.now();

    // Create many transactions
    const promises = Array.from({ length: transactionCount }, (_, i) =>
      convexTest.mutation(api.finance.createTransaction, {
        walletId,
        amount: 100,
        currency: 'EGP',
        type: 'DEPOSIT',
        idempotencyKey: `perf-test-${i}`,
      })
    );

    await Promise.all(promises);
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Should complete within reasonable time (adjust threshold as needed)
    expect(duration).toBeLessThan(10000); // 10 seconds

    // Verify final balance
    const balances = await convexTest.query(api.finance.getBalancesForUser, {
      userId: testUserId,
    });

    expect(balances[0].balance).toBe(transactionCount * 100);
  });

  it('should handle reconciliation of many wallets efficiently', async () => {
    const walletCount = 50;
    const walletIds: Id<"wallets">[] = [];

    // Create multiple users and wallets
    for (let i = 0; i < walletCount; i++) {
      const userId = await convexTest.mutation(api.users.initializeUser, {
        clerkId: `bulk-user-${i}`,
        email: `bulk${i}@example.com`,
        name: `Bulk User ${i}`,
      });

      const walletId = await convexTest.mutation(api.finance.createWallet, {
        userId,
        currency: 'EGP',
      });

      walletIds.push(walletId);

      // Add some transactions
      await convexTest.mutation(api.finance.createTransaction, {
        walletId,
        amount: 1000 * (i + 1),
        currency: 'EGP',
        type: 'DEPOSIT',
      });
    }

    const startTime = Date.now();

    // Run reconciliation on all wallets
    const result = await convexTest.action(api.reconcile.reconcileWalletBalances, {
      walletIds,
      dryRun: true,
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(result.success).toBe(true);
    expect(result.result.walletsProcessed).toBe(walletCount);
    expect(duration).toBeLessThan(30000); // 30 seconds
  });
});
