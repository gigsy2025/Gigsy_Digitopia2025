import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const Currency = v.union(v.literal("EGP"), v.literal("USD"), v.literal("EUR"));

const TransactionType = v.union(
  v.literal("DEPOSIT"),
  v.literal("WITHDRAWAL"),
  v.literal("TRANSFER"),
  v.literal("ESCROW_HOLD"),
  v.literal("ESCROW_RELEASE"),
  v.literal("PAYOUT"),
  v.literal("FEE"),
  v.literal("REFUND")
);

const TransactionStatus = v.union(
  v.literal("PENDING"),
  v.literal("COMPLETED"),
  v.literal("FAILED"),
  v.literal("CANCELLED")
);

const schema = defineSchema({
  users: defineTable({
    // --- Core Identity & Authentication ---
    clerkId: v.string(), // The unique identifier from the Clerk authentication service.
    email: v.string(), // The user's primary email address, used for notifications.
    // Legacy price field for backward compatibility
    price: v.optional(v.number()),
    // Legacy pricing type for backward compatibility
    pricingType: v.optional(
      v.union(
        v.literal("free"),
        v.literal("one-time"),
        v.literal("subscription"),
      ),
    ),
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

    // ---- CACHED PROJECTION ONLY: DO NOT WRITE DIRECTLY FROM CLIENT ----
    // Multi-currency balance support - READ-ONLY cached projection for fast UI
    balances: v.array(
      v.object({
        currency: v.union(v.literal("EGP"), v.literal("USD"), v.literal("EUR")), // Supported currencies
        amount: v.number(), // Balance amount in smallest unit (integer, e.g., cents/piastres)
        lastUpdated: v.number(), // Timestamp of last balance update
        isActive: v.boolean(), // Whether this currency balance is actively used
      }),
    ), // Array of currency balances for multi-currency support - CACHED ONLY

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
        lessonsCompleted: v.optional(v.number()),
        lastActivityAt: v.optional(v.number()),

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
    // --- Core Course Details ---
    title: v.string(),
    description: v.string(),
    shortDescription: v.optional(v.string()),
    category: v.optional(
      v.union(
        v.literal("development"),
        v.literal("design"),
        v.literal("marketing"),
        v.literal("writing"),
        v.literal("data"),
        v.literal("business"),
        v.literal("creative"),
        v.literal("technology"),
        v.literal("soft-skills"),
        v.literal("languages"),
      ),
    ),
    difficulty: v.optional(
      v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced"),
        v.literal("expert"),
      ),
    ),
    // Alias for backward compatibility
    difficultyLevel: v.optional(
      v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced"),
        v.literal("expert"),
      ),
    ),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("published"),
        v.literal("archived"),
        v.literal("coming_soon"),
        v.literal("private"),
      ),
    ),
    estimatedDuration: v.optional(v.number()),

    // --- Media & Visual Assets (Convex File Storage) ---
    thumbnailId: v.optional(v.id("_storage")), // Course thumbnail/cover image
    bannerId: v.optional(v.id("_storage")), // Course banner image for headers
    introVideoId: v.optional(v.id("_storage")), // Course introduction video

    // --- Pricing & Monetization ---
    pricing: v.optional(
      v.object({
        isFree: v.boolean(),
        price: v.optional(v.number()),
        currency: v.optional(
          v.union(v.literal("EGP"), v.literal("USD"), v.literal("EUR")),
        ),
        discountPercentage: v.optional(v.number()),
        originalPrice: v.optional(v.number()),
        paymentType: v.optional(
          v.union(
            v.literal("one-time"),
            v.literal("subscription"),
            v.literal("per-module"),
          ),
        ),
      }),
    ),
    // Legacy price field for backward compatibility
    price: v.optional(v.number()),

    // --- Course Content Structure ---
    learningObjectives: v.optional(v.array(v.string())),
    prerequisites: v.optional(v.array(v.string())),
    targetAudience: v.optional(v.array(v.string())),
    skills: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
    language: v.optional(v.string()),
    format: v.optional(
      v.union(
        v.literal("self-paced"),
        v.literal("instructor-led"),
        v.literal("hybrid"),
        v.literal("live"),
      ),
    ),

    // --- Course Statistics & Analytics ---
    enrollmentCount: v.optional(v.number()),
    completionRate: v.optional(v.number()),
    averageRating: v.optional(v.number()),
    totalRatings: v.optional(v.number()),
    viewCount: v.optional(v.number()),

    // --- Author & Access Control ---
    authorId: v.id("users"), // The `_id` of the user (admin only) who created the course
    isPublic: v.optional(v.boolean()),
    isFeatured: v.optional(v.boolean()),

    // --- Standard System Fields ---
    updatedAt: v.number(),
    lastUpdated: v.optional(v.number()), // Alias for backward compatibility
    updatedBy: v.optional(v.string()), // Last user who updated the course
    createdBy: v.string(),
    deletedAt: v.optional(v.number()),
  })
    .index("by_author", ["authorId"])
    .index("by_category", ["category"])
    .index("by_difficulty", ["difficulty"])
    .index("by_status", ["status"])
    .index("by_featured", ["isFeatured"])
    .index("by_public", ["isPublic"])
    .index("by_language", ["language"])
    .index("by_format", ["format"])
    .index("by_created_by", ["createdBy"])
    .index("by_rating", ["averageRating"])
    .index("by_enrollment", ["enrollmentCount"])
    .index("by_status_category", ["status", "category"])
    .index("by_status_featured", ["status", "isFeatured"])
    .index("by_active", ["deletedAt"])
    .index("by_updated_at", ["updatedAt"]),

  modules: defineTable({
    // --- Core Module Details ---
    courseId: v.id("courses"),
    title: v.string(),
    description: v.optional(v.string()),
    order: v.number(), // The sequence of this module within the course
    orderIndex: v.optional(v.number()), // Alias for backward compatibility
    estimatedDuration: v.optional(v.number()), // Duration in minutes
    lessonCount: v.optional(v.number()), // Number of lessons in this module

    // --- Module Media Assets ---
    thumbnailId: v.optional(v.id("_storage")), // Module thumbnail

    // --- Module Completion Requirements ---
    completionRequirement: v.optional(
      v.union(
        v.literal("all-lessons"),
        v.literal("percentage"),
        v.literal("assessment"),
      ),
    ),
    requiredPercentage: v.optional(v.number()), // Required completion percentage (0-100)

    // --- Module Status & Visibility ---
    isPublished: v.optional(v.boolean()),
    isLocked: v.optional(v.boolean()),
    isRequired: v.optional(v.boolean()), // Whether module is required for completion

    // --- Standard System Fields ---
    updatedAt: v.number(),
    createdBy: v.string(),
    deletedAt: v.optional(v.number()),
  })
    .index("by_course", ["courseId"])
    .index("by_course_order", ["courseId", "order"])
    .index("by_published", ["isPublished"])
    .index("by_active", ["deletedAt"]),

  lessons: defineTable({
    // --- Core Lesson Details ---
    moduleId: v.id("modules"),
    courseId: v.id("courses"), // Added for direct course queries
    title: v.string(),
    description: v.optional(v.string()),
    order: v.number(), // The sequence of this lesson within the module
    orderIndex: v.optional(v.number()), // Alias for backward compatibility
    estimatedDuration: v.optional(v.number()), // Duration in minutes

    // --- Lesson Content (Union type for flexibility) ---
    content: v.union(
      v.string(), // Text content, markdown, or external URLs (YouTube, Vimeo, etc.)
      v.id("_storage"), // Convex file storage ID for uploaded videos/media
    ),
    contentType: v.union(
      v.literal("text"),
      v.literal("video"),
      v.literal("audio"),
      v.literal("interactive"),
      v.literal("quiz"),
      v.literal("assignment"),
      v.literal("live"),
      v.literal("external"), // For YouTube, Vimeo, etc.
      v.literal("file"), // For uploaded files
    ),

    // --- Additional Media Assets ---
    thumbnailId: v.optional(v.id("_storage")), // Lesson thumbnail

    // --- Lesson Resources & Attachments ---
    resources: v.optional(
      v.array(
        v.object({
          title: v.string(),
          url: v.optional(v.string()), // External link
          fileId: v.optional(v.id("_storage")), // Convex storage file
          type: v.union(
            v.literal("pdf"),
            v.literal("link"),
            v.literal("download"),
            v.literal("exercise"),
            v.literal("document"),
          ),
          fileSize: v.optional(v.string()),
        }),
      ),
    ),

    // --- Lesson Settings ---
    isPublished: v.optional(v.boolean()),
    isFree: v.optional(v.boolean()), // Allow free preview lessons
    isLocked: v.optional(v.boolean()),

    // --- Standard System Fields ---
    updatedAt: v.number(),
    createdBy: v.string(),
    deletedAt: v.optional(v.number()),
  })
    .index("by_module", ["moduleId"])
    .index("by_course", ["courseId"])
    .index("by_module_order", ["moduleId", "order"])
    .index("by_content_type", ["contentType"])
    .index("by_published", ["isPublished"])
    .index("by_free", ["isFree"])
    .index("by_active", ["deletedAt"]),

  // --- File Management & Media Storage ---

  fileMetadata: defineTable({
    // --- Core File Information ---
    storageId: v.id("_storage"), // Reference to Convex storage
    originalName: v.string(),
    contentType: v.string(), // MIME type
    fileSize: v.number(), // Size in bytes

    // --- File Classification ---
    category: v.union(
      v.literal("course-thumbnail"),
      v.literal("course-banner"),
      v.literal("course-intro-video"),
      v.literal("module-thumbnail"),
      v.literal("lesson-video"),
      v.literal("lesson-thumbnail"),
      v.literal("lesson-resource"),
      v.literal("user-avatar"),
      v.literal("other"),
    ),

    // --- Media-specific metadata ---
    duration: v.optional(v.number()), // For videos/audio in seconds
    dimensions: v.optional(
      v.object({
        width: v.number(),
        height: v.number(),
      }),
    ), // For images/videos

    // --- Access Control ---
    uploadedBy: v.string(), // Clerk user ID
    isPublic: v.optional(v.boolean()),

    // --- Usage Tracking ---
    usageCount: v.optional(v.number()), // How many times referenced
    lastAccessed: v.optional(v.number()),

    // --- Standard System Fields ---
    updatedAt: v.number(),
    createdBy: v.string(),
    deletedAt: v.optional(v.number()),
  })
    .index("by_storage_id", ["storageId"])
    .index("by_category", ["category"])
    .index("by_uploaded_by", ["uploadedBy"])
    .index("by_public", ["isPublic"])
    .index("by_content_type", ["contentType"])
    .index("by_active", ["deletedAt"]),

  // --- LMS User Progress & Enrollment ---

  enrollments: defineTable({
    // Core references
    userId: v.id("users"), // Student enrolled
    courseId: v.id("courses"), // Course enrolled in

    // Enrollment details
    enrolledAt: v.number(), // Enrollment timestamp
    createdAt: v.optional(v.number()), // Alias for backward compatibility
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("dropped"),
      v.literal("suspended"),
    ),

    // Progress summary
    progress: v.number(), // Overall course progress percentage
    lastAccessedAt: v.optional(v.number()), // Last lesson access
    completedAt: v.optional(v.number()), // Course completion timestamp

    // Payment tracking
    paymentStatus: v.union(
      v.literal("free"),
      v.literal("paid"),
      v.literal("pending"),
      v.literal("refunded"),
    ),
    paymentAmount: v.optional(v.number()),
    paymentCurrency: v.optional(v.string()),
    paymentId: v.optional(v.string()), // External payment reference

    // Standard System Fields
    createdBy: v.string(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_course", ["courseId"])
    .index("by_user_course", ["userId", "courseId"])
    .index("by_status", ["status"])
    .index("by_payment_status", ["paymentStatus"]),

  lessonProgress: defineTable({
    // Core references
    userId: v.id("users"),
    lessonId: v.id("lessons"),
    courseId: v.id("courses"),
    moduleId: v.id("modules"),

    // Progress details
    watchedDuration: v.number(), // Seconds watched (cumulative, handles seeking)
    totalDuration: v.number(), // Total lesson duration
    percentage: v.number(), // Completion percentage (0-100)
    isCompleted: v.boolean(), // Whether lesson is marked complete

    // Enhanced tracking
    maxWatchedPosition: v.number(), // Furthest point reached (prevents gaming)
    watchCount: v.number(), // Number of times lesson was started
    sessionDuration: v.number(), // Time spent in current session

    // Behavioral insights
    seekEvents: v.number(), // Number of seek/skip events
    pauseCount: v.number(), // Number of pause events
    playbackSpeed: v.optional(v.number()), // Last used playback speed

    // Timestamps
    firstWatchedAt: v.number(), // When user first started this lesson
    lastWatchedAt: v.number(), // Last activity timestamp
    completedAt: v.optional(v.number()), // Completion timestamp
    sessionStartedAt: v.number(), // Current session start time

    // Standard System Fields
    updatedAt: v.number(),
    createdBy: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_lesson", ["lessonId"])
    .index("by_course", ["courseId"])
    .index("by_module", ["moduleId"])
    .index("by_user_lesson", ["userId", "lessonId"]) // Primary lookup - ensure uniqueness
    .index("by_user_course", ["userId", "courseId"])
    .index("by_user_module", ["userId", "moduleId"])
    .index("by_completion_status", ["isCompleted", "completedAt"]) // Analytics queries
    .index("by_recent_activity", ["lastWatchedAt"]), // Recent activity tracking

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

  // --- Wallets: one per user per currency (meta only) ---
  wallets: defineTable({
    userId: v.id("users"),
    currency: Currency,
    balance: v.number(), // Stored in smallest unit (e.g., cents)
    isActive: v.boolean(),
    metadata: v.optional(v.any()),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_currency", ["userId", "currency"]),

  // --- Immutable ledger (append-only) ---
  transactions: defineTable({
    walletId: v.id("wallets"),
    amount: v.number(), // integer smallest unit (positive for credit, negative for debit)
    currency: v.union(v.literal("EGP"), v.literal("USD"), v.literal("EUR")),
    type: TransactionType,
    status: TransactionStatus,
    description: v.optional(v.string()),
    metadata: v.optional(v.any()),
    // Idempotency & reconciliation fields
    idempotencyKey: v.optional(v.string()), // platform-provided idempotency key
    relatedEntityType: v.optional(v.string()),
    relatedEntityId: v.optional(v.string()),
    createdAt: v.number(),
    createdBy: v.string()
  })
    .index("by_wallet", ["walletId"])
    .index("by_related", ["relatedEntityType", "relatedEntityId"])
    .index("by_idempotency_key", ["idempotencyKey"]),

  // --- Cached materialized balances for fast read & UI subscriptions ---
  walletBalances: defineTable({
    walletId: v.id("wallets"),
    currency: v.union(v.literal("EGP"), v.literal("USD"), v.literal("EUR")),
    balance: v.number(), // integer smallest unit
    lastTransactionAt: v.optional(v.number()),
    lastUpdated: v.number()
  }).index("by_wallet", ["walletId"]).index("by_user_currency", ["walletId", "currency"]),

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

  // --- Video Analytics & Learning Behavior ---

  videoAnalytics: defineTable({
    // Core event information
    userId: v.string(), // Clerk user ID
    lessonId: v.id("lessons"),
    courseId: v.id("courses"),
    moduleId: v.id("modules"),

    // Event details
    eventType: v.union(
      v.literal("video_play"),
      v.literal("video_pause"),
      v.literal("video_ended"),
      v.literal("video_error"),
      v.literal("progress_update"),
      v.literal("lesson_completed"),
      v.literal("video_seek"),
      v.literal("fullscreen_enter"),
      v.literal("fullscreen_exit"),
      v.literal("volume_change"),
      v.literal("playback_rate_change"),
    ),
    eventData: v.optional(v.any()), // Flexible data for different event types
    timestamp: v.number(),

    // Session tracking
    sessionId: v.string(),

    // Device and environment
    userAgent: v.optional(v.string()),
    deviceType: v.optional(v.string()), // "mobile", "tablet", "desktop"

    // Standard System Fields
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_lesson", ["lessonId"])
    .index("by_course", ["courseId"])
    .index("by_module", ["moduleId"])
    .index("by_event_type", ["eventType"])
    .index("by_session", ["sessionId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_user_lesson", ["userId", "lessonId"])
    .index("by_user_course", ["userId", "courseId"]),

  // --- Logging Service Tables ---

  adminLogs: defineTable({
    // Admin action tracking
    action: v.string(), // Action performed
    details: v.any(), // Action details and context
    userId: v.string(), // Admin user who performed the action
    timestamp: v.number(), // Action timestamp
    createdAt: v.number(), // Creation timestamp
  })
    .index("by_user", ["userId"])
    .index("by_action", ["action"])
    .index("by_timestamp", ["timestamp"]),

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
