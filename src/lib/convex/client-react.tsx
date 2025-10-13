"use client";

import type { ReactNode } from "react";
import { ConvexReactClient, useMutation, useQuery } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import type { FunctionReference } from "convex/server";
import type { DefaultFunctionArgs } from "convex/server";
import { useAuth } from "@clerk/nextjs";

const convexUrl =
  process.env.NEXT_PUBLIC_CONVEX_URL ??
  "https://harmless-spoonbill-103.convex.cloud";

const convexClient = new ConvexReactClient(convexUrl);

export function ConvexProvider({ children }: { readonly children: ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convexClient} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}

type PublicQueryReference<
  Args extends DefaultFunctionArgs,
  Return,
> = FunctionReference<"query", "public", Args, Return>;

type PublicMutationReference<
  Args extends DefaultFunctionArgs,
  Return,
> = FunctionReference<"mutation", "public", Args, Return>;

export function useConvexSubscription<Args extends DefaultFunctionArgs, Return>(
  reference: PublicQueryReference<Args, Return>,
  args: Args | "skip",
): Return | undefined {
  const normalizedArgs = args === "skip" ? "skip" : args;
  return useQuery(
    reference as unknown as FunctionReference<"query">,
    normalizedArgs as never,
  ) as Return | undefined;
}

export function useConvexMutation<Args extends DefaultFunctionArgs, Return>(
  reference: PublicMutationReference<Args, Return>,
) {
  return useMutation(reference);
}

export function useConvexClient(): ConvexReactClient {
  return convexClient;
}
