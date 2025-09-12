#!/bin/bash

# Vercel Environment Variables Setup Script
# Run this script to quickly add all required environment variables to your Vercel project

echo "🚀 Setting up Vercel environment variables for Gigsy project..."
echo "Make sure you're logged in to Vercel CLI (run 'vercel login' if needed)"
echo ""

# Better Stack Configuration
echo "📊 Adding Better Stack logging configuration..."
echo "CPC3vJYL5W5t8KQUeHv9niNG" | vercel env add BETTER_STACK_SOURCE_TOKEN production
echo "CPC3vJYL5W5t8KQUeHv9niNG" | vercel env add NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN production
echo "https://s1515829.eu-nbg-2.betterstackdata.com" | vercel env add NEXT_PUBLIC_BETTER_STACK_INGESTING_URL production

# Clerk Authentication
echo "🔐 Adding Clerk authentication configuration..."
echo "pk_test_c3VpdGVkLWNyb3ctNTkuY2xlcmsuYWNjb3VudHMuZGV2JA" | vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production
echo "sk_test_KMpJEs6oxJO26yM4VxnxTbAeF3e6ak0RljrZ2VMXgB" | vercel env add CLERK_SECRET_KEY production
echo "https://suited-crow-59.clerk.accounts.dev" | vercel env add NEXT_PUBLIC_CLERK_FRONTEND_API_URL production
echo "https://suited-crow-59.clerk.accounts.dev/.well-known/jwks.json" | vercel env add CLERK_JWKS_Endpoint production
echo "/sign-in" | vercel env add NEXT_PUBLIC_CLERK_SIGN_IN_URL production
echo "/sign-up" | vercel env add NEXT_PUBLIC_CLERK_SIGN_UP_URL production
echo "/" | vercel env add NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL production
echo "/" | vercel env add NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL production

# Sentry Configuration
echo "🐛 Adding Sentry error monitoring configuration..."
echo "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" | vercel env add SENTRY_AUTH_TOKEN production
echo "goalrise" | vercel env add SENTRY_ORG production
echo "gigsy_digitopia2025" | vercel env add SENTRY_PROJECT production

# Application Configuration
echo "⚙️ Adding application configuration..."
echo "info" | vercel env add LOG_LEVEL production
echo "gigsy" | vercel env add APP_NAME production
echo "1.0.0" | vercel env add APP_VERSION production

echo ""
echo "✅ All environment variables have been added to Vercel!"
echo "🔄 Don't forget to redeploy your application for changes to take effect:"
echo "   git push origin main"
echo ""
echo "🔍 You can verify the variables in your Vercel dashboard at:"
echo "   https://vercel.com/dashboard → Your Project → Settings → Environment Variables"
