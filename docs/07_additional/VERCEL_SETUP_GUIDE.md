# 🚀 Vercel Deployment Environment Setup Guide

## Problem: Better Stack Token Missing in Production

The error `[LOGGING DEBUG] No Better Stack token found` occurs because Vercel deployments don't automatically inherit your local `.env` file. You need to configure environment variables directly in Vercel.

## 🔧 Solution: Configure Vercel Environment Variables

### Method 1: Using Vercel Dashboard (Recommended)

1. **Go to your Vercel dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)
2. **Select your project**: `Gigsy_Digitopia2025`
3. **Go to Settings → Environment Variables**
4. **Add each variable individually**:

#### Required Environment Variables:

```bash
# Better Stack Logging
BETTER_STACK_SOURCE_TOKEN=CPC3vJYL5W5t8KQUeHv9niNG
NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN=CPC3vJYL5W5t8KQUeHv9niNG
NEXT_PUBLIC_BETTER_STACK_INGESTING_URL=https://s1515829.eu-nbg-2.betterstackdata.com

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_c3VpdGVkLWNyb3ctNTkuY2xlcmsuYWNjb3VudHMuZGV2JA
CLERK_SECRET_KEY=sk_test_KMpJEs6oxJO26yM4VxnxTbAeF3e6ak0RljrZ2VMXgB
NEXT_PUBLIC_CLERK_FRONTEND_API_URL=https://suited-crow-59.clerk.accounts.dev
CLERK_JWKS_Endpoint=https://suited-crow-59.clerk.accounts.dev/.well-known/jwks.json
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/

# Sentry Error Monitoring
SENTRY_AUTH_TOKEN=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
SENTRY_ORG=goalrise
SENTRY_PROJECT=gigsy_digitopia2025

# Application Configuration
LOG_LEVEL=info
APP_NAME=gigsy
APP_VERSION=1.0.0
```

### Method 2: Using Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Add environment variables (run each command)
vercel env add BETTER_STACK_SOURCE_TOKEN
vercel env add NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN
vercel env add NEXT_PUBLIC_BETTER_STACK_INGESTING_URL
# ... continue for all variables
```

## 🔍 Debug Information Added

The logging service now includes enhanced debugging to help identify environment variable issues:

- **Client-side debugging**: Shows available environment variables and token status
- **Server-side debugging**: Shows both private and public token availability
- **Environment context**: Displays Node.js environment and platform information

## ✅ Verification Steps

After adding environment variables to Vercel:

1. **Redeploy your application**:
   ```bash
   git push origin main
   ```

2. **Check deployment logs** in Vercel dashboard for debug messages

3. **Expected log output** after fix:
   ```
   [LOGGING DEBUG] Client-side token check: { found: true, length: 24, prefix: "CPC3vJYL" }
   [LOGGING DEBUG] Initializing Better Stack with token: CPC3vJYL...
   [LOGGING DEBUG] Using custom endpoint: https://s1515829.eu-nbg-2.betterstackdata.com
   ```

## 🚨 Important Notes

### Environment Variable Types in Vercel:

- **`NEXT_PUBLIC_*`**: Available in browser (client-side)
- **Regular variables**: Only available server-side
- **All environments**: Make sure to set for Production, Preview, and Development

### Security Considerations:

- **Never commit** sensitive tokens to git
- **Use `NEXT_PUBLIC_*`** only for non-sensitive configuration
- **Keep private keys** (like `CLERK_SECRET_KEY`) as server-only variables

## 🎯 Expected Results

After properly configuring environment variables in Vercel:

- ✅ Logging service will initialize successfully
- ✅ Better Stack token will be found and authenticated
- ✅ Logs will be sent to Better Stack dashboard
- ✅ No more "No Better Stack token found" errors

## 📞 Troubleshooting

If you still see issues after setting environment variables:

1. **Check variable names** - they must match exactly (case-sensitive)
2. **Verify deployment** - changes require a new deployment to take effect
3. **Check Function Logs** in Vercel dashboard for detailed error messages
4. **Test locally** with production environment variables

The enhanced debugging will now show exactly which environment variables are available and help identify any remaining configuration issues.
