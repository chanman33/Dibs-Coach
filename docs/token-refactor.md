# Cal.com Token Management System Refactoring
## Product Requirements Document

### Executive Summary

This document outlines the urgent refactoring plan for the Cal.com token management system. The current implementation has token management logic spread across multiple locations with redundant code paths. This refactoring will consolidate token management into a centralized, layered architecture to improve maintainability, reduce duplication, and create a more robust integration with the Cal.com API.

### Goals and Objectives

- Create a centralized token management system
- Eliminate redundant code across API routes and server actions
- Simplify the client → server → Cal.com API flow
- Standardize error handling and token refresh mechanisms
- Improve maintainability for future Cal.com API changes

### Technical Requirements

#### Phase 1: Core Implementation in Library

**Consolidate Token Management in `lib/cal/cal-service.ts`**
- Create `CalTokenService` class with core token operations:
  - `updateTokens`: Store tokens in database
  - `isTokenExpired`: Check token expiration
  - `refreshTokens`: Refresh tokens using appropriate method
  - `refreshManagedUserToken`: Handle managed user token refresh
  - `ensureValidToken`: Validate and refresh tokens as needed

**Create Unified Cal API Utility in `lib/cal/cal-api.ts`**
- Implement `makeCalApiRequest` function that:
  - Takes endpoint, method, body, userUlid parameters
  - Automatically ensures valid token via CalTokenService
  - Makes the API request to Cal.com
  - Handles errors consistently

#### Phase 2: Server Actions as Primary Interface

**Refactor `utils/actions/cal-tokens.ts`**
- Implement server actions that wrap the library functions:
  - `updateCalTokens`: Update tokens with path revalidation
  - `refreshUserCalTokens`: Refresh tokens when needed
  - `ensureValidCalToken`: Get valid token for operations

**Create Token Validation Utility in `utils/cal/token-util.ts`**
- Implement `ensureValidToken` helper for server actions
- Standardize error handling and logging

#### Phase 3: Update API Routes

**Update `app/api/cal/refresh-token/route.ts`**
- Use server actions instead of direct implementation
- Maintain consistent error handling

**Update OAuth Callback Routes**
- Modify all OAuth callback routes to use server actions for token updates
- Maintain proper redirects for user experience


#### Phase 6: Documentation

**Create comprehensive README in `lib/cal` directory**
- Document architecture, usage patterns, and examples

### Interface Details

#### CalTokenService Class

```typescript
class CalTokenService {
  static async updateTokens(userUlid: string, tokenData: {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt: number | string;
  }): Promise<TokenUpdateResult>;
  
  static isTokenExpired(accessTokenExpiresAt: string | number | Date): boolean;
  
  static async refreshTokens(userUlid: string, forceRefresh?: boolean): Promise<TokenRefreshResult>;
  
  static async ensureValidToken(userUlid: string): Promise<{
    accessToken: string;
    success: boolean;
    error?: string;
  }>;
}
```

#### Server Action Interfaces

```typescript
// utils/actions/cal-tokens.ts
export async function updateCalTokens(
  userUlid: string, 
  tokenData: {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt: number | string;
  }
): Promise<TokenUpdateResult>;

export async function refreshUserCalTokens(
  userUlid: string, 
  forceRefresh?: boolean
): Promise<TokenUpdateResult>;

export async function ensureValidCalToken(
  userUlid: string
): Promise<{
  accessToken: string;
  success: boolean;
  error?: string;
}>;

// utils/actions/cal-default-event-type.ts
export async function createDefaultEventTypes(
  userUlid: string
): Promise<ApiResponse<{
  success: boolean;
  totalCreated?: number;
  createdEventTypes?: any[];
}>>;
```

### Integration Points

The refactored system will integrate with:

1. **Database**
   - `CalendarIntegration` table for storing tokens

2. **Cal.com API**
   - OAuth token endpoints
   - Event type management endpoints
   - User management endpoints

3. **Client UI**
   - Settings page for viewing connection status
   - Availability page for event type management

### Error Handling

Consistent error handling will include:
- Detailed logging with operation context
- Standardized error response format
- Token refresh attempts before reporting errors
- Clear user-facing error messages

### Migration Strategy

Migration will proceed in the following order:
1. Implement core library functions
2. Update server actions to use library
3. Modify API routes to use server actions
4. Update event type operations
5. Create dedicated default event type server action
6. Document the new architecture

### Success Criteria

The refactoring will be considered successful when:
- All token operations use the centralized system
- No duplicate token management code exists
- Client-side code calls server actions directly where possible
- API routes only exist for OAuth flows and webhook handlers
- Error handling is consistent across all operations

### Timeline

Implementation will be prioritized as an urgent mission-critical task, with all phases executed as quickly as possible while maintaining code quality and system stability.