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
import type * as applications from "../applications.js";
import type * as courses from "../courses.js";
import type * as coursesMutations from "../coursesMutations.js";
import type * as files from "../files.js";
import type * as finance from "../finance.js";
import type * as index from "../index.js";
import type * as internal_healthQueries from "../internal/healthQueries.js";
import type * as internal_index from "../internal/index.js";
import type * as internal_reconcileQueries from "../internal/reconcileQueries.js";
import type * as internal_walletBalances from "../internal/walletBalances.js";
import type * as internal_walletInit from "../internal/walletInit.js";
import type * as internal_walletMutations from "../internal/walletMutations.js";
import type * as internal_walletTransactions from "../internal/walletTransactions.js";
import type * as lessons from "../lessons.js";
import type * as messages from "../messages.js";
import type * as profile from "../profile.js";
import type * as progressBatch from "../progressBatch.js";
import type * as reconcile from "../reconcile.js";
import type * as schema_fixed from "../schema_fixed.js";
import type * as skills from "../skills.js";
import type * as skillsTest from "../skillsTest.js";
import type * as users from "../users.js";
import type * as wallet from "../wallet.js";
import type * as walletApi from "../walletApi.js";

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
  applications: typeof applications;
  courses: typeof courses;
  coursesMutations: typeof coursesMutations;
  files: typeof files;
  finance: typeof finance;
  index: typeof index;
  "internal/healthQueries": typeof internal_healthQueries;
  "internal/index": typeof internal_index;
  "internal/reconcileQueries": typeof internal_reconcileQueries;
  "internal/walletBalances": typeof internal_walletBalances;
  "internal/walletInit": typeof internal_walletInit;
  "internal/walletMutations": typeof internal_walletMutations;
  "internal/walletTransactions": typeof internal_walletTransactions;
  lessons: typeof lessons;
  messages: typeof messages;
  profile: typeof profile;
  progressBatch: typeof progressBatch;
  reconcile: typeof reconcile;
  schema_fixed: typeof schema_fixed;
  skills: typeof skills;
  skillsTest: typeof skillsTest;
  users: typeof users;
  wallet: typeof wallet;
  walletApi: typeof walletApi;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
