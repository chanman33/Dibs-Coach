# B2B Admin Features Specification
Version: 1.1.0

## Overview
Comprehensive specification for B2B admin features, including admin dashboard, user management, organization management, and billing administration.

## Core Features

### Admin Dashboard
- Global metrics overview
- User and organization management
- Subscription and billing management
- System health monitoring
- Activity logs and audit trails
- Support ticket management

### Organization Management
- Organization creation and setup
- Team member management
- Subscription and billing
- Custom branding
- Feature access control
- Usage analytics

### User Management
- User roles and permissions
- Team member invitations
- Access control
- Activity monitoring
- Profile management
- Support requests

### Enhanced Administrative Dashboard
- Global metrics and KPIs overview
- Real-time subscription status tracking
- Inactive user monitoring and alerts
- Usage breakdown and trend analysis
- Custom alert system configuration
- Resource utilization metrics
- Cost center tracking
- ROI analytics

### Credit Management System
- Credit pool configuration
- Usage limits and policies
- Special allocations
- Notification system
- Approval workflows

### Advanced Team Management
- Hierarchical team structure
- Department organization
- Seat management
- Granular permissions
- User preferences
- Team analytics

### Enterprise Features
- White-labeling
- Advanced analytics
- Integration management
- SSO configuration
- API access control

## Implementation

### Database Schema

```prisma
model Organization {
  id              BigInt      @id @default(autoincrement())
  name            String      @db.Text
  slug            String      @db.Text @unique
  status          OrgStatus   @default(ACTIVE)
  tier            SubTier     @default(FREE)
  features        Json?       // Enabled features and limits
  branding        Json?       // Custom branding settings
  metadata        Json?
  createdAt       DateTime    @default(now()) @db.Timestamptz
  updatedAt       DateTime    @updatedAt @db.Timestamptz

  users           UserOrganization[]
  subscription    Subscription?
  invites         OrganizationInvite[]
  apiKeys         ApiKey[]

  @@index([status])
  @@index([tier])
}

model UserOrganization {
  id              BigInt      @id @default(autoincrement())
  userId          String      @db.Text
  userDbId        BigInt
  organizationId  BigInt
  role            OrgRole
  status          UserOrgStatus
  metadata        Json?
  createdAt       DateTime    @default(now()) @db.Timestamptz
  updatedAt       DateTime    @updatedAt @db.Timestamptz

  user            User        @relation(fields: [userDbId], references: [id])
  organization    Organization @relation(fields: [organizationId], references: [id])

  @@unique([userDbId, organizationId])
  @@index([organizationId])
  @@index([role])
  @@index([status])
}

model OrganizationInvite {
  id              BigInt      @id @default(autoincrement())
  organizationId  BigInt
  email           String      @db.Text
  role            OrgRole
  token           String      @db.Text @unique
  status          InviteStatus
  expiresAt       DateTime    @db.Timestamptz
  metadata        Json?
  createdAt       DateTime    @default(now()) @db.Timestamptz
  updatedAt       DateTime    @updatedAt @db.Timestamptz

  organization    Organization @relation(fields: [organizationId], references: [id])

  @@index([organizationId])
  @@index([email])
  @@index([status])
  @@index([expiresAt])
}

model ApiKey {
  id              BigInt      @id @default(autoincrement())
  organizationId  BigInt
  name            String      @db.Text
  key             String      @db.Text @unique
  scopes          String[]
  lastUsed        DateTime?   @db.Timestamptz
  expiresAt       DateTime?   @db.Timestamptz
  metadata        Json?
  createdAt       DateTime    @default(now()) @db.Timestamptz
  updatedAt       DateTime    @updatedAt @db.Timestamptz

  organization    Organization @relation(fields: [organizationId], references: [id])

  @@index([organizationId])
  @@index([lastUsed])
  @@index([expiresAt])
}

model Department {
  id              BigInt      @id @default(autoincrement())
  organizationId  BigInt
  name            String      @db.Text
  code            String      @db.Text
  parentId        BigInt?     // For hierarchical structure
  level           Int         // Hierarchy level
  metadata        Json?
  createdAt       DateTime    @default(now()) @db.Timestamptz
  updatedAt       DateTime    @updatedAt @db.Timestamptz

  organization    Organization @relation(fields: [organizationId], references: [id])
  parent          Department?  @relation("DepartmentHierarchy", fields: [parentId], references: [id])
  children        Department[] @relation("DepartmentHierarchy")
  teams           Team[]

  @@index([organizationId])
  @@index([parentId])
}

model Team {
  id              BigInt      @id @default(autoincrement())
  organizationId  BigInt
  departmentId    BigInt?
  name            String      @db.Text
  description     String?     @db.Text
  settings        Json?       // Team-specific settings
  metadata        Json?
  createdAt       DateTime    @default(now()) @db.Timestamptz
  updatedAt       DateTime    @updatedAt @db.Timestamptz

  organization    Organization @relation(fields: [organizationId], references: [id])
  department      Department?  @relation(fields: [departmentId], references: [id])
  members         TeamMember[]

  @@index([organizationId])
  @@index([departmentId])
}

model TeamMember {
  id              BigInt      @id @default(autoincrement())
  teamId          BigInt
  userId          String      @db.Text
  userDbId        BigInt
  role            TeamRole
  permissions     String[]    // Granular permissions
  preferences     Json?       // User preferences
  metadata        Json?
  createdAt       DateTime    @default(now()) @db.Timestamptz
  updatedAt       DateTime    @updatedAt @db.Timestamptz

  team            Team        @relation(fields: [teamId], references: [id])
  user            User        @relation(fields: [userDbId], references: [id])

  @@index([teamId])
  @@index([userDbId])
  @@index([role])
}

model CreditPool {
  id              BigInt      @id @default(autoincrement())
  organizationId  BigInt
  name            String      @db.Text
  totalCredits    Int
  usedCredits     Int         @default(0)
  hardLimit       Boolean     @default(true)
  alertThreshold  Int         // Percentage for alerts
  renewalDate     DateTime?   @db.Timestamptz
  metadata        Json?
  createdAt       DateTime    @default(now()) @db.Timestamptz
  updatedAt       DateTime    @updatedAt @db.Timestamptz

  organization    Organization @relation(fields: [organizationId], references: [id])
  allocations     CreditAllocation[]

  @@index([organizationId])
}

model CreditAllocation {
  id              BigInt      @id @default(autoincrement())
  poolId          BigInt
  teamId          BigInt?
  userDbId        BigInt?
  amount          Int
  type            AllocationType
  expiresAt       DateTime?   @db.Timestamptz
  metadata        Json?
  createdAt       DateTime    @default(now()) @db.Timestamptz
  updatedAt       DateTime    @updatedAt @db.Timestamptz

  pool            CreditPool  @relation(fields: [poolId], references: [id])
  team            Team?       @relation(fields: [teamId], references: [id])
  user            User?       @relation(fields: [userDbId], references: [id])

  @@index([poolId])
  @@index([teamId])
  @@index([userDbId])
}

model CreditApproval {
  id              BigInt      @id @default(autoincrement())
  organizationId  BigInt
  requesterId     BigInt
  amount          Int
  reason          String      @db.Text
  status          ApprovalStatus
  approvedById    BigInt?
  approvedAt      DateTime?   @db.Timestamptz
  metadata        Json?
  createdAt       DateTime    @default(now()) @db.Timestamptz
  updatedAt       DateTime    @updatedAt @db.Timestamptz

  organization    Organization @relation(fields: [organizationId], references: [id])
  requester       User        @relation("requester", fields: [requesterId], references: [id])
  approver        User?       @relation("approver", fields: [approvedById], references: [id])

  @@index([organizationId])
  @@index([requesterId])
  @@index([status])
}

enum OrgStatus {
  ACTIVE
  SUSPENDED
  DELETED
}

enum OrgRole {
  OWNER
  ADMIN
  MEMBER
  GUEST
}

enum UserOrgStatus {
  ACTIVE
  SUSPENDED
  REMOVED
}

enum InviteStatus {
  PENDING
  ACCEPTED
  EXPIRED
  REVOKED
}

enum TeamRole {
  LEAD
  MANAGER
  MEMBER
  OBSERVER
}

enum AllocationType {
  STANDARD
  BONUS
  PROMOTIONAL
  SPECIAL
}

enum ApprovalStatus {
  PENDING
  APPROVED
  REJECTED
  ESCALATED
}
```

### API Routes

```typescript
// app/api/admin/organizations/route.ts
GET /api/admin/organizations
- List organizations
- Query params: status, tier, search, page, limit
- Response: { organizations: Organization[], total: number }

POST /api/admin/organizations
- Create organization
- Request: { name: string, tier: SubTier, features?: object }

GET /api/admin/organizations/[id]
- Get organization details
- Response: { organization: Organization & { users: User[], subscription: Subscription } }

PATCH /api/admin/organizations/[id]
- Update organization
- Request: { name?: string, status?: OrgStatus, tier?: SubTier, features?: object }

// app/api/admin/users/route.ts
GET /api/admin/users
- List users
- Query params: role, status, search, page, limit
- Response: { users: User[], total: number }

POST /api/admin/users/invite
- Invite user to organization
- Request: { email: string, role: OrgRole, organizationId: number }

PATCH /api/admin/users/[id]
- Update user status/role
- Request: { status?: UserOrgStatus, role?: OrgRole }

// app/api/admin/billing/route.ts
GET /api/admin/billing/subscriptions
- List subscriptions
- Query params: status, tier, page, limit
- Response: { subscriptions: Subscription[], total: number }

POST /api/admin/billing/subscriptions/[id]/update
- Update subscription
- Request: { tier: SubTier, features?: object }

// app/api/admin/dashboard/route.ts
GET /api/admin/dashboard/metrics
- Get dashboard metrics
- Query params: timeRange, groupBy
- Response: { metrics: DashboardMetrics }

// app/api/admin/credits/route.ts
POST /api/admin/credits/pools
- Create credit pool
- Request: CreditPoolConfig

POST /api/admin/credits/allocations
- Allocate credits
- Request: { poolId: number, allocation: CreditAllocation }

POST /api/admin/credits/approvals
- Request credit approval
- Request: { amount: number, reason: string }

// app/api/admin/teams/route.ts
POST /api/admin/teams
- Create team
- Request: TeamConfig

PATCH /api/admin/teams/[id]/members
- Update team members
- Request: { add?: string[], remove?: string[], update?: Record<string, TeamRole> }

// app/api/admin/enterprise/route.ts
POST /api/admin/enterprise/white-label
- Configure white-labeling
- Request: WhiteLabelConfig

POST /api/admin/enterprise/sso
- Configure SSO
- Request: SSOConfig
```

### Admin Components

```typescript
// components/admin/OrganizationList.tsx
export function OrganizationList() {
  // List and manage organizations
}

// components/admin/UserManagement.tsx
export function UserManagement() {
  // Manage users and roles
}

// components/admin/BillingManagement.tsx
export function BillingManagement() {
  // Manage subscriptions and billing
}

// components/admin/ActivityLog.tsx
export function ActivityLog() {
  // Display audit logs
}

// components/admin/MetricsOverview.tsx
export function MetricsOverview() {
  // Display key metrics
}
```

### Organization Management

```typescript
// utils/admin/organizations.ts
export async function createOrganization(params: {
  name: string;
  tier: SubTier;
  features?: Record<string, any>;
}): Promise<Organization> {
  // Create new organization
}

export async function updateOrganization(
  id: number,
  params: UpdateOrgParams
): Promise<Organization> {
  // Update organization details
}

export async function getOrganizationMetrics(
  id: number
): Promise<{
  activeUsers: number;
  monthlyUsage: Record<string, number>;
  subscription: SubscriptionDetails;
}> {
  // Get organization metrics
}
```

### User Management

```typescript
// utils/admin/users.ts
export async function inviteUser(params: {
  email: string;
  role: OrgRole;
  organizationId: number;
}): Promise<OrganizationInvite> {
  // Create and send invitation
}

export async function updateUserRole(
  userId: number,
  organizationId: number,
  role: OrgRole
): Promise<UserOrganization> {
  // Update user role
}

export async function removeUserFromOrg(
  userId: number,
  organizationId: number
): Promise<void> {
  // Remove user from organization
}
```

### API Key Management

```typescript
// utils/admin/api-keys.ts
export async function createApiKey(params: {
  organizationId: number;
  name: string;
  scopes: string[];
  expiresAt?: Date;
}): Promise<ApiKey> {
  // Generate and store API key
}

export async function revokeApiKey(
  id: number
): Promise<void> {
  // Revoke API key
}
```

### Utility Functions

```typescript
// utils/admin/dashboard.ts
export async function getDashboardMetrics(
  organizationId: number,
  timeRange: string,
  groupBy?: string
): Promise<DashboardMetrics>;

// utils/admin/credits.ts
export async function calculateCreditUsage(
  poolId: number
): Promise<{
  used: number,
  remaining: number,
  allocations: CreditAllocation[]
}>;

// utils/admin/teams.ts
export async function syncTeamHierarchy(
  organizationId: number
): Promise<void>;

// utils/admin/enterprise.ts
export async function deployWhiteLabel(
  organizationId: number,
  config: WhiteLabelConfig
): Promise<void>;
```

## Implementation Plan

### Phase 1: Core Admin Features
- [ ] Organization CRUD operations
- [ ] User management system
- [ ] Basic admin dashboard
- [ ] Activity logging

### Phase 2: Advanced Organization Features
- [ ] Team management
- [ ] Custom branding
- [ ] Feature controls
- [ ] API key management

### Phase 3: Billing and Subscriptions
- [ ] Subscription management
- [ ] Usage tracking
- [ ] Billing administration
- [ ] Invoice management

### Phase 4: Analytics and Reporting
- [ ] Organization analytics
- [ ] Usage reports
- [ ] Audit logs
- [ ] Custom reports

### Phase 5: Advanced Features
- [ ] SSO integration
- [ ] Advanced permissions
- [ ] Compliance tools
- [ ] Enterprise features

### Phase 1: Enhanced Dashboard
- [ ] Implement detailed metrics tracking
- [ ] Create usage analytics system
- [ ] Set up alert infrastructure
- [ ] Build reporting system

### Phase 2: Credit Management
- [ ] Implement credit pool system
- [ ] Create allocation management
- [ ] Set up approval workflows
- [ ] Configure notification system

### Phase 3: Team Management
- [ ] Build department hierarchy
- [ ] Implement team management
- [ ] Create permission system
- [ ] Set up user preferences

### Phase 4: Enterprise Features
- [ ] Implement white-labeling
- [ ] Set up SSO integration
- [ ] Create API management
- [ ] Build advanced analytics

### Phase 5: Integration & Optimization
- [ ] Implement third-party integrations
- [ ] Optimize performance
- [ ] Enhance security features
- [ ] Add advanced customization

## Security Considerations

### Access Control
- Role-based access control (RBAC)
- Permission management
- API key security
- Session management
- IP restrictions

### Audit Trail
- User actions logging
- Critical changes tracking
- Access logs
- Data modification history
- Security events

### Compliance
- Data privacy controls
- GDPR compliance
- CCPA compliance
- SOC 2 requirements
- Security policies

## Testing Strategy
- Unit tests for core functionality
- Integration tests for API endpoints
- E2E tests for critical flows
- Performance testing
- Security testing 