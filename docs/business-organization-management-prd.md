# Business Organization Management PRD

## 1. Introduction

### 1.1 Purpose
This document outlines the product requirements for creating, onboarding, and managing business organizations within the Dibs platform. It defines the necessary features and workflows for system administrators to efficiently handle B2B customers.

### 1.2 Scope
The scope includes organization creation, member management, permission controls, organization settings management, and analytics reporting capabilities for system administrators.

### 1.3 Definitions
- **Organization**: A business entity with multiple members that uses the Dibs platform
- **Organization Member**: A user associated with a specific organization
- **Organization Admin**: A user with administrative privileges within an organization
- **System Admin**: A platform administrator with access to all organizations

## 2. Problem Statement

Currently, the platform lacks a streamlined workflow for system administrators to create and manage business organizations. The business dashboard (`/dashboard/business`) exists but there is no clear path for admins to:

1. Create new business organizations
2. Add and manage organization members
3. Configure organization settings
4. Monitor organization performance
5. Manage billing and subscriptions

This gap creates friction in the B2B customer onboarding process and complicates ongoing management.

## 3. User Personas

### 3.1 System Administrator
- Responsible for platform-wide management
- Creates and configures business organizations
- Handles high-level issues and platform decisions
- Monitors overall platform health and metrics

### 3.2 Organization Administrator
- Manages their specific business organization
- Adds and removes organization members
- Configures organization-specific settings
- Views organization analytics

### 3.3 Organization Member
- Regular user within a business organization
- Has role-specific permissions and access
- Participates in daily operations within the platform

## 4. User Journeys

### 4.1 Business Organization Creation Flow
1. System admin navigates to Organization Management section
2. Admin clicks "Create Organization" button
3. Admin fills in organization details:
   - Name
   - Type (from OrgType enum)
   - Industry (from OrgIndustry enum)
   - Tier (from OrgTier enum)
   - Primary contact information
4. Admin reviews details and confirms creation
5. System creates the organization and redirects to organization detail page

### 4.2 Member Management Flow
1. System admin navigates to specific organization
2. Admin selects "Members" tab
3. Admin can:
   - View existing members
   - Add new members via email invitation
   - Edit member roles and permissions
   - Remove members
   - Transfer members between organizations

### 4.3 Organization Settings Management Flow
1. System admin navigates to organization settings
2. Admin can configure:
   - Organization status
   - Billing settings
   - Feature access controls
   - Default preferences
3. Admin saves changes which are applied immediately

## 5. Feature Requirements

### 5.1 Organization Management Dashboard

#### 5.1.1 Organization List View
- Sortable and filterable list of all organizations
- Key metrics displayed for each organization:
  - Member count
  - Status
  - Creation date
  - Tier/plan
- Quick action buttons for common tasks

#### 5.1.2 Organization Creation
- Form with fields for all required organization information
- Validation for required fields
- Option to create from templates for common configurations
- Ability to set initial admin user(s)

#### 5.1.3 Organization Detail View
- Overview of organization information
- Tabs for different management sections:
  - Details/Settings
  - Members
  - Analytics
  - Billing
  - Activity Log

### 5.2 Member Management

#### 5.2.1 Member List
- List all members associated with the organization
- Display name, email, role, status, and last activity
- Sort and filter capabilities
- Bulk actions for common operations

#### 5.2.2 Member Invitation
- Email-based invitation system
- Customizable invitation messages
- Role selection at invitation time
- Tracking of pending invitations

#### 5.2.3 Role & Permission Management
- Assign predefined roles to members
- Custom permission sets for special cases
- Role templates for quick assignment
- Permission inheritance hierarchy

### 5.3 Organization Settings

#### 5.3.1 General Settings
- Organization name, description, logo
- Contact information
- Industry and type classifications
- Status controls (active, inactive, suspended)

#### 5.3.2 Feature Access Controls
- Toggle access to specific platform features
- Customize feature limitations
- Role-based feature access

#### 5.3.3 Region and Location Management
- Add/edit/remove regions
- Manage physical locations
- Set regional preferences

### 5.4 Analytics & Reporting

#### 5.4.1 Organization Performance Dashboard
- Member activity metrics
- Feature usage statistics
- Comparison against benchmarks
- Trend analysis over time

#### 5.4.2 Report Generation
- Scheduled and on-demand reports
- Export formats (PDF, Excel, CSV)
- Custom report builder
- Saved report templates

### 5.5 Billing & Subscription Management

#### 5.5.1 Plan Management
- Assign and change subscription plans
- Custom pricing arrangements
- Contract term management
- Renewal tracking

#### 5.5.2 Invoice Management
- View organization invoices
- Payment tracking
- Credit adjustments
- Payment method management

## 6. Technical Requirements

### 6.1 Database Extensions
- Enhance Organization and OrganizationMember models in schema.prisma
- Add additional tracking fields for system admin actions
- Create new models for organization-specific settings and preferences

### 6.2 API Requirements
- Create new API endpoints for organization management
- Extend existing user management APIs to handle organization context
- Build analytics aggregation endpoints
- Develop invitation and member management endpoints

### 6.3 Integration Requirements
- Integrate with existing authentication system
- Connect to billing and payment processing systems
- Ensure analytics data collection across platform
- Notification system integration for alerts and invitations

## 7. UI/UX Specifications

### 7.1 System Admin Dashboard Updates
- Add "Organizations" section to main navigation in system sidebar
- Create consistent management interface matching existing admin patterns
- Use card-based layouts for key metrics
- Implement clear visual hierarchy for organization information

### 7.2 Organization Management UI
- List view with filtering and sorting options
- Detailed organization profile view
- Tab-based navigation for organization management sections
- Responsive design for all screen sizes

### 7.3 Member Management UI
- Table view of members with status indicators
- Modal forms for adding/editing members
- Permission visualization matrix
- Drag-and-drop interface for role assignments

## 8. Success Metrics

### 8.1 Adoption Metrics
- Number of organizations created
- Member invitation acceptance rate
- Feature utilization across organizations
- Admin time spent on organization management tasks

### 8.2 Efficiency Metrics
- Time to create new organization
- Time to onboard complete organization team
- Support tickets related to organization management
- Organization admin satisfaction ratings

## 9. Implementation Timeline

### 9.1 Phase 1: Core Organization Management (Weeks 1-3)
- Organization list and detail views
- Basic organization creation
- Simple member management

### 9.2 Phase 2: Enhanced Member Management (Weeks 4-6)
- Advanced invitation system
- Role and permission refinement
- Bulk operations

### 9.3 Phase 3: Settings & Configuration (Weeks 7-9)
- Organization settings management
- Feature access controls
- Regional configuration

### 9.4 Phase 4: Analytics & Billing (Weeks 10-12)
- Organization analytics dashboard
- Report generation
- Billing management interface

## 10. Future Enhancements

### 10.1 Self-Service Organization Creation
- Allow users to create their own organizations
- Self-service plan selection
- Automated onboarding process

### 10.2 Organization Collaboration Features
- Cross-organization project capabilities
- Shared resources between organizations
- Partnership management tools

### 10.3 Advanced Analytics
- Predictive analytics for organization growth
- AI-powered recommendations
- Custom analytics dashboards

### 10.4 Multi-Tier Organization Structures
- Parent-child organization relationships
- Holding company structures
- Complex permission inheritance

## 11. Appendix

### 11.1 Database Schema Reference

Based on the current schema.prisma file, the Organization and OrganizationMember models will be used:

```prisma
model Organization {
  // Existing fields
  // ...
  
  // New fields to consider adding:
  adminNotes          String?
  onboardingStatus    String?
  lastAdminAction     DateTime?
  adminActionBy       String?
}

model OrganizationMember {
  // Existing fields
  // ...
  
  // New fields to consider adding:
  invitedBy           String?
  invitationSentAt    DateTime?
  lastRoleChange      DateTime?
  roleChangedBy       String?
}
```

### 11.2 UI Mockup References

UI mockups should follow the existing design patterns in the `/dashboard/system/` and `/dashboard/business/` interfaces, maintaining consistency with components like:

- Card, CardContent, CardHeader, CardTitle
- Tabs, TabsList, TabsContent
- Tables and data visualization components
- Form elements from UI component library 