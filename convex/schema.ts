import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
  users: defineTable({
    // --- Core Identity & Authentication ---
    clerkId: v.string(), // The unique identifier from the Clerk authentication service.
    email: v.string(), // The user's primary email address, used for notifications.
    name: v.string(), // The user's full name for display purposes.

    // --- Authorization & Financials ---
    roles: v.array(v.string()), // A list of roles, e.g., ["student", "employer"].
    balance: v.object({
      // A denormalized cache of the user's current balance.
      amount: v.number(),
      currency: v.string(),
    }),

    // --- Profile & Recommendation Data ---
    portfolio: v.optional(
      v.object({
        // Optional: A snapshot of key portfolio items.
        // Define the structure of the portfolio object as needed.
        // For example:
        // bio: v.string(),
        // projects: v.array(v.object({ title: v.string(), url: v.string() }))
      }),
    ),
    embedding: v.optional(v.array(v.number())), // Optional: The vector embedding of the user's profile.
    embeddingUpdatedAt: v.optional(v.number()), // Optional: Timestamp of the last embedding update.

    // --- Standard System Fields ---
    // Note: `_id` and `_creationTime` are automatically provided by Convex.
    // We manually add our own `updatedAt` for more granular control.
    updatedAt: v.number(), // Timestamp of the last modification.
    createdBy: v.string(), // The clerkId of the user who created this record, or "system".
    deletedAt: v.optional(v.number()), // Timestamp for soft deletes. Null if not deleted.
  })
    // --- Indexes for Performance ---
    // A unique index on clerkId is critical for finding users based on their auth identity.
    .index("by_clerk_id", ["clerkId"])
    // A unique index on email is important for lookups and preventing duplicates.
    .index("by_email", ["email"]),

  gigs: defineTable({
    // --- Core Gig Details ---
    title: v.string(), // The public title of the gig.
    description: v.string(), // A detailed description of the work required.
    skills: v.array(v.string()), // An array of canonical skill strings for searching.

    // --- Ownership & Lifecycle ---
    employerId: v.id("users"), // The `_id` of the user who created the gig.
    status: v.string(), // The current state of the gig, e.g., "draft", "open", "in_progress", "completed".

    // --- Financials ---
    budget: v.object({
      // A structured budget for clarity.
      min: v.number(),
      max: v.number(),
      currency: v.string(),
    }),

    // --- Timestamps & Deadlines ---
    deadline: v.optional(v.number()), // Optional: A timestamp for when the work is due.

    // --- Standard System Fields ---
    updatedAt: v.number(), // Timestamp of the last modification.
    createdBy: v.string(), // The clerkId of the user who created this record.
    deletedAt: v.optional(v.number()), // Timestamp for soft deletes. Null if not deleted.
  })
    // --- Indexes for Performance ---
    // To quickly find all gigs posted by a specific employer.
    .index("by_employer", ["employerId"])
    // To efficiently query gigs based on their current status.
    .index("by_status", ["status"]),

  applications: defineTable({
    // --- Core Relationships ---
    gigId: v.id("gigs"), // The `_id` of the gig being applied to.
    studentId: v.id("users"), // The `_id` of the student who is applying.

    // --- Application Content & State ---
    coverLetter: v.string(), // The text content of the student's application.
    status: v.string(), // The current state of the application, e.g., "submitted", "accepted", "rejected".

    // --- Standard System Fields ---
    updatedAt: v.number(), // Timestamp of the last modification.
    createdBy: v.string(), // The clerkId of the user who created this record.
    deletedAt: v.optional(v.number()), // Timestamp for soft deletes (or for "withdrawn" status).
  })
    // --- Indexes for Performance ---
    // A compound index to quickly find a specific application and enforce uniqueness.
    .index("by_gig_and_student", ["gigId", "studentId"])
    // To quickly find all applications for a specific gig.
    .index("by_gig", ["gigId"])
    // To quickly find all applications submitted by a specific student.
    .index("by_student", ["studentId"]),

  // --- LMS Core Content Tables ---

  courses: defineTable({
    title: v.string(),
    description: v.string(),
    authorId: v.id("users"), // The `_id` of the user (e.g., employer, admin) who created the course.
    // Standard System Fields
    updatedAt: v.number(),
    createdBy: v.string(),
    deletedAt: v.optional(v.number()),
  }).index("by_author", ["authorId"]),
  // Index By Course Id is defined in the modules table

  modules: defineTable({
    courseId: v.id("courses"),
    title: v.string(),
    order: v.number(), // The sequence of this module within the course.
    // Standard System Fields
    updatedAt: v.number(),
    createdBy: v.string(),
    deletedAt: v.optional(v.number()),
  }).index("by_course", ["courseId"]),

  lessons: defineTable({
    moduleId: v.id("modules"),
    title: v.string(),
    content: v.string(), // Could be markdown text, or a URL to a video.
    order: v.number(), // The sequence of this lesson within the module.
    // Standard System Fields
    updatedAt: v.number(),
    createdBy: v.string(),
    deletedAt: v.optional(v.number()),
  }).index("by_module", ["moduleId"]),

  // --- LMS User Progress & Enrollment ---

  enrollments: defineTable({
    studentId: v.id("users"),
    courseId: v.id("courses"),
    status: v.string(), // e.g., "in_progress", "completed".
    // Standard System Fields
    updatedAt: v.number(),
    createdBy: v.string(),
    deletedAt: v.optional(v.number()),
  }).index("by_student_and_course", ["studentId", "courseId"]),

  lessonProgress: defineTable({
    enrollmentId: v.id("enrollments"),
    lessonId: v.id("lessons"),
    status: v.string(), // e.g., "not_started", "in_progress", "completed".
    // Standard System Fields
    updatedAt: v.number(),
    createdBy: v.string(),
  }).index("by_enrollment_and_lesson", ["enrollmentId", "lessonId"]),

  // --- Quiz System Tables ---

  quizzes: defineTable({
    lessonId: v.id("lessons"),
    question: v.string(),
    order: v.number(), // If a lesson has multiple timed quizzes.
  }).index("by_lesson", ["lessonId"]),

  quizOptions: defineTable({
    quizId: v.id("quizzes"),
    text: v.string(),
    isCorrect: v.boolean(),
  }).index("by_quiz", ["quizId"]),

  quizAttempts: defineTable({
    studentId: v.id("users"),
    quizId: v.id("quizzes"),
    selectedOptionId: v.id("quizOptions"),
    isCorrect: v.boolean(), // Denormalized for easier querying.
    // Standard System Fields
    createdBy: v.string(),
  }).index("by_student_and_quiz", ["studentId", "quizId"]),

  // --- Chat Service Tables ---

  conversations: defineTable({
    // A canonical key made by sorting and joining participant user IDs to prevent duplicate conversations.
    // e.g., "user_abc...#user_xyz..."
    canonicalKey: v.string(),
    participants: v.array(v.id("users")), // An array of the `_id`s of the participating users.
    lastMessageAt: v.optional(v.number()), // Timestamp of the last message sent, for sorting conversation lists.
  }).index("by_canonical_key", ["canonicalKey"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    authorId: v.id("users"),
    body: v.string(), // The text content of the message.
    // Standard System Fields are implicitly handled by Convex (_id, _creationTime)
  }).index("by_conversation", ["conversationId"]),

  // Join table for efficient lookup of a user's conversations
  userConversations: defineTable({
    userId: v.id("users"),
    conversationId: v.id("conversations"),
    lastReadAt: v.optional(v.number()), // To track unread messages.
  })
    .index("by_user", ["userId"])
    .index("by_user_and_conversation", ["userId", "conversationId"]),

  // Table for managing ephemeral real-time status
  userStatus: defineTable({
    userId: v.id("users"),
    conversationId: v.optional(v.id("conversations")),
    status: v.string(), // "online", "offline", "typing"
    lastUpdated: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_conversation_and_status", ["conversationId", "status"]),

  // --- Payments & Ledger Service Tables ---

  wallets: defineTable({
    userId: v.id("users"), // The `_id` of the user who owns this wallet.
    currency: v.string(), // e.g., "EGP", "USD".
    // Standard System Fields
    updatedAt: v.number(),
    createdBy: v.string(),
  }).index("by_user", ["userId"]),

  transactions: defineTable({
    walletId: v.id("wallets"),
    // The amount can be positive (credit) or negative (debit).
    // Stored as an integer in the smallest currency unit (e.g., cents, piastres) to avoid floating-point errors.
    amount: v.number(),
    currency: v.string(),
    type: v.string(), // "DEPOSIT", "ESCROW_HOLD", "ESCROW_RELEASE", "PAYOUT", "FEE", "WITHDRAWAL", "REFUND"
    description: v.string(), // A human-readable description of the transaction.

    // --- Auditing & Idempotency ---
    relatedEntityType: v.optional(v.string()), // e.g., "gig", "application".
    relatedEntityId: v.optional(v.string()), // The `_id` of the related document.
    externalTransactionId: v.optional(v.string()), // The unique ID from a payment provider like Stripe or Paymob.

    // Standard System Fields
    createdBy: v.string(), // Can be a clerkId or "system" for fees.
  })
    .index("by_wallet", ["walletId"])
    .index("by_external_id", ["externalTransactionId"]),

  // --- Gamification Service Tables ---

  // Defines the conditions for earning rewards
  gamificationRules: defineTable({
    eventName: v.string(), // The system event, e.g., "course.completed", "application.sent"
    description: v.string(),
    pointsAwarded: v.optional(v.number()),
    badgeIdToAward: v.optional(v.id("badges")),
    titleIdToAward: v.optional(v.id("titles")),
  }).index("by_event", ["eventName"]),

  // An immutable log of all points a user has earned
  pointsLog: defineTable({
    userId: v.id("users"),
    points: v.number(), // Always a positive integer
    ruleId: v.id("gamificationRules"),
    relatedEntityId: v.optional(v.string()), // e.g., the courseId or gigId
    // Standard System Fields
    createdBy: v.string(), // clerkId
  }).index("by_user", ["userId"]),

  // --- Definitions for Badges & Titles ---

  badges: defineTable({
    name: v.string(),
    description: v.string(),
    iconUrl: v.string(), // URL to the badge image asset
  }),

  titles: defineTable({
    name: v.string(), // e.g., "Community Helper", "Prodigy"
    description: v.string(),
  }),

  // --- Join tables to link rewards to users ---

  userBadges: defineTable({
    userId: v.id("users"),
    badgeId: v.id("badges"),
    // Standard System Fields
    createdBy: v.string(),
  }).index("by_user_and_badge", ["userId", "badgeId"]),

  userTitles: defineTable({
    userId: v.id("users"),
    titleId: v.id("titles"),
    isEquipped: v.boolean(), // Denotes if this is the user's currently displayed title
    // Standard System Fields
    createdBy: v.string(),
  }).index("by_user", ["userId"]),

  // --- Logging Service Tables ---

  logs: defineTable({
    // Core log data
    level: v.string(), // "trace", "debug", "info", "warn", "error", "fatal"
    message: v.string(), // The log message
    context: v.string(), // Logger context: "api", "auth", "database", etc.

    // Metadata
    metadata: v.optional(v.any()), // Flexible log metadata object - allows any structure

    // Correlation tracking
    correlationId: v.optional(v.string()),
    requestId: v.optional(v.string()),
    userId: v.optional(v.string()),
    sessionId: v.optional(v.string()),

    // Environment info
    service: v.string(), // "gigsy"
    version: v.string(), // App version
    environment: v.string(), // "development", "production"

    // Source tracking
    source: v.string(), // "client", "server", "middleware"
    userAgent: v.optional(v.string()),
    ip: v.optional(v.string()),

    // Processing status
    status: v.string(), // "pending", "forwarded", "failed"
    forwardedAt: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    retryCount: v.optional(v.number()),

    // Standard System Fields
    createdBy: v.string(),
  })
    .index("by_status", ["status"])
    .index("by_level", ["level"])
    .index("by_context", ["context"])
    .index("by_correlation_id", ["correlationId"]),
});

export default schema;
