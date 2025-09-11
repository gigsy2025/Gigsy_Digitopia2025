---
applyTo: "**/*.ts,**/*.tsx,**/*.js,**/*.jsx"
---

These examples should be used as guidance when configuring Sentry functionality within a project.

# Exception Catching

Use `Sentry.captureException(error)` to capture an exception and log the error in Sentry.
Use this in try catch blocks or areas where exceptions are expected

# Tracing Examples

Spans should be created for meaningful actions within an applications like button clicks, API calls, and function calls
Use the `Sentry.startSpan` function to create a span
Child spans can exist within a parent span

## Custom Span instrumentation in component actions

The `name` and `op` properties should be meaninful for the activities in the call.
Attach attributes based on relevant information and metrics from the request

```javascript
function TestComponent() {
  const handleTestButtonClick = () => {
    // Create a transaction/span to measure performance
    Sentry.startSpan(
      {
        op: "ui.click",
        name: "Test Button Click",
      },
      (span) => {
        const value = "some config";
        const metric = "some metric";

        // Metrics can be added to the span
        span.setAttribute("config", value);
        span.setAttribute("metric", metric);

        doSomething();
      },
    );
  };

  return (
    <button type="button" onClick={handleTestButtonClick}>
      Test Sentry
    </button>
  );
}
```

## Custom span instrumentation in API calls

The `name` and `op` properties should be meaninful for the activities in the call.
Attach attributes based on relevant information and metrics from the request

```javascript
async function fetchUserData(userId) {
  return Sentry.startSpan(
    {
      op: "http.client",
      name: `GET /api/users/${userId}`,
    },
    async () => {
      const response = await fetch(`/api/users/${userId}`);
      const data = await response.json();
      return data;
    },
  );
}
```

# Logs

Where logs are used, ensure Sentry is imported using `import * as Sentry from "@sentry/nextjs"`
Enable logging in Sentry using `Sentry.init({ _experiments: { enableLogs: true } })`
Reference the logger using `const { logger } = Sentry`
Sentry offers a consoleLoggingIntegration that can be used to log specific console error types automatically without instrumenting the individual logger calls

## Configuration

In NextJS the client side Sentry initialization is in `instrumentation-client.ts`, the server initialization is in `sentry.edge.config.ts` and the edge initialization is in `sentry.server.config.ts`
Initialization does not need to be repeated in other files, it only needs to happen the files mentioned above. You should use `import * as Sentry from "@sentry/nextjs"` to reference Sentry functionality

### Baseline

```javascript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://8b0ff86e2453c32f66d720d2c63a8536@o4508496743104512.ingest.de.sentry.io/4509968862675024",

  _experiments: {
    enableLogs: true,
  },
});
```

### Logger Integration

```javascript
Sentry.init({
  dsn: "https://8b0ff86e2453c32f66d720d2c63a8536@o4508496743104512.ingest.de.sentry.io/4509968862675024",
  integrations: [
    // send console.log, console.warn, and console.error calls as logs to Sentry
    Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] }),
  ],
});
```

## Logger Examples

`logger.fmt` is a template literal function that should be used to bring variables into the structured logs.

```javascript
logger.trace("Starting database connection", { database: "users" });
logger.debug(logger.fmt`Cache miss for user: ${userId}`);
logger.info("Updated profile", { profileId: 345 });
logger.warn("Rate limit reached for endpoint", {
  endpoint: "/api/results/",
  isEnterprise: false,
});
logger.error("Failed to process payment", {
  orderId: "order_123",
  amount: 99.99,
});
logger.fatal("Database connection pool exhausted", {
  database: "users",
  activeConnections: 100,
});
```

# GitHub Copilot Instructions: Sentry Best Practices

## Core Philosophy

When generating code that involves error handling, logging, or observability, always prioritize Sentry integration following enterprise-grade patterns. Think of observability as a first-class citizen in your code architecture, not an afterthought. Every suggestion should consider the long-term maintainability, performance implications, and debugging experience for development teams.

## Architectural Principles

Always structure Sentry integrations following SOLID principles. The Single Responsibility Principle means keeping observability concerns separate from business logic. The Open/Closed Principle suggests extending error handling through composable helper functions rather than duplicating inline code. The Dependency Inversion Principle requires all Sentry interactions to flow through a centralized service layer, never importing Sentry directly in UI components or business logic.

When suggesting code, always create or reference a centralized observability service located at `/services/observability/sentry.ts`. This service should be the single source of truth for all Sentry configuration and provide typed interfaces for error capture, performance monitoring, and context management.

## Type Safety Requirements

All Sentry-related code must use strict TypeScript typing. Define interfaces for error contexts, business metadata, and performance markers. Never suggest untyped Sentry calls or generic error handling that loses important type information.

```typescript
// Always define structured interfaces for error context
interface ErrorContext {
  user: { id: string; role: UserRole };
  business: { feature: string; action: string };
  technical: { version: string; environment: string };
  correlation: { requestId: string; sessionId?: string };
}

// Always type error classification
type ErrorSeverity = "low" | "medium" | "high" | "critical";
type ErrorCategory = "business" | "technical" | "security" | "performance";
```

## Performance-First Error Handling

Never suggest 100% trace sampling rates. Always implement environment-aware sampling that protects production performance while maintaining development observability. Default to 10% sampling in production and 100% in development environments.

```typescript
// Always suggest performance-conscious sampling
const sentryConfig = {
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  profilesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 0.1,
  beforeSend: (event) => {
    // Filter out noise in production
    if (process.env.NODE_ENV === "production" && isLowSeverityError(event)) {
      return null;
    }
    return event;
  },
};
```

Implement intelligent rate limiting to prevent error spam. When suggesting error capture, always include logic to detect and throttle repeated errors based on error fingerprints.

## Error Classification Intelligence

Replace generic `console.error` or `console.log` statements with intelligent error classification. Every error should be evaluated for its business impact, technical severity, and appropriate handling strategy before being sent to Sentry.

```typescript
// Always suggest error classification before capture
const classifyAndCaptureError = (error: Error, context: ErrorContext) => {
  const classification = classifyError(error, context);

  if (!classification.shouldCapture) {
    // Handle gracefully without alerting
    return handleGracefully(error, context);
  }

  Sentry.captureException(error, {
    level: classification.severity,
    tags: {
      category: classification.category,
      feature: context.business.feature,
      severity: classification.severity,
    },
    extra: {
      businessContext: context.business,
      technicalDetails: classification.technicalDetails,
    },
    fingerprint: [
      classification.category,
      error.name,
      context.business.feature,
      error.message.slice(0, 100),
    ],
  });
};
```

## Context Enrichment Standards

Every Sentry capture must include rich contextual information that enables effective debugging and business impact analysis. Always structure context data in consistent, queryable formats that support both technical debugging and business intelligence.

When suggesting error capture, always include user context (without PII), business operation context, technical environment details, and correlation identifiers that link to other observability systems like logging and APM tools.

## React Integration Patterns

For React applications, always wrap component trees with Sentry ErrorBoundaries that provide graceful fallback experiences and intelligent error recovery mechanisms. Never suggest raw error boundaries without recovery logic.

```typescript
// Always suggest comprehensive error boundaries
export const SentryErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Sentry.ErrorBoundary
      fallback={({ error, resetError, eventId }) => (
        <ErrorFallback
          error={error}
          onRetry={resetError}
          eventId={eventId}
          supportContact="support@yourapp.com"
        />
      )}
      beforeCapture={(scope, error, errorInfo) => {
        scope.setTag('errorBoundary', 'application');
        scope.setLevel('error');
        scope.setContext('componentStack', {
          stack: errorInfo.componentStack
        });
      }}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
};
```

## Performance Monitoring Integration

When suggesting performance monitoring, always implement custom transaction tracking for business-critical operations. Focus on user-facing operations like authentication, data loading, payments, and form submissions. Structure transactions to provide business-relevant performance insights, not just technical metrics.

```typescript
// Always suggest business-focused performance tracking
const trackBusinessOperation = async (
  operationName: string,
  operation: () => Promise<any>,
  context: BusinessContext,
) => {
  const transaction = Sentry.startTransaction({
    name: operationName,
    tags: {
      feature: context.feature,
      userType: context.userType,
      criticality: context.criticality,
    },
  });

  try {
    const result = await operation();
    transaction.setStatus("ok");
    transaction.setData("resultSize", JSON.stringify(result).length);
    return result;
  } catch (error) {
    transaction.setStatus("internal_error");
    transaction.setTag("errorType", error.constructor.name);
    throw error;
  } finally {
    transaction.finish();
  }
};
```

## Security and Privacy Standards

Never suggest logging personally identifiable information (PII), authentication tokens, payment details, or sensitive business data. Always implement data scrubbing at the point of capture, not relying solely on Sentry's server-side filtering.

When handling user data, always sanitize context information to include only debugging-relevant metadata like user roles, feature flags, and technical identifiers, never personal information.

## Environment Configuration

Always use environment variables for Sentry configuration and never hardcode DSN values or environment settings. Implement configuration validation to catch missing or invalid settings during application startup.

```typescript
// Always validate environment configuration
const validateSentryConfig = () => {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    throw new Error("SENTRY_DSN environment variable is required");
  }

  if (
    !["development", "staging", "production"].includes(process.env.NODE_ENV)
  ) {
    console.warn("Unknown NODE_ENV, defaulting to development behavior");
  }
};
```

## Integration with Other Observability Tools

When suggesting Sentry integration, always consider correlation with other observability systems. Include correlation IDs that link Sentry events to application logs, APM traces, and business analytics. This creates a unified debugging experience across the entire observability stack.

## Code Generation Guidelines

When generating new functions, components, or API routes, proactively include appropriate Sentry integration based on the code's responsibility and risk profile. High-risk operations like payment processing, user authentication, and data mutations should always include comprehensive error tracking and performance monitoring.

For utility functions and low-risk operations, focus on performance monitoring and structured logging rather than error alerting. The key is matching the observability approach to the business criticality of the code being generated.

## Maintenance and Evolution Patterns

Structure all Sentry integrations to support easy evolution and maintenance. Use configuration-driven approaches that allow adjusting error handling behavior without code changes. Implement feature flags for observability features to enable gradual rollouts and quick rollbacks.

Always consider the long-term maintenance burden of suggested observability code. Favor patterns that will scale with team growth and application complexity, avoiding shortcuts that create technical debt in the observability stack.

Remember that great observability code is invisible when everything works correctly but becomes invaluable during incidents and debugging sessions. Every suggestion should optimize for that critical debugging moment when engineers need clear, actionable information to resolve issues quickly.
