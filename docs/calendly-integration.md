# Calendly Integration Documentation

## Overview
This document outlines the implementation of Calendly integration in our Next.js application, using TypeScript, Clerk for authentication, and Supabase for data storage.

## Architecture

### Core Components

1. **CalendlyService** (`lib/calendly/calendly-service.ts`)
   - Handles all Calendly API interactions
   - Manages OAuth2 token refresh flow with exponential backoff
   - Provides type-safe methods for all Calendly operations
   - Integrates with Clerk auth and Supabase storage
   - Implements automatic token refresh on 401 responses
   - Includes circuit breaker for failed refresh attempts
   - Manages availability data caching

2. **CalendlyClient** (`lib/calendly/calendly-client.ts`)
   - Low-level API client implementation
   - Handles common API methods
   - Manages request formatting and response parsing
   - Implements retry mechanisms with backoff

3. **CalendlySync** (`lib/calendly/calendly-sync.ts`)
   - Manages background token refresh
   - Handles webhook event processing
   - Maintains availability cache
   - Implements fallback mechanisms
   - Tracks sync status and metrics

4. **Type Definitions** (`utils/types/calendly.ts`)
   - Complete TypeScript interfaces for all Calendly entities
   - Zod schemas for request/response validation
   - Ensures type safety across the application

### Background Jobs

1. **Token Refresh Job** (`jobs/refresh-calendly-tokens.ts`)
   ```typescript
   // Runs every hour to proactively refresh tokens
   interface TokenRefreshJob {
     findExpiringTokens(): Promise<CalendlyIntegration[]>
     refreshTokens(integrations: CalendlyIntegration[]): Promise<void>
     handleFailures(failures: RefreshFailure[]): Promise<void>
   }
   ```

2. **Availability Sync Job** (`jobs/sync-calendly-availability.ts`)
   ```typescript
   // Maintains availability cache and handles updates
   interface AvailabilitySyncJob {
     syncUserAvailability(userDbId: number): Promise<void>
     updateCache(data: AvailabilityData): Promise<void>
     handleSyncFailure(error: SyncError): Promise<void>
   }
   ```

### Webhook System

1. **Webhook Handlers** (`app/api/calendly/webhooks/route.ts`)
   ```typescript
   // Processes real-time updates from Calendly
   interface WebhookHandlers {
     handleAvailabilityUpdate(event: WebhookEvent): Promise<void>
     handleUserUpdate(event: WebhookEvent): Promise<void>
     handleEventCreation(event: WebhookEvent): Promise<void>
   }
   ```

2. **Event Processing** (`lib/calendly/webhook-processor.ts`)
   ```typescript
   // Processes and validates webhook events
   interface WebhookProcessor {
     validateSignature(payload: unknown, signature: string): boolean
     processEvent(event: WebhookEvent): Promise<void>
     handleFailure(error: ProcessingError): Promise<void>
   }
   ```

### Caching System

1. **Availability Cache** (`lib/calendly/cache-manager.ts`)
   ```typescript
   interface CacheManager {
     get(key: string): Promise<CachedData | null>
     set(key: string, data: CachedData, ttl: number): Promise<void>
     invalidate(key: string): Promise<void>
     handleMiss(key: string): Promise<CachedData>
   }
   ```

### Database Schema

```sql
CREATE TABLE CalendlyIntegration (
  id BIGINT PRIMARY KEY,
  userDbId BIGINT REFERENCES User(id),
  accessToken TEXT NOT NULL,
  refreshToken TEXT NOT NULL,
  expiresAt TIMESTAMP WITH TIME ZONE NOT NULL,
  lastSyncAt TIMESTAMP WITH TIME ZONE,
  failedRefreshCount INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  organizationUrl TEXT,
  schedulingUrl TEXT,
  updatedAt TIMESTAMP WITH TIME ZONE NOT NULL,
  CONSTRAINT fk_user FOREIGN KEY (userDbId) REFERENCES User(id) ON DELETE CASCADE
);

CREATE TABLE CalendlyAvailabilityCache (
  id BIGINT PRIMARY KEY,
  userDbId BIGINT REFERENCES User(id),
  data JSONB NOT NULL,
  expiresAt TIMESTAMP WITH TIME ZONE NOT NULL,
  createdAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_user FOREIGN KEY (userDbId) REFERENCES User(id) ON DELETE CASCADE
);

CREATE TABLE CalendlyWebhookEvent (
  id BIGINT PRIMARY KEY,
  eventType TEXT NOT NULL,
  payload JSONB NOT NULL,
  processedAt TIMESTAMP WITH TIME ZONE,
  error TEXT,
  createdAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

### Error Handling & Recovery

1. **Circuit Breaker**
   ```typescript
   interface CircuitBreaker {
     isOpen(): boolean
     recordSuccess(): void
     recordFailure(): void
     shouldAttemptRefresh(): boolean
   }
   ```

2. **Retry Mechanism**
   ```typescript
   interface RetryManager {
     shouldRetry(error: Error, attempt: number): boolean
     getBackoffTime(attempt: number): number
     handleMaxRetries(error: Error): void
   }
   ```

### React Components

1. **CalendlyAvailability** (`components/calendly/CalendlyAvailability.tsx`)
   - Displays connection status
   - Manages availability settings
   - Handles reconnection flow
   - Shows mock data warnings
   - Provides quick access to Calendly settings

2. **ConnectCalendly** (`components/calendly/ConnectCalendly.tsx`)
   - Handles initial Calendly connection
   - Displays connection status
   - Provides account management options

3. **BookingModal** (`app/dashboard/realtor/coaches/_components/BookingModal.tsx`)
   - Implements Calendly inline widget
   - Handles script loading and initialization
   - Manages booking flow and events
   - Provides error handling and loading states

4. **SessionList** (`components/calendly/SessionList.tsx`)
   - Displays scheduled sessions
   - Implements filtering and sorting
   - Handles session management
   - Provides pagination support

### React Hooks

1. **useCalendly** (`utils/hooks/useCalendly.ts`)
   - Manages Calendly connection state
   - Handles OAuth flow
   - Provides connection methods
   - Manages loading and error states

2. **useEventTypes** (`utils/hooks/use-calendly.ts`)
   - Fetches and manages event types
   - Handles pagination
   - Provides error handling
   - Supports success/error callbacks

### API Routes

#### Authentication
1. **OAuth Callback** (`app/api/calendly/oauth/callback/route.ts`)
   ```typescript
   GET /api/calendly/oauth/callback
   Query params: code, state
   ```

2. **Status** (`app/api/calendly/status/route.ts`)
   ```typescript
   GET /api/calendly/status
   Response: CalendlyStatus
   ```

#### Event Management
1. **Event Types** (`app/api/calendly/events/types/route.ts`)
   ```typescript
   GET /api/calendly/events/types
   Query params: count, pageToken
   ```

2. **Scheduled Events** (`app/api/calendly/events/scheduled/route.ts`)
   ```typescript
   GET /api/calendly/events/scheduled
   Query params: count, pageToken, status, minStartTime, maxStartTime
   ```

3. **Event Cancellation** (`app/api/calendly/events/cancel/route.ts`)
   ```typescript
   POST /api/calendly/events/cancel
   Body: { uuid: string, reason: string }
   ```

#### Availability Management
1. **Free Times** (`app/api/calendly/availability/free/route.ts`)
   ```typescript
   GET /api/calendly/availability/free
   Query params: eventUri, startTime, endTime
   ```

2. **Schedules** (`app/api/calendly/availability/schedules/route.ts`)
   ```typescript
   GET /api/calendly/availability/schedules
   Query params: userUri
   ```

### Error Handling

1. **API Routes**
   ```typescript
   interface ApiResponse<T> {
     data: T | null
     error: {
       code: string
       message: string
       details?: unknown
     } | null
   }
   ```

2. **Client Components**
   - Toast notifications for user feedback
   - Loading states with spinners
   - Error boundaries for component failures
   - Graceful degradation

### Best Practices

1. **Type Safety**
   - Zod schemas for runtime validation
   - TypeScript interfaces for compile-time checks
   - Strict null checks enabled
   - Proper error typing

2. **Security**
   - Server-side token management
   - Clerk authentication integration
   - Supabase for secure storage
   - Input validation on all routes

3. **Performance**
   - Optimistic UI updates
   - Loading states for better UX
   - Error recovery mechanisms
   - Proper cleanup in components

## Environment Variables

```env
CALENDLY_CLIENT_ID=your_client_id
CALENDLY_CLIENT_SECRET=your_client_secret
CALENDLY_WEBHOOK_SIGNING_KEY=your_webhook_key
USE_REAL_CALENDLY=true|false
```

## Database Schema

```sql
CREATE TABLE User (
  id BIGINT PRIMARY KEY,
  userId TEXT NOT NULL,
  calendlyAccessToken TEXT,
  calendlyRefreshToken TEXT,
  calendlyExpiresAt TIMESTAMP WITH TIME ZONE,
  updatedAt TIMESTAMP WITH TIME ZONE
);
``` 