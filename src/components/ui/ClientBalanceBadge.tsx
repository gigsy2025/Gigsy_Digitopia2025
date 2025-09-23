"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import BalanceBadge from "./BalanceBadge";
import { Skeleton } from "../ui/skeleton";

export function ClientBalanceBadge() {
  const { user, isLoaded: isUserLoaded } = useUser();

  // Always call the query hook, but conditionally pass the clerkId
  const userQuery = useQuery(
    api.users.getUserByClerkId,
    isUserLoaded && user?.id ? { clerkId: user.id } : "skip",
  );

  // Show skeleton while loading
  if (!isUserLoaded || (user && !userQuery)) {
    return <Skeleton className="h-8 w-24 rounded-md" />;
  }

  // If we have a user but no userQuery, show nothing
  if (user && !userQuery?._id) {
    return null;
  }

  // If no user is logged in, show nothing
  if (!user) {
    return null;
  }

  // Only render the BalanceBadge if we have a valid Convex user ID
  return <BalanceBadge userId={userQuery?._id} />;
}

export default ClientBalanceBadge;
