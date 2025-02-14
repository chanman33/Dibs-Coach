# Calendly Integration Specification
Version: 2.0.0

## Overview
Comprehensive specification for Calendly integration, including OAuth flow, event management, webhook handling, and implementation details.

## Features
- OAuth2 authentication with Calendly
- Event type management
- Scheduling workflow
- Webhook handling for event updates
- User availability sync
- Event notifications
- Zoom meeting integration

## Implementation

### OAuth Flow
```typescript
// lib/calendly-api.ts
export async function getAuthUrl(userId: string): Promise<string> {
  return `https://auth.calendly.com/oauth/authorize?client_id=${
    process.env.CALENDLY_CLIENT_ID
  }&response_type=code&redirect_uri=${
    encodeURIComponent(process.env.CALENDLY_REDIRECT_URI)
  }&state=${userId}`;
}

export async function exchangeCode(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  // Exchange authorization code for tokens
}
```

### Database Schema
```prisma
model CalendlyIntegration {
  id              BigInt    @id @default(autoincrement())
  userId          String    @db.Text
  userDbId        BigInt
  accessToken     String    @db.Text
  refreshToken    String    @db.Text
  tokenExpiry     DateTime  @db.Timestamptz
  calendlyUserId  String    @db.Text
  organizationId  String    @db.Text
  metadata        Json?
  createdAt       DateTime  @default(now()) @db.Timestamptz
  updatedAt       DateTime  @updatedAt @db.Timestamptz

  user            User      @relation(fields: [userDbId], references: [id])

  @@index([userDbId])
}

model CalendlyEvent {
  id              BigInt    @id @default(autoincrement())
  userId          String    @db.Text
  userDbId        BigInt
  eventUuid       String    @db.Text
  eventType       String    @db.Text
  status          EventStatus
  startTime       DateTime  @db.Timestamptz
  endTime         DateTime  @db.Timestamptz
  inviteeEmail    String    @db.Text
  zoomMeetingId   String?   @db.Text
  metadata        Json?
  createdAt       DateTime  @default(now()) @db.Timestamptz
  updatedAt       DateTime  @updatedAt @db.Timestamptz

  user            User      @relation(fields: [userDbId], references: [id])

  @@index([userDbId])
  @@index([status])
}

enum EventStatus {
  SCHEDULED
  CANCELED
  COMPLETED
}
```

### API Routes

```typescript
// app/api/calendly/auth/route.ts
GET /api/calendly/auth
- Initiate OAuth flow
- Response: Redirect to Calendly auth URL

GET /api/calendly/auth/callback
- Handle OAuth callback
- Query params: code, state
- Response: Redirect to success/error page

// app/api/calendly/webhook/route.ts
POST /api/calendly/webhook
- Handle Calendly webhooks
- Validate signature
- Process event updates

// app/api/calendly/events/route.ts
GET /api/calendly/events
- List user's scheduled events
- Query params: status, startDate, endDate
- Response: { events: CalendlyEvent[] }

POST /api/calendly/events/sync
- Force sync with Calendly
- Response: { synced: number }
```

### Webhook Handling
```typescript
// utils/calendly/webhooks.ts
export async function handleWebhook(
  payload: any,
  signature: string
): Promise<void> {
  validateWebhookSignature(signature, payload);
  
  switch (payload.event) {
    case 'invitee.created':
      await handleNewBooking(payload.payload);
      break;
    case 'invitee.canceled':
      await handleCancellation(payload.payload);
      break;
    // ... other event handlers
  }
}
```

### Event Management
```typescript
// utils/calendly/events.ts
export async function syncEvents(userId: string): Promise<number> {
  const integration = await getCalendlyIntegration(userId);
  const events = await fetchCalendlyEvents(integration);
  return await updateLocalEvents(userId, events);
}

export async function handleNewBooking(
  payload: CalendlyWebhookPayload
): Promise<void> {
  // Create local event record
  // Schedule Zoom meeting
  // Send notifications
}
```

### Zoom Integration
```typescript
// utils/calendly/zoom.ts
export async function createZoomMeeting(
  event: CalendlyEvent
): Promise<string> {
  // Create Zoom meeting for event
  // Return meeting ID
}

export async function updateZoomMeeting(
  event: CalendlyEvent
): Promise<void> {
  // Update existing Zoom meeting
}
```

## Implementation Plan

### Phase 1: Core Integration
- [x] Set up OAuth flow
- [x] Create database schema
- [x] Implement token management
- [x] Basic event syncing

### Phase 2: Event Management
- [x] Implement webhook handling
- [x] Event creation/updates
- [x] Basic notification system
- [ ] Event cancellation flow

### Phase 3: Zoom Integration
- [x] Zoom meeting creation
- [x] Meeting updates/cancellation
- [ ] Automated recordings
- [ ] Meeting reminders

### Phase 4: Advanced Features
- [ ] Calendar availability sync
- [ ] Custom event types
- [ ] Team scheduling
- [ ] Analytics tracking

### Phase 5: Optimization
- [ ] Implement caching
- [ ] Add retry mechanisms
- [ ] Improve error handling
- [ ] Performance monitoring

## Error Handling
- Token refresh mechanism
- Webhook retry logic
- Event sync conflict resolution
- API rate limit handling
- Error logging and monitoring

## Security Considerations
- Secure token storage
- Webhook signature validation
- User data access control
- API key rotation
- Audit logging

## Testing Strategy
- OAuth flow testing
- Webhook payload validation
- Event sync verification
- Integration tests
- Load testing for webhooks 