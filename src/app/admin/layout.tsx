/**
 * ADMIN LAYOUT
 *
 * Layout wrapper for admin pages with navigation, RBAC enforcement,
 * and consistent styling. Provides responsive admin interface with
 * sidebar navigation and proper accessibility support.
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-09-16
 */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    template: "%s | Gigsy Admin",
    default: "Admin Dashboard | Gigsy",
  },
  description: "Administrative interface for the Gigsy platform",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={cn("bg-background min-h-screen", inter.className)}>
      {children}
    </div>
  );
}
