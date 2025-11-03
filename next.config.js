/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";
import { withSentryConfig } from "@sentry/nextjs";
import { withBetterStack } from "@logtail/next";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const CrittersWebpackPluginModule = require("critters-webpack-plugin");
const CrittersWebpackPlugin =
  CrittersWebpackPluginModule.default ?? CrittersWebpackPluginModule;

/** @type {import("next").NextConfig} */
const baseConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "harmless-spoonbill-103.convex.cloud",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "api.qrserver.com",
      },
    ],
  },
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.plugins.push(
        new CrittersWebpackPlugin({
          preload: "swap",
          pruneSource: true,
          inlineFonts: true,
          compress: true, // Minify inlined CSS
          preloadFonts: true, // Preload key fonts to reduce blocking
          mergeStylesheets: true, // Merge multiple CSS files before inlining
        }),
      );
    }

    return config;
  },
};

// First wrap with BetterStack/Logtail, then with Sentry
const configWithLogtail = withBetterStack(baseConfig);

export default withSentryConfig(configWithLogtail, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "goalrise",
  project: "gigsy_digitopia2025",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
  authToken: process.env.SENTRY_AUTH_TOKEN,
});
