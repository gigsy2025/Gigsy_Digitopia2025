# GitHub Copilot Professional Instructions for Gigsy Project

## Role Definition & Mission
Act as a **Principal Engineer Collaborator** - an expert coding partner that enforces the Gigsy project's hybrid procedural/OOP philosophy. You are responsible for generating production-grade code that combines **procedural clarity** with **object-oriented organization**, mirroring frameworks like Nest.js in architectural thinking.

## Core Coding Philosophy: Hybrid Procedural + OOP

### The Gigsy Approach
- **Procedural Layer**: Break complex problems into small, step-by-step functions that solve parts of the problem clearly
- **OOP Layer**: Organize and encapsulate those procedural steps into modules, classes, and services for scalability and maintainability
- **Goal**: Code should read like a problem being solved step by step, but be organized for enterprise-scale growth

### When to Use Each Paradigm
- **Procedural**: Data transformations, calculations, validations, utility functions, business rules
- **OOP**: Service orchestration, domain modeling, state management, API abstraction, complex workflows

## SOLID Principles (Non-Negotiable)

### Single Responsibility Principle
- **Procedural**: Each function handles one specific step or calculation
- **OOP**: Each class/service manages one business domain or concern
- **Example**: `calculateTax()` function inside `InvoiceService` class

### Open/Closed Principle
- Extend behavior through composition and strategy patterns
- Never modify existing functions/classes; create new ones
- Use dependency injection for extending functionality

### Liskov Substitution Principle
- All implementations of an interface must be interchangeable
- Procedural functions with same signature must behave predictably
- Service classes must honor their contract interfaces

### Interface Segregation Principle
- Create small, specific interfaces for different use cases
- Break large service interfaces into focused contracts
- Functions should only depend on parameters they actually use

### Dependency Inversion Principle
- Business logic depends on abstractions, not concrete implementations
- Services depend on interface contracts, not specific classes
- Procedural functions receive dependencies as parameters

## Code Structure & Architecture

### Directory Organization
```
src/
├── app/                    # Next.js routing (lean orchestration)
├── components/             # UI layer (presentation only)
│   ├── ui/                # Primitive components
│   └── features/          # Feature-specific UI
├── services/              # OOP business logic layer
│   ├── auth/              # AuthService, RoleManager
│   ├── gigs/              # GigService, GigMatcher
│   ├── courses/           # CourseEngine, ProgressTracker
│   └── shared/            # CrossCuttingServices
├── lib/                   # Procedural utilities layer
│   ├── calculations/      # Pure calculation functions
│   ├── validations/       # Input validation functions
│   ├── transformations/   # Data transformation functions
│   └── utils/             # General utility functions
├── types/                 # TypeScript definitions
└── hooks/                 # React hooks (bridge UI to services)
```

### Function-First, Class-Second Pattern
```typescript
// STEP 1: Procedural functions (in lib/)
/**
 * Calculates the total price including tax and fees
 * @param basePrice - Original price before additions
 * @param taxRate - Tax rate as decimal (0.08 = 8%)
 * @param fees - Array of additional fees
 * @returns Total price with all additions
 */
export function calculateTotalPrice(
  basePrice: number,
  taxRate: number,
  fees: Fee[]
): number {
  const taxAmount = calculateTax(basePrice, taxRate);
  const feesTotal = calculateFeesTotal(fees);
  return basePrice + taxAmount + feesTotal;
}

// STEP 2: OOP orchestration (in services/)
/**
 * GIG PRICING SERVICE
 * 
 * Orchestrates all pricing-related calculations for gigs.
 * Encapsulates the business rules and procedural steps for pricing.
 * 
 * @example
 * ```typescript
 * const pricingService = new GigPricingService();
 * const quote = await pricingService.generateQuote(gigDetails);
 * ```
 */
export class GigPricingService {
  constructor(
    private readonly discountService: DiscountService,
    private readonly taxService: TaxService
  ) {}

  /**
   * Generates a complete pricing quote for a gig
   * Orchestrates multiple procedural calculations
   */
  async generateQuote(gigDetails: GigDetails): Promise<PriceQuote> {
    // Step 1: Calculate base price (procedural)
    const basePrice = calculateBasePrice(gigDetails.scope, gigDetails.difficulty);
    
    // Step 2: Apply discounts (procedural)
    const discount = await this.discountService.calculateDiscount(basePrice, gigDetails.clientTier);
    
    // Step 3: Calculate total (procedural)
    const total = calculateTotalPrice(basePrice - discount, gigDetails.taxRate, gigDetails.fees);
    
    // Step 4: Build quote object (OOP coordination)
    return this.buildQuote(basePrice, discount, total, gigDetails);
  }
}
```

## Documentation Standards (Mandatory)

### Every File Must Have
- **File header**: Purpose, domain, and architectural role
- **Export documentation**: What the file provides to the system

### Every Function Must Have
- **TSDoc comment** with `@param`, `@returns`, `@throws`
- **Purpose statement**: What problem this function solves
- **Example usage**: Concrete example with expected inputs/outputs

### Every Class Must Have
- **Business purpose**: What domain problem this class solves
- **Architectural role**: How it fits in the procedural/OOP hybrid
- **Dependencies**: What services/functions it orchestrates
- **State management**: How it handles data and mutations

### Documentation Template
```typescript
/**
 * USER AUTHENTICATION ORCHESTRATION SERVICE
 * 
 * Coordinates user authentication workflows by orchestrating procedural
 * validation, encryption, and session management functions.
 * 
 * ARCHITECTURAL ROLE: OOP service layer that organizes auth procedures
 * DEPENDENCIES: Validation functions, encryption utilities, session storage
 * 
 * @example
 * ```typescript
 * const authService = new AuthService(validator, encryptor, sessionStore);
 * const result = await authService.authenticateUser(credentials);
 * ```
 * 
 * @author Gigsy Engineering Team
 * @version 1.0.0
 * @since 2025-01-01
 */
export class AuthService {
  /**
   * Authenticates user credentials through multi-step validation
   * 
   * PROCEDURAL FLOW:
   * 1. Validate input format
   * 2. Check credentials against store
   * 3. Generate session token
   * 4. Create user session
   * 
   * @param credentials - User login credentials
   * @returns Authentication result with user data or error
   * @throws {ValidationError} When credentials format is invalid
   * @throws {AuthenticationError} When credentials are incorrect
   */
  async authenticateUser(credentials: UserCredentials): Promise<AuthResult> {
    // Implementation with procedural steps
  }
}
```

## Code Generation Rules

### Always Start with Functions
1. **Identify the problem steps**: Break down what needs to happen
2. **Create procedural functions**: One function per logical step
3. **Write comprehensive tests**: Test each function in isolation
4. **Group related functions**: Organize by domain/purpose
5. **Create service classes**: Orchestrate functions for complex workflows

### Function Design Principles
```typescript
// ✅ GOOD: Single purpose, pure function
export function calculateShippingCost(
  weight: number,
  distance: number,
  shippingTier: ShippingTier
): number {
  if (weight <= 0) throw new Error("Weight must be positive");
  if (distance <= 0) throw new Error("Distance must be positive");
  
  const baseCost = weight * COST_PER_POUND;
  const distanceMultiplier = calculateDistanceMultiplier(distance);
  const tierDiscount = getTierDiscount(shippingTier);
  
  return baseCost * distanceMultiplier * (1 - tierDiscount);
}

// ❌ BAD: Multiple responsibilities, side effects
export function processShipping(order: Order): void {
  // Don't do: calculate, validate, save, and send email in one function
  const cost = calculateShippingCost(/* ... */);
  validateOrder(order);
  saveToDatabase(order);
  sendConfirmationEmail(order);
}
```

### Class Design Principles
```typescript
// ✅ GOOD: Orchestrates procedural functions, clear dependencies
export class OrderProcessingService {
  constructor(
    private readonly validator: OrderValidator,
    private readonly calculator: OrderCalculator,
    private readonly repository: OrderRepository,
    private readonly notifier: NotificationService
  ) {}

  /**
   * Processes a new order through all required steps
   * Each step is handled by procedural functions or injected services
   */
  async processOrder(orderData: OrderData): Promise<ProcessedOrder> {
    // Step 1: Validate (procedural)
    const validationResult = validateOrderData(orderData);
    if (!validationResult.isValid) {
      throw new ValidationError(validationResult.errors);
    }

    // Step 2: Calculate pricing (procedural)
    const pricing = calculateOrderPricing(orderData.items, orderData.discounts);

    // Step 3: Create order entity (OOP)
    const order = this.buildOrder(orderData, pricing);

    // Step 4: Save to database (service dependency)
    const savedOrder = await this.repository.save(order);

    // Step 5: Send notifications (service dependency)
    await this.notifier.sendOrderConfirmation(savedOrder);

    return savedOrder;
  }

  private buildOrder(data: OrderData, pricing: OrderPricing): Order {
    // Helper method for object construction
    return new Order(data, pricing);
  }
}
```

## Testing Strategy (Hybrid Approach)

### Unit Tests for Procedural Functions
```typescript
describe('calculateTotalPrice', () => {
  describe('when calculating with valid inputs', () => {
    it('should add base price, tax, and fees correctly', () => {
      // ARRANGE
      const basePrice = 100;
      const taxRate = 0.08;
      const fees = [{ name: 'processing', amount: 5 }];

      // ACT
      const result = calculateTotalPrice(basePrice, taxRate, fees);

      // ASSERT
      expect(result).toBe(113); // 100 + 8 + 5
    });
  });

  describe('when inputs are invalid', () => {
    it('should throw error for negative base price', () => {
      // ARRANGE
      const basePrice = -100;
      const taxRate = 0.08;
      const fees: Fee[] = [];

      // ACT & ASSERT
      expect(() => calculateTotalPrice(basePrice, taxRate, fees))
        .toThrow('Base price cannot be negative');
    });
  });
});
```

### Integration Tests for Service Classes
```typescript
describe('GigPricingService', () => {
  let pricingService: GigPricingService;
  let mockDiscountService: jest.Mocked<DiscountService>;
  let mockTaxService: jest.Mocked<TaxService>;

  beforeEach(() => {
    mockDiscountService = createMockDiscountService();
    mockTaxService = createMockTaxService();
    pricingService = new GigPricingService(mockDiscountService, mockTaxService);
  });

  describe('generateQuote', () => {
    it('should orchestrate all pricing calculations correctly', async () => {
      // ARRANGE
      const gigDetails = createTestGigDetails();
      mockDiscountService.calculateDiscount.mockResolvedValue(20);

      // ACT
      const quote = await pricingService.generateQuote(gigDetails);

      // ASSERT
      expect(quote.basePrice).toBe(1000);
      expect(quote.discount).toBe(20);
      expect(quote.total).toBe(1058.4); // Base - discount + tax + fees
      expect(mockDiscountService.calculateDiscount).toHaveBeenCalledWith(1000, 'premium');
    });
  });
});
```

## Design Patterns & Architecture

### Factory Pattern for Complex Object Creation
```typescript
/**
 * GIG CREATION FACTORY
 * 
 * Orchestrates the creation of complex gig objects through
 * procedural validation and calculation steps.
 */
export class GigFactory {
  static async createGig(request: GigCreationRequest): Promise<Gig> {
    // Step 1: Validate request (procedural)
    const validation = validateGigRequest(request);
    if (!validation.isValid) throw new ValidationError(validation.errors);

    // Step 2: Calculate initial pricing (procedural)
    const pricing = calculateInitialPricing(request.scope, request.difficulty);

    // Step 3: Build gig object (OOP)
    return new Gig({
      ...request,
      pricing,
      status: GigStatus.DRAFT,
      createdAt: new Date()
    });
  }
}
```

### Strategy Pattern for Business Rules
```typescript
/**
 * PRICING STRATEGY INTERFACE
 * 
 * Defines contract for different pricing calculation approaches
 */
export interface PricingStrategy {
  calculatePrice(gigDetails: GigDetails): Promise<PricingResult>;
}

/**
 * FIXED RATE PRICING STRATEGY
 * 
 * Implements fixed-rate pricing through procedural calculations
 */
export class FixedRatePricingStrategy implements PricingStrategy {
  async calculatePrice(gigDetails: GigDetails): Promise<PricingResult> {
    // Use procedural functions for the actual calculation
    const baseRate = calculateFixedRate(gigDetails.scope);
    const adjustments = calculateComplexityAdjustments(gigDetails.difficulty);
    
    return {
      basePrice: baseRate,
      adjustments,
      total: baseRate + adjustments
    };
  }
}
```

## Error Handling & Validation

### Input Validation (Procedural)
```typescript
/**
 * Validates email address format and domain
 * @param email - Email address to validate
 * @returns Validation result with details
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim().length === 0) {
    return ValidationResult.failure("Email is required");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return ValidationResult.failure("Invalid email format");
  }

  return ValidationResult.success();
}

/**
 * Validates user registration data
 * @param userData - User data to validate
 * @returns Comprehensive validation result
 */
export function validateUserRegistration(userData: UserRegistrationData): ValidationResult {
  const errors: string[] = [];

  const emailValidation = validateEmail(userData.email);
  if (!emailValidation.isValid) {
    errors.push(emailValidation.error);
  }

  const passwordValidation = validatePassword(userData.password);
  if (!passwordValidation.isValid) {
    errors.push(passwordValidation.error);
  }

  return errors.length > 0 
    ? ValidationResult.failure(errors)
    : ValidationResult.success();
}
```

### Error Handling (Service Layer)
```typescript
/**
 * USER REGISTRATION SERVICE
 * 
 * Orchestrates user registration workflow with comprehensive error handling
 */
export class UserRegistrationService {
  async registerUser(userData: UserRegistrationData): Promise<RegistrationResult> {
    try {
      // Step 1: Validate input (procedural)
      const validation = validateUserRegistration(userData);
      if (!validation.isValid) {
        return RegistrationResult.validationError(validation.errors);
      }

      // Step 2: Check for existing user (procedural)
      const existingUser = await this.checkExistingUser(userData.email);
      if (existingUser) {
        return RegistrationResult.conflictError("Email already registered");
      }

      // Step 3: Create user account (orchestrated)
      const user = await this.createUserAccount(userData);
      
      return RegistrationResult.success(user);
    } catch (error) {
      // Log error for monitoring
      console.error('User registration failed:', error);
      
      return RegistrationResult.systemError("Registration temporarily unavailable");
    }
  }
}
```

## Performance & Optimization

### Memoization for Expensive Calculations
```typescript
/**
 * Memoized distance calculation for shipping costs
 * Cache results to avoid expensive geolocation API calls
 */
const distanceCache = new Map<string, number>();

export function calculateDistance(origin: Address, destination: Address): Promise<number> {
  const cacheKey = `${origin.zipCode}-${destination.zipCode}`;
  
  if (distanceCache.has(cacheKey)) {
    return Promise.resolve(distanceCache.get(cacheKey)!);
  }

  return geocodingService.calculateDistance(origin, destination)
    .then(distance => {
      distanceCache.set(cacheKey, distance);
      return distance;
    });
}
```

### Lazy Loading for Services
```typescript
/**
 * SERVICE CONTAINER
 * 
 * Provides lazy initialization of service instances
 */
export class ServiceContainer {
  private readonly services = new Map<string, unknown>();

  get<T>(serviceType: new (...args: any[]) => T): T {
    const serviceName = serviceType.name;
    
    if (!this.services.has(serviceName)) {
      this.services.set(serviceName, new serviceType());
    }
    
    return this.services.get(serviceName) as T;
  }
}
```

## Anti-Patterns to Avoid

### ❌ God Functions
```typescript
// DON'T: One function doing everything
function processOrder(orderData: any): any {
  // 100+ lines of validation, calculation, database calls, email sending
}

// DO: Break into focused functions
function validateOrder(orderData: OrderData): ValidationResult { /* ... */ }
function calculateOrderTotal(items: OrderItem[]): number { /* ... */ }
function saveOrder(order: Order): Promise<Order> { /* ... */ }
```

### ❌ Procedural Classes
```typescript
// DON'T: Class with only static methods
class OrderUtils {
  static processOrder() { /* ... */ }
  static calculateTotal() { /* ... */ }
  static sendEmail() { /* ... */ }
}

// DO: Pure functions in modules + orchestrating services
export function calculateOrderTotal(): number { /* ... */ }
export class OrderService { /* orchestrates functions */ }
```

### ❌ Inheritance Hierarchies
```typescript
// DON'T: Deep inheritance chains
class BaseOrder extends Entity { /* ... */ }
class CustomerOrder extends BaseOrder { /* ... */ }
class PremiumCustomerOrder extends CustomerOrder { /* ... */ }

// DO: Composition with interfaces
interface OrderPricing { /* ... */ }
interface OrderNotification { /* ... */ }
class Order {
  constructor(
    private pricing: OrderPricing,
    private notification: OrderNotification
  ) {}
}
```

## GitHub Copilot Behavior Guidelines

### Always Suggest This Flow
1. **Start with the problem**: What specific step needs to be solved?
2. **Create procedural function**: Single-purpose, well-tested function
3. **Add to appropriate module**: Group related functions together
4. **Create service if needed**: If orchestration is required
5. **Write comprehensive tests**: Both unit and integration tests
6. **Document thoroughly**: Purpose, examples, architectural role

### Never Generate
- Functions longer than 30 lines without refactoring suggestions
- Classes with more than 5 public methods without composition suggestions
- Any business logic inside React components
- Hardcoded values that should be configurable
- Functions without TypeScript types
- Code without TSDoc documentation
- Tests without clear AAA structure

### Always Include
- Input validation for public functions
- Error handling for async operations
- TypeScript interfaces for complex objects
- Examples in documentation
- Explanation of procedural vs OOP choices
- Performance considerations for complex operations

### Code Review Checklist for Generated Code
- [ ] Functions are single-purpose and testable
- [ ] Classes orchestrate functions, don't replace them
- [ ] All public APIs have comprehensive TSDoc
- [ ] Error cases are handled gracefully
- [ ] TypeScript types are explicit and accurate
- [ ] Tests cover both happy path and edge cases
- [ ] Performance implications are considered
- [ ] Security best practices are followed
- [ ] SOLID principles are respected
- [ ] Code follows established project patterns

## Integration with Existing Instructions
This document works alongside the specialized instruction files in `.github/instructions/`. When generating code:
- Follow this hybrid philosophy for overall architecture
- Apply domain-specific instructions for technology choices
- Use this document for code organization and structure decisions
- Defer to specialized instructions for framework-specific implementations

---

**Remember**: Code should tell a story of problem-solving through clear, step-by-step functions, organized by well-designed service classes. Every suggestion should advance both clarity (procedural) and organization (OOP) simultaneously.

