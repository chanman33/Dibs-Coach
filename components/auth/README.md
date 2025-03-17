# Authentication Components

This directory contains standardized components for handling authentication and authorization across the application.

## Components

| Component | Purpose | Use Case |
|-----------|---------|----------|
| `WithAuth` | Basic authentication and capability checks | For pages that need simple auth checks based on user capabilities |
| `WithOrganizationAuth` | Organization-based authentication | For pages that need org-specific role and permission checks |
| `RouteGuard` | Simple route protection | For layouts to prevent unauthenticated access to protected routes |
| `AuthProviders` | Auth context provider | Used at the app root to provide authentication context |

## Import Pattern

Always import from the index file:

```tsx
import { WithAuth, WithOrganizationAuth, RouteGuard } from '@/components/auth';
```

## Usage Guidelines

### Page-Level Protection

For individual pages requiring capability checks:

```tsx
import { WithAuth } from '@/components/auth';
import { USER_CAPABILITIES } from '@/utils/roles/roles';

function MyPage() {
  return <div>Protected content</div>;
}

export default WithAuth(MyPage, {
  requiredCapabilities: [USER_CAPABILITIES.SOME_CAPABILITY]
});
```

### Organization-Level Protection

For pages requiring organization role checks:

```tsx
import { WithOrganizationAuth } from '@/components/auth';
import { SYSTEM_ROLES, ORG_ROLES, ORG_LEVELS, PERMISSIONS } from '@/utils/roles/roles';

function MyOrgPage() {
  return <div>Organization content</div>;
}

export default WithOrganizationAuth(MyOrgPage, {
  requiredSystemRole: SYSTEM_ROLES.USER,
  requiredOrgRole: ORG_ROLES.MEMBER,
  requiredOrgLevel: ORG_LEVELS.LOCAL,
  requiredPermissions: [PERMISSIONS.SOME_PERMISSION],
  requireOrganization: true
});
```

### Layout-Level Protection

For protecting multiple routes with a common layout:

```tsx
import { RouteGuard } from '@/components/auth';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard>
      <div className="layout">
        {children}
      </div>
    </RouteGuard>
  );
}
```

## Authentication Flow

1. Server-side checks in root layout verify basic auth status
2. `RouteGuard` in layouts provides basic route protection 
3. Page components use HOCs for fine-grained permission checks

This layered approach ensures consistent protection while maintaining granular control. 