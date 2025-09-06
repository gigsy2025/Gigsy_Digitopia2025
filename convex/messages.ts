import { query } from "./_generated/server";

export const getForCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }
    // Return a simple array for now without database calls
    return [
      {
        _id: "test-id",
        author: identity.email ?? "unknown",
        body: "Test message",
      },
    ];
  },
});
