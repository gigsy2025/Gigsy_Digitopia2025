"use client";
import { useUser } from "@clerk/nextjs";

export default function Badge() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return <span className="text-gray-500">Loading...</span>;
  }

  if (!user) {
    return <span className="text-gray-500">Welcome, Guest!</span>;
  }

  return (
    <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-800">
      Logged in as {user.fullName ?? user.emailAddresses[0]?.emailAddress}
    </span>
  );
}
