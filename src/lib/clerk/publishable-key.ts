import { env } from "@/env";

const FALLBACK_PUBLISHABLE_KEY = "pk_test_placeholder";

export function getClerkPublishableKey(): string {
  return (
    env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ??
    FALLBACK_PUBLISHABLE_KEY
  );
}
