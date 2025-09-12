/**
 * Example: User Initialization with Clerk Webhook
 *
 * This example demonstrates how to integrate the enterprise-grade
 * user initialization function with Clerk authentication webhooks.
 */

import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { fetchMutation } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";

// --- Environment Variables ---
const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET!;

// --- Types ---
interface ClerkUserEvent {
  type: "user.created" | "user.updated" | "user.deleted";
  data: {
    id: string;
    email_addresses: Array<{
      email_address: string;
      verification: { status: string };
    }>;
    first_name: string;
    last_name: string;
    image_url: string;
    created_at: number;
    updated_at: number;
  };
}

/**
 * Clerk Webhook Handler for User Events
 *
 * ENTERPRISE FEATURES:
 * - Webhook signature verification for security
 * - Comprehensive error handling and logging
 * - Idempotent user creation to prevent duplicates
 * - Multi-currency balance initialization
 * - Audit trail with timestamps
 *
 * @param request - Incoming webhook request from Clerk
 * @returns HTTP response indicating processing status
 */
export async function POST(request: NextRequest) {
  try {
    // --- Security: Verify Webhook Signature ---
    const payload = await request.text();
    const headersList = request.headers;

    const svixHeaders = {
      "svix-id": headersList.get("svix-id") ?? "",
      "svix-timestamp": headersList.get("svix-timestamp") ?? "",
      "svix-signature": headersList.get("svix-signature") ?? "",
    };

    const webhook = new Webhook(CLERK_WEBHOOK_SECRET);

    let event: ClerkUserEvent;
    try {
      event = webhook.verify(payload, svixHeaders) as ClerkUserEvent;
    } catch (error) {
      console.error("Webhook signature verification failed:", error);
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 },
      );
    }

    // --- Process User Creation Event ---
    if (event.type === "user.created") {
      const userData = event.data;

      // Extract primary email address
      const primaryEmail =
        userData.email_addresses.find(
          (email) => email.verification.status === "verified",
        ) || userData.email_addresses[0];

      if (!primaryEmail) {
        console.error("No email address found for user:", userData.id);
        return NextResponse.json(
          { error: "No valid email address" },
          { status: 400 },
        );
      }

      // Construct user name
      const userName =
        [userData.first_name, userData.last_name].filter(Boolean).join(" ") ||
        "User";

      // --- Initialize User in Convex Database ---
      try {
        const initResult = await fetchMutation(api.users.initializeUser, {
          clerkId: userData.id,
          email: primaryEmail.email_address,
          name: userName,
          avatarUrl: userData.image_url || undefined,
          // Default configuration for new users
          roles: ["user"], // Start with basic user role
          initialCurrency: "EGP", // Default to Egyptian Pound
          initialBalance: 0, // Start with zero balance
        });

        if (initResult.success) {
          console.log("User initialized successfully:", {
            userId: initResult.userId,
            clerkId: userData.id,
            email: primaryEmail.email_address,
            balanceCount: initResult.balances.length,
          });

          // Optional: Send welcome notification
          // await sendWelcomeNotification(initResult.userId);

          return NextResponse.json({
            success: true,
            message: "User initialized successfully",
            userId: initResult.userId,
          });
        } else {
          console.error("User initialization failed:", initResult.message);
          return NextResponse.json(
            { error: "Failed to initialize user" },
            { status: 500 },
          );
        }
      } catch (convexError) {
        console.error("Convex database error:", convexError);

        // Handle specific error cases
        if (convexError.message?.includes("already exists")) {
          // User already exists - this is OK for idempotency
          console.log("User already exists, skipping initialization");
          return NextResponse.json({
            success: true,
            message: "User already exists",
          });
        }

        return NextResponse.json(
          { error: "Database error during user creation" },
          { status: 500 },
        );
      }
    }

    // --- Process User Update Event ---
    else if (event.type === "user.updated") {
      // TODO: Handle user profile updates
      console.log("User updated event received:", event.data.id);

      return NextResponse.json({
        success: true,
        message: "User update processed",
      });
    }

    // --- Process User Deletion Event ---
    else if (event.type === "user.deleted") {
      // TODO: Handle user soft deletion
      console.log("User deleted event received:", event.data.id);

      return NextResponse.json({
        success: true,
        message: "User deletion processed",
      });
    }

    // --- Unknown Event Type ---
    else {
      console.log("Unknown event type received:", event.type);
      return NextResponse.json({
        success: true,
        message: "Event type not handled",
      });
    }
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * Alternative: Direct User Creation Example
 *
 * This example shows how to create a user directly
 * without webhooks, useful for testing or admin functions.
 */
export async function createUserExample() {
  try {
    // Example 1: Basic user creation
    const basicUser = await fetchMutation(api.users.initializeUser, {
      clerkId: "clerk_example_123",
      email: "john.doe@example.com",
      name: "John Doe",
    });

    console.log("Basic user created:", basicUser);

    // Example 2: Advanced user creation with custom settings
    const advancedUser = await fetchMutation(api.users.initializeUser, {
      clerkId: "clerk_example_456",
      email: "jane.smith@example.com",
      name: "Jane Smith",
      avatarUrl: "https://example.com/avatars/jane.jpg",
      roles: ["freelancer", "user"],
      initialCurrency: "USD",
      initialBalance: 1000,
    });

    console.log("Advanced user created:", advancedUser);

    // Example 3: Get user information
    const userInfo = await fetchMutation(api.users.getUserByClerkId, {
      clerkId: "clerk_example_123",
    });

    if (userInfo) {
      console.log("User profile:", {
        name: userInfo.name,
        email: userInfo.email,
        roles: userInfo.roles,
        balanceCount: userInfo.balances.length,
        profileCompleteness: userInfo.profile?.completeness,
      });
    }

    // Example 4: Update user information
    const updateResult = await fetchMutation(api.users.updateUser, {
      userId: basicUser.userId,
      name: "John D. Doe",
      roles: ["client", "user"],
    });

    console.log("User update result:", updateResult);
  } catch (error) {
    console.error("User creation example failed:", error);
  }
}

/**
 * Advanced Usage: Batch User Operations
 *
 * Example of handling multiple user operations efficiently
 */
export async function batchUserOperationsExample() {
  const userDataList = [
    {
      clerkId: "clerk_batch_001",
      email: "user1@example.com",
      name: "User One",
      roles: ["freelancer"] as const,
      initialCurrency: "EGP" as const,
    },
    {
      clerkId: "clerk_batch_002",
      email: "user2@example.com",
      name: "User Two",
      roles: ["client"] as const,
      initialCurrency: "USD" as const,
    },
    {
      clerkId: "clerk_batch_003",
      email: "user3@example.com",
      name: "User Three",
      roles: ["admin", "user"] as const,
      initialCurrency: "EUR" as const,
    },
  ];

  try {
    // Create users concurrently for better performance
    const creationPromises = userDataList.map((userData) =>
      fetchMutation(api.users.initializeUser, userData),
    );

    const results = await Promise.allSettled(creationPromises);

    // Process results
    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        console.log(
          `User ${index + 1} created successfully:`,
          result.value.userId,
        );
      } else {
        console.error(`User ${index + 1} creation failed:`, result.reason);
      }
    });

    // Get statistics after batch creation
    const stats = await fetchMutation(api.users.getUserStatistics, {});
    console.log("Updated user statistics:", stats);
  } catch (error) {
    console.error("Batch user operations failed:", error);
  }
}

/**
 * Testing Helper: Create Mock Users
 *
 * Utility function for creating test users in development
 */
export async function createMockUsersForTesting() {
  const mockUsers = [
    {
      clerkId: "clerk_mock_freelancer",
      email: "freelancer@test.com",
      name: "Test Freelancer",
      roles: ["freelancer", "user"] as const,
      initialCurrency: "USD" as const,
      initialBalance: 500,
    },
    {
      clerkId: "clerk_mock_client",
      email: "client@test.com",
      name: "Test Client",
      roles: ["client", "user"] as const,
      initialCurrency: "EGP" as const,
      initialBalance: 1000,
    },
    {
      clerkId: "clerk_mock_admin",
      email: "admin@test.com",
      name: "Test Admin",
      roles: ["admin", "moderator", "user"] as const,
      initialCurrency: "EUR" as const,
      initialBalance: 0,
    },
  ];

  console.log("Creating mock users for testing...");

  for (const userData of mockUsers) {
    try {
      const result = await fetchMutation(api.users.initializeUser, userData);
      console.log(`✅ Created ${userData.name} (${result.userId})`);
    } catch (error) {
      console.error(`❌ Failed to create ${userData.name}:`, error);
    }
  }

  console.log("Mock user creation completed");
}

/**
 * Error Handling Example
 *
 * Demonstrates proper error handling patterns
 */
export async function errorHandlingExample() {
  try {
    // This will fail due to duplicate Clerk ID
    await fetchMutation(api.users.initializeUser, {
      clerkId: "clerk_duplicate_test",
      email: "first@example.com",
      name: "First User",
    });

    // Second attempt with same Clerk ID should fail
    await fetchMutation(api.users.initializeUser, {
      clerkId: "clerk_duplicate_test", // Same ID
      email: "second@example.com",
      name: "Second User",
    });
  } catch (error) {
    if (error.message?.includes("already exists")) {
      console.log("✅ Duplicate prevention working correctly");
    } else {
      console.error("❌ Unexpected error:", error);
    }
  }

  try {
    // This will fail due to invalid email
    await fetchMutation(api.users.initializeUser, {
      clerkId: "clerk_invalid_email_test",
      email: "not-an-email",
      name: "Invalid Email User",
    });
  } catch (error) {
    if (error.message?.includes("Invalid email format")) {
      console.log("✅ Email validation working correctly");
    } else {
      console.error("❌ Unexpected error:", error);
    }
  }
}

// Export handler for Next.js API route
export { POST as default };

// Export examples for development use
export {
  createUserExample,
  batchUserOperationsExample,
  createMockUsersForTesting,
  errorHandlingExample,
};
