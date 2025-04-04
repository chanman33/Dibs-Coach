# Calendar OAuth Integration Guide with Cal.com

This guide explains how to implement calendar integration using the Cal.com API, which allows your application to connect with Google Calendar and Office 365 Calendar.

## Overview

The Cal.com calendar integration involves a multi-step OAuth flow:

1. **Initiate OAuth Flow**: Generate an OAuth authorization URL that redirects users to the calendar provider's auth page
2. **Handle Redirect**: Process the OAuth callback with code and state parameters
3. **Save Credentials**: Exchange the authorization code for access/refresh tokens
4. **Sync Credentials**: Ensure calendar credentials are properly synchronized
5. **Check Connection**: Verify the calendar integration is working correctly

## Prerequisites

- A Cal.com account with API access
- Cal.com API credentials (client ID and secret)
- Proper environment variables configured

## Environment Variables

Ensure these variables are set in your `.env` file:

```
# Cal.com API credentials
CAL_CLIENT_ID=your_cal_client_id
CAL_CLIENT_SECRET=your_cal_client_secret

# Redirect URLs (optional, can be constructed dynamically)
NEXT_PUBLIC_GOOGLE_CALENDAR_REDIRECT=https://your-app.com/api/cal/gcal-oauth-redirect
NEXT_PUBLIC_OFFICE_CALENDAR_REDIRECT=https://your-app.com/api/cal/office-oauth-redirect

# Success/Error URLs (optional)
NEXT_PUBLIC_CALENDAR_SUCCESS_URL=https://your-app.com/dashboard/settings?tab=integrations&success=true
NEXT_PUBLIC_CALENDAR_ERROR_URL=https://your-app.com/dashboard/settings?tab=integrations&error=true
```

## Step 1: Initiate OAuth Flow

To start the OAuth process, call the "Get OAuth Connect URL" endpoint:

```typescript
// Example frontend code to initiate OAuth
async function connectGoogleCalendar() {
  try {
    const response = await fetch('/api/cal/calendars/oauth-connect-url?type=google');
    const result = await response.json();
    
    if (result.success && result.data?.authUrl) {
      // Redirect the user to the authorization URL
      window.location.href = result.data.authUrl;
    } else {
      console.error('Failed to get auth URL', result.error);
    }
  } catch (error) {
    console.error('Error connecting calendar:', error);
  }
}
```

The API implementation (`/api/cal/calendars/oauth-connect-url/route.ts`) handles:
- Authenticating the user
- Getting the Cal.com access token
- Refreshing the token if needed
- Constructing the proper redirect URL
- Calling the Cal.com API to get the OAuth URL

## Step 2: Handle OAuth Redirect

After the user authorizes your app, they'll be redirected to your callback URL with the `code` and `state` parameters. 

Implement redirect handlers for each calendar type:
- `/api/cal/gcal-oauth-redirect` for Google Calendar
- `/api/cal/office-oauth-redirect` for Office 365

These handlers extract the OAuth parameters and call the "Save OAuth Calendar Credentials" endpoint.

## Step 3: Save OAuth Calendar Credentials

The next step is to exchange the authorization code for access and refresh tokens:

This endpoint (`/api/cal/calendars/save-oauth-cal-creds/route.ts`):
- Extracts the OAuth code and state parameters
- Calls Cal.com's API to complete the OAuth flow
- Updates your database with the successful integration

## Step 4: Sync Calendar Credentials

To ensure the credentials are properly synchronized or to refresh expired tokens:

```typescript
// Example code to sync credentials
async function syncCalendarCredentials(calendarType: 'google' | 'office365') {
  try {
    const response = await fetch('/api/cal/calendars/sync-credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ calendarType })
    });
    
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error syncing calendar credentials:', error);
    return false;
  }
}
```

## Step 5: Check Calendar Connection

To verify if a user has connected calendar credentials:

```typescript
// Example code to check calendar status
async function checkCalendarConnection() {
  try {
    const response = await fetch('/api/cal/calendars/status');
    const result = await response.json();
    
    if (result.success) {
      return result.data.hasConnectedCalendars;
    }
    return false;
  } catch (error) {
    console.error('Error checking calendar status:', error);
    return false;
  }
}
```

## Database Schema

Your `CalendarIntegration` table should include:

```sql
CREATE TABLE "CalendarIntegration" (
  "id" SERIAL PRIMARY KEY,
  "userUlid" TEXT REFERENCES "User"("ulid"),
  "calAccessToken" TEXT NOT NULL,
  "calAccessTokenExpiresAt" TIMESTAMP WITH TIME ZONE,
  "calRefreshToken" TEXT,
  "calManagedUserId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## UI Implementation Example

Here's an example React component for calendar integration:

```tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function CalendarIntegration() {
  const [isLoading, setIsLoading] = useState(false);
  const [hasCalendars, setHasCalendars] = useState(false);

  // Check if calendars are connected on component mount
  useEffect(() => {
    async function checkCalendars() {
      const response = await fetch('/api/cal/calendars/status');
      const data = await response.json();
      if (data.success) {
        setHasCalendars(data.data.hasConnectedCalendars);
      }
    }
    checkCalendars();
  }, []);

  // Connect Google Calendar
  async function connectGoogleCalendar() {
    setIsLoading(true);
    try {
      const response = await fetch('/api/cal/calendars/oauth-connect-url?type=google');
      const result = await response.json();
      
      if (result.success && result.data?.authUrl) {
        window.location.href = result.data.authUrl;
      } else {
        console.error('Failed to get auth URL', result.error);
      }
    } catch (error) {
      console.error('Error connecting calendar:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Calendar Integration</h2>
      
      {hasCalendars ? (
        <div className="p-4 bg-green-50 text-green-700 rounded-md">
          ✅ Calendar connected successfully
        </div>
      ) : (
        <div className="space-y-4">
          <Button 
            onClick={connectGoogleCalendar} 
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? 'Connecting...' : 'Connect Google Calendar'}
          </Button>
          
          <Button 
            onClick={() => {/* Similar function for Office365 */}} 
            disabled={isLoading}
            variant="outline"
            className="flex items-center gap-2"
          >
            Connect Office 365 Calendar
          </Button>
        </div>
      )}
    </div>
  );
}
```

## Troubleshooting

- **Token Expiration**: The Cal.com access token expires after some time. Implement proper token refresh logic.
- **Redirect Issues**: Ensure your redirect URLs are properly configured and accessible.
- **API Permissions**: Check that your Cal.com API credentials have the necessary permissions.
- **Error Handling**: Implement proper error handling for all API calls.

## Security Considerations

- Store tokens securely in your database
- Use HTTPS for all API calls
- Implement proper authentication before allowing calendar access
- Consider encrypting sensitive tokens in your database 