/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: "./",
});

// Add any custom config to be passed to Jest
const config = {
  coverageProvider: "v8",
  testEnvironment: "jsdom",
  // Add more setup options before each test is run
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],

  // Enable automatic mocking
  clearMocks: true,

  // Coverage settings
  collectCoverage: true,
  coverageDirectory: "coverage",

  // Module path mappings to match your src/ directory structure
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },

  // Transform ES modules from node_modules
  transformIgnorePatterns: [
    "node_modules/(?!(@clerk/|convex/|next-themes/|@radix-ui/|lucide-react/))",
  ],

  // Handle ES modules
  extensionsToTreatAsEsm: [".ts", ".tsx"],

  // Global setup for ES modules
  globals: {
    "ts-jest": {
      useESM: true,
    },
  },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config);
