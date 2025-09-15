import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
  users: defineTable({
    // --- Core Identity & Authentication ---
    clerkId: v.string(), // The unique identifier from the Clerk authentication service.
    email: v.string(), // The user's primary email address, used for notifications.
    name: v.string(), // The user's full name for display purposes.
    avatarUrl: v.optional(v.string()), // Optional URL to the user's avatar image.

    // --- Authorization & Financials ---
    roles: v.array(
      v.union(
        v.literal("user"),
        v.literal("admin"),
        v.literal("moderator"),
        v.literal("freelancer"),
        v.literal("client"),
      ),
    ), // Strict role validation

    // --- Multi-Currency Balance Management ---
    balances: v.array(
      v.object({
        // Multi-currency balance support - users can have balances in different currencies
        currency: v.union(v.literal("EGP"), v.literal("USD"), v.literal("EUR")), // Supported currencies
        amount: v.number(), // Balance amount (should be non-negative)
        lastUpdated: v.number(), // Timestamp of last balance update
        isActive: v.boolean(), // Whether this currency balance is actively used
      }),
    ), // Array of currency balances for multi-currency support

    // --- Profile & Recommendation Data (Career Growth Service) ---
    profile: v.optional(
      v.object({
        // Professional identity
        bio: v.optional(v.string()), // Short introduction text
        headline: v.optional(v.string()), // Professional headline, e.g., "Frontend Engineer & Medical Student"

        // Geographic & timezone data for matching
        location: v.optional(
          v.object({
            country: v.string(), // ISO country code or country name
            city: v.string(), // City name
            timezone: v.string(), // IANA timezone identifier, e.g., "Africa/Cairo"
          }),
        ),

        // Skills & experience
        skills: v.array(v.string()), // Normalized list of canonical skills for matching
        experienceLevel: v.union(
          v.literal("beginner"),
          v.literal("intermediate"),
          v.literal("advanced"),
          v.literal("expert"),
        ), // Strict typing for experience levels

        // Educational background
        education: v.array(
          v.object({
            school: v.string(), // Institution name
            degree: v.string(), // Degree type and field, e.g., "Bachelor of Computer Science"
            start: v.string(), // Start date in ISO format or "YYYY-MM" format
            end: v.optional(v.string()), // End date, null for ongoing education
          }),
        ),

        // Professional experience
        workExperience: v.array(
          v.object({
            company: v.string(), // Company/organization name
            role: v.string(), // Job title/position
            start: v.string(), // Start date in ISO format or "YYYY-MM" format
            end: v.optional(v.string()), // End date, null for current position
            description: v.optional(v.string()), // Brief description of role and achievements
          }),
        ),

        // Portfolio snapshot (lightweight, full history in separate service)
        portfolio: v.optional(
          v.object({
            projects: v.array(
              v.object({
                title: v.string(), // Project name
                url: v.optional(v.string()), // Project URL or demo link
                description: v.optional(v.string()), // Brief project description
                technologies: v.optional(v.array(v.string())), // Technologies used
              }),
            ),
            websiteUrl: v.optional(v.string()), // Personal website or portfolio site
            githubUrl: v.optional(v.string()), // GitHub profile URL
            linkedinUrl: v.optional(v.string()), // LinkedIn profile URL
          }),
        ),

        // Profile metadata
        completeness: v.optional(v.number()), // Cached completeness percentage (0-100)
        lastUpdated: v.optional(v.number()), // Timestamp of last profile update
        version: v.optional(v.number()), // Profile schema version for migrations
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
    .index("by_email", ["email"])
    // Index for soft delete filtering - essential for excluding deleted users
    .index("by_deleted_status", ["deletedAt"])
    // Index for role-based queries and admin operations
    .index("by_roles", ["roles"])
    // Index for efficient user updates and cache invalidation
    .index("by_updated_at", ["updatedAt"]),

  gigs: defineTable({
    // --- Core Gig Details ---
    title: v.string(), // The public title of the gig.
    description: v.string(), // A detailed description of the work required.
    skills: v.array(v.string()), // An array of canonical skill strings for searching.

    // --- Ownership & Lifecycle ---
    employerId: v.id("users"), // The `_id` of the user who created the gig.
    status: v.union(
      v.literal("draft"),
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("in_review"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("paused"),
    ), // Strict status validation for gig lifecycle

    // --- Gig Classification ---
    category: v.union(
      v.literal("design"),
      v.literal("development"),
      v.literal("writing"),
      v.literal("marketing"),
      v.literal("data"),
      v.literal("video"),
      v.literal("audio"),
      v.literal("business"),
      v.literal("other"),
    ), // Standardized gig categories
    difficultyLevel: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced"),
      v.literal("expert"),
    ), // Required skill level

    // --- Financials ---
    budget: v.object({
      // A structured budget for clarity.
      min: v.number(), // Minimum budget (should be positive)
      max: v.number(), // Maximum budget (should be >= min)
      currency: v.union(v.literal("EGP"), v.literal("USD"), v.literal("EUR")), // Supported currencies
      type: v.union(
        v.literal("fixed"),
        v.literal("hourly"),
        v.literal("milestone"),
      ), // Budget type
    }),

    // --- Time Management ---
    deadline: v.optional(v.number()), // Optional: A timestamp for when the work is due.
    estimatedDuration: v.optional(
      v.object({
        value: v.number(), // Duration value
        unit: v.union(
          v.literal("hours"),
          v.literal("days"),
          v.literal("weeks"),
          v.literal("months"),
        ),
      }),
    ), // Expected project duration
    applicationDeadline: v.optional(v.number()), // Timestamp for application deadline

    // --- Gig Requirements ---
    experienceRequired: v.union(
      v.literal("entry"),
      v.literal("intermediate"),
      v.literal("senior"),
      v.literal("expert"),
    ), // Required experience level

    // --- Gig Metadata ---
    metadata: v.optional(
      v.object({
        views: v.number(), // Number of times gig was viewed
        applicantCount: v.number(), // Number of applications received
        savedCount: v.number(), // Number of times gig was saved/bookmarked
        featuredUntil: v.optional(v.number()), // Timestamp for featured listing expiry
        publishedAt: v.optional(v.number()), // When gig was published
        lastModified: v.number(), // Last modification timestamp
        version: v.number(), // Version for optimistic updates
        isUrgent: v.boolean(), // Urgent priority flag
        isRemoteOnly: v.boolean(), // Remote work requirement
      }),
    ),

    // --- Location & Remote Work ---
    location: v.optional(
      v.object({
        type: v.union(
          v.literal("remote"),
          v.literal("onsite"),
          v.literal("hybrid"),
        ),
        city: v.optional(v.string()),
        country: v.optional(v.string()),
        timezone: v.optional(v.string()), // Preferred timezone for remote work
      }),
    ),

    // --- Standard System Fields ---
    updatedAt: v.number(), // Timestamp of the last modification.
    createdBy: v.string(), // The clerkId of the user who created this record.
    deletedAt: v.optional(v.number()), // Timestamp for soft deletes. Null if not deleted.
  })
    // --- Indexes for Performance ---
    // To quickly find all gigs posted by a specific employer.
    .index("by_employer", ["employerId"])
    // To efficiently query gigs based on their current status.
    .index("by_status", ["status"])

    // Find gigs by category for browsing
    .index("by_category", ["category"])

    // Find gigs by experience level required
    .index("by_experience", ["experienceRequired"])

    // Find gigs by difficulty level
    .index("by_difficulty", ["difficultyLevel"])

    // Find gigs by deadline for urgent work
    .index("by_deadline", ["deadline"])

    // Find gigs by budget type (fixed, hourly, milestone)
    .index("by_budget_type", ["budget.type"])

    // Find gigs by location type (remote, onsite, hybrid)
    .index("by_location_type", ["location.type"])

    // Composite index for efficient filtering by status and category
    .index("by_status_category", ["status", "category"])

    // Composite index for status and employer (for employer dashboards)
    .index("by_status_employer", ["status", "employerId"])

    // Composite index for open gigs by category and experience level
    .index("by_open_category_experience", [
      "status",
      "category",
      "experienceRequired",
    ])

    // Find non-deleted gigs efficiently
    .index("by_active", ["deletedAt"])

    // Find featured gigs
    .index("by_featured", ["metadata.featuredUntil"]),

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
    shortDescription: v.optional(v.string()),
    category: v.optional(v.string()),
    difficulty: v.optional(v.string()),
    status: v.optional(v.string()),
    estimatedDuration: v.optional(v.number()),
    pricing: v.optional(v.any()),
    authorId: v.id("users"), // The `_id` of the user (e.g., employer, admin) who created the course.
    // Standard System Fields
    updatedAt: v.number(),
    createdBy: v.string(),
    deletedAt: v.optional(v.number()),
  })
    .index("by_author", ["authorId"])
    .index("by_category", ["category"])
    .index("by_difficulty", ["difficulty"])
    .index("by_status", ["status"]),
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
