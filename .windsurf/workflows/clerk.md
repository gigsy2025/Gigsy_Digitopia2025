---
description: clerk
auto_execution_mode: 1
---

---
applyTo: "**/*.ts,**/*.tsx,**/*.js,**/*.jsx"
---

# 🔐 Copilot Instructions for Clerk Integration (Gigsy Frontend)

## 📌 General Principles

- Always use **TypeScript** with strict typing for Clerk.
- Default to **Next.js Server Components**. Use `"use client"` only where Clerk React hooks are required (`useUser`, `useSession`, etc.).
- All authentication logic must be isolated in **/features/auth/** or **/services/auth/**, never inside UI primitives.
- Follow **SOLID principles** to keep auth logic clean, testable, and maintainable.
- Read and follow **Clerk's official best practices** for security and performance: https://clerk.com/docs/

---

## 🔑 Clerk Best Practices

### Authentication & Sessions

- Always use **ClerkProvider** at the root (`app/layout.tsx`) and wrap the app.
- Use **`<SignedIn>` / `<SignedOut>` wrappers** to render conditional UI instead of manual checks.
- Use **`useUser` hook** only in **client components** when user profile data is required.
- Always prefer **server-side session validation** with `auth()` from `@clerk/nextjs/server` in server actions, API routes, and middleware.

### Middleware

- Use **Clerk middleware** (`middleware.ts`) to protect routes, redirect unauthorized users, and enforce role-based access.
- Always define **public routes** vs. **protected routes** explicitly in `matcher`.

### Role & RBAC

- Store roles in Clerk metadata (`publicMetadata` or `privateMetadata`).
- Never hardcode roles in UI. Use a **helper function** (`getUserRole(user)`) from `/services/auth/roleUtils.ts`.

### Social Logins & Security

- Enable social providers via Clerk Dashboard, not hardcoded config.
- Use **multi-factor authentication** where required.
- Always handle **webhooks** from Clerk in a secure, idempotent API route (`/api/webhooks/clerk`).

---

## ⚡ Performance & Scalability

- Use **SSR** for protected pages (`getUser` in server components) to avoid hydration flicker.
- Cache non-sensitive Clerk calls (e.g., avatars, public metadata) with SWR or React Query.
- For real-time user state (typing indicators, presence), combine Clerk auth with **Convex or WebSockets**.

---

## 🛠 Code Organization

- **/features/auth/components/** → LoginButton, LogoutButton, UserMenu.
- **/features/auth/hooks/** → Custom hooks wrapping Clerk (`useAuthRole`, `useIsAdmin`).
- **/services/auth/** → Session validation, role helpers, webhook handlers.
- **/middleware.ts** → Route protection.
- **/types/auth.d.ts** → Auth-related interfaces.

---

## ✅ Best Practices Checklist

- ✅ Always use **Clerk React hooks** only in client components.
- ✅ Always use **Clerk server helpers** (`auth()`, `currentUser`) in server contexts.
- ✅ Always extract metadata types into `/types`.
- ✅ Always wrap `<UserButton />`, `<SignInButton />`, `<SignOutButton />` into **Gigsy-specific components** for consistency.
- ✅ Always validate Clerk webhooks with secret keys.
- ✅ Always log and handle Clerk errors with **Sentry**.

---

## 📚 Documentation Context

When generating code, follow:

- Clerk Docs → https://clerk.com/docs
- Clerk Next.js Quickstart → https://clerk.com/docs/quickstarts/nextjs
- Clerk React SDK → https://clerk.com/docs/components/react
- Clerk Webhooks → https://clerk.com/docs/users/webhooks

---

## 🤖 Copilot Behavior

- Always suggest **Clerk components** (`<SignInButton />`, `<UserButton />`, `<SignedIn />`) instead of building custom auth UI.
- Always suggest **server-side session validation** with `auth()` for secure APIs.
- Always encourage **role-based helpers** rather than inline role checks.
- Always guide towards **wrapping Clerk components** into Gigsy-specific abstractions (`GigsyLoginButton.tsx`) for consistency.
- Never mix raw JWT handling — **always use Clerk SDK APIs**.
- Always optimize for **security, maintainability, type safety, and accessibility**.
