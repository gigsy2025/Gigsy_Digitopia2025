import { query } from "./_generated/server";

export const testSkills = query({
  args: {},
  handler: async () => {
    return { message: "Skills test working" };
  },
});
