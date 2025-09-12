# VERCEL DEPLOYMENT ENVIRONMENT VARIABLES
# Copy these to your Vercel dashboard or use `vercel env add`

# =============================================================================
# REQUIRED: Better Stack Logging Configuration
# =============================================================================
BETTER_STACK_SOURCE_TOKEN=CPC3vJYL5W5t8KQUeHv9niNG
NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN=CPC3vJYL5W5t8KQUeHv9niNG
NEXT_PUBLIC_BETTER_STACK_INGESTING_URL=https://s1515829.eu-nbg-2.betterstackdata.com

# =============================================================================
# REQUIRED: Clerk Authentication
# =============================================================================
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_c3VpdGVkLWNyb3ctNTkuY2xlcmsuYWNjb3VudHMuZGV2JA
CLERK_SECRET_KEY=sk_test_KMpJEs6oxJO26yM4VxnxTbAeF3e6ak0RljrZ2VMXgB
NEXT_PUBLIC_CLERK_FRONTEND_API_URL=https://suited-crow-59.clerk.accounts.dev
CLERK_JWKS_Endpoint=https://suited-crow-59.clerk.accounts.dev/.well-known/jwks.json
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/

# =============================================================================
# REQUIRED: Sentry Error Monitoring
# =============================================================================
SENTRY_AUTH_TOKEN=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
SENTRY_ORG=goalrise
SENTRY_PROJECT=gigsy_digitopia2025

# =============================================================================
# APPLICATION CONFIGURATION
# =============================================================================
LOG_LEVEL=info
APP_NAME=gigsy
APP_VERSION=1.0.0
NODE_ENV=production
