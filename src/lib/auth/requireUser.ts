import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

interface RequireUserOptions {
  returnTo: string;
}

export async function requireUser({
  returnTo,
}: RequireUserOptions): Promise<string> {
  const { userId } = await auth();

  if (!userId) {
    redirect(`/sign-in?returnTo=${encodeURIComponent(returnTo)}`);
  }

  return userId;
}
