# Testing Guide for Gigsy

## Overview

Gigsy uses Jest as the primary testing framework for unit tests. This provides fast feedback during development and ensures code quality in our CI/CD pipeline.

## Testing Strategy

### Current: Unit Tests with Jest

**What we test:**
- Business logic functions (pricing, calculations, validations)
- React component rendering and behavior
- Utility functions and helpers
- TypeScript type safety

**What's included:**
- Jest testing framework
- React Testing Library for component tests
- TypeScript integration
- Code coverage reporting
- CI/CD integration

### Future: Integration & E2E Tests

As Gigsy grows, we'll add:
- **Integration tests** for API endpoints and database operations
- **End-to-end tests** for complete user workflows
- **Performance tests** for critical paths

## Running Tests

### Local Development

```bash
# Install dependencies
pnpm install

# Run all tests once
pnpm test

# Run tests in watch mode (recommended for development)
pnpm test:watch

# Run tests with coverage report
pnpm test:coverage

# Run tests in CI mode (what the pipeline uses)
pnpm test:ci
```

### Test Structure

```
src/
├── app/
│   └── __tests__/          # Page component tests
│       └── page.test.tsx
├── components/
│   └── __tests__/          # Component tests
│       └── *.test.tsx
├── lib/
│   └── __tests__/          # Utility function tests
│       └── utils.test.ts
└── features/
    └── [domain]/
        └── __tests__/      # Feature-specific tests
```

## Writing Tests

### Unit Test Example

```typescript
import { calculateTotalPrice } from '../utils'

describe('calculateTotalPrice', () => {
  it('should calculate price with tax correctly', () => {
    expect(calculateTotalPrice(100, 0.08)).toBe(108)
  })

  it('should throw error for negative prices', () => {
    expect(() => calculateTotalPrice(-10, 0.08))
      .toThrow('Base price cannot be negative')
  })
})
```

### Component Test Example

```typescript
import { render, screen } from '@testing-library/react'
import HomePage from '@/app/page'

describe('HomePage', () => {
  it('renders the main heading', () => {
    render(<HomePage />)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })
})
```

## Test Coverage

We maintain coverage thresholds:
- **Lines**: 70%
- **Functions**: 70%
- **Branches**: 70%
- **Statements**: 70%

View coverage reports:
```bash
pnpm test:coverage
open coverage/lcov-report/index.html
```

## CI/CD Integration

Tests run automatically on:
- Every pull request
- Every push to main/master
- Manual workflow triggers

The pipeline includes:
1. Unit tests with coverage
2. TypeScript type checking
3. Linting and formatting
4. Build verification

## Best Practices

### Test Naming
- Use descriptive test names: `should calculate tax correctly when given valid inputs`
- Group related tests with `describe` blocks
- Use AAA pattern: Arrange, Act, Assert

### Test Structure
```typescript
describe('Feature/Component', () => {
  describe('when condition X', () => {
    it('should do Y', () => {
      // Arrange
      const input = setupTestData()
      
      // Act
      const result = functionUnderTest(input)
      
      // Assert
      expect(result).toBe(expectedValue)
    })
  })
})
```

### What to Test
- **Do test**: Business logic, component behavior, edge cases, error conditions
- **Don't test**: Implementation details, third-party libraries, trivial getters/setters

### Mocking
- Mock external dependencies (APIs, modules)
- Use Jest's built-in mocking capabilities
- Keep mocks simple and focused

## Debugging Tests

```bash
# Run specific test file
pnpm test utils.test.ts

# Run tests matching pattern
pnpm test --testNamePattern="calculate"

# Debug with verbose output
pnpm test --verbose

# Update snapshots (if using snapshot testing)
pnpm test --updateSnapshot
```

## Performance

Tests should be fast:
- Unit tests: < 100ms each
- Total test suite: < 30 seconds
- Use mocks to avoid slow operations
- Parallelize test execution (Jest default)

## Next Steps

1. **Run the tests**: `pnpm test:coverage`
2. **Write tests for new features**: Follow the examples above
3. **Maintain coverage**: Keep above 70% threshold
4. **Add integration tests**: When ready for next phase

For questions or test-specific issues, check the Jest documentation or ask the team.
