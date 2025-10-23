/**
 * AUTHENTICATED APP LAYOUT
 *
 * Layout component for authenticated application pages with integrated sidebar,
 * proper SSR support, and enterprise-grade performance optimizations.
 *
 * FEATURES:
 * - ShadCN Sidebar with persistent state via cookies
 * - Responsive design with mobile sheet component
 * - Theme-aware styling with CSS variables
 * - Analytics integration for navigation tracking
 * - Keyboard shortcuts (Cmd/Ctrl+B for sidebar toggle)
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-01-14
 */

import { type Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ClerkProvider } from "@clerk/nextjs";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

import { AppSidebar } from "@/components/AppSidebar";
import { SkillsCheck } from "@/components/SkillsCheck";
import { ClientBalanceBadge } from "@/components/ui/ClientBalanceBadge";
import Providers from "@/providers/Providers";
import { resolveCurrentUser } from "@/lib/auth/userResolver.server";
import { getClerkPublishableKey } from "@/lib/clerk/publishable-key";

// Force dynamic rendering since we need to access user session
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gigsy App",
  description: "Your freelance platform dashboard",
};

/**
 * Props for the app layout
 */
interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * Authenticated App Layout
 *
 * Provides the main application shell with sidebar navigation,
 * breadcrumbs, and responsive design for authenticated users.
 * Includes secure user metadata fetching and context hydration.
 */
export default async function AppLayout({ children }: AppLayoutProps) {
  // Resolve user with metadata from Clerk
  const initialUser = await resolveCurrentUser();

  if (!initialUser) {
    redirect("/sign-in");
  }

  // Get sidebar state from cookies for SSR
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar:state")?.value === "true";

  const publishableKey = getClerkPublishableKey();

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <Providers initialUser={initialUser}>
        <SidebarProvider defaultOpen={defaultOpen}>
          <AppSidebar />
          <SidebarInset>
          {/* Main App Header */}
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex w-full items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />

                {/* Simple breadcrumb for now */}
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <span>Dashboard</span>
                  <span>/</span>
                  <span className="text-foreground">Overview</span>
                </div>
              </div>

              {/* Balance Badge - visible on desktop */}
              <div className="flex items-center gap-4">
                <ClientBalanceBadge />
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 pt-0">
            {children}
          </div>

            {/* Skills Onboarding Check */}
            <SkillsCheck />
          </SidebarInset>
        </SidebarProvider>
      </Providers>
    </ClerkProvider>
  );
}
