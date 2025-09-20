---
applyTo: "**/*.ts,**/*.tsx,**/*.js,**/*.jsx"
---

# GitHub Copilot Instructions: Zod Validation Best Practices

## Foundational Philosophy

Think of Zod as the guardian at the gates of your application, ensuring that every piece of data entering your system meets strict quality standards before it can cause problems deeper in your application logic. When generating any code that deals with external data sources, user inputs, or API communications, always approach the problem with a validation-first mindset that treats runtime type safety as equally important as compile-time type safety.

Zod represents the critical bridge between the unpredictable external world and the carefully typed internal world of your TypeScript application. Every boundary where data crosses from external sources into your application represents a potential point of failure that must be protected with comprehensive validation logic.

## Architectural Integration Patterns

Structure your Zod integration following domain-driven design principles that create clear boundaries between different areas of your application. Organize schemas in a dedicated `/schemas` directory with subdirectories that mirror your business domains. This approach creates a clear mapping between your application's conceptual model and its validation layer.

When suggesting schema organization, always create separate files for distinct business domains. Authentication schemas belong in `/schemas/auth.ts`, business logic schemas like gig management belong in `/schemas/gigs.ts`, and payment-related validation belongs in `/schemas/payments.ts`. This domain-based organization makes schemas discoverable and maintainable as your application grows in complexity.

Each schema file should follow a consistent export pattern that provides both the runtime validation schema and the compile-time TypeScript type. This dual export pattern ensures that both your validation logic and your type system stay perfectly synchronized, preventing the common problem where validation rules and type definitions drift apart over time.

```typescript
// Always provide both runtime schema and compile-time type
export const UserProfileSchema = z.object({
  id: z.string().uuid("User ID must be a valid UUID"),
  email: z.string().email("Must be a valid email address"),
  displayName: z.string().min(2, "Display name must be at least 2 characters"),
  role: z.enum(["user", "admin", "moderator"]),
  createdAt: z.string().datetime("Must be a valid ISO datetime string"),
  preferences: z
    .object({
      notifications: z.boolean(),
      theme: z.enum(["light", "dark", "system"]),
    })
    .optional(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;
```

## Defensive Programming with SafeParse

Always implement validation using Zod's `safeParse` method rather than the direct `parse` method. The `safeParse` approach embodies defensive programming principles by acknowledging that validation can fail and providing structured ways to handle those failures gracefully. This approach prevents unhandled exceptions from crashing your application while providing detailed error information for debugging and user feedback.

When suggesting validation code, always structure the error handling to distinguish between different types of validation failures. Some validation errors represent user input problems that should result in helpful error messages, while others might indicate system integration issues that should be logged for developer investigation.

```typescript
// Always use defensive validation patterns
const validateAndProcessData = async (
  rawData: unknown,
): Promise<ProcessedData | null> => {
  const validationResult = DataSchema.safeParse(rawData);

  if (!validationResult.success) {
    // Log validation failures for monitoring and debugging
    console.error("Data validation failed:", {
      errors: validationResult.error.issues,
      receivedData: rawData,
      timestamp: new Date().toISOString(),
    });

    // Determine if this is a user error or system error
    const isUserError = validationResult.error.issues.some(
      (issue) => issue.code === "invalid_type" || issue.code === "too_small",
    );

    if (isUserError) {
      // Handle as user input error
      return null;
    } else {
      // Handle as system integration error
      throw new Error(
        "Unexpected data structure received from external system",
      );
    }
  }

  return processValidatedData(validationResult.data);
};
```

## Form Integration Excellence

When generating form-related code, always integrate Zod with react-hook-form using the zodResolver. This integration creates a seamless experience where your validation schema drives both client-side form validation and server-side data processing. The integration ensures that users receive immediate feedback about validation errors while maintaining the same validation rules across your entire application stack.

Structure form schemas to provide granular, user-friendly error messages that guide users toward successful form completion. Each field should include custom error messages that explain not just what went wrong, but how to fix the problem. This approach transforms validation from a barrier into a helpful guide that improves user experience.

```typescript
// Create comprehensive form schemas with helpful error messages
export const GigCreationSchema = z.object({
  title: z
    .string()
    .min(10, "Gig title must be at least 10 characters to be descriptive")
    .max(100, "Gig title must be under 100 characters for readability"),

  description: z
    .string()
    .min(
      50,
      "Please provide at least 50 characters describing the gig requirements",
    )
    .max(2000, "Description must be under 2000 characters"),

  budget: z
    .number()
    .positive("Budget must be a positive amount")
    .min(25, "Minimum budget is $25 to ensure fair compensation")
    .max(10000, "Maximum budget is $10,000 for platform safety"),

  category: z.enum(["design", "development", "writing", "marketing"], {
    errorMap: () => ({
      message: "Please select a valid category from the available options",
    }),
  }),

  skills: z
    .array(z.string().min(1))
    .min(1, "Please specify at least one required skill")
    .max(10, "Maximum of 10 skills to keep requirements focused"),

  deadline: z
    .string()
    .datetime("Please provide a valid deadline date and time")
    .refine(
      (date) => new Date(date) > new Date(),
      "Deadline must be in the future",
    ),
});

// Always integrate with react-hook-form for seamless user experience
export const useGigCreationForm = () => {
  return useForm<z.infer<typeof GigCreationSchema>>({
    resolver: zodResolver(GigCreationSchema),
    mode: "onBlur", // Validate as users complete each field
    defaultValues: {
      title: "",
      description: "",
      budget: 0,
      skills: [],
      // Provide sensible defaults to improve user experience
    },
  });
};
```

## API Integration and Data Flow Protection

Every API integration point requires comprehensive validation that protects your application from unexpected data structures, missing fields, or type mismatches. When suggesting API integration code, always implement validation at the boundary between your application and external services. This boundary validation serves as a crucial defense mechanism that prevents corrupted or malicious data from propagating through your application.

Structure API validation to handle both successful responses and error conditions gracefully. Many applications fail to validate error responses from APIs, leading to confusing user experiences when something goes wrong. Your validation layer should provide structured handling for both success and failure scenarios.

```typescript
// Comprehensive API integration with proper error handling
const fetchUserGigs = async (userId: string): Promise<UserGig[] | null> => {
  try {
    const response = await fetch(`/api/users/${userId}/gigs`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
        "Content-Type": "application/json",
      },
    });

    // First validate the HTTP response
    if (!response.ok) {
      const errorResult = APIErrorSchema.safeParse(await response.json());
      if (errorResult.success) {
        throw new APIError(errorResult.data.message, errorResult.data.code);
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Then validate the success response data
    const rawData = await response.json();
    const validationResult = z.array(UserGigSchema).safeParse(rawData);

    if (!validationResult.success) {
      console.error("API response validation failed:", {
        endpoint: `/api/users/${userId}/gigs`,
        errors: validationResult.error.issues,
        receivedData: rawData,
      });

      // Return null to indicate failure without crashing the application
      return null;
    }

    return validationResult.data;
  } catch (error) {
    console.error("Failed to fetch user gigs:", error);
    throw error; // Re-throw to allow caller to handle appropriately
  }
};
```

## Schema Composition and Reusability

Design schemas using composition patterns that promote reusability and maintainability. Rather than creating large, monolithic schemas, build smaller, focused schemas that can be combined to create more complex validation rules. This compositional approach follows the DRY principle while making your validation logic more testable and easier to understand.

When suggesting schema composition, always consider the relationships between different data entities in your application. Common patterns include base schemas that are extended for specific use cases, partial schemas for update operations, and union schemas for handling polymorphic data structures.

```typescript
// Build reusable schema components
const BaseEntitySchema = z.object({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const UserBaseSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(2).max(50),
  avatar: z.string().url().optional(),
});

// Compose schemas for different contexts
export const UserProfileSchema = BaseEntitySchema.extend({
  ...UserBaseSchema.shape,
  role: z.enum(["freelancer", "client", "admin"]),
  verified: z.boolean(),
  rating: z.number().min(0).max(5).optional(),
});

export const UserRegistrationSchema = UserBaseSchema.extend({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain uppercase, lowercase, and number",
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords must match",
  path: ["confirmPassword"],
});

// Create partial schemas for update operations
export const UserUpdateSchema = UserProfileSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();
```

## Error Handling and User Experience

Transform validation errors into actionable user guidance through sophisticated error handling patterns. When validation fails, users should receive clear, specific feedback that helps them understand exactly what needs to be corrected and how to fix it. This approach turns validation from a frustrating obstacle into a helpful guide that improves the overall user experience.

Structure error handling to provide different levels of detail depending on the context. Form validation errors should be user-friendly and actionable, while API validation errors might need more technical detail for debugging purposes. Always consider who will be consuming the error information and tailor the message accordingly.

```typescript
// Transform Zod errors into user-friendly messages
export const formatValidationErrors = (
  error: ZodError,
): Record<string, string> => {
  const errors: Record<string, string> = {};

  error.issues.forEach((issue) => {
    const path = issue.path.join(".");

    // Provide context-specific error messages
    switch (issue.code) {
      case "too_small":
        if (issue.type === "string") {
          errors[path] =
            `This field must be at least ${issue.minimum} characters long`;
        } else if (issue.type === "number") {
          errors[path] = `Value must be at least ${issue.minimum}`;
        }
        break;

      case "too_big":
        if (issue.type === "string") {
          errors[path] =
            `This field must be no more than ${issue.maximum} characters long`;
        } else if (issue.type === "number") {
          errors[path] = `Value must be no more than ${issue.maximum}`;
        }
        break;

      case "invalid_string":
        if (issue.validation === "email") {
          errors[path] = "Please enter a valid email address";
        } else if (issue.validation === "url") {
          errors[path] = "Please enter a valid URL";
        }
        break;

      default:
        errors[path] = issue.message || "This field contains an error";
    }
  });

  return errors;
};
```

## Performance and Optimization Considerations

Design validation schemas with performance in mind, especially for frequently validated data or large datasets. While Zod provides excellent runtime safety, complex validation logic can become a performance bottleneck if not implemented thoughtfully. Consider the performance implications of your validation choices and implement optimization strategies where appropriate.

When suggesting validation for high-frequency operations, implement caching strategies for schema compilation and consider lazy validation patterns for optional or expensive validation operations. This approach ensures that your validation layer enhances application reliability without compromising performance.

Remember that Zod schemas are JavaScript objects that can be expensive to create repeatedly. In performance-critical paths, consider pre-compiling schemas and reusing them rather than creating new schema instances for each validation operation.

## Integration with Modern Development Tools

Always reference the official Zod documentation at https://zod.dev for the most current API patterns and best practices. The Zod ecosystem evolves rapidly, with new features and optimization patterns being introduced regularly. Staying current with the official documentation ensures that your validation patterns take advantage of the latest capabilities.

When integrating with React Hook Form, reference the resolver documentation at https://react-hook-form.com/docs/useform#resolver to understand the most effective integration patterns. The combination of Zod and React Hook Form creates a powerful validation experience, but the integration patterns continue to evolve with new versions of both libraries.

For server-side validation in frameworks like Next.js or when using backend services like Convex, always implement the same validation schemas on both client and server sides. This dual validation approach provides immediate user feedback while maintaining security and data integrity on the server side.

The key to successful Zod integration lies in treating validation as a fundamental architectural concern rather than an afterthought. Every piece of code that handles external data should be designed with validation as a core requirement, creating applications that are both user-friendly and resilient to unexpected data conditions.
