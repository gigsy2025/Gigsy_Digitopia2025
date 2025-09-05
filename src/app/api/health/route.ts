/**
 * Health Check API Endpoint
 *
 * Provides a simple health check endpoint for container monitoring
 * Returns basic application status and uptime information
 *
 * @route GET /api/health
 * @returns {Response} JSON response with health status
 *
 * @author Gigsy Development Team
 * @since 2025-09-05
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Health check endpoint handler
 *
 * PERFORMANCE: Lightweight endpoint with minimal processing
 * for fast health check responses
 *
 * @param _request - The incoming HTTP request (unused)
 * @returns Promise resolving to health status response
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    // Basic health check - you can extend this with database checks, etc.
    const healthData = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version ?? "1.0.0",
      environment: process.env.NODE_ENV ?? "development",
    };

    return NextResponse.json(healthData, {
      status: 200,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Health check failed:", error);

    return NextResponse.json(
      {
        status: "unhealthy",
        error: "Internal server error",
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
  }
}
