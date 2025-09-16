# User Authentication & Authorization System

## Overview

This document describes the implementation of a secure, scalable, and type-safe user authentication and authorization system built on Clerk, following enterprise-grade principles and best practices.

## Architecture

### Core Principles

- **Security First**: Server-side role resolution and enforcement
- **Type Safety**: Comprehensive TypeScript interfaces and type guards
- **Performance**: Minimal client-side re-renders with server-side hydration
- **Scalability**: Clean separation of concerns and SOLID principles
- **Maintainability**: Single source of truth with clear data flow

### Data Flow

1. **Server Component** (`app/layout.tsx`) fetches user from Clerk
2. **User Resolver** (`lib/auth/userResolver.server.ts`) normalizes and validates metadata
3. **Providers** (`providers/Providers.tsx`) hydrates client context
4. **Components** consume context via typed hooks

## File Structure

```
src/
├── types/auth.ts                    # Core auth types and interfaces
├── lib/auth/
│   ├── userResolver.server.ts       # Server-side user fetching
│   └── policies.ts                  # Authorization policies
├── providers/
│   ├── Providers.tsx               # Main provider wrapper
│   └── UserContext.tsx             # User context implementation
└── app/app/layout.tsx              # Server component integration
```

## Core Types

### Role Hierarchy

```typescript
type Role = "guest" | "student" | "employer" | "admin";
```

- **guest**: Default role for unauthenticated or users without role
- **student**: Can apply to gigs and manage their profile
- **employer**: Can post gigs, hire freelancers, and manage their postings
- **admin**: Full system access with all permissions

### UserProfile Interface

```typescript
interface UserProfile {
  id: string; // Clerk user ID
  email?: string; // Primary email address
  name?: string; // Display name
  avatar?: string; // Profile image URL
  role: Role; // Normalized role (never undefined)
  verified: boolean; // Email verification status
  organizationId?: string; // Optional organization association
  fetchedAt: string; // Cache timestamp
}
```

### Permissions

Available system permissions:

- `view_public`: View public content
- `apply_gigs`: Apply to gig postings
- `post_gigs`: Create new gig postings
- `manage_gigs`: Edit/delete own gigs
- `manage_profile`: Edit user profile
- `hire_freelancers`: Review applications and hire
- `view_admin_panel`: Access admin interface
- `manage_users`: User administration
- `view_analytics`: Access analytics dashboards
- `manage_system`: System configuration

## Server-Side Components

### User Resolver

**File**: `src/lib/auth/userResolver.server.ts`

Secure server-side utility for fetching and normalizing Clerk user data:

```typescript
import { resolveCurrentUser } from "@/lib/auth/userResolver.server";

// In your server component
const user = await resolveCurrentUser();
```

**Features**:

- Validates Clerk public metadata
- Graceful fallback to "guest" role for invalid data
- Security audit logging for invalid metadata
- Error handling with typed exceptions

### Authorization Policies

**File**: `src/lib/auth/policies.ts`

Central authorization logic with audit logging:

```typescript
import { AuthorizationPolicies } from "@/lib/auth/policies";

// Check specific permissions
const canPost = AuthorizationPolicies.hasPermission(user, "post_gigs");

// Check role hierarchy
const isEmployerOrAbove = AuthorizationPolicies.hasMinimumRole(
  user,
  "employer",
);

// Business logic helpers
const canManageGigs = AuthorizationPolicies.canManageGigs(user);
```

## Client-Side Components

### UserContext Provider

**File**: `src/providers/UserContext.tsx`

React context for client-side user state with performance optimization:

```typescript
import { useUser, usePermission, useMinimumRole } from "@/providers/UserContext";

function MyComponent() {
  const { user, isAdmin, isVerified } = useUser();
  const canPostGigs = usePermission('post_gigs');
  const hasEmployerAccess = useMinimumRole('employer');

  return (
    <div>
      {canPostGigs && <button>Post Gig</button>}
    </div>
  );
}
```

### Available Hooks

#### Core Hooks

- `useUser()`: Get current user state and quick access flags
- `usePermission(permission)`: Check specific permission
- `useMinimumRole(role)`: Check role hierarchy
- `useBusinessPermissions()`: Get business-specific permission flags
- `useUserDisplay()`: Get user display information (name, avatar, initials)

#### Utility Hooks

- `useIsAuthenticated()`: Simple authentication check

### Conditional Rendering Components

#### ConditionalRender

```typescript
<ConditionalRender
  authenticated={<AuthenticatedContent />}
  unauthenticated={<SignInPrompt />}
/>
```

#### RoleGate

```typescript
<RoleGate role="employer" fallback={<AccessDenied />}>
  <EmployerDashboard />
</RoleGate>
```

#### PermissionGate

```typescript
<PermissionGate permission="manage_users" fallback={<NoAccess />}>
  <UserManagement />
</PermissionGate>
```

## Setup Instructions

### 1. Update Clerk Public Metadata

In your Clerk dashboard, ensure user public metadata includes:

```json
{
  "role": "admin" // or "student", "employer", "guest"
}
```

### 2. Update Layout Component

The app layout should already be updated, but ensure it includes:

```typescript
import Providers from "@/providers/Providers";
import { resolveCurrentUser } from "@/lib/auth/userResolver.server";

export default async function AppLayout({ children }) {
  const initialUser = await resolveCurrentUser();

  return (
    <Providers initialUser={initialUser}>
      {/* Your app content */}
    </Providers>
  );
}
```

### 3. Use in Components

```typescript
import { useUser, usePermission } from "@/providers/UserContext";

export function MyFeature() {
  const { user, isAdmin } = useUser();
  const canManageGigs = usePermission('manage_gigs');

  return (
    <div>
      {isAdmin && <AdminPanel />}
      {canManageGigs && <GigManagement />}
    </div>
  );
}
```

## Security Considerations

### ⚠️ Critical Security Rules

1. **Never rely on client context for authorization**
   - Client context is for UI convenience only
   - Always re-validate permissions server-side

2. **Server-side enforcement is authoritative**
   - All Convex functions must check permissions
   - API routes must validate user roles
   - Database operations must be protected

3. **Audit logging**
   - Invalid role attempts are logged
   - Permission denials are tracked
   - Use logs for security analysis

### Example: Convex Function Protection

```typescript
// convex/gigs.ts
import { mutation } from "./_generated/server";

export const createGig = mutation({
  args: { title: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    // Check role from Clerk metadata
    const metadata = identity.publicMetadata as any;
    if (!["employer", "admin"].includes(metadata?.role)) {
      throw new Error("Insufficient permissions");
    }

    // Proceed with gig creation
    return await ctx.db.insert("gigs", {
      ...args,
      createdBy: identity.subject,
    });
  },
});
```

## Performance Optimizations

### Server-Side Hydration

- User data is fetched once on server
- Passed to client via props (no extra network requests)
- Context value is memoized to prevent re-renders

### Caching Strategy

- Server components cache user resolution
- Client context acts as session cache
- No polling for role changes (use webhooks for real-time updates)

### Efficient Re-renders

- Context value uses `useMemo` for performance
- Permission hooks use `useMemo` for computation caching
- Conditional components minimize render cycles

## Testing

### Unit Testing

Test the server-side resolver:

```typescript
import { normalizeUserProfile } from "@/lib/auth/userResolver.server";

describe("User Resolver", () => {
  test("should normalize valid user", () => {
    const clerkUser = {
      id: "user_123",
      emailAddresses: [{ emailAddress: "test@example.com" }],
      publicMetadata: { role: "admin" },
    };

    const profile = normalizeUserProfile(clerkUser);
    expect(profile.role).toBe("admin");
  });
});
```

### Integration Testing

Test the authorization policies:

```typescript
import { AuthorizationPolicies } from "@/lib/auth/policies";

describe("Authorization Policies", () => {
  test("admin should have all permissions", () => {
    const adminUser = { role: "admin" } as UserProfile;

    expect(AuthorizationPolicies.hasPermission(adminUser, "manage_users")).toBe(
      true,
    );
    expect(AuthorizationPolicies.hasPermission(adminUser, "post_gigs")).toBe(
      true,
    );
  });
});
```

## Migration Guide

If upgrading from an existing auth system:

1. **Backup existing user data**
2. **Map existing roles to new role enum**
3. **Update Clerk public metadata for all users**
4. **Replace old auth hooks with new ones**
5. **Test authorization in all components**
6. **Update Convex functions with new permission checks**

## Troubleshooting

### Common Issues

1. **"useUser must be used within a UserProvider"**
   - Ensure component is wrapped in `<Providers>`
   - Check that Providers is in the layout component

2. **User always appears as "guest"**
   - Verify Clerk public metadata is set correctly
   - Check server-side user resolution logs
   - Ensure Clerk environment variables are configured

3. **Permissions not working**
   - Verify role is set in Clerk dashboard
   - Check server-side logs for metadata validation
   - Ensure business logic uses server-side validation

### Debug Mode

Enable debug logging by checking the browser console for:

- `[UserResolver]` - Server-side user resolution
- `[Authorization]` - Permission checks

## Future Enhancements

- **Real-time role updates** via webhooks
- **Organization-based permissions** for multi-tenant setup
- **Feature flags integration** for gradual rollouts
- **Advanced audit logging** with external systems
- **Role assignment UI** for admin users

## Support

For questions or issues with the authentication system:

1. Check the troubleshooting section above
2. Review server-side logs for error details
3. Ensure Clerk configuration is correct
4. Test with a fresh user account

---

**Last Updated**: January 14, 2025  
**Version**: 1.0.0  
**Author**: Principal Engineer
