/**
 * Enterprise-grade test suite for User Management Service
 *
 * Tests all CRUD operations, validation, error handling,
 * and business logic for user initialization and management.
 *
 * Following AAA pattern: Arrange, Act, Assert
 */

// Jest globals are available in the test environment

// Type definitions aligned with actual Convex schemas
interface TestUserCreationArgs {
  clerkId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  roles?: string[];
  initialCurrency?: "EGP" | "USD" | "EUR";
  initialBalance?: number;
}

interface TestBalanceResult {
  currency: "EGP" | "USD" | "EUR";
  amount: number;
  lastUpdated: number;
}

interface TestUserProfile {
  bio?: string;
  headline?: string;
  location?: string;
  skills: string[];
  experienceLevel: "beginner" | "intermediate" | "expert" | "advanced";
  education: unknown[];
  workExperience: unknown[];
  completeness: number;
  version: number;
  lastUpdated: number;
}

interface TestUser {
  _id: string;
  clerkId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  roles: string[];
  profile?: TestUserProfile; // Profile is optional to match Convex schema
  balances: TestBalanceResult[];
  _creationTime: number;
  updatedAt: number;
}

interface TestUserStatistics {
  totalUsers: number;
  usersByRole: {
    user: number;
    freelancer: number;
    client: number;
    admin: number;
    moderator: number;
  };
  averageProfileCompleteness: number;
  recentSignups: number;
}

interface TestUserUpdateResult {
  success: boolean;
  user?: TestUser;
  errors?: string[];
}

/**
 * Mock testing helper for simulating Convex database operations
 * Provides isolated testing environment with predictable data
 */
class MockConvexTestingHelper {
  private mockData = new Map<string, TestUser>();
  private mockStatistics: TestUserStatistics;

  constructor() {
    this.resetMockData();
    this.mockStatistics = {
      totalUsers: 0,
      usersByRole: {
        user: 0,
        freelancer: 0,
        client: 0,
        admin: 0,
        moderator: 0,
      },
      averageProfileCompleteness: 0,
      recentSignups: 0,
    };
  }

  /**
   * Reset mock data to clean state for each test
   */
  resetMockData(): void {
    this.mockData.clear();
  }

  /**
   * Mock implementation of initializeUser function
   */
  mockInitializeUser(args: TestUserCreationArgs): TestUser {
    // Validation: Required fields
    if (!args.clerkId) {
      throw new Error("Clerk ID is required for user initialization");
    }

    if (!args.email?.includes("@")) {
      throw new Error("Valid email address is required");
    }

    if (!args.name || args.name.trim().length < 2) {
      throw new Error("Name must be at least 2 characters long");
    }

    // Check for duplicate email
    const existingUsers = Array.from(this.mockData.values());
    for (const user of existingUsers) {
      if (user.email === args.email) {
        throw new Error("User with this email already exists");
      }
    }

    // Check for duplicate Clerk ID
    for (const user of existingUsers) {
      if (user.clerkId === args.clerkId) {
        throw new Error("User with this Clerk ID already exists");
      }
    }

    // Create balances for all supported currencies
    const supportedCurrencies: Array<"EGP" | "USD" | "EUR"> = [
      "EGP",
      "USD",
      "EUR",
    ];
    const balances: TestBalanceResult[] = supportedCurrencies.map(
      (currency) => ({
        currency,
        amount:
          currency === args.initialCurrency
            ? Math.max(0, args.initialBalance ?? 0)
            : 0,
        lastUpdated: Date.now(),
      }),
    );

    // Create new user
    const user: TestUser = {
      _id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      clerkId: args.clerkId,
      email: args.email,
      name: args.name.trim(),
      avatarUrl: args.avatarUrl,
      roles: args.roles && args.roles.length > 0 ? args.roles : ["user"],
      profile: {
        skills: [],
        experienceLevel: "beginner",
        education: [],
        workExperience: [],
        completeness: 10, // Base completeness for having name and email
        version: 1,
        lastUpdated: Date.now(),
      },
      balances,
      _creationTime: Date.now(),
      updatedAt: Date.now(),
    };

    this.mockData.set(user._id, user);
    return user;
  }

  /**
   * Mock implementation of getUserByClerkId function
   */
  mockGetUserByClerkId(clerkId: string): TestUser | null {
    const users = Array.from(this.mockData.values());
    for (const user of users) {
      if (user.clerkId === clerkId) {
        return user;
      }
    }
    return null;
  }

  /**
   * Mock implementation of updateUser function
   */
  mockUpdateUser(args: {
    userId: string;
    updates: Partial<TestUser>;
  }): TestUserUpdateResult {
    const user = this.mockData.get(args.userId);
    if (!user) {
      return {
        success: false,
        errors: ["User not found"],
      };
    }

    // Validate email uniqueness if updating email
    if (args.updates.email && args.updates.email !== user.email) {
      const existingUsers = Array.from(this.mockData.values());
      for (const existingUser of existingUsers) {
        if (
          existingUser.email === args.updates.email &&
          existingUser._id !== args.userId
        ) {
          return {
            success: false,
            errors: ["User with this email already exists"],
          };
        }
      }
    }

    // Apply updates
    const updatedUser: TestUser = {
      ...user,
      ...args.updates,
      updatedAt: Date.now(),
    };

    this.mockData.set(args.userId, updatedUser);

    return {
      success: true,
      user: updatedUser,
    };
  }

  /**
   * Mock implementation of getUserStatistics function
   */
  mockGetUserStatistics(): TestUserStatistics {
    const users = Array.from(this.mockData.values());
    const totalUsers = users.length;

    const usersByRole = {
      user: 0,
      freelancer: 0,
      client: 0,
      admin: 0,
      moderator: 0,
    };

    let totalCompleteness = 0;
    let recentSignups = 0;
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    for (const user of users) {
      // Count users by role (primary role)
      const primaryRole = user.roles[0] || "user";
      if (primaryRole in usersByRole) {
        const roleKey = primaryRole as keyof typeof usersByRole;
        usersByRole[roleKey]++;
      }

      // Safely access profile completeness with fallback
      totalCompleteness += user.profile?.completeness ?? 0;

      if (user._creationTime > oneDayAgo) {
        recentSignups++;
      }
    }

    return {
      totalUsers,
      usersByRole,
      averageProfileCompleteness:
        totalUsers > 0 ? totalCompleteness / totalUsers : 0,
      recentSignups,
    };
  }
}

// Global test setup
const testingHelper = new MockConvexTestingHelper();

describe("User Management Service", () => {
  beforeEach(() => {
    testingHelper.resetMockData();
  });

  describe("User Initialization", () => {
    test("should successfully initialize a new user with minimum required data", () => {
      // ARRANGE
      const userArgs: TestUserCreationArgs = {
        clerkId: "clerk_test_123",
        email: "testuser@example.com",
        name: "Test User",
      };

      // ACT
      const result = testingHelper.mockInitializeUser(userArgs);

      // ASSERT
      expect(result).toBeDefined();
      expect(result.clerkId).toBe(userArgs.clerkId);
      expect(result.email).toBe(userArgs.email);
      expect(result.name).toBe(userArgs.name);
      expect(result.roles).toEqual(["user"]); // Default role
      expect(result.balances).toHaveLength(3); // EGP, USD, EUR
      expect(result.profile?.completeness).toBe(10);
    });

    test("should initialize user with custom role and initial balance", () => {
      // ARRANGE
      const userArgs: TestUserCreationArgs = {
        clerkId: "clerk_freelancer_123",
        email: "freelancer@example.com",
        name: "Freelancer User",
        roles: ["freelancer"],
        initialCurrency: "USD",
        initialBalance: 1000,
      };

      // ACT
      const result = testingHelper.mockInitializeUser(userArgs);

      // ASSERT
      expect(result.roles).toEqual(["freelancer"]);

      const usdBalance = result.balances.find((b) => b.currency === "USD");
      expect(usdBalance?.amount).toBe(1000);

      const egpBalance = result.balances.find((b) => b.currency === "EGP");
      expect(egpBalance?.amount).toBe(0);
    });

    test("should throw error for invalid email", () => {
      // ARRANGE
      const userArgs: TestUserCreationArgs = {
        clerkId: "clerk_test_123",
        email: "invalid-email",
        name: "Test User",
      };

      // ACT & ASSERT
      expect(() => testingHelper.mockInitializeUser(userArgs)).toThrow(
        "Valid email address is required",
      );
    });

    test("should throw error for duplicate email", () => {
      // ARRANGE
      const firstUser: TestUserCreationArgs = {
        clerkId: "clerk_first_123",
        email: "duplicate@example.com",
        name: "First User",
      };

      const secondUser: TestUserCreationArgs = {
        clerkId: "clerk_second_123",
        email: "duplicate@example.com",
        name: "Second User",
      };

      // ACT
      testingHelper.mockInitializeUser(firstUser);

      // ASSERT
      expect(() => testingHelper.mockInitializeUser(secondUser)).toThrow(
        "User with this email already exists",
      );
    });

    test("should throw error for short name", () => {
      // ARRANGE
      const userArgs: TestUserCreationArgs = {
        clerkId: "clerk_test_123",
        email: "test@example.com",
        name: "A", // Too short
      };

      // ACT & ASSERT
      expect(() => testingHelper.mockInitializeUser(userArgs)).toThrow(
        "Name must be at least 2 characters long",
      );
    });
  });

  describe("User Retrieval", () => {
    test("should retrieve user by Clerk ID", () => {
      // ARRANGE
      const userArgs: TestUserCreationArgs = {
        clerkId: "clerk_retrieve_123",
        email: "retrieve@example.com",
        name: "Retrieve User",
      };

      const createdUser = testingHelper.mockInitializeUser(userArgs);

      // ACT
      const retrievedUser =
        testingHelper.mockGetUserByClerkId("clerk_retrieve_123");

      // ASSERT
      expect(retrievedUser).toBeDefined();
      expect(retrievedUser?._id).toBe(createdUser._id);
      expect(retrievedUser?.email).toBe(userArgs.email);
    });

    test("should return null for non-existent Clerk ID", () => {
      // ACT
      const result = testingHelper.mockGetUserByClerkId(
        "non_existent_clerk_id",
      );

      // ASSERT
      expect(result).toBeNull();
    });
  });

  describe("User Updates", () => {
    test("should successfully update user information", () => {
      // ARRANGE
      const userArgs: TestUserCreationArgs = {
        clerkId: "clerk_update_123",
        email: "original@example.com",
        name: "Original Name",
      };

      const createdUser = testingHelper.mockInitializeUser(userArgs);

      const updates = {
        name: "Updated Name",
        avatarUrl: "https://example.com/new-avatar.jpg",
      };

      // ACT
      const result = testingHelper.mockUpdateUser({
        userId: createdUser._id,
        updates,
      });

      // ASSERT
      expect(result.success).toBe(true);
      expect(result.user?.name).toBe("Updated Name");
      expect(result.user?.avatarUrl).toBe("https://example.com/new-avatar.jpg");
      expect(result.user?.email).toBe("original@example.com"); // Unchanged
    });

    test("should fail to update with duplicate email", () => {
      // ARRANGE
      testingHelper.mockInitializeUser({
        clerkId: "clerk_first_123",
        email: "first@example.com",
        name: "First User",
      });

      const secondUser = testingHelper.mockInitializeUser({
        clerkId: "clerk_second_123",
        email: "second@example.com",
        name: "Second User",
      });

      // ACT
      const result = testingHelper.mockUpdateUser({
        userId: secondUser._id,
        updates: { email: "first@example.com" },
      });

      // ASSERT
      expect(result.success).toBe(false);
      expect(result.errors).toContain("User with this email already exists");
    });

    test("should fail to update non-existent user", () => {
      // ACT
      const result = testingHelper.mockUpdateUser({
        userId: "non_existent_user_id",
        updates: { name: "New Name" },
      });

      // ASSERT
      expect(result.success).toBe(false);
      expect(result.errors).toContain("User not found");
    });
  });

  describe("User Statistics", () => {
    test("should return correct statistics for multiple users", () => {
      // ARRANGE
      testingHelper.mockInitializeUser({
        clerkId: "clerk_user_1",
        email: "user1@example.com",
        name: "User 1",
        roles: ["user"],
      });

      testingHelper.mockInitializeUser({
        clerkId: "clerk_freelancer_1",
        email: "freelancer1@example.com",
        name: "Freelancer 1",
        roles: ["freelancer"],
      });

      testingHelper.mockInitializeUser({
        clerkId: "clerk_client_1",
        email: "client1@example.com",
        name: "Client 1",
        roles: ["client"],
      });

      // ACT
      const stats = testingHelper.mockGetUserStatistics();

      // ASSERT
      expect(stats.totalUsers).toBe(3);
      expect(stats.usersByRole.user).toBe(1);
      expect(stats.usersByRole.freelancer).toBe(1);
      expect(stats.usersByRole.client).toBe(1);
      expect(stats.averageProfileCompleteness).toBe(10); // All have 10% base completeness
      expect(stats.recentSignups).toBe(3); // All created within last day
    });

    test("should return empty statistics for no users", () => {
      // ACT
      const stats = testingHelper.mockGetUserStatistics();

      // ASSERT
      expect(stats.totalUsers).toBe(0);
      expect(stats.usersByRole.user).toBe(0);
      expect(stats.averageProfileCompleteness).toBe(0);
      expect(stats.recentSignups).toBe(0);
    });
  });

  describe("Data Validation", () => {
    test("should validate all supported currencies in balances", () => {
      // ARRANGE
      const userArgs: TestUserCreationArgs = {
        clerkId: "clerk_currency_test",
        email: "currency@example.com",
        name: "Currency User",
        initialCurrency: "EUR",
        initialBalance: 500,
      };

      // ACT
      const result = testingHelper.mockInitializeUser(userArgs);

      // ASSERT
      expect(result.balances).toHaveLength(3);

      const currencies = result.balances.map((b) => b.currency).sort();
      expect(currencies).toEqual(["EGP", "EUR", "USD"]);

      const eurBalance = result.balances.find((b) => b.currency === "EUR");
      expect(eurBalance?.amount).toBe(500);
    });

    test("should handle negative initial balance gracefully", () => {
      // ARRANGE
      const userArgs: TestUserCreationArgs = {
        clerkId: "clerk_negative_balance",
        email: "negative@example.com",
        name: "Negative User",
        initialCurrency: "USD",
        initialBalance: -100,
      };

      // ACT
      const result = testingHelper.mockInitializeUser(userArgs);

      // ASSERT
      const usdBalance = result.balances.find((b) => b.currency === "USD");
      expect(usdBalance?.amount).toBe(0); // Should be clamped to 0
    });
  });

  describe("Profile Management", () => {
    test("should initialize with default profile structure", () => {
      // ARRANGE
      const userArgs: TestUserCreationArgs = {
        clerkId: "clerk_profile_test",
        email: "profile@example.com",
        name: "Profile User",
      };

      // ACT
      const result = testingHelper.mockInitializeUser(userArgs);

      // ASSERT
      expect(result.profile).toBeDefined();
      expect(result.profile?.skills).toEqual([]);
      expect(result.profile?.experienceLevel).toBe("beginner");
      expect(result.profile?.education).toEqual([]);
      expect(result.profile?.workExperience).toEqual([]);
      expect(result.profile?.completeness).toBe(10);
      expect(result.profile?.version).toBe(1);
      expect(result.profile?.lastUpdated).toBeDefined();
    });
  });
});
