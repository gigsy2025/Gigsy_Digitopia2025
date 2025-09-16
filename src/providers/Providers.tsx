/**
 * MAIN PROVIDERS COMPONENT
 *
 * Root client-side provider that bridges server-to-client data transfer.
 * Combines all necessary providers for the application context.
 *
 * FEATURES:
 * - User context with server-side hydration
 * - Convex client provider integration
 * - Type-safe props interface
 * - Performance-optimized with minimal re-renders
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-01-14
 */

"use client";

import React, { type ReactNode } from "react";
import ConvexClientProvider from "@/providers/ConvexClientProvider";
import { UserProvider } from "@/providers/UserContext";
import { type UserProfile } from "@/types/auth";

/**
 * Props for the main Providers component
 */
interface ProvidersProps {
  /** Initial user data from server-side resolution */
  initialUser: UserProfile | null;
  /** Child components to wrap */
  children: ReactNode;
}

/**
 * Main Providers Component
 *
 * Combines all application providers and ensures proper provider ordering.
 * Handles server-to-client hydration of user state and integrates with Convex.
 */
export default function Providers({ initialUser, children }: ProvidersProps) {
  return (
    <ConvexClientProvider>
      <UserProvider initialUser={initialUser}>{children}</UserProvider>
    </ConvexClientProvider>
  );
}
