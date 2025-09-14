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
import { currentUser } from "@clerk/nextjs/server";

import { 
  SidebarInset,
  SidebarProvider,
  SidebarTrigger 
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

import { AppSidebar } from "@/components/AppSidebar";

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
 */
export default async function AppLayout({ children }: AppLayoutProps) {
  // Check authentication
  const user = await currentUser();
  
  if (!user) {
    redirect("/sign-in");
  }
  
  // Get sidebar state from cookies for SSR
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar:state")?.value === "true";
  
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <SidebarInset>
        {/* Main App Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            
            {/* Simple breadcrumb for now */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Dashboard</span>
              <span>/</span>
              <span className="text-foreground">Overview</span>
            </div>
          </div>
        </header>
        
        {/* Main Content Area */}
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
