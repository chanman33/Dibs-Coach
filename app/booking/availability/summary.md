# Calendar Integration Fix for Booking System

## Problem Identified
The booking system was experiencing 401 errors with the message "These credentials do not belong to you" when trying to fetch busy times from Cal.com. This occurred because:

1. A **mentee** (the current user) visits a coach's availability page
2. The system was incorrectly trying to associate the coach's token with the mentee's account
3. When refreshing the token, it was trying to refresh it using the wrong user context

## Solution Implemented

We fixed this by clearly separating the coach and mentee contexts:

### 1. Client-Side Changes (`hooks/useBookingAvailability.ts`):
- Now explicitly sends the coach's ULID in the request parameters:
  ```javascript
  const apiUrl = `/api/cal/calendars/get-busy-times?coachUlid=${encodeURIComponent(actualCoachId)}&...`;
  ```
- Added a test function to directly verify coach calendar access

### 2. API Endpoint Changes (`app/api/cal/calendars/get-busy-times/route.ts`):
- Now takes the coach's ULID directly from the query parameters
- No longer tries to look up the user by token
- Uses the coach's ULID for token validation and refresh:
  ```javascript
  const tokenResult = await ensureValidCalToken(coachUlid);
  ```
- Passes the coach's ULID to `handleCalApiResponse` for any needed token refreshes

## Key Concept
The key understanding is that we need to maintain the correct **user context** throughout the flow:

1. When a mentee views a coach's availability, the coach's calendar access is what matters
2. All Cal.com API calls need to be made with the coach's credentials
3. Any token refreshes need to happen in the coach's context, not the mentee's

## Testing
Added a direct test function that:
1. Retrieves the coach's token and managed user ID
2. Makes a direct API call to test busy times retrieval 
3. Logs the results for verification

This ensures the token validation and refresh process are working correctly with the coach's credentials.

## Expected Outcome
The booking system should now correctly:
1. Use the coach's calendar token for all Cal.com API calls
2. Refresh the coach's token when needed
3. Gracefully handle any token-related errors
4. Provide appropriate feedback to users when calendar sync issues occur 