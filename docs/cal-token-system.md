# Dibs Application - Cal.com Token Management System

## Purpose

This system manages OAuth 2.0 access and refresh tokens required to interact with the Cal.com API on behalf of users, particularly focusing on *managed users* created via the Dibs platform integration. It ensures that valid tokens are available for API calls and handles the process of refreshing tokens when they expire.

## Key Concepts

*   **Access Token:** A short-lived token (currently 60 minutes) used to authenticate API requests to Cal.com.
*   **Refresh Token:** A long-lived token (currently 1 year) used to obtain a new access token when the current one expires, without requiring the user to re-authenticate. Cal.com uses *refresh token rotation*, meaning a new refresh token might be issued when the standard refresh endpoint is used.
*   **Managed User:** A Cal.com user created programmatically via the Dibs platform using OAuth Client Credentials, distinct from users who sign up directly on Cal.com.
*   **Standard Refresh:** The standard OAuth 2.0 mechanism using the `/v2/oauth/{clientId}/refresh` endpoint. Requires a valid `refresh_token` and the client secret. Returns a new `access_token` and potentially a new `refresh_token`.
*   **Force Refresh:** A Cal.com-specific mechanism for managed users using the `/v2/oauth-clients/{clientId}/users/{userId}/force-refresh` endpoint. Requires the client secret and client ID. It generates a completely new set of tokens and is useful if the standard refresh fails (e.g., the refresh token itself expired or was revoked).

## Core Components

1.  **`CalTokenService` (`lib/cal/cal-service.ts`)**
    *   The central engine for token operations. Contains the core logic.
    *   Contains static methods for:
        *   Saving/updating tokens in the database (`updateTokens`).
        *   Checking access token expiry (`isTokenExpired`).
        *   Handling the refresh logic, including the fallback to force refresh (`refreshTokens`).
        *   Ensuring a valid token is available, triggering refresh if needed (`ensureValidToken`).
    *   Interacts directly with the Supabase database (`CalendarIntegration` table) and the Cal.com API endpoints.

2.  **Server Actions (`utils/actions/cal/cal-tokens.ts`)**
    *   Provides the primary, safe interface for invoking token operations from server components, client components, or API routes.
    *   Wraps the core `CalTokenService` methods (`ensureValidCalToken`, `refreshUserCalTokens`, `updateCalTokens`).
    *   Adds Next.js-specific features like `revalidatePath` upon successful token updates/refreshes.
    *   Includes loop protection/cooldown mechanisms via the underlying service.

## Recommended Entry Points

For most use cases requiring interaction with the Cal.com API, the following are the recommended, stable ways to handle token management:

1.  **`ensureValidCalToken` (Server Action):** Located in `utils/actions/cal/cal-tokens.ts`. This is the **primary function** to call before making a Cal.com API request that requires user authentication. It automatically checks token validity and performs the necessary refresh steps (standard or force fallback) if required.
2.  **`makeCalApiRequest` (`lib/cal/cal-api.ts`):** This wrapper function centralizes Cal.com API calls. If a `userUlid` is provided, it automatically calls `CalTokenService.ensureValidToken` internally before making the request. Using this wrapper is highly recommended for consistency.

## Workflow: Ensuring a Valid Token (via `ensureValidCalToken`)

1.  **Request:** Application code calls the `ensureValidCalToken(userUlid)` server action.
2.  **Validation:** The underlying `CalTokenService.ensureValidToken` checks the `calAccessTokenExpiresAt` timestamp stored in the user's `CalendarIntegration` record.
3.  **Refresh Check:** If the access token is expired or within the 5-minute buffer, `CalTokenService.refreshTokens(userUlid, false)` is called.
4.  **Standard Refresh Attempt:** `refreshTokens` calls the Cal.com `/oauth/{clientId}/refresh` endpoint using the stored `calRefreshToken`.
5.  **Success (Standard):** If successful, the new `access_token` (and potentially rotated `refresh_token`) are saved to the database via `updateTokens`. The valid `access_token` is returned.
6.  **Failure (Standard):** If the standard refresh fails:
    *   The system checks if the user has a `calManagedUserId`.
    *   **If Managed User -> Attempt Force Refresh:** The `/force-refresh` endpoint is called automatically as a fallback.
        *   **Success (Force):** New tokens are saved via `updateTokens`. The new `access_token` is returned.
        *   **Failure (Force):** An error is returned.
    *   **If Not Managed User:** An error from the standard refresh failure is returned.
7.  **No Refresh Needed:** If the initial validation found the token to be valid, the existing `access_token` is returned directly.
8.  **Path Revalidation:** If a refresh occurred successfully within the server action wrapper, relevant Next.js paths (like settings, calendar pages) are revalidated.

## Database Schema

Token information is stored in the `public.CalendarIntegration` table:

*   `calAccessToken`: Stores the encrypted Cal.com access token.
*   `calRefreshToken`: Stores the encrypted Cal.com refresh token.
*   `calAccessTokenExpiresAt`: Stores the timestamp (ISO string) when the access token expires.
*   `calManagedUserId`: Stores the numeric ID if the user is a Cal.com managed user.

## Environment Variables

*   `NEXT_PUBLIC_CAL_CLIENT_ID`: The public OAuth Client ID for the Dibs Cal.com application.
*   `CAL_CLIENT_SECRET`: The secret key for the Dibs Cal.com OAuth application (used for refresh calls).

## Usage Example

```typescript
// In an API route or server component needing to call Cal.com
import { ensureValidCalToken } from '@/utils/actions/cal/cal-tokens';
// Or preferably use the wrapper:
// import { makeCalApiRequest } from '@/lib/cal/cal-api';
import { getAuthenticatedUserUlid } from '@/utils/auth/cal-auth-helpers'; // Or other way to get userUlid

// ... inside async function ...
const authResult = await getAuthenticatedUserUlid();
if (authResult.error || !authResult.data) {
  // Handle auth error
  return;
}
const userUlid = authResult.data.userUlid;

// --- Option 1: Direct use of ensureValidCalToken ---
const tokenResult = await ensureValidCalToken(userUlid);

if (!tokenResult.success || !tokenResult.accessToken) {
  // Handle error fetching/refreshing token
  console.error("Failed to get valid Cal token:", tokenResult.error);
  return;
}
const accessToken = tokenResult.accessToken;
// Now use the accessToken...

// --- Option 2: Using makeCalApiRequest (Recommended) ---
// try {
//   const calendars = await makeCalApiRequest<any[]>('/calendars', 'GET', undefined, userUlid);
//   // Use calendars data...
// } catch (error) {
//   console.error("Failed Cal API call:", error);
//   // Handle error (token handling is done internally by makeCalApiRequest)
// }
```

## Important Notes

*   Avoid calling `CalTokenService` methods directly from outside `lib/cal/cal-api.ts` or the server actions. Use the defined entry points (`ensureValidCalToken` action or `makeCalApiRequest`).
*   The system automatically handles the complexity of choosing the correct refresh endpoint based on user type and API call success/failure.
*   Error handling should be implemented by the callers of `ensureValidCalToken` (or `makeCalApiRequest`) to manage scenarios where a valid token cannot be obtained even after refresh attempts.
*   The `utils/cal/cal-integration-actions.ts` file also interacts with the token system (specifically `refreshUserCalTokens`) as part of its status checking and synchronization logic. This could potentially be refactored to use `ensureValidCalToken` in the future for consistency.