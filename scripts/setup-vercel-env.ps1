# Vercel Environment Variables Setup Script (PowerShell)
# Run this script to quickly add all required environment variables to your Vercel project

Write-Host "🚀 Setting up Vercel environment variables for Gigsy project..." -ForegroundColor Green
Write-Host "Make sure you're logged in to Vercel CLI (run 'vercel login' if needed)" -ForegroundColor Yellow
Write-Host ""

# Better Stack Configuration
Write-Host "📊 Adding Better Stack logging configuration..." -ForegroundColor Cyan
"CPC3vJYL5W5t8KQUeHv9niNG" | vercel env add BETTER_STACK_SOURCE_TOKEN production
"CPC3vJYL5W5t8KQUeHv9niNG" | vercel env add NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN production
"https://s1515829.eu-nbg-2.betterstackdata.com" | vercel env add NEXT_PUBLIC_BETTER_STACK_INGESTING_URL production

# Clerk Authentication
Write-Host "🔐 Adding Clerk authentication configuration..." -ForegroundColor Cyan
"pk_test_c3VpdGVkLWNyb3ctNTkuY2xlcmsuYWNjb3VudHMuZGV2JA" | vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production
"sk_test_KMpJEs6oxJO26yM4VxnxTbAeF3e6ak0RljrZ2VMXgB" | vercel env add CLERK_SECRET_KEY production
"https://suited-crow-59.clerk.accounts.dev" | vercel env add NEXT_PUBLIC_CLERK_FRONTEND_API_URL production
"https://suited-crow-59.clerk.accounts.dev/.well-known/jwks.json" | vercel env add CLERK_JWKS_Endpoint production
"/sign-in" | vercel env add NEXT_PUBLIC_CLERK_SIGN_IN_URL production
"/sign-up" | vercel env add NEXT_PUBLIC_CLERK_SIGN_UP_URL production
"/" | vercel env add NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL production
"/" | vercel env add NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL production

# Sentry Configuration
Write-Host "🐛 Adding Sentry error monitoring configuration..." -ForegroundColor Cyan
"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" | vercel env add SENTRY_AUTH_TOKEN production
"goalrise" | vercel env add SENTRY_ORG production
"gigsy_digitopia2025" | vercel env add SENTRY_PROJECT production

# Application Configuration
Write-Host "⚙️ Adding application configuration..." -ForegroundColor Cyan
"info" | vercel env add LOG_LEVEL production
"gigsy" | vercel env add APP_NAME production
"1.0.0" | vercel env add APP_VERSION production

Write-Host ""
Write-Host "✅ All environment variables have been added to Vercel!" -ForegroundColor Green
Write-Host "🔄 Don't forget to redeploy your application for changes to take effect:" -ForegroundColor Yellow
Write-Host "   git push origin main" -ForegroundColor White
Write-Host ""
Write-Host "🔍 You can verify the variables in your Vercel dashboard at:" -ForegroundColor Yellow
Write-Host "   https://vercel.com/dashboard → Your Project → Settings → Environment Variables" -ForegroundColor White
