---
description: Gigsy Chat Service Architect
auto_execution_mode: 1
---

---
applyTo: "**/*.ts,**/*.tsx,**/*.js,**/*.jsx"
---


# Gigsy Chat Service Architect

**Document ID:** GSY-ARCH-CHAT-2025-01 

**Version:** 1.0 

**Date:** September 10, 2025 

**Author:** Mostafa Yaser, Software Architect 

**Status:** Final

## **1\. Architectural Overview of the Chat Service**

The Chat Service is responsible for all real-time communication on the Gigsy platform. The architecture is designed to be highly performant and scalable, separating conversation metadata from the message stream itself and handling ephemeral real-time events like "typing" status in a dedicated, non-persistent manner.

### **Key Architectural Principles:**

* **Lightweight Conversations:** The `conversations` table itself is merely a lightweight container. It holds metadata about the chat session, such as its participants, but not the messages themselves. This keeps the primary conversation document small and fast to query.  
* **Immutable Message Stream:** Messages are stored in a separate `messages` table, creating an append-only log of the chat history. This is a highly scalable pattern, as we primarily write new messages and read them in chronological order. The primary index on `(conversationId, _creationTime)` is crucial for efficient pagination.  
* **Efficient Querying with a Join Table:** To avoid slow, expensive array scans when finding all conversations for a user, we will use a dedicated `userConversations` join table. This table provides a direct, indexed lookup from a `userId` to all their associated `conversationIds`.  
* **Ephemeral State Management:** Real-time statuses like "online" or "is typing" are high-frequency, temporary events. Storing them in our primary database would cause excessive writes and performance issues. We will manage this ephemeral state in a dedicated `userStatus` table, which acts as a temporary cache for real-time UI updates.

### **2\. Convex Schema Definition (`convex/schema.ts`)**

The following is a complete set of table definitions for the Chat Service. These tables work together to provide the full messaging experience and should be added to your `convex/schema.ts` file.

import { defineSchema, defineTable } from "convex/server";  
import { v } from "convex/values";

export default defineSchema({  
  // ... users, gigs, applications, LMS tables ...

  // \--- Chat Service Tables \---

  conversations: defineTable({  
    // A canonical key made by sorting and joining participant user IDs to prevent duplicate conversations.  
    // e.g., "user\_abc...\#user\_xyz..."  
    canonicalKey: v.string(),  
    participants: v.array(v.id("users")), // An array of the \`\_id\`s of the participating users.  
    lastMessageAt: v.optional(v.number()), // Timestamp of the last message sent, for sorting conversation lists.  
  }).index("by\_canonical\_key", \["canonicalKey"\]),

  messages: defineTable({  
    conversationId: v.id("conversations"),  
    authorId: v.id("users"),  
    body: v.string(), // The text content of the message.  
    // Standard System Fields are implicitly handled by Convex (\_id, \_creationTime)  
  }).index("by\_conversation", \["conversationId"\]),

  // Join table for efficient lookup of a user's conversations  
  userConversations: defineTable({  
    userId: v.id("users"),  
    conversationId: v.id("conversations"),  
    lastReadAt: v.optional(v.number()), // To track unread messages.  
  })  
    .index("by\_user", \["userId"\])  
    .index("by\_user\_and\_conversation", \["userId", "conversationId"\]),

  // Table for managing ephemeral real-time status  
  userStatus: defineTable({  
    userId: v.id("users"),  
    conversationId: v.optional(v.id("conversations")),  
    status: v.string(), // "online", "offline", "typing"  
    lastUpdated: v.number(),  
  })  
    .index("by\_user", \["userId"\])  
    .index("by\_conversation\_and\_status", \["conversationId", "status"\]),

  // ... other tables ...  
});

### **Implementation Notes & Next Steps**

* **Creating a Conversation:**  
  1. A mutation `createOrGetConversation(otherUserId)` will be the entry point.  
  2. It must construct the `canonicalKey` by fetching both user IDs, sorting them alphabetically, and joining them with a separator (e.g., `#`).  
  3. It will first query the `conversations` table using the `by_canonical_key` index to see if a conversation already exists. If so, it returns the existing `conversationId`.  
  4. If not, it inserts a new document into `conversations` and also inserts two corresponding documents into the `userConversations` join table (one for each participant).  
* **Sending a Message:**  
  1. A `sendMessage(conversationId, body)` mutation will insert a new document into the `messages` table.  
  2. Crucially, after inserting the message, it must also update the `lastMessageAt` field on the parent `conversations` document to the current timestamp. This ensures conversation lists are always sorted correctly.  
* **"Is Typing" Indicator Logic:**  
  1. **Frontend (Start Typing):** When a user starts typing in a conversation, the Next.js frontend calls a mutation, e.g., `updateTypingStatus({ conversationId, isTyping: true })`.  
  2. **Backend Mutation:** This mutation finds the user's status document in the `userStatus` table (or creates one) and updates it to `{ status: "typing", conversationId: '...', lastUpdated: Date.now() }`.  
  3. **Frontend (Display):** The chat component will have a real-time query, e.g., `getTypingStatus(conversationId)`, which subscribes to the `userStatus` table, filtered by the current `conversationId` and `status: "typing"`. When a document appears, the "is typing..." UI is shown.  
  4. **Frontend (Stop Typing):** When the user stops typing (or sends the message), the frontend calls the same mutation with `isTyping: false`. The backend then updates the status back to `"online"`.  
  5. **Stale Status Cleanup:** A Convex `cronJob` must run periodically (e.g., every minute) to clean up stale typing indicators. It will query the `userStatus` table for documents where `status` is `"typing"` and `lastUpdated` is older than a few seconds, and reset their status to `"online"`. This handles cases where a user closes their browser without sending a "stop typing" event.
