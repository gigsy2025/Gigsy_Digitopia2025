---
description: "Professional Jest testing standards and best practices for Next.js TypeScript applications"
applyTo: "**/*.test.ts,**/*.test.tsx,**/*.spec.ts,**/*.spec.tsx,**/jest.config.*,**/jest.setup.*"
---

# 🧪 Jest Testing Instructions for GitHub Copilot

**Principal Engineer Standards for Scalable, Maintainable, and Type-Safe Testing**

## Core Testing Philosophy

### Test Pyramid & Strategy

- **Unit Tests (70%)**: Test individual functions, components, and hooks in isolation
- **Integration Tests (20%)**: Test component interactions and data flow
- **E2E Tests (10%)**: Test complete user workflows (separate from Jest scope)
- **Behavior-Driven**: Test what the code does, not how it does it
- **Fast Feedback**: Tests should run quickly and provide clear failure messages

### Type Safety & SOLID Principles

- **Single Responsibility**: Each test should verify one specific behavior
- **Open/Closed**: Tests should be extensible without modification
- **Liskov Substitution**: Mocks should behave like real implementations
- **Interface Segregation**: Mock only what you need for each test
- **Dependency Inversion**: Test against abstractions, not implementations

---

## 📋 Testing Standards & Requirements

### File Organization & Naming

```typescript
// ✅ CORRECT: Co-located test files
src/
├── components/
│   ├── UserProfile.tsx
│   └── UserProfile.test.tsx          // Component tests
├── hooks/
│   ├── useAuth.ts
│   └── useAuth.test.ts               // Hook tests
├── lib/
│   ├── validation.ts
│   └── validation.test.ts            // Utility tests
└── app/
    ├── api/
    │   ├── users/
    │   │   ├── route.ts
    │   │   └── route.test.ts         // API route tests
```

### Test File Structure (Mandatory)

```typescript
/**
 * @file UserProfile.test.tsx
 * @description Comprehensive tests for UserProfile component
 * @author [Your Name]
 * @created 2025-01-XX
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserProfile } from "./UserProfile";
import type { UserProfileProps } from "./UserProfile.types";

// ✅ ALWAYS: Type-safe test data
const mockUser: UserProfileProps["user"] = {
  id: "user_123",
  name: "John Doe",
  email: "john@example.com",
  role: "student",
} as const;

// ✅ ALWAYS: Describe blocks for organization
describe("UserProfile Component", () => {
  // ✅ ALWAYS: Setup and teardown
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ✅ ALWAYS: Group related tests
  describe("Rendering", () => {
    it("should display user information correctly", () => {
      // AAA Pattern: Arrange, Act, Assert
    });
  });

  describe("User Interactions", () => {
    it("should handle profile edit when user clicks edit button", async () => {
      // Test implementation
    });
  });

  describe("Error Handling", () => {
    it("should display error message when user data is invalid", () => {
      // Test implementation
    });
  });
});
```

---

## 🔧 Essential Testing Patterns

### 1. React Component Testing

```typescript
// ✅ PROPER: Complete component test with mocks
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GigCard } from '@/components/GigCard';
import { TestWrapper } from '@/test-utils/TestWrapper';

// ✅ Type-safe mock data factory
const createMockGig = (overrides = {}): Gig => ({
  id: 'gig_123',
  title: 'Frontend Developer',
  company: 'Tech Corp',
  budget: 5000,
  deadline: new Date('2025-12-31'),
  skills: ['React', 'TypeScript'],
  ...overrides,
});

describe('GigCard', () => {
  it('should display gig information and handle application', async () => {
    // ARRANGE
    const user = userEvent.setup();
    const mockGig = createMockGig();
    const mockOnApply = jest.fn();

    // ACT
    render(
      <TestWrapper>
        <GigCard gig={mockGig} onApply={mockOnApply} />
      </TestWrapper>
    );

    // ASSERT
    expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
    expect(screen.getByText('$5,000')).toBeInTheDocument();

    // User interaction
    await user.click(screen.getByRole('button', { name: /apply/i }));
    expect(mockOnApply).toHaveBeenCalledWith(mockGig.id);
  });
});
```

### 2. Custom Hook Testing

```typescript
// ✅ PROPER: Hook testing with renderHook
import { renderHook, waitFor } from '@testing-library/react';
import { useGigSearch } from '@/hooks/useGigSearch';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ✅ Test wrapper for hooks with providers
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useGigSearch Hook', () => {
  it('should fetch and filter gigs based on search criteria', async () => {
    // ARRANGE
    const searchParams = { skills: ['React'], budget: { min: 1000, max: 5000 } };

    // ACT
    const { result } = renderHook(
      () => useGigSearch(searchParams),
      { wrapper: createWrapper() }
    );

    // ASSERT
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.gigs).toHaveLength(expect.any(Number));
    expect(result.current.error).toBeNull();
  });
});
```

### 3. API Route Testing

```typescript
// ✅ PROPER: API route testing with Next.js mocks
import { createMocks } from "node-mocks-http";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/gigs/route";

// ✅ Mock external dependencies
jest.mock("@/lib/convex", () => ({
  convexClient: {
    query: jest.fn(),
    mutation: jest.fn(),
  },
}));

describe("/api/gigs API Route", () => {
  describe("GET /api/gigs", () => {
    it("should return paginated gigs with proper headers", async () => {
      // ARRANGE
      const request = new NextRequest(
        "http://localhost:3000/api/gigs?page=1&limit=10",
      );

      // ACT
      const response = await GET(request);
      const data = await response.json();

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain(
        "application/json",
      );
      expect(data).toHaveProperty("gigs");
      expect(data).toHaveProperty("pagination");
      expect(Array.isArray(data.gigs)).toBe(true);
    });
  });

  describe("POST /api/gigs", () => {
    it("should create gig with valid data and return 201", async () => {
      // ARRANGE
      const gigData = {
        title: "Senior React Developer",
        description: "Build awesome UIs",
        budget: 10000,
        skills: ["React", "TypeScript"],
      };

      const request = new NextRequest("http://localhost:3000/api/gigs", {
        method: "POST",
        body: JSON.stringify(gigData),
        headers: { "content-type": "application/json" },
      });

      // ACT
      const response = await POST(request);
      const result = await response.json();

      // ASSERT
      expect(response.status).toBe(201);
      expect(result).toHaveProperty("id");
      expect(result.title).toBe(gigData.title);
    });

    it("should return 400 for invalid gig data", async () => {
      // ARRANGE
      const invalidData = { title: "" }; // Missing required fields

      const request = new NextRequest("http://localhost:3000/api/gigs", {
        method: "POST",
        body: JSON.stringify(invalidData),
        headers: { "content-type": "application/json" },
      });

      // ACT
      const response = await POST(request);
      const error = await response.json();

      // ASSERT
      expect(response.status).toBe(400);
      expect(error).toHaveProperty("message");
      expect(error.message).toContain("validation");
    });
  });
});
```

### 4. State Management Testing (Jotai)

```typescript
// ✅ PROPER: Jotai atom testing
import { renderHook, act } from "@testing-library/react";
import { useAtom } from "jotai";
import { userAtom, updateUserProfileAction } from "@/state/userAtom";
import { TestProviders } from "@/test-utils/TestProviders";

describe("User State Management", () => {
  it("should update user profile through atom action", async () => {
    // ARRANGE
    const { result } = renderHook(
      () => ({
        user: useAtom(userAtom),
        updateProfile: useAtom(updateUserProfileAction),
      }),
      { wrapper: TestProviders },
    );

    const newProfile = { name: "John Updated", skills: ["React", "Node.js"] };

    // ACT
    await act(async () => {
      await result.current.updateProfile[1](newProfile);
    });

    // ASSERT
    expect(result.current.user[0]?.name).toBe("John Updated");
    expect(result.current.user[0]?.skills).toEqual(["React", "Node.js"]);
  });
});
```

---

## 🚀 Advanced Testing Patterns

### Performance Testing

```typescript
// ✅ Performance-critical components
import { render } from '@testing-library/react';
import { performance } from 'perf_hooks';

describe('GigList Performance', () => {
  it('should render 1000 gigs within acceptable time', () => {
    // ARRANGE
    const manyGigs = Array.from({ length: 1000 }, (_, i) =>
      createMockGig({ id: `gig_${i}` })
    );

    // ACT & MEASURE
    const startTime = performance.now();
    render(<GigList gigs={manyGigs} />);
    const endTime = performance.now();

    // ASSERT
    const renderTime = endTime - startTime;
    expect(renderTime).toBeLessThan(100); // Should render in under 100ms
  });
});
```

### Error Boundary Testing

```typescript
// ✅ Error boundary testing
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  it('should catch and display error message', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    // ARRANGE & ACT
    render(
      <ErrorBoundary fallback={<div>Something went wrong</div>}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // ASSERT
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});
```

---

## 🛡️ Mocking Strategy

### External Services

```typescript
// ✅ Convex Database Mocking
jest.mock("@/convex/_generated/api", () => ({
  api: {
    gigs: {
      list: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    users: {
      getProfile: jest.fn(),
      updateProfile: jest.fn(),
    },
  },
}));

// ✅ Clerk Authentication Mocking
jest.mock("@clerk/nextjs", () => ({
  useUser: jest.fn(() => ({
    user: {
      id: "user_123",
      emailAddresses: [{ emailAddress: "test@example.com" }],
      firstName: "Test",
      lastName: "User",
    },
    isLoaded: true,
    isSignedIn: true,
  })),
  useAuth: jest.fn(() => ({
    userId: "user_123",
    isLoaded: true,
    isSignedIn: true,
  })),
}));

// ✅ Sentry Error Tracking Mocking
jest.mock("@sentry/nextjs", () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  withScope: jest.fn((callback) =>
    callback({
      setTag: jest.fn(),
      setLevel: jest.fn(),
      setContext: jest.fn(),
    }),
  ),
}));
```

### Test Utilities

```typescript
// ✅ Create comprehensive test utilities
// @/test-utils/TestWrapper.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from '@/components/theme-provider';

export const TestWrapper: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <ClerkProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="light">
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
};

// ✅ Custom render function
export const renderWithProviders = (ui: React.ReactElement) => {
  return render(ui, { wrapper: TestWrapper });
};
```

---

## 📊 Test Quality Metrics

### Coverage Requirements

- **Statements**: Minimum 85%
- **Branches**: Minimum 80%
- **Functions**: Minimum 90%
- **Lines**: Minimum 85%

### Performance Benchmarks

- **Unit tests**: < 10ms per test
- **Integration tests**: < 100ms per test
- **Test suite**: < 30 seconds total runtime

---

## ✅ Code Review Checklist for Tests

### Test Structure & Quality

- [ ] Tests follow AAA pattern (Arrange, Act, Assert)
- [ ] Each test has a clear, descriptive name
- [ ] Tests are isolated and don't depend on other tests
- [ ] Mocks are properly cleaned up between tests
- [ ] Edge cases and error conditions are tested

### Type Safety & Best Practices

- [ ] All test data is properly typed
- [ ] Mock implementations match real interface signatures
- [ ] No `any` types used in test code
- [ ] Test utilities are reusable and well-documented

### Maintainability

- [ ] Tests are easy to understand and modify
- [ ] Test data factories are used for complex objects
- [ ] Tests focus on behavior, not implementation details
- [ ] Tests will survive reasonable refactoring

---

## 🚫 Anti-Patterns to Avoid

### Common Mistakes

```typescript
// ❌ BAD: Testing implementation details
expect(component.state.isLoading).toBe(true);

// ✅ GOOD: Testing behavior
expect(screen.getByText("Loading...")).toBeInTheDocument();

// ❌ BAD: Overly complex test setup
const setupComplexTest = () => {
  const mockService = new MockService();
  mockService.setupMethod1();
  mockService.setupMethod2();
  // ... 20 more lines
};

// ✅ GOOD: Simple, focused test setup
const mockApiCall = jest.fn().mockResolvedValue(mockData);

// ❌ BAD: Testing multiple behaviors in one test
it("should do everything", () => {
  // Testing 5 different things
});

// ✅ GOOD: One behavior per test
it("should display user name when user is loaded", () => {
  // Single focused test
});
```

---

## 📚 Documentation & References

### Required Reading

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro)
- [Next.js Testing Guide](https://nextjs.org/docs/testing)
- [Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)

### Project-Specific Patterns

- Use `@/test-utils` for all shared testing utilities
- Follow the established mocking patterns for Convex, Clerk, and Sentry
- Always use TypeScript for test files
- Maintain test coverage above 85% for critical business logic

---

## 🤖 Copilot-Specific Guidelines

When generating test code, GitHub Copilot should:

1. **Always suggest complete test suites** with describe blocks and proper organization
2. **Generate type-safe mock data** using factories and proper TypeScript types
3. **Include proper setup/teardown** with beforeEach/afterEach hooks
4. **Use React Testing Library** best practices for component testing
5. **Follow AAA pattern** consistently in all test cases
6. **Mock external dependencies** appropriately for the testing scope
7. **Generate meaningful test descriptions** that explain what is being tested
8. **Include edge cases and error handling** tests
9. **Suggest performance tests** for critical paths
10. **Follow the established project patterns** for consistency

### Example Prompt Enhancement

Instead of generating:

```typescript
test("it works", () => {
  expect(true).toBe(true);
});
```

Generate:

```typescript
describe("UserProfileForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Form Validation", () => {
    it("should display validation errors for invalid email format", async () => {
      // Comprehensive test implementation
    });
  });
});
```

---

**Remember**: Tests are not just verification tools—they're documentation of how your code should behave. Write them with the same care and attention as production code.
