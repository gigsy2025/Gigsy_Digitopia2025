/**
 * GIGSY DASHBOARD PAGE
 *
 * Main dashboard for authenticated users showcasing the sidebar navigation
 * and serving as the landing page for the Gigsy application.
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-01-14
 */

"use client";

import Link from "next/link";
import { useUser } from "@/providers/UserContext";

export default function DashboardPage() {
  const { isAdmin } = useUser();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your Gigsy dashboard. Manage your gigs, learning, and
          career growth.
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-card text-card-foreground rounded-lg border p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Active Gigs</h3>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="text-muted-foreground h-4 w-4"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="m22 21-3-3" />
            </svg>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold">3</div>
            <p className="text-muted-foreground text-xs">+1 from last month</p>
          </div>
        </div>

        <div className="bg-card text-card-foreground rounded-lg border p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Course Progress</h3>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="text-muted-foreground h-4 w-4"
            >
              <path d="M12 2v20m9-9H3" />
            </svg>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold">67%</div>
            <p className="text-muted-foreground text-xs">
              2 courses in progress
            </p>
          </div>
        </div>

        <div className="bg-card text-card-foreground rounded-lg border p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">This Month&apos;s Earnings</h3>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="text-muted-foreground h-4 w-4"
            >
              <path d="M12 2v20m9-9H3" />
            </svg>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold">$2,350</div>
            <p className="text-muted-foreground text-xs">
              +18% from last month
            </p>
          </div>
        </div>

        <div className="bg-card text-card-foreground rounded-lg border p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Profile Views</h3>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="text-muted-foreground h-4 w-4"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold">142</div>
            <p className="text-muted-foreground text-xs">+7% from last week</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Recent Activity</h2>
        <div className="bg-card rounded-lg border">
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">
                    New gig application received
                  </p>
                  <p className="text-muted-foreground text-xs">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">Course module completed</p>
                  <p className="text-muted-foreground text-xs">1 day ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">
                    Payment received from client
                  </p>
                  <p className="text-muted-foreground text-xs">3 days ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Quick Actions</h2>
        <div
          className={`grid gap-4 ${isAdmin ? "md:grid-cols-4" : "md:grid-cols-3"}`}
        >
          <Link
            href="/app/work/post"
            className="bg-card hover:bg-accent flex flex-col items-center justify-center rounded-lg border p-6 text-center transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="text-primary mb-2 h-8 w-8"
            >
              <path d="M12 2v20m9-9H3" />
            </svg>
            <h3 className="font-medium">Post a Gig</h3>
            <p className="text-muted-foreground text-sm">
              Find talented freelancers
            </p>
          </Link>

          <Link
            href="/app/courses"
            className="bg-card hover:bg-accent flex flex-col items-center justify-center rounded-lg border p-6 text-center transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="text-primary mb-2 h-8 w-8"
            >
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
            <h3 className="font-medium">Browse Courses</h3>
            <p className="text-muted-foreground text-sm">Learn new skills</p>
          </Link>

          {/* Admin Only: Create Course Action */}
          {isAdmin && (
            <Link
              href="/admin/courses/create"
              className="bg-card hover:bg-accent border-primary/20 flex flex-col items-center justify-center rounded-lg border bg-gradient-to-br from-blue-50 to-indigo-50 p-6 text-center transition-colors dark:from-blue-950/50 dark:to-indigo-950/50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="text-primary mb-2 h-8 w-8"
              >
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                <path d="M12 7v6" />
                <path d="M9 10h6" />
              </svg>
              <h3 className="text-primary font-medium">Create Course</h3>
              <p className="text-muted-foreground text-sm">
                Add new learning content
              </p>
            </Link>
          )}

          <Link
            href="/app/profile"
            className="bg-card hover:bg-accent flex flex-col items-center justify-center rounded-lg border p-6 text-center transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="text-primary mb-2 h-8 w-8"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <h3 className="font-medium">Update Profile</h3>
            <p className="text-muted-foreground text-sm">
              Enhance your presence
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
