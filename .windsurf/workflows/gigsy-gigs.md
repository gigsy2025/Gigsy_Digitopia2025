---
description: Gigsy Gigs Architect
auto_execution_mode: 1
---

---
applyTo: "**/*.ts,**/*.tsx,**/*.js,**/*.jsx"
---

# Gigsy Gigs Architect

**Document ID:** GSY-ARCH-GIGS-2025-01 **Version:** 1.0 **Date:** September 10, 2025 **Author:** Mostafa Yaser, Software Architect **Status:** Final

## **1\. Architectural Overview of the `gigs` Table**

The `gigs` table is the operational core of the Gig Marketplace Service (GMS). It represents the "jobs" or "projects" that employers post to find talent. The design of this table must accommodate a rich set of data for clear communication, effective searching, and a robust lifecycle management process.

### **Key Architectural Principles:**

* **State Machine Lifecycle:** A gig progresses through a defined lifecycle. The `status` field is the single source of truth for this state (e.g., `"draft"`, `"open_for_applications"`, `"in_progress"`, `"completed"`). All business logic, user permissions, and UI displays will be driven by this explicit state machine. This prevents inconsistent states and simplifies logic.  
* **Structured Data for Clarity:** To avoid ambiguity and enhance searchability, critical fields are structured. The `budget` is an object containing `min`, `max`, and `currency`, which is far more expressive than a single number. This provides clarity for both employers and students.  
* **Search and Discovery Optimized:** The `skills` field, while implemented as an array of strings for MVP velocity, is designed for faceted search. Combined with the `title` and `description`, it forms the basis of our keyword and vector-based search algorithms, allowing students to easily discover relevant opportunities.  
* **Clear Ownership and Association:** Every gig has a clear `employerId`, linking it directly to a user in the `users` table. This foreign key relationship is fundamental for managing permissions, displaying gig ownership, and handling financial transactions.

### **2\. Convex Schema Definition (`convex/schema.ts`)**

The following TypeScript code is the complete definition for the `gigs` table. It should be added to your `convex/schema.ts` file alongside the `users` table definition.

import { defineSchema, defineTable } from "convex/server";  
import { v } from "convex/values";

export default defineSchema({  
  // ... users table definition ...

  gigs: defineTable({  
    // \--- Core Gig Details \---  
    title: v.string(),        // The public title of the gig.  
    description: v.string(),  // A detailed description of the work required.  
    skills: v.array(v.string()), // An array of canonical skill strings for searching.

    // \--- Ownership & Lifecycle \---  
    employerId: v.id("users"), // The \`\_id\` of the user who created the gig.  
    status: v.string(),        // The current state of the gig, e.g., "draft", "open", "in\_progress", "completed".

    // \--- Financials \---  
    budget: v.object({         // A structured budget for clarity.  
      min: v.number(),  
      max: v.number(),  
      currency: v.string(),  
    }),

    // \--- Timestamps & Deadlines \---  
    deadline: v.optional(v.number()), // Optional: A timestamp for when the work is due.

    // \--- Standard System Fields \---  
    updatedAt: v.number(), // Timestamp of the last modification.  
    createdBy: v.string(), // The clerkId of the user who created this record.  
    deletedAt: v.optional(v.number()), // Timestamp for soft deletes. Null if not deleted.  
  })  
  // \--- Indexes for Performance \---  
  // To quickly find all gigs posted by a specific employer.  
  .index("by\_employer", \["employerId"\])  
  // To efficiently query gigs based on their current status.  
  .index("by\_status", \["status"\]),

  // ... other tables ...  
});

### **3\. Implementation Notes & Next Steps**

* **Gig Creation Mutation:** You will create a Convex `mutation` (e.g., `createGig`) that allows an authenticated user with the `"employer"` role to insert a new document into this table. The initial `status` should always be set to `"draft"`.  
* **State Transition Logic:** The business logic for moving a gig from one `status` to another (e.g., from `"draft"` to `"open_for_applications"`) must be encapsulated in dedicated mutations (e.g., `publishGig`). These mutations must perform validation checks; for example, a gig cannot be published without a title, description, and budget.  
* **Server-Side Validation:** All inputs, especially the `budget` object and `skills` array, must be strictly validated within your Convex mutations to ensure data integrity before being written to the database.  
* **Soft Deletes vs. Archiving:** For the MVP, we are using a simple `deletedAt` for soft deletes. In a future version, the `status` field could be expanded to include an `"archived"` state for gigs that an employer wants to hide but not permanently delete.
