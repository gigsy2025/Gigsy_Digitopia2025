import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
  messages: defineTable({
    author: v.string(),
    body: v.string(),
  }),
});

export default schema;
