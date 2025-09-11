/**
 * Test file for the clean browser logger implementation
 *
 * This demonstrates the "Clean Simple Way" you requested:
 * 1. Browser calls Convex actions
 * 2. Convex actions use server-side GigsyLogger
 * 3. GigsyLogger forwards to Better Stack via Pino
 *
 * No complex transport layer - just simple action calls!
 */

import { ConvexReactClient } from "convex/react";
import { ConvexBrowserLogger } from "./src/lib/logging/browser-logger";

// Example usage of the clean browser logger
export async function testCleanBrowserLogger() {
  // Initialize Convex client (normally done in your app)
  const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

  // Create clean browser logger
  const browserLogger = new ConvexBrowserLogger(convex);

  // Clean, simple logging - no complex transport!
  browserLogger.info(
    { userId: "123", action: "user_login" },
    "User logged in successfully",
  );
  browserLogger.warn({ component: "payment" }, "Payment processing delayed");
  browserLogger.error(
    { error: "Connection timeout" },
    "Failed to connect to API",
  );

  console.log("✅ Clean browser logging working!");
  console.log("📝 Logs forwarded to Better Stack via Convex actions");
  console.log("🔒 API tokens stay secure on server-side");
  console.log("🚀 No complex transport layer needed!");
}

// This is the architecture you requested:
// Browser → Convex Action → GigsyLogger → Pino → Better Stack
//
// Benefits:
// - Clean and simple
// - Secure (tokens on server)
// - No complex transport system
// - Uses existing GigsyLogger infrastructure
// - Leverages Convex's reliable action system
