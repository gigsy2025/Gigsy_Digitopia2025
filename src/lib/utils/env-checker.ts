/**
 * ENVIRONMENT VARIABLES CHECKER
 *
 * Utility to check if all required environment variables are properly configured
 * Useful for debugging deployment issues.
 */

export function checkEnvironmentVariables() {
  const isClientSide = typeof window !== "undefined";
  const results = {
    environment: process.env.NODE_ENV,
    isClientSide,
    timestamp: new Date().toISOString(),
    requiredVars: {} as Record<
      string,
      { found: boolean; value?: string; type: string }
    >,
    recommendations: [] as string[],
  };

  // Define required environment variables
  const requiredVars = [
    // Better Stack
    { name: "BETTER_STACK_SOURCE_TOKEN", type: "server", required: true },
    {
      name: "NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN",
      type: "client",
      required: true,
    },
    {
      name: "NEXT_PUBLIC_BETTER_STACK_INGESTING_URL",
      type: "client",
      required: true,
    },

    // Clerk
    {
      name: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
      type: "client",
      required: true,
    },
    { name: "CLERK_SECRET_KEY", type: "server", required: true },
    {
      name: "NEXT_PUBLIC_CLERK_FRONTEND_API_URL",
      type: "client",
      required: true,
    },

    // Sentry
    { name: "SENTRY_AUTH_TOKEN", type: "server", required: false },
    { name: "SENTRY_ORG", type: "server", required: false },
    { name: "SENTRY_PROJECT", type: "server", required: false },

    // Application
    { name: "LOG_LEVEL", type: "server", required: false },
    { name: "APP_NAME", type: "server", required: false },
    { name: "APP_VERSION", type: "server", required: false },

    // Sampling Configuration
    { name: "ENABLE_LOG_SAMPLING", type: "server", required: false },
    { name: "LOG_SAMPLING_RATE", type: "server", required: false },
  ];

  // Check each variable
  for (const variable of requiredVars) {
    const value = process.env[variable.name];
    const found = !!value;

    results.requiredVars[variable.name] = {
      found,
      value: found ? `${value.substring(0, 8)}...` : undefined,
      type: variable.type,
    };

    // Add recommendations for missing required variables
    if (!found && variable.required) {
      if (isClientSide && variable.type === "client") {
        results.recommendations.push(
          `Missing required client-side variable: ${variable.name}`,
        );
      } else if (!isClientSide && variable.type === "server") {
        results.recommendations.push(
          `Missing required server-side variable: ${variable.name}`,
        );
      }
    }
  }

  // Environment-specific recommendations
  if (process.env.NODE_ENV === "production") {
    const betterStackVar = results.requiredVars.BETTER_STACK_SOURCE_TOKEN;
    const clerkSecretVar = results.requiredVars.CLERK_SECRET_KEY;

    if (betterStackVar && !betterStackVar.found) {
      results.recommendations.push(
        "🚨 PRODUCTION: Better Stack logging will not work without BETTER_STACK_SOURCE_TOKEN",
      );
    }
    if (clerkSecretVar && !clerkSecretVar.found) {
      results.recommendations.push(
        "🚨 PRODUCTION: Authentication will not work without CLERK_SECRET_KEY",
      );
    }
  }

  return results;
}

/**
 * Log environment variable status for debugging
 */
export function debugEnvironmentVariables() {
  const results = checkEnvironmentVariables();

  console.group("🔍 Environment Variables Debug Report");
  console.log("Environment:", results.environment);
  console.log("Context:", results.isClientSide ? "Client-side" : "Server-side");
  console.log("Timestamp:", results.timestamp);

  console.group("📋 Variable Status");
  for (const [name, details] of Object.entries(results.requiredVars)) {
    const status = details.found ? "✅" : "❌";
    const context = details.type === "client" ? "CLIENT" : "SERVER";
    console.log(
      `${status} [${context}] ${name}:`,
      details.found ? details.value : "NOT FOUND",
    );
  }
  console.groupEnd();

  if (results.recommendations.length > 0) {
    console.group("⚠️ Recommendations");
    results.recommendations.forEach((rec) => console.warn(rec));
    console.groupEnd();
  } else {
    console.log("✅ All required environment variables are configured!");
  }

  console.groupEnd();

  return results;
}

/**
 * Simple health check for critical environment variables
 */
export function isEnvironmentHealthy(): boolean {
  const results = checkEnvironmentVariables();
  return results.recommendations.length === 0;
}
