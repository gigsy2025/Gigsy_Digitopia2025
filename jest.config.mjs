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
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "convex/**/*.ts",
    "!**/node_modules/**",
    "!**/__tests__/**",
    "!**/*.stories.tsx",
    "!src/app/layout.tsx",
    "!src/app/global-error.tsx",
    "!convex/_generated/**",
    "!src/instrumentation*.ts",
    "!src/middleware.ts",
    "!src/env.js",
    "!src/components/ui/**",
    "!src/lib/validations/**",
    "!src/lib/auth/**",
    "!src/providers/**",
    "!src/app/**/layout.tsx"
  ],

  // Module path mappings to match your src/ directory structure
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },

  // Transform ES modules from node_modules - include all packages that use ES modules
  transformIgnorePatterns: [
    "node_modules/(?!(@clerk/|@logtail/|convex/|next-themes/|@radix-ui/|lucide-react/|@sentry/))",
  ],

  // Handle ES modules and .mjs files
  extensionsToTreatAsEsm: [".ts", ".tsx"],

  // Module file extensions Jest should process
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "mjs"],

  // Global setup for ES modules
  globals: {
    "ts-jest": {
      useESM: true,
    },
  },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config);
