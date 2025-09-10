---
applyTo: "**/*.ts,**/*.tsx,**/*.js,**/*.jsx"
---

# 🚀 Copilot Instructions for Gigsy Frontend

## 📌 General Principles

- Always use **TypeScript** with `strict` mode.
- Prefer **Next.js Server Components** by default. Only use `"use client"` when interactive hooks (e.g., `useState`, `useEffect`) are required.
- Apply **SOLID principles**:
  - **S**ingle Responsibility → each component handles one concern.
  - **O**pen/Closed → extend components via composition, not direct edits.
  - **L**iskov Substitution → components must remain interchangeable if typed the same.
  - **I**nterface Segregation → use small, precise prop interfaces.
  - **D**ependency Inversion → business logic stays in `/services`, UI just renders props.

---

## 🎨 UI Guidelines

### ShadCN UI

- Always prefer **ShadCN primitives** (Button, Card, Input, Dialog, DropdownMenu, etc.).
- Use **variants** (e.g., `variant="outline" | "destructive"`) instead of inline styles.
- Use **Radix-based accessibility** (keyboard nav, ARIA roles come built-in).
- Wrap complex ShadCN components into **Gigsy-specific wrappers** (e.g., `GigsyButton.tsx`) for consistency.

### Kibo UI

- Use Kibo UI for **higher-level workflows** (commerce-style grids, dynamic product-like lists, responsive layout utilities).
- Keep Kibo UI components **wrapped in domain-specific components** (`GigsyCourseCard`, `GigsyGigListing`).
- Never mix raw Tailwind + Kibo + ShadCN without purpose — **ShadCN for primitives, Kibo for structure**.

---

## ⚡ Performance & Scalability

- Default to **SSR/SSG/ISR** rendering depending on content type.
- For interactive widgets (chat, dashboards), use **client components** + `React.memo`, `useCallback`, `useMemo`.
- Use **dynamic imports** with `ssr: false` for heavy widgets.
- Prefer **TanStack Query (React Query)** for API calls instead of manual `useEffect`.
- Use **Suspense + streaming** for progressive data loading.

---

## 🛠 Code Organization

- **/components/ui/** → ShadCN primitives.
- **/components/kibo/** → Wrapped Kibo UI components.
- **/components/shared/** → Common UI (navbar, footer, sidebar).
- **/features/** → Feature-specific components (gigs, courses, chat).
- **/services/** → API/Convex calls, business logic.
- **/hooks/** → Custom reusable hooks.
- **/types/** → TypeScript interfaces and DTOs.
- **/utils/** → Pure utility functions.

---

## ✅ Best Practices Checklist

- ✅ Always type props with explicit interfaces.
- ✅ Always use `React.FC<Props>` with `Props` interface.
- ✅ Always extract constants (colors, spacing, variants) into config.
- ✅ Always keep forms using `react-hook-form + zod` for validation.
- ✅ Always use accessible labels (`aria-label`, `aria-describedby`).
- ✅ Always memoize expensive calculations.

---

## 📚 Documentation Context

When generating code:

- Follow **ShadCN docs** → https://ui.shadcn.com/docs
- Follow **Kibo UI docs** → # 🚀 Copilot Instructions for Gigsy Frontend

## 📌 General Principles

- Always use **TypeScript** with `strict` mode.
- Prefer **Next.js Server Components** by default. Only use `"use client"` when interactive hooks (e.g., `useState`, `useEffect`) are required.
- Apply **SOLID principles**:
  - **S**ingle Responsibility → each component handles one concern.
  - **O**pen/Closed → extend components via composition, not direct edits.
  - **L**iskov Substitution → components must remain interchangeable if typed the same.
  - **I**nterface Segregation → use small, precise prop interfaces.
  - **D**ependency Inversion → business logic stays in `/services`, UI just renders props.

---

## 🎨 UI Guidelines

### ShadCN UI

- Always prefer **ShadCN primitives** (Button, Card, Input, Dialog, DropdownMenu, etc.).
- Use **variants** (e.g., `variant="outline" | "destructive"`) instead of inline styles.
- Use **Radix-based accessibility** (keyboard nav, ARIA roles come built-in).
- Wrap complex ShadCN components into **Gigsy-specific wrappers** (e.g., `GigsyButton.tsx`) for consistency.

### Kibo UI

- Use Kibo UI for **higher-level workflows** (commerce-style grids, dynamic product-like lists, responsive layout utilities).
- Keep Kibo UI components **wrapped in domain-specific components** (`GigsyCourseCard`, `GigsyGigListing`).
- Never mix raw Tailwind + Kibo + ShadCN without purpose — **ShadCN for primitives, Kibo for structure**.

---

## ⚡ Performance & Scalability

- Default to **SSR/SSG/ISR** rendering depending on content type.
- For interactive widgets (chat, dashboards), use **client components** + `React.memo`, `useCallback`, `useMemo`.
- Use **dynamic imports** with `ssr: false` for heavy widgets.
- Prefer **TanStack Query (React Query)** for API calls instead of manual `useEffect`.
- Use **Suspense + streaming** for progressive data loading.

---

## 🛠 Code Organization

- **/components/ui/** → ShadCN primitives.
- **/components/kibo/** → Wrapped Kibo UI components.
- **/components/shared/** → Common UI (navbar, footer, sidebar).
- **/features/** → Feature-specific components (gigs, courses, chat).
- **/services/** → API/Convex calls, business logic.
- **/hooks/** → Custom reusable hooks.
- **/types/** → TypeScript interfaces and DTOs.
- **/utils/** → Pure utility functions.

---

## ✅ Best Practices Checklist

- ✅ Always type props with explicit interfaces.
- ✅ Always use `React.FC<Props>` with `Props` interface.
- ✅ Always extract constants (colors, spacing, variants) into config.
- ✅ Always keep forms using `react-hook-form + zod` for validation.
- ✅ Always use accessible labels (`aria-label`, `aria-describedby`).
- ✅ Always memoize expensive calculations.

---

## 📚 Documentation Context

When generating code:

- Follow **ShadCN docs** → https://ui.shadcn.com/docs
- Follow **Kibo UI docs** → https://www.kibo-ui.com/docs
- Apply **Next.js 15 App Router best practices** → https://nextjs.org/docs
- Apply **TanStack Query best practices** → https://tanstack.com/query/latest

---

## 🤖 Copilot Behavior

- Always suggest **ShadCN components first** for UI primitives.
- Always suggest **Kibo UI components second** for structured layouts or workflows.
- Always **wrap external library components** into Gigsy-specific components before using them across features.
- Never generate plain HTML if a ShadCN/Kibo alternative exists.
- Always optimize for **type safety, maintainability, and accessibility**.

- Apply **Next.js 15 App Router best practices** → https://nextjs.org/docs
- Apply **TanStack Query best practices** → https://tanstack.com/query/latest

---

## 🤖 Copilot Behavior

- Always suggest **ShadCN components first** for UI primitives.
- Always suggest **Kibo UI components second** for structured layouts or workflows.
- Always **wrap external library components** into Gigsy-specific components before using them across features.
- Never generate plain HTML if a ShadCN/Kibo alternative exists.
- Always optimize for **type safety, maintainability, and accessibility**.
