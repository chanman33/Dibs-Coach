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

2. **Background Jobs** (`app/api/cron/`)
   - Token Refresh Job (`refresh-calendly-tokens/route.ts`)
     - Runs hourly to proactively refresh tokens
     - Implements circuit breaker pattern
     - Uses exponential backoff for retries
     - Handles token refresh failures gracefully
   
   - Availability Sync Job (`sync-calendly-availability/route.ts`)
     - Runs every 15 minutes
     - Syncs availability for users with expired cache
     - Maintains availability and event type data
     - Implements efficient caching strategy

3. **Webhook System** (`app/api/calendly/webhooks/route.ts`)
   - Secure signature verification
   - Real-time event processing
   - Event storage and tracking
   - Handles booking and availability updates
   - Implements proper error handling

### Database Schema

```sql
-- Calendly Integration Tables
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
  updatedAt TIMESTAMP WITH TIME ZONE NOT NULL,
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

CREATE TABLE CalendlyBooking (
  id BIGINT PRIMARY KEY,
  userDbId BIGINT REFERENCES User(id),
  calendlyEventUuid TEXT NOT NULL,
  status TEXT NOT NULL,
  startTime TIMESTAMP WITH TIME ZONE NOT NULL,
  endTime TIMESTAMP WITH TIME ZONE NOT NULL,
  inviteeEmail TEXT NOT NULL,
  inviteeName TEXT NOT NULL,
  eventType TEXT NOT NULL,
  createdAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE NOT NULL,
  CONSTRAINT fk_user FOREIGN KEY (userDbId) REFERENCES User(id) ON DELETE CASCADE
);
```

### Error Handling & Recovery

1. **Circuit Breaker**
   - Prevents cascading failures
   - Auto-resets after timeout
   - Tracks failure count
   - Configurable thresholds

2. **Retry Mechanism**
   - Exponential backoff with jitter
   - Smart retry decisions
   - Configurable retry limits
   - Error-specific handling

### Monitoring & Logging

1. **Error Logging**
   - Structured error format
   - Context-specific error codes
   - Detailed error tracking
   - Performance monitoring

2. **Status Tracking**
   - Integration health monitoring
   - Token refresh status
   - Webhook delivery status
   - Cache performance metrics

### Security Measures

1. **Token Management**
   - Secure token storage
   - Proactive token refresh
   - Token revocation on disconnect
   - Failed refresh cleanup

2. **Webhook Security**
   - Signature verification
   - Request validation
   - Rate limiting
   - Error handling

### Caching Strategy

1. **Availability Cache**
   - TTL-based expiration (24 hours)
   - Real-time invalidation via webhooks
   - Background sync fallback
   - Cache warmup on access

2. **Performance Optimization**
   - Edge runtime for better performance
   - Parallel API requests
   - Efficient database queries
   - Proper connection pooling

## Environment Variables

```env
# Calendly Configuration
CALENDLY_CLIENT_ID=your_client_id
CALENDLY_CLIENT_SECRET=your_client_secret
CALENDLY_WEBHOOK_SIGNING_KEY=your_webhook_key

# Vercel Cron Configuration
CRON_SECRET=your_cron_secret
```

## Vercel Configuration

```json
{
  "crons": [
    {
      "path": "/api/cron/refresh-calendly-tokens",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/sync-calendly-availability",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

## Implementation Status

✅ Token Management System
- [x] Proactive token refresh
- [x] Circuit breaker implementation
- [x] Exponential backoff
- [x] Error recovery

✅ Webhook Integration
- [x] Secure signature verification
- [x] Event storage
- [x] Real-time processing
- [x] Error handling

✅ Background Sync
- [x] Availability synchronization
- [x] Cache management
- [x] Performance optimization
- [x] Error recovery

✅ Database Schema
- [x] All required tables
- [x] Proper relationships
- [x] Indexes and constraints
- [x] Status tracking

✅ Security
- [x] Token security
- [x] Webhook verification
- [x] Error handling
- [x] Logging system 