# Cal.com Token Management

This documentation explains how token management for Cal.com integration is handled in our application.

## Overview

The application uses Cal.com's API for calendar integrations, which requires managing access tokens and refresh tokens. To improve reliability and maintainability, we've implemented a centralized approach to handle token management.

## File Structure

- `utils/cal/token-util.ts` - Core utility functions for token management
- `utils/auth/cal-token-service.ts` - Low-level token refresh service
- `utils/actions/cal-tokens.ts` - Server actions for token operations

## Key Concepts

1. **Token Validation**: We check if tokens are expired or about to expire (within a buffer period)
2. **Token Refresh**: If tokens need refreshing, we use Cal.com's API to refresh them
3. **Error Handling**: We handle token expiration errors (498 status codes) from Cal.com API
4. **Retry Logic**: When token errors occur, we automatically refresh and retry the request

## Core Functions

### `ensureValidCalToken(userUlid, forceRefresh)`

This is the main function to use when you need to ensure a valid token before making a Cal.com API request.

```typescript
import { ensureValidCalToken } from '@/utils/cal/token-util'

// Example usage
const tokenResult = await ensureValidCalToken(userData.ulid);

if (tokenResult.success && tokenResult.tokenInfo?.accessToken) {
  // Use tokenResult.tokenInfo.accessToken for API calls
}
```

### `handleCalApiResponse(response, retryFn, userUlid)`

This function handles API responses, detecting token errors and automatically refreshing/retrying.

```typescript
import { handleCalApiResponse } from '@/utils/cal/token-util'

// Define a function to make the API call
const makeCalRequest = (token: string) => fetch('https://api.cal.com/v2/calendars', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
});

// Initial request with current token
let response = await makeCalRequest(accessToken);

// Handle potential token expiration and retry with our utility
response = await handleCalApiResponse(
  response,
  makeCalRequest,
  userData.ulid
);
```

## Best Practices

1. Always use `ensureValidCalToken` before making Cal.com API requests
2. Always use `handleCalApiResponse` to handle API responses and detect token errors
3. Do not implement custom token refresh logic across different API routes
4. Use the token utility interfaces (`CalTokenInfo`, `TokenRefreshResult`) for type safety

## OAuth Flow

The OAuth flow for connecting calendars has been updated to integrate with this token management approach:

1. User initiates calendar connection
2. Cal.com handles OAuth redirect and callback
3. Our callback page finalizes the connection in the database
4. The callback page then uses our token utility to refresh the Cal.com token
5. The user is redirected back to the settings page

## Monitoring and Debugging

Token operations are logged with consistent prefixes:
- `[CAL_TOKEN_UTIL]` - For token utility operations
- `[TOKEN_SERVICE]` - For low-level token service operations
- `[CAL_TOKENS_REFRESH]` - For server action refresh operations

## Maintenance

When updating the Cal.com integration or token management:

1. Make changes to the centralized utility files
2. Update the documentation to reflect any changes in behavior
3. Avoid duplicating token refresh logic across API routes 