/**
 * Health check script for Docker container monitoring
 *
 * Performs a simple HTTP request to verify the application is responding
 * Used by Docker's HEALTHCHECK instruction
 *
 * @author Gigsy Development Team
 * @since 2025-09-05
 */

import http from "http";
import { hostname } from "os";

const options = {
  host: hostname(),
  port: process.env.PORT || 3000,
  timeout: 2000,
  method: "GET",
  path: "/api/health", // Health endpoint to be created in your Next.js app
};

const healthCheck = () => {
  const request = http.request(options, (res) => {
    console.log(`Health check status: ${res.statusCode}`);
    if (res.statusCode === 200) {
      process.exit(0);
    } else {
      console.error(`Health check failed with status: ${res.statusCode}`);
      process.exit(1);
    }
  });

  request.on("error", (err) => {
    console.error("Health check failed:", err.message);
    process.exit(1);
  });

  request.on("timeout", () => {
    console.error("Health check timeout");
    request.destroy();
    process.exit(1);
  });

  request.setTimeout(options.timeout);
  request.end();
};

// Execute health check
healthCheck();
