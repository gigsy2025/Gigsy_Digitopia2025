---
applyTo: "**/*.ts,**/*.tsx,**/*.js,**/*.jsx"
---


# Gigsy Gamification Service

**Document ID:** GSY-ARCH-GAME-2025-01 **Version:** 1.0 **Date:** September 10, 2025 **Author:** Mostafa Yaser, Software Architect **Status:** Final

## **1\. Architectural Overview of the Gamification Service**

The Gamification Service is designed to foster user engagement and guide behavior by rewarding valuable contributions and achievements within the Gigsy ecosystem. The architecture is event-driven, meaning it listens for significant events from other services (e.g., `course.completed`, `gig.completed`) and awards rewards based on a configurable set of rules.

### **Key Architectural Principles:**

* **Event-Driven Logic:** The service will not have complex internal logic. Instead, it will react to events published by other parts of the platform. This decouples the gamification logic from the core business logic of other services.  
* **Auditable Points System:** Similar to our financial ledger, a user's point total is not a mutable field. It is **calculated** by summing an immutable `pointsLog`. This creates a perfect, auditable history of how every point was earned.  
* **Configurable Rules:** To make the system flexible, the criteria for earning points and badges will be stored in a `gamificationRules` table. This allows us to add new achievements or adjust point values in the future without changing the core application code.  
* **Diverse Rewards:** The system is designed to handle multiple types of rewards:  
  * **Points:** A cumulative score reflecting overall activity.  
  * **Badges:** Non-fungible visual awards for specific, milestone achievements (e.g., "First Gig Completed").  
  * **Titles:** Selectable cosmetic honors that users can display on their profile (e.g., "Top Learner").

### **2\. Convex Schema Definition (`convex/schema.ts`)**

The following tables form the complete Gamification Service. They should be added to your `convex/schema.ts` file.

import { defineSchema, defineTable } from "convex/server";  
import { v } from "convex/values";

export default defineSchema({  
  // ... all other table definitions ...

  // \--- Gamification Service Tables \---

  // Defines the conditions for earning rewards  
  gamificationRules: defineTable({  
    eventName: v.string(), // The system event, e.g., "course.completed", "application.sent"  
    description: v.string(),  
    pointsAwarded: v.optional(v.number()),  
    badgeIdToAward: v.optional(v.id("badges")),  
    titleIdToAward: v.optional(v.id("titles")),  
  }).index("by\_event", \["eventName"\]),

  // An immutable log of all points a user has earned  
  pointsLog: defineTable({  
    userId: v.id("users"),  
    points: v.number(), // Always a positive integer  
    ruleId: v.id("gamificationRules"),  
    relatedEntityId: v.optional(v.string()), // e.g., the courseId or gigId  
    // Standard System Fields  
    createdBy: v.string(), // clerkId  
  }).index("by\_user", \["userId"\]),

  // \--- Definitions for Badges & Titles \---

  badges: defineTable({  
    name: v.string(),  
    description: v.string(),  
    iconUrl: v.string(), // URL to the badge image asset  
  }),

  titles: defineTable({  
    name: v.string(), // e.g., "Community Helper", "Prodigy"  
    description: v.string(),  
  }),

  // \--- Join tables to link rewards to users \---

  userBadges: defineTable({  
    userId: v.id("users"),  
    badgeId: v.id("badges"),  
    // Standard System Fields  
    createdBy: v.string(),  
  }).index("by\_user\_and\_badge", \["userId", "badgeId"\]),

  userTitles: defineTable({  
    userId: v.id("users"),  
    titleId: v.id("titles"),  
    isEquipped: v.boolean(), // Denotes if this is the user's currently displayed title  
    // Standard System Fields  
    createdBy: v.string(),  
  }).index("by\_user", \["userId"\]),

  // ... other tables ...  
});

### **Implementation Notes & Next Steps**

* **Central Event Handler:** An internal `action`, `internal.gamification.handleEvent`, will be the single entry point to the service. When a student completes a course, the LMS service will call this action with `{ eventName: "course.completed", userId: "...", relatedEntityId: "..." }`.  
* **Rule Processing Logic:**  
  1. The `handleEvent` action will query the `gamificationRules` table using the `by_event` index to find all matching rules.  
  2. For each rule, it will check if the user has already been awarded this specific reward for this specific entity (to prevent duplicate rewards).  
  3. If the reward is new, it will insert documents into the `pointsLog`, `userBadges`, or `userTitles` tables accordingly.  
* **Calculating Total Score:** A `query`, `getUserGamificationProfile`, will be created. It will take a `userId` and:  
  1. Fetch all documents from `pointsLog` for that user and sum the `points` field.  
  2. Fetch all documents from `userBadges` and `userTitles` to get a list of earned rewards.  
  3. Return a comprehensive profile object: `{ totalPoints: 1250, badges: [...], titles: [...] }`.  
* **Leaderboard Implementation:** A `query`, `getLeaderboard`, can be implemented to calculate the top scores. **For the hackathon**, this query can run live. **For production**, a `cronJob` should run periodically (e.g., every hour) to pre-calculate the top 100 user scores and store them in a separate `leaderboard` table for fast retrieval, avoiding expensive calculations on every page load.
