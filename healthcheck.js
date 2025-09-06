/**
 * Health check script for Docker container monitoring
 *
 * Performs a simple HTTP request to verify the application is responding
 * Used by Docker's HEALTHCHECK instruction
 *
 * @author Gigsy Development Team
 * @since 2025-09-05
 */

const http = require("http");
const { hostname } = require("os");

const options = {
  host: "localhost", // Use localhost instead of hostname() for container health checks
  port: process.env.PORT || 3000,
  timeout: 2000,
  method: "GET",
  path: "/", // Check root path instead of /api/health which might not exist yet
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
