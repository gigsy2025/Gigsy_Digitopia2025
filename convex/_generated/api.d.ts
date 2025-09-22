/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as analytics from "../analytics.js";
import type * as courses from "../courses.js";
import type * as coursesMutations from "../coursesMutations.js";
import type * as files from "../files.js";
import type * as index from "../index.js";
import type * as lessons from "../lessons.js";
import type * as messages from "../messages.js";
import type * as progressBatch from "../progressBatch.js";
import type * as schema_fixed from "../schema_fixed.js";
import type * as skills from "../skills.js";
import type * as skillsTest from "../skillsTest.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  courses: typeof courses;
  coursesMutations: typeof coursesMutations;
  files: typeof files;
  index: typeof index;
  lessons: typeof lessons;
  messages: typeof messages;
  progressBatch: typeof progressBatch;
  schema_fixed: typeof schema_fixed;
  skills: typeof skills;
  skillsTest: typeof skillsTest;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
