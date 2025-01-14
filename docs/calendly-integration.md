# Calendly Integration Documentation

## Overview
This document outlines the implementation of Calendly integration in our Next.js application, using TypeScript, Clerk for authentication, and Supabase for data storage.

## Architecture

### Core Components

1. **CalendlyService** (`lib/calendly-service.ts`)
   - Handles all Calendly API interactions
   - Manages OAuth2 token refresh flow
   - Provides type-safe methods for all Calendly operations
   - Integrates with Clerk auth and Supabase storage

2. **Utility Functions** (`lib/calendly-utils.ts`)
   - Date and time formatting
   - Authentication checks
   - Data transformation helpers
   - Availability calculations

3. **Type Definitions** (`types/calendly.ts`)
   - Complete TypeScript interfaces for all Calendly entities
   - Ensures type safety across the application
   - Matches Calendly's API response structures

### API Routes

1. **Event Types** (`app/api/calendly/event-types/route.ts`)
   ```typescript
   GET /api/calendly/event-types
   Query params: count, pageToken
   ```

2. **Scheduled Events** (`app/api/calendly/scheduled-events/route.ts`)
   ```typescript
   GET /api/calendly/scheduled-events
   Query params: count, pageToken, status, minStartTime, maxStartTime
   ```

3. **Event Cancellation** (`app/api/calendly/scheduled-events/[uuid]/cancel/route.ts`)
   ```typescript
   POST /api/calendly/scheduled-events/{uuid}/cancel
   Body: { reason: string }
   ```

4. **Availability Schedules** (`app/api/calendly/availability-schedules/route.ts`)
   ```typescript
   GET /api/calendly/availability-schedules
   Query params: userUri
   ```

5. **Busy Times** (`app/api/calendly/busy-times/route.ts`)
   ```typescript
   GET /api/calendly/busy-times
   Query params: userUri, startTime, endTime
   ```

6. **Available Times** (`app/api/calendly/available-times/route.ts`)
   ```typescript
   GET /api/calendly/available-times
   Query params: eventUri, startTime, endTime
   ```

7. **Invitee Management** (`app/api/calendly/invitees/no-show/route.ts`)
   ```typescript
   POST /api/calendly/invitees/no-show
   Body: { inviteeUri: string }

   DELETE /api/calendly/invitees/{uuid}/no-show
   ```

### React Hooks

1. **useEventTypes**
   - Fetches and manages event type data
   - Handles pagination
   - Provides loading and error states

2. **useScheduledEvents**
   - Manages scheduled events list
   - Supports filtering and pagination
   - Includes event cancellation functionality

3. **useAvailabilitySchedules**
   - Retrieves user's availability schedules
   - Handles timezone conversions
   - Provides formatted schedule data

4. **useBusyTimes**
   - Fetches user's busy time slots
   - Supports date range filtering
   - Integrates with availability checking

5. **useAvailableTimes**
   - Gets available time slots for events
   - Handles date range selection
   - Supports capacity checking

6. **useEventInvitees**
   - Manages event invitee data
   - Handles no-show marking
   - Supports invitee status updates

## Authentication Flow

1. **Initial Auth**
   ```typescript
   const user = await checkCalendlyAuth()
   ```
   - Verifies Clerk authentication
   - Checks Supabase for Calendly tokens
   - Throws if not authenticated or connected

2. **Token Refresh**
   - Automatic token refresh on 401 responses
   - Updates tokens in Supabase
   - Retries failed requests

## Data Models

1. **User Table**
   ```sql
   CREATE TABLE User (
     id BIGINT PRIMARY KEY,
     userId TEXT NOT NULL,
     calendlyAccessToken TEXT,
     calendlyRefreshToken TEXT,
     updatedAt TIMESTAMP WITH TIME ZONE
   );
   ```

## Utility Functions

1. **Date Formatting**
   ```typescript
   formatTime(dateString)              // "2:30 PM"
   formatEventDateTime(event)          // Adds formatted dates
   formatDateRange(startDate, endDate) // "Mar 1 - Mar 7, 2024"
   ```

2. **Availability Helpers**
   ```typescript
   isTimeSlotAvailable(time, busyTimes)
   groupTimesByDate(times)
   ```

## Error Handling

1. **API Routes**
   - Consistent error response format
   - Detailed error logging
   - HTTP status codes mapping

2. **Client Hooks**
   - Loading states
   - Error states with messages
   - Toast notifications

## Best Practices

1. **Type Safety**
   - All API responses typed
   - Runtime type checking
   - Strict null checks

2. **Performance**
   - Request caching
   - Optimistic updates
   - Pagination support

3. **Security**
   - Server-side token management
   - Request validation
   - Error message sanitization

## Usage Examples

1. **Fetching Event Types**
   ```typescript
   const { eventTypes, loading, error } = useEventTypes()
   useEffect(() => {
     fetchEventTypes(10)
   }, [])
   ```

2. **Managing Events**
   ```typescript
   const { events, cancelEvent } = useScheduledEvents()
   const handleCancel = async (uuid) => {
     await cancelEvent(uuid, 'Schedule conflict')
   }
   ```

3. **Checking Availability**
   ```typescript
   const { availableTimes } = useAvailableTimes()
   const slots = groupTimesByDate(availableTimes)
   ```

## Environment Variables

```env
CALENDLY_API_BASE_URL=https://api.calendly.com
CALENDLY_AUTH_BASE_URL=https://auth.calendly.com
CALENDLY_CLIENT_ID=your_client_id
CALENDLY_CLIENT_SECRET=your_client_secret
```

## Future Improvements

1. **Features**
   - Batch operations
   - Webhook support
   - Analytics tracking
   - Caching layer

2. **Performance**
   - Request batching
   - Background polling
   - Optimistic updates

3. **UX**
   - Better error messages
   - Loading skeletons
   - Offline support 