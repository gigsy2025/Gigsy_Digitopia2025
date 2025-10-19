# Users Schema Review & Improvements

## Overview

This document provides a comprehensive review of the users schema in the Gigsy platform, highlighting improvements made to enhance type safety, performance, and maintainability.

## Schema Structure Analysis

### ✅ **Strengths Identified**

1. **Well-Organized Structure**: Clear sectional organization with descriptive comments
2. **Comprehensive Profile Data**: Covers all career growth service requirements
3. **Standard System Fields**: Proper auditing with `createdBy`, `updatedAt`, `deletedAt`
4. **Soft Delete Support**: Implements soft deletes for data preservation
5. **Vector Embeddings**: Support for AI-driven profile matching

### 🔧 **Improvements Made**

#### **1. Enhanced Type Safety**

**Before:**

```typescript
roles: v.array(v.string());
experienceLevel: v.string();
currency: v.string();
```

**After:**

```typescript
roles: v.array(
  v.union(
    v.literal("user"),
    v.literal("admin"),
    v.literal("moderator"),
    v.literal("freelancer"),
    v.literal("client"),
  ),
);
experienceLevel: v.union(
  v.literal("beginner"),
  v.literal("intermediate"),
  v.literal("advanced"),
  v.literal("expert"),
);
currency: v.union(v.literal("EGP"), v.literal("USD"), v.literal("EUR"));
```

**Benefits:**

- Prevents invalid role assignments
- Ensures data consistency
- Enables better query optimization
- Provides compile-time validation

#### **2. Enhanced Indexing Strategy**

**Added Indexes:**

```typescript
.index("by_clerk_id", ["clerkId"])        // Authentication lookups
.index("by_email", ["email"])             // Email-based queries
.index("by_deleted_status", ["deletedAt"]) // Soft delete filtering
.index("by_roles", ["roles"])             // Role-based access control
.index("by_updated_at", ["updatedAt"])    // Cache invalidation
```

**Performance Benefits:**

- Faster authentication lookups
- Efficient role-based filtering
- Optimized soft delete queries
- Better cache invalidation strategies

#### **3. Profile Metadata Enhancement**

**Added Fields:**

```typescript
completeness: v.optional(v.number()); // Cached completeness (0-100)
lastUpdated: v.optional(v.number()); // Profile update tracking
version: v.optional(v.number()); // Schema versioning
```

**Benefits:**

- Enables profile completeness tracking
- Supports schema migrations
- Improves user experience with progress indicators

## Data Integrity Considerations

### **Required Fields Validation**

- `clerkId`: Must be unique and non-empty
- `email`: Must be valid email format and unique
- `name`: Must be non-empty
- `roles`: Must contain at least one valid role
- `balance.amount`: Should be non-negative

### **Optional Fields Guidelines**

- `avatarUrl`: Should be valid URL when provided
- `profile`: Can be null for new users
- `profile.skills`: Should contain normalized skill strings
- `profile.location.timezone`: Should be valid IANA timezone

## Performance Optimization

### **Index Usage Patterns**

1. **Authentication Queries**

   ```typescript
   // Use by_clerk_id index
   ctx.db
     .query("users")
     .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId));
   ```

2. **Role-Based Access Control**

   ```typescript
   // Use by_roles index
   ctx.db.query("users").withIndex("by_roles", (q) => q.eq("roles", "admin"));
   ```

3. **Active Users Only**
   ```typescript
   // Use by_deleted_status index
   ctx.db
     .query("users")
     .withIndex("by_deleted_status", (q) => q.eq("deletedAt", undefined));
   ```

### **Query Optimization Tips**

1. Always filter by `deletedAt` for active users
2. Use specific indexes for role-based queries
3. Cache profile completeness to avoid recalculation
4. Leverage embedding fields for AI-driven matching

## Security Considerations

### **Access Control**

- Roles are strictly typed and validated
- Profile data is optional and user-controlled
- Balance information requires proper authorization
- Embedding data should not contain PII

### **Data Privacy**

- Profile bio/headline should be sanitized
- Location data should be generalized (city-level)
- Portfolio URLs should be validated
- Education/work history should exclude sensitive details

## Migration Strategy

### **Existing Data Migration**

1. Add default values for new required fields
2. Set `version: 1` for existing profiles
3. Calculate and cache completeness scores
4. Validate and normalize existing role data

### **Future Schema Changes**

- Use `profile.version` for tracking schema updates
- Implement backward compatibility for older versions
- Plan deprecation strategy for unused fields

## Best Practices

### **Creating Users**

```typescript
const user = await ctx.db.insert("users", {
  clerkId: "user_xyz",
  email: "user@example.com",
  name: "John Doe",
  roles: ["user"],
  balance: { amount: 0, currency: "EGP" },
  updatedAt: Date.now(),
  createdBy: "user_xyz",
});
```

### **Updating Profiles**

```typescript
const profile = {
  bio: "Software engineer passionate about web development",
  skills: ["javascript", "typescript", "react"],
  experienceLevel: "intermediate" as const,
  completeness: 65,
  lastUpdated: Date.now(),
  version: 1,
};

await ctx.db.patch(userId, {
  profile,
  updatedAt: Date.now(),
});
```

### **Querying Active Users**

```typescript
const activeUsers = await ctx.db
  .query("users")
  .withIndex("by_deleted_status", (q) => q.eq("deletedAt", undefined))
  .collect();
```

## Supporting Files

### **Type Definitions**

- `src/types/profile.ts`: TypeScript interfaces for profile data
- Provides compile-time type safety
- Includes helper types for partial updates and search filters

### **Validation Schemas**

- `src/lib/validations/profile.ts`: Zod schemas for runtime validation
- Comprehensive validation rules with user-friendly error messages
- Profile completeness calculation utilities

## Recommendations

### **Immediate Actions**

1. ✅ **Completed**: Enhanced type safety with literal unions
2. ✅ **Completed**: Added comprehensive indexing strategy
3. ✅ **Completed**: Enhanced profile metadata tracking

### **Future Enhancements**

1. **Search Indexing**: Consider full-text search on profile fields
2. **Profile Analytics**: Track profile view/interaction metrics
3. **Skills Normalization**: Implement canonical skill mapping
4. **Location Services**: Integrate with geocoding APIs for timezone detection

### **Monitoring & Alerts**

1. Monitor profile completeness distribution
2. Track index usage for query optimization
3. Alert on unusual role assignment patterns
4. Monitor embedding generation performance

## Conclusion

The users schema has been significantly enhanced with improved type safety, comprehensive indexing, and better metadata tracking. These improvements provide a solid foundation for the Career Growth Service while maintaining backward compatibility and enabling future scalability.

The schema now supports:

- ✅ Strict type validation
- ✅ Efficient querying patterns
- ✅ Profile completeness tracking
- ✅ Role-based access control
- ✅ AI-driven matching capabilities
- ✅ Schema versioning for migrations

These enhancements ensure the users table can effectively support the platform's growth while maintaining data integrity and query performance.
