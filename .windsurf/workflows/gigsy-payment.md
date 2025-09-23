---
description: Gigsy Payment Architect
auto_execution_mode: 1
---

---
applyTo: "**/*.ts,**/*.tsx,**/*.js,**/*.jsx"
---


# Gigsy Payment Architect

**Document ID:** GSY-ARCH-LEDGER-2025-01 **Version:** 1.0 **Date:** September 10, 2025 **Author:** Mostafa Yaser, Software Architect **Status:** Final

## **1\. Architectural Overview of the Payments & Ledger Service**

This service is the source of truth for all financial activity on the Gigsy platform. Its design is founded on the principle of an **immutable ledger**, which provides a complete, auditable, and tamper-proof history of every transaction.

### **Key Architectural Principles:**

* **Calculated Balances, Not Stored Balances:** We will **never** store a user's current balance as a single, mutable number in their `users` or `wallets` table. Doing so is brittle and prone to race conditions and synchronization errors. Instead, a user's balance is always **calculated in real-time** by summing the `amount` of all documents in their transaction history. This guarantees the balance is always correct.  
* **Immutable, Append-Only Ledger:** The `transactions` table is an append-only log. Transactions are **never updated or deleted**. If a mistake is made or a refund is required, a new, reversing transaction (e.g., a `REFUND` transaction) is created. This ensures a perfect audit trail.  
* **Atomicity and Idempotency:** Financial operations must be atomic. For external events, such as a deposit webhook from a payment provider, operations must be idempotent to prevent duplicate transactions from a single real-world payment. We achieve this by storing an `externalTransactionId`.  
* **Clear Transaction Types:** Every financial movement is categorized by a `type` (e.g., `DEPOSIT`, `ESCROW_HOLD`, `PAYOUT`, `FEE`). This makes the ledger easy to query, audit, and understand.

### **2\. Convex Schema Definition (`convex/schema.ts`)**

The following tables form the core of our financial system. They should be added to your `convex/schema.ts` file.

import { defineSchema, defineTable } from "convex/server";  
import { v } from "convex/values";

export default defineSchema({  
  // ... all other table definitions ...

  // \--- Payments & Ledger Service Tables \---

  wallets: defineTable({  
    userId: v.id("users"), // The \`\_id\` of the user who owns this wallet.  
    currency: v.string(),  // e.g., "EGP", "USD".  
    // Standard System Fields  
    updatedAt: v.number(),  
    createdBy: v.string(),  
  }).index("by\_user", \["userId"\]),

  transactions: defineTable({  
    walletId: v.id("wallets"),  
    // The amount can be positive (credit) or negative (debit).  
    // Stored as an integer in the smallest currency unit (e.g., cents, piastres) to avoid floating-point errors.  
    amount: v.number(),  
    currency: v.string(),  
    type: v.string(), // "DEPOSIT", "ESCROW\_HOLD", "ESCROW\_RELEASE", "PAYOUT", "FEE", "WITHDRAWAL", "REFUND"  
    description: v.string(), // A human-readable description of the transaction.

    // \--- Auditing & Idempotency \---  
    relatedEntityType: v.optional(v.string()), // e.g., "gig", "application".  
    relatedEntityId: v.optional(v.string()),   // The \`\_id\` of the related document.  
    externalTransactionId: v.optional(v.string()), // The unique ID from a payment provider like Stripe or Paymob.

    // Standard System Fields  
    createdBy: v.string(), // Can be a clerkId or "system" for fees.  
  })  
    .index("by\_wallet", \["walletId"\])  
    .index("by\_external\_id", \["externalTransactionId"\]),  
    
  // ... other tables ...  
});

###  **Implementation Notes & Next Steps**

* **Calculating a Balance:** You will create a Convex `query` named `getWalletBalance`. This query will take a `walletId` as an argument, use the `by_wallet` index to fetch all associated transactions, and use `reduce()` to sum their `amount` fields. This provides the real-time balance.  
* **Core Financial Flow (Example: A Complete Gig):**  
  1. **Deposit:** An employer wants to fund their account. The frontend initiates a payment with Paymob/Stripe. Upon successful payment, the provider sends a webhook to a Convex `httpAction`. This action **must first check** if a transaction with the given `externalTransactionId` already exists. If not, it creates a `DEPOSIT` transaction in the employer's wallet with a positive `amount`.  
  2. **Escrow Hold:** When the employer accepts a student's application for a gig, the `acceptApplication` mutation triggers an `action`. This action creates an `ESCROW_HOLD` transaction in the employer's wallet with a **negative** `amount` equal to the gig's budget. The `relatedEntityId` will be the `gigId`.  
  3. **Completion & Payout:** When the gig is successfully completed and approved, another `action` is triggered. This action creates three transactions:  
     * An `ESCROW_RELEASE` in the employer's wallet with a **positive** `amount` (if you are managing a system balance, otherwise this is skipped).  
     * A `PAYOUT` in the student's wallet with a positive `amount` (gig budget minus the platform fee).  
     * A `FEE` transaction in a "system" wallet with a positive `amount` equal to the platform fee.  
* **Security:** All mutations and actions that create transactions must be heavily guarded with permission checks. Only the system or verified webhooks should be able to create transactions. A user should never be able to create a transaction for themselves directly.
