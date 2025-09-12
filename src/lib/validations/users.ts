/**
 * User Balance Validation Schema
 * Multi-currency balance validation using Zod for runtime type safety
 */

import { z } from "zod";

// Supported currencies validation
export const CurrencySchema = z.enum(["EGP", "USD", "EUR"], {
  errorMap: () => ({ message: "Currency must be one of: EGP, USD, EUR" }),
});

// User roles validation
export const UserRoleSchema = z.enum(
  ["user", "admin", "moderator", "freelancer", "client"],
  {
    errorMap: () => ({ message: "Invalid user role specified" }),
  },
);

// Individual currency balance validation
export const CurrencyBalanceSchema = z.object({
  currency: CurrencySchema,
  amount: z
    .number()
    .min(0, "Balance amount cannot be negative")
    .max(1000000, "Balance amount cannot exceed 1,000,000")
    .finite("Balance amount must be a valid number"),
  lastUpdated: z
    .number()
    .int("Last updated must be an integer timestamp")
    .positive("Last updated must be a positive timestamp"),
  isActive: z.boolean({
    required_error: "isActive status is required",
    invalid_type_error: "isActive must be a boolean",
  }),
});

// Multi-currency balances array validation
export const UserBalancesSchema = z.object({
  balances: z
    .array(CurrencyBalanceSchema)
    .min(1, "At least one currency balance is required")
    .max(10, "Maximum 10 currency balances allowed")
    .refine(
      (balances) => {
        const currencies = balances.map((b) => b.currency);
        return new Set(currencies).size === currencies.length;
      },
      { message: "Duplicate currencies are not allowed" },
    )
    .refine((balances) => balances.some((b) => b.isActive), {
      message: "At least one currency must be active",
    }),
});

// Balance operation validation
export const BalanceOperationSchema = z.object({
  currency: CurrencySchema,
  amount: z
    .number()
    .finite("Amount must be a valid number")
    .refine((amount) => amount !== 0, "Amount cannot be zero"),
  description: z
    .string()
    .min(3, "Description must be at least 3 characters")
    .max(200, "Description must be under 200 characters")
    .trim(),
  relatedEntityType: z
    .string()
    .min(1, "Related entity type cannot be empty")
    .optional(),
  relatedEntityId: z
    .string()
    .min(1, "Related entity ID cannot be empty")
    .optional(),
});

// Balance query validation
export const BalanceQuerySchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  currency: CurrencySchema.optional(),
  activeOnly: z.boolean().default(false),
});

// Balance update request validation
export const UpdateBalanceRequestSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  currency: CurrencySchema,
  newAmount: z
    .number()
    .min(0, "New amount cannot be negative")
    .max(1000000, "New amount cannot exceed 1,000,000")
    .finite("New amount must be a valid number"),
  reason: z
    .string()
    .min(5, "Reason must be at least 5 characters")
    .max(500, "Reason must be under 500 characters")
    .trim(),
  updatedBy: z.string().min(1, "Updated by field is required").trim(),
});

// Currency preferences validation
export const CurrencyPreferencesSchema = z.object({
  primaryCurrency: CurrencySchema,
  displayCurrencies: z
    .array(CurrencySchema)
    .min(1, "At least one display currency is required")
    .max(3, "Maximum 3 display currencies allowed"),
  autoConvert: z.boolean().default(false),
  minimumBalance: z.record(
    CurrencySchema,
    z.number().min(0, "Minimum balance cannot be negative"),
  ),
});

// User creation with balance validation
export const CreateUserWithBalanceSchema = z.object({
  clerkId: z.string().min(1, "Clerk ID is required").trim(),
  email: z.string().email("Must be a valid email address").trim().toLowerCase(),
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be under 100 characters")
    .trim(),
  avatarUrl: z.string().url("Avatar URL must be a valid URL").optional(),
  roles: z
    .array(UserRoleSchema)
    .min(1, "At least one role is required")
    .max(5, "Maximum 5 roles allowed")
    .default(["user"]), // Default to "user" role
  initialCurrency: CurrencySchema,
  initialBalance: z
    .number()
    .min(0, "Initial balance cannot be negative")
    .max(10000, "Initial balance cannot exceed 10,000")
    .default(0),
});

// Balance validation rules schema
export const BalanceValidationSchema = z.object({
  minBalance: z.number().default(0),
  maxBalance: z.number().positive("Max balance must be positive"),
  allowNegative: z.boolean().default(false),
  freezeThreshold: z.number().optional(),
});

// Transaction context validation
export const TransactionContextSchema = z.object({
  fromCurrency: CurrencySchema.optional(),
  toCurrency: CurrencySchema.optional(),
  exchangeRate: z
    .number()
    .positive("Exchange rate must be positive")
    .optional(),
  fees: z
    .array(
      z.object({
        type: z.string().min(1, "Fee type is required"),
        amount: z.number().positive("Fee amount must be positive"),
        currency: CurrencySchema,
      }),
    )
    .optional(),
});

// Balance operation types validation
export const BalanceOperationTypeSchema = z.enum(
  [
    "DEPOSIT",
    "WITHDRAWAL",
    "ESCROW_HOLD",
    "ESCROW_RELEASE",
    "PAYMENT",
    "REFUND",
    "FEE",
    "CONVERSION",
    "ADJUSTMENT",
  ],
  {
    errorMap: () => ({ message: "Invalid balance operation type" }),
  },
);

// Helper validation functions
export const validateCurrencyBalance = (data: unknown) => {
  return CurrencyBalanceSchema.safeParse(data);
};

export const validateUserBalances = (data: unknown) => {
  return UserBalancesSchema.safeParse(data);
};

export const validateBalanceOperation = (data: unknown) => {
  return BalanceOperationSchema.safeParse(data);
};

export const validateCurrencySupport = (currency: string) => {
  return CurrencySchema.safeParse(currency);
};

// Export inferred types for TypeScript usage
export type Currency = z.infer<typeof CurrencySchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export type CurrencyBalance = z.infer<typeof CurrencyBalanceSchema>;
export type UserBalances = z.infer<typeof UserBalancesSchema>;
export type BalanceOperation = z.infer<typeof BalanceOperationSchema>;
export type BalanceQuery = z.infer<typeof BalanceQuerySchema>;
export type UpdateBalanceRequest = z.infer<typeof UpdateBalanceRequestSchema>;
export type CurrencyPreferences = z.infer<typeof CurrencyPreferencesSchema>;
export type CreateUserWithBalanceData = z.infer<
  typeof CreateUserWithBalanceSchema
>;
export type BalanceValidation = z.infer<typeof BalanceValidationSchema>;
export type TransactionContext = z.infer<typeof TransactionContextSchema>;
export type BalanceOperationType = z.infer<typeof BalanceOperationTypeSchema>;
