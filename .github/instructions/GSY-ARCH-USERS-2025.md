---
applyTo: "**/*.ts,**/*.tsx,**/*.js,**/*.jsx"
---

# Gigsy Users Table Architect

**Document ID:** GSY-ARCH-USERS-2025-01 **Version:** 1.0 **Date:** September 10, 2025 **Author:** Mostafa Yaser, Software Architect **Status:** Final

## **1\. Architectural Overview of the `users` Table**

The `users` table serves as the central identity and data hub for every individual interacting with the Gigsy platform. It is the single source of truth for user-specific information, linking authentication, profile data, financial status, and application-specific roles. Our design prioritizes scalability, security, and future flexibility.

### **Key Architectural Principles:**

* **Decoupling Identity:** We intentionally separate our internal system ID (`_id`, provided by Convex) from the external authentication provider's ID (`clerkId`). This is a critical strategic decision that prevents vendor lock-in and allows us to potentially integrate other authentication methods in the future without a disruptive migration. The `clerkId` acts as a stable, unique reference to the identity provider.  
* **Ledger-First Financials:** The `balance` field is a performance optimization—a denormalized cache. The absolute source of truth for a user's funds is the immutable `transactions` ledger. All mutations that affect a user's balance **must** first write to the ledger and only then update this cached `balance` value. This ensures auditability and financial integrity.  
* **Role-Based Authorization:** For our MVP, a simple `roles` array provides a flexible and fast way to implement authorization logic directly within our Convex functions. We can easily check if a user has the `"employer"` or `"student"` role before allowing an action.  
* **Recommendation Engine Ready:** The inclusion of `embedding` and `embeddingUpdatedAt` fields builds the foundation for our core recommendation feature from day one. This allows us to store the vector representation of a user's profile directly with their data, simplifying the matching and search process.

### **2\. Convex Schema Definition (`convex/schema.ts`)**

The following TypeScript code is the complete and final definition for the `users` table, to be placed within your `convex/schema.ts` file. This code translates our architectural design into a concrete schema that Convex will enforce.

import { defineSchema, defineTable } from "convex/server";  
import { v } from "convex/values";

export default defineSchema({  
  // ... other tables like gigs, transactions, etc. will go here

  users: defineTable({  
    // \--- Core Identity & Authentication \---  
    clerkId: v.string(), // The unique identifier from the Clerk authentication service.  
    email: v.string(),   // The user's primary email address, used for notifications.  
    name: v.string(),    // The user's full name for display purposes.

    // \--- Authorization & Financials \---  
    roles: v.array(v.string()), // A list of roles, e.g., \["student", "employer"\].  
    balance: v.object({         // A denormalized cache of the user's current balance.  
      amount: v.number(),  
      currency: v.string(),  
    }),

    // \--- Profile & Recommendation Data \---  
    portfolio: v.optional(v.object({  // Optional: A snapshot of key portfolio items.  
      // Define the structure of the portfolio object as needed.  
      // For example:  
      // bio: v.string(),  
      // projects: v.array(v.object({ title: v.string(), url: v.string() }))  
    })),  
    embedding: v.optional(v.array(v.number())), // Optional: The vector embedding of the user's profile.  
    embeddingUpdatedAt: v.optional(v.number()), // Optional: Timestamp of the last embedding update.

    // \--- Standard System Fields \---  
    // Note: \`\_id\` and \`\_creationTime\` are automatically provided by Convex.  
    // We manually add our own \`updatedAt\` for more granular control.  
    updatedAt: v.number(), // Timestamp of the last modification.  
    createdBy: v.string(), // The clerkId of the user who created this record, or "system".  
    deletedAt: v.optional(v.number()), // Timestamp for soft deletes. Null if not deleted.  
  })  
  // \--- Indexes for Performance \---  
  // A unique index on clerkId is critical for finding users based on their auth identity.  
  .index("by\_clerk\_id", \["clerkId"\])  
  // A unique index on email is important for lookups and preventing duplicates.  
  .index("by\_email", \["email"\]),

});

### **3\. Implementation Notes & Next Steps**

* **User Creation Flow:** This schema defines the *structure* of a user. The next step is to implement a Convex `internalAction` or `mutation` (e.g., `createUser`) that is triggered by a Clerk webhook upon a new user's first sign-up. This function will be responsible for creating a new document in this `users` table, populating the `clerkId`, `email`, `name`, and setting initial default values for `roles` and `balance`.  
* **Enforcing Uniqueness:** While we define `by_clerk_id` and `by_email` as standard indexes, Convex doesn't have a native `unique` constraint at the schema level as of this writing. Uniqueness must be enforced in your application logic (i.e., in the `createUser` function, you must first query to see if a user with that `clerkId` already exists before inserting). The indexes will make this query extremely fast.
