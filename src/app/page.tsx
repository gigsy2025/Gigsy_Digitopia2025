"use client";
import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { api } from "../../convex/_generated/api";
import Badge from "@/components/Badge";

export default function HomePage() {
  return (
    <>
      <Authenticated>
        <UserButton />
        <Badge />
        {/* <Content /> */}
      </Authenticated>
      <Unauthenticated>
        <SignInButton />
      </Unauthenticated>
    </>
  );
}

// function Content() {
//   const messages = useQuery(api.messages.getForCurrentUser);
//   return <div>Authenticated content: {messages?.length ?? 0}</div>;
// }
