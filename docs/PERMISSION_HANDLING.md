# Permission Handling Guidelines

## Core Principles

1. **Centralized Permission Logic**: All permission logic must be centralized in the `permissionService` in `utils/auth/permission-service.ts`.
2. **Client-Server Consistency**: Permission checks in client and server code must be identical.
3. **Loading State Management**: Never make authorization decisions until all required data is loaded.
4. **Single Source of Truth**: Permission constants must be defined in one place only.
5. **Proper Logging**: All permission decisions must be logged with adequate context.

## Known Issues and Their Solutions

### Race Condition Between Client and Server

**Problem**: The client-side `RouteGuardProvider` might check permissions before organization data is fully loaded, while server actions would later validate those permissions successfully, leading to inconsistent authorization results.

**Solution**:
- Wait for all data to load before making authorization decisions
- Use loading states to prevent premature permission checks
- Track redirect state to prevent multiple redirects
- Synchronize permission logic between client and server

## Implementation Guidelines

### RouteGuardProvider

The `RouteGuardProvider` in `components/auth/RouteGuardContext.tsx` should:

1. **Respect Loading States**:
   ```typescript
   // Only make authorization decisions when ALL data is loaded
   if (isOrgLoading || !authContext) {
     console.log('[ROUTE_GUARD] Still loading data, deferring permission check');
     return; // Don't make decisions yet
   }
   ```

2. **Track Redirect State**:
   ```typescript
   const [isRedirecting, setIsRedirecting] = useState(false);
   
   // Prevent multiple redirects
   if (isRedirecting) {
     console.log('[ROUTE_GUARD] Already redirecting, skipping further checks');
     return;
   }
   
   if (!authorized) {
     setIsRedirecting(true);
     router.push(redirectPath);
   }
   ```

3. **Use Descriptive Loading Messages**:
   ```typescript
   const loadingMessage = isOrgLoading 
     ? "Loading organization data..." 
     : "Verifying permissions...";
   
   return <ContainerLoading message={loadingMessage} />;
   ```

### Server Actions

The `withServerAction` wrapper in `utils/middleware/withServerAction.ts` should:

1. **Match Client-Side Permission Logic**:
   ```typescript
   // This logic should match the client-side canAccessBusinessDashboard() function
   const hasValidOrgRole = !!orgData?.role && 
     businessDashboardRoles.includes(orgData.role as OrgRole);
     
   const hasValidPermission = isSystemOwner || (hasOrgMembership && hasValidOrgRole);
   ```

2. **Log Authorization Decisions**:
   ```typescript
   console.log('[SERVER_ACTION_PERMISSION_GRANTED]', {
     userId: session.userId,
     hasOrgMembership,
     isSystemOwner,
     orgRole: orgData?.role || 'none',
     hasValidOrgRole,
     timestamp: new Date().toISOString()
   });
   ```

### Permission Service

The `permissionService` in `utils/auth/permission-service.ts` should:

1. **Cache Results When Appropriate**:
   ```typescript
   setUser(user: AuthContext | null): void {
     const now = Date.now();
     
     // Only clear cache when significant context changes
     if (this.user && user && this.user.userId === user.userId) {
       const sameOrg = this.user.organizationUlid === user.organizationUlid;
       const sameOrgRole = this.user.orgRole === user.orgRole;
       
       if (sameOrg && sameOrgRole) {
         console.log('[PERMISSION_SERVICE] Same user context, preserving cache');
         this.user = user; // Update reference but keep cache
         this.lastSetTimestamp = now;
         return;
       }
     }
     
     this.cache.clear();
     // ...
   }
   ```

2. **Log Transitions and Decisions**:
   ```typescript
   console.log('[PERMISSION_SERVICE] Business dashboard access check:', {
     userId: this.user.userId,
     orgRole: this.user.orgRole || 'none',
     organizationUlid: this.user.organizationUlid || 'none',
     isSystemOwner,
     hasValidOrg,
     hasValidOrgRole,
     result,
     timestamp: new Date().toISOString()
   });
   ```

## Permission Constants

All permission-related constants should be defined in `utils/roles/roles.ts` and imported where needed. For example:

```typescript
// In utils/roles/roles.ts
export const ORG_ROLES = {
  OWNER: 'OWNER',
  DIRECTOR: 'DIRECTOR',
  MANAGER: 'MANAGER',
  MEMBER: 'MEMBER'
} as const;

// Reuse in other files
import { ORG_ROLES } from '@/utils/roles/roles';
```

## Preventing Duplication

If a constant is needed in multiple files but can't be directly imported due to circular references, redefine it with a clear comment indicating the source of truth:

```typescript
// This should match the same constant in permission-service.ts
const businessDashboardRoles = [
  ORG_ROLES.OWNER,
  ORG_ROLES.DIRECTOR,
  ORG_ROLES.MANAGER
] as readonly OrgRole[];
```

## Debugging Permission Issues

When debugging permission issues:

1. Check logs with `[PERMISSION_SERVICE]`, `[ROUTE_GUARD]`, and `[SERVER_ACTION]` prefixes
2. Verify that permission decisions are only made after all data is loaded
3. Ensure client and server permission checks are using the same logic
4. Review timing of permission checks relative to data loading
5. Confirm that the same constants are used everywhere