/**
 * ADMIN COURSES PAGE
 *
 * Comprehensive course management interface for administrators with
 * course creation, editing, and management capabilities. Features
 * RBAC enforcement, responsive design, and enterprise-grade UI.
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-09-16
 */

import type { Metadata } from "next";
import { AdminCourseForm } from "@/components/admin/AdminCourseForm";

export const metadata: Metadata = {
  title: "Create Course | Gigsy Admin",
  description: "Create and manage courses on the Gigsy platform",
};

export const dynamic = "force-dynamic";

export default function AdminCoursesPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminCourseForm />
    </div>
  );
}
