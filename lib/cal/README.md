# Cal.com Token Management System

This directory contains the centralized token management system for Cal.com integration. The system provides a structured approach to handling Cal.com API tokens, refreshing them when needed, and making authenticated requests to the Cal.com API.

## Architecture

The token management system follows a layered architecture:

1. **Core Library (lib/cal)**: Contains the core token management functionality
   - `cal-service.ts`: Contains `CalTokenService` class with core token operations
   - `cal-api.ts`: Provides `makeCalApiRequest` utility for authenticated Cal.com API calls

2. **Server Actions (utils/actions)**: Server actions that provide the primary interface for client code
   - `cal-tokens.ts`: Wraps the library functions with proper cache invalidation

3. **Utility Layer (utils/cal)**: Provides helper functions for token validation
   - `token-util.ts`: Contains utilities for token validation and API response handling

4. **API Routes (app/api/cal)**: Simplified API routes that use the server actions
   - `refresh-token`: Uses server actions for token refresh
   - `refresh-managed-user-token`: Used for managed user token refresh

## Usage Examples

### 1. Refreshing Tokens (Server-side)

```typescript
import { refreshUserCalTokens } from '@/utils/actions/cal-tokens';

// In a server action or API route
const result = await refreshUserCalTokens(userUlid, forceRefresh);

if (result.success) {
  // Token refreshed successfully
} else {
  // Handle error: result.error
}
```

### 2. Ensuring Valid Token (Server-side)

```typescript
import { ensureValidCalToken } from '@/utils/actions/cal-tokens';

// In a server action or API route
const result = await ensureValidCalToken(userUlid);

if (result.success) {
  // Use the token: result.accessToken
} else {
  // Handle error: result.error
}
```

### 3. Making Cal.com API Requests

```typescript
import { makeCalApiRequest } from '@/lib/cal/cal-api';

// This will automatically handle token validation and refresh
const eventTypes = await makeCalApiRequest('/event-types', 'GET', undefined, userUlid);

// POST example
const booking = await makeCalApiRequest(
  '/bookings',
  'POST',
  { eventTypeId, start, end, name, email },
  userUlid
);
```

### 4. Using with Token Utility (Advanced)

```typescript
import { handleCalApiResponse } from '@/utils/cal/token-util';

// In a more advanced scenario where you need to handle the response directly
const initialResponse = await fetch('https://api.cal.com/v2/endpoint', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});

// This will automatically handle token expiration and retry
const response = await handleCalApiResponse(
  initialResponse,
  (newToken) => fetch('https://api.cal.com/v2/endpoint', {
    headers: { 'Authorization': `Bearer ${newToken}` }
  }),
  userUlid
);
```

## Key Features

- **Centralized Token Management**: All token operations are handled by `CalTokenService`
- **Automatic Token Refresh**: Tokens are automatically refreshed when expired
- **Token Loop Protection**: System prevents refresh loops with cooldown periods
- **Managed User Support**: Special handling for Cal.com managed users
- **Cache Invalidation**: Server actions automatically revalidate appropriate paths
- **Error Handling**: Consistent error formats and detailed logging

## Error Handling

All functions in the token management system return standardized error responses:

```typescript
{
  success: false,
  error: 'Descriptive error message'
}
```

Error cases are logged with detailed context information, including:
- The specific operation that failed
- The user ULID
- Timestamp
- Stack trace (in development)

## Best Practices

1. **Always use the server actions** for client-side code to benefit from automatic path revalidation
2. **Use makeCalApiRequest** for all Cal.com API calls instead of direct fetch
3. **Check success property** before using results from any token operation
4. **Handle errors gracefully** by providing user-friendly messages
5. **Don't expose tokens to the client** - all token operations should be server-side

## Internal Details

The system uses a layered approach to prevent code duplication:

1. `CalTokenService` provides core functionality for managing tokens
2. Server actions wrap this functionality with cache invalidation
3. API routes use server actions to maintain consistency

Token refresh follows this process:
1. Check if token is expired or about to expire
2. If refresh is needed, determine if it's a managed user
3. Call the appropriate Cal.com API endpoint to refresh the token
4. Update the token in the database
5. Revalidate relevant paths to update UI components

## Migration Notes

When migrating existing code:

1. Replace direct token checking with `ensureValidCalToken`
2. Replace direct API calls with `makeCalApiRequest`
3. Remove duplicate token refresh code in API routes
4. Use the standardized error handling patterns 