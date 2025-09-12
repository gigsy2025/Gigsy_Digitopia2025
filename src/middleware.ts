import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/_betterstack/(.*)", // Allow Better Stack telemetry
  "/api/webhooks(.*)", // Allow Clerk webhooks
  "/api/users/webhook(.*)", // Allow Clerk webhooks
  "/api/public(.*)", // Allow public API routes
  "/trpc/public(.*)", // Allow public tRPC routes
  "/favicon.ico", // Allow favicon
]);

export default clerkMiddleware(async (auth, request) => {
  // Skip authentication for public routes
  if (isPublicRoute(request)) {
    return;
  }

  // Protect all other routes
  await auth.protect();
});
export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
