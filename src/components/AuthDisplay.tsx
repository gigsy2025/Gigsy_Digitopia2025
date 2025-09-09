"use client";

import { useUser, SignInButton, SignOutButton } from "@clerk/nextjs";

export default function AuthDisplay() {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-purple-600"></div>
        <span className="ml-2 text-gray-600">Loading authentication...</span>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-lg bg-white p-6 shadow-md">
      <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">
        Authentication Status
      </h2>

      {isSignedIn ? (
        <div className="space-y-4">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p
              className="text-lg font-semibold text-green-600"
              data-testid="auth-status"
            >
              Signed In
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 p-4">
            <h3 className="mb-2 font-medium text-gray-700">
              User Information:
            </h3>
            <div className="space-y-2 text-sm">
              <p data-testid="user-name">
                <span className="font-medium">Name:</span>{" "}
                {user.fullName ?? "Not provided"}
              </p>
              <p data-testid="user-email">
                <span className="font-medium">Email:</span>{" "}
                {user.emailAddresses[0]?.emailAddress ?? "Not provided"}
              </p>
              <p data-testid="user-id">
                <span className="font-medium">User ID:</span> {user.id}
              </p>
            </div>
          </div>

          <SignOutButton>
            <button
              className="w-full rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700"
              data-testid="sign-out-button"
            >
              Sign Out
            </button>
          </SignOutButton>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <svg
                className="h-8 w-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <p
              className="text-lg font-semibold text-gray-600"
              data-testid="auth-status"
            >
              Not Signed In
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Please sign in to access personalized features
            </p>
          </div>

          <SignInButton mode="modal">
            <button
              className="w-full rounded-lg bg-purple-600 px-4 py-2 font-medium text-white transition-colors hover:bg-purple-700"
              data-testid="sign-in-button"
            >
              Sign In
            </button>
          </SignInButton>
        </div>
      )}
    </div>
  );
}
