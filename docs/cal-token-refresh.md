# Cal.com Managed User Token Refresh

This document explains how token refresh works for Cal.com managed users in our application.

## Overview

Our application uses Cal.com's managed user pattern as documented in the [Cal.com API docs](https://cal.com/docs/api-reference/v2/platform-managed-users). This pattern allows us to create and manage users directly through Cal.com's API, without requiring the traditional OAuth flow.

When a managed user's token expires, we need to refresh it using the appropriate endpoints.

## Token Refresh Flow

We have implemented two methods for refreshing tokens, which follow Cal.com's documentation:

1. **Regular Refresh** - Using the `POST /v2/oauth/{clientId}/refresh` endpoint
2. **Force Refresh** - Using the `POST /v2/oauth-clients/{clientId}/users/{userId}/force-refresh` endpoint as a fallback

### Components

Our implementation consists of:

1. **API Route**: `app/api/cal/refresh-managed-user-token/route.ts`
   - Handles the HTTP request to refresh a token
   - Makes the appropriate API calls to Cal.com
   - Falls back to force refresh if regular refresh fails
   - Returns the updated tokens

2. **Server Action**: `utils/actions/cal-tokens.ts`
   - Contains the `updateCalTokens` function that updates tokens in the database
   - Contains the `refreshUserCalTokens` function that can be called from other server actions

### Token Refresh Process

1. A token refresh is triggered when:
   - A user action requires a valid Cal.com token
   - The system detects that a token has expired
   - A scheduled job runs to refresh tokens before they expire

2. The system:
   - Retrieves the user's refresh token from the database
   - Calls the Cal.com refresh endpoint
   - If successful, updates the token in the database
   - If unsuccessful, tries the force refresh endpoint
   - Returns the new tokens

3. Token storage:
   - Tokens are stored in the `CalendarIntegration` table
   - Fields include: `calAccessToken`, `calRefreshToken`, `calAccessTokenExpiresAt`

## Error Handling

Our implementation includes comprehensive error handling:

- Checks for missing environment variables
- Validates required fields
- Handles API errors from Cal.com
- Provides detailed logging of all operations
- Returns errors in a consistent format

## Usage

To refresh a token from a server action:

```typescript
import { refreshUserCalTokens } from '@/utils/actions/cal-tokens';

// In a server action
const result = await refreshUserCalTokens(userUlid);
if (!result.success) {
  // Handle error
}
```

To update tokens directly (if you already have new tokens):

```typescript
import { updateCalTokens } from '@/utils/actions/cal-tokens';

const updateResult = await updateCalTokens(userUlid, {
  accessToken: 'new-access-token',
  refreshToken: 'new-refresh-token',
  accessTokenExpiresAt: expirationTimestamp
});
```

## Further Reading

- [Cal.com Managed Users documentation](https://cal.com/docs/api-reference/v2/platform-managed-users)
- [Cal.com Refresh Managed User Tokens docs](https://cal.com/docs/api-reference/v2/platform-managed-users/refresh-managed-user-tokens)
- [Cal.com Force Refresh Tokens docs](https://cal.com/docs/api-reference/v2/platform-managed-users/force-refresh-tokens) 