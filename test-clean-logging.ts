import { ConvexBrowserLogger } from "./src/lib/logging/browser-logger";

// Test the clean browser logging
const browserLogger = new ConvexBrowserLogger();

console.log("Testing clean browser logging...");

// This should call our Convex action, which calls GigsyLogger to forward to Better Stack
browserLogger.info(
  {
    source: "clean-test",
    timestamp: new Date().toISOString(),
  },
  "Test message from clean browser logger",
);

console.log("Test sent - check Convex console for any errors");
