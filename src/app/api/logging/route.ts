import { withBetterStack } from "@logtail/next";
import type { BetterStackRequest } from "@logtail/next";
import { NextResponse } from "next/server";

export const GET = withBetterStack((req: BetterStackRequest) => {
  req.log.info("Login function called");

  // You can create intermediate loggers
  const log = req.log.with({ scope: "user" });
  log.info("User logged in", { userId: 42 });

  return NextResponse.json({ hello: "world" });
});
