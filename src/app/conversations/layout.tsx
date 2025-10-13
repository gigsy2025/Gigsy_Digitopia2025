import { auth } from "@clerk/nextjs/server";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Sidebar from "./components/Sidebar";
import { getConvexServer } from "@/lib/convex/client";

interface ConversationsLayoutProps {
  readonly children: ReactNode;
}

export default async function ConversationsLayout({
  children,
}: ConversationsLayoutProps) {
  const { userId, getToken } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const token = (await getToken?.({ template: "convex" })) ?? undefined;
  if (!token) {
    redirect("/sign-in");
  }

  const convex = getConvexServer({ token });
  const sidebarData = await convex.listConversationsForUser({ limit: 25 });

  return (
    <div className="bg-background flex h-[calc(100vh-4rem)] min-h-0 w-full overflow-hidden">
      <Sidebar
        initialConversations={sidebarData.conversations}
        initialCursor={sidebarData.continueCursor}
        initialIsDone={sidebarData.isDone}
      />
      <div className="border-border bg-background flex min-h-0 flex-1 flex-col border-l">
        {children}
      </div>
    </div>
  );
}
