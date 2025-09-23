---
description: Gigsy Applications Architecture Document
auto_execution_mode: 1
---

---
applyTo: "**/*.ts,**/*.tsx,**/*.js,**/*.jsx"
---

# Gigsy Applications Architecture Document

**Document ID:** GSY-ARCH-APPLICATIONS-2025-01 **Version:** 1.0 **Date:** September 10, 2025 **Author:** Mostafa Yaser, Software Architect **Status:** Final

## **1\. Architectural Overview of the `applications` Table**

The `applications` table serves as the relational bridge between the `users` (students) and `gigs` (opportunities) tables. Each document in this table represents a single, unique application from a student for a specific gig. Its design is fundamental to the core marketplace loop: discover, apply, review, and hire.

### **Key Architectural Principles:**

* **Unique Link (The Join Table):** The primary purpose of this table is to create a many-to-many relationship between users and gigs. However, a single student can only apply to a single gig once. We enforce this critical business rule through a compound index and application logic, ensuring data integrity.  
* **Application Lifecycle Management:** An application is not a static record; it has a clear lifecycle. The `status` field (e.g., `"submitted"`, `"accepted"`, `"rejected"`, `"withdrawn"`) is the source of truth for its state. This allows us to build clear dashboards for both students and employers to track progress.  
* **Clear Ownership:** The `studentId` field unambiguously assigns ownership of the application to the student, which is essential for permissions and queries (e.g., "Show me all my applications").  
* **Communication Channel:** The `coverLetter` is the primary medium through which a student communicates their value and interest to an employer, making it a core piece of data for the application.

## **2\. Convex Schema Definition (`convex/schema.ts`)**

The following TypeScript code is the complete definition for the `applications` table. It should be added to your `convex/schema.ts` file alongside the other table definitions.

import { defineSchema, defineTable } from "convex/server";  
import { v } from "convex/values";

export default defineSchema({  
  // ... users and gigs table definitions ...

  applications: defineTable({  
    // \--- Core Relationships \---  
    gigId: v.id("gigs"),       // The \`\_id\` of the gig being applied to.  
    studentId: v.id("users"),    // The \`\_id\` of the student who is applying.

    // \--- Application Content & State \---  
    coverLetter: v.string(), // The text content of the student's application.  
    status: v.string(),      // The current state of the application, e.g., "submitted", "accepted", "rejected".

    // \--- Standard System Fields \---  
    updatedAt: v.number(), // Timestamp of the last modification.  
    createdBy: v.string(), // The clerkId of the user who created this record.  
    deletedAt: v.optional(v.number()), // Timestamp for soft deletes (or for "withdrawn" status).  
  })  
  // \--- Indexes for Performance \---  
  // A compound index to quickly find a specific application and enforce uniqueness.  
  .index("by\_gig\_and\_student", \["gigId", "studentId"\])  
  // To quickly find all applications for a specific gig.  
  .index("by\_gig", \["gigId"\])  
  // To quickly find all applications submitted by a specific student.  
  .index("by\_student", \["studentId"\]),

  // ... other tables ...  
});

## **3\. Implementation Notes & Next Steps**

* **Enforcing Uniqueness:** As discussed, our most critical business rule is that a student cannot apply for the same gig twice. This must be enforced within the `createApplication` mutation. Before inserting a new application, you **must** use the `by_gig_and_student` index to query for an existing document with the same `gigId` and `studentId`. If one exists, the mutation should fail with an error.  
* **State Transition Logic:** The power of the marketplace comes from managing the application `status`. You will need dedicated mutations for this:  
  1. `acceptApplication(applicationId)`: Can only be called by the gig's `employerId`. This mutation should set the application `status` to `"accepted"`.  
  2. `rejectApplication(applicationId)`: Can also only be called by the employer.  
  3. `withdrawApplication(applicationId)`: Can only be called by the `studentId` who owns the application.  
* **Triggering Side-Effects:** The `acceptApplication` mutation is a critical event. When an application is accepted, it should trigger a subsequent action (using `ctx.scheduler` or an `action`) to:  
  1. Update the parent `gig`'s status to `"in_progress"`.  
  2. Update the other applications for that same gig to a status like `"rejected"` or `"closed"`.  
  3. Initiate the `escrow_hold` transaction in the ledger.  
* **Permissions:** All mutations must begin with an authentication check and a permission check. For example, to create an application, the user must have the `"student"` role. To accept one, the user must be the owner of the associated gig.
