# Organization Member Roles: Product Requirements Document

## Overview

This document outlines the requirements and implementation details for handling organization membership roles within the application. The primary requirement is that any user who joins an organization by invite or is manually added should automatically inherit the `MEMBER` role unless specifically assigned a different role.

## Current Implementation

1. **Database Schema**
   - The Prisma schema correctly defines `MEMBER` as the default role for `OrganizationMember` with `@default(MEMBER)` in the model definition.
   - Organization members are stored in the `OrganizationMember` table with appropriate relationships to users and organizations.

2. **Member Addition Flow**
   - The add member form in the UI correctly sets `MEMBER` as the default role in the form's `defaultValues`.
   - The `addOrganizationMember` function accepts a role parameter and now includes a fallback to ensure the role defaults to `MEMBER` if not provided.

3. **Role Permissions**
   - The `MEMBER` role has appropriate basic permissions defined in `roles.ts`:
     - `VIEW_ORG_ANALYTICS`
     - `ACCESS_DASHBOARD`

## Enhancements Made

1. **Default Role Fallback**
   - Modified the `addOrganizationMember` function to ensure that the role defaults to `MEMBER` if not provided, adding an extra safety layer:
   ```javascript
   role: validatedData.role || 'MEMBER'
   ```

2. **Organization Invite System**
   - Implemented a comprehensive invite system in `utils/actions/organization-invite-actions.ts` with the following functionality:
     - Creating invites (with `MEMBER` as default role)
     - Accepting invites
     - Canceling invites
     - Resending invites
     - Fetching organization invites

## Future Enhancements

1. **User Interface for Invites**
   - Build UI components for sending invites to join organizations
   - Implement a list view of pending invites with actions (cancel/resend)
   - Create a clear invitation acceptance flow for users

2. **Email Notifications**
   - Implement email delivery for invite notifications
   - Include expiration information and clear action buttons in emails

3. **Role Management**
   - Create comprehensive role management interfaces for organization admins
   - Allow customization of permission sets for each role
   - Implement role upgrade paths for promoting members to higher roles

4. **System Notifications**
   - Notify users when they've been added to an organization or their role has changed
   - Display pending invites prominently in the user dashboard

5. **Onboarding**
   - Create onboarding flows specific to newly joined organization members
   - Display welcome information and organization details

## Implementation Notes

1. **Invite Process Flow**
   - When an invite is created, the role is set to `MEMBER` by default (via Zod schema default)
   - When an invite is accepted, the member is created with the role specified in the invite (which defaults to `MEMBER`)
   - When a member is added directly, they are assigned the `MEMBER` role unless a different role is explicitly chosen

2. **Role Hierarchy**
   - The system supports various role levels (OWNER, DIRECTOR, MANAGER, MEMBER, GUEST)
   - Organization creators are automatically assigned the OWNER role
   - Each role has specific permissions as defined in the `ORG_ROLE_PERMISSIONS` object

3. **Database Considerations**
   - The `@default(MEMBER)` annotation in the Prisma schema ensures database-level defaults
   - Application logic also enforces this default through validation schemas

## Technical Debt / Known Issues

1. **Invite Table Sync**
   - The `OrganizationInvite` table needs to be properly added to the database schema
   - Linter errors indicate type mismatches that need to be addressed

2. **Email Delivery**
   - Email delivery for invites is not yet implemented (marked with TODOs)

## Migration Considerations

No schema migrations are required for existing members as the default role has always been in place at the database level. New functionality (invites) will require new tables to be created. 