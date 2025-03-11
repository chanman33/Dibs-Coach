# Zoom Integration Specification
Version: 2.0.0

## Overview
Comprehensive specification for Zoom integration, including OAuth flow, meeting management, webhook handling, and implementation details.

## Features
- OAuth2 authentication with Zoom
- Automated meeting creation
- Meeting management
- Recording handling
- Webhook processing
- User settings management
- Integration with Cal events

## Implementation

### OAuth Flow
```typescript
// lib/zoom-api.ts
export async function getAuthUrl(userId: string): Promise<string> {
  return `https://zoom.us/oauth/authorize?response_type=code&client_id=${
    process.env.ZOOM_CLIENT_ID
  }&redirect_uri=${
    encodeURIComponent(process.env.ZOOM_REDIRECT_URI)
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
model ZoomIntegration {
  id              BigInt    @id @default(autoincrement())
  userId          String    @db.Text
  userDbId        BigInt
  accessToken     String    @db.Text
  refreshToken    String    @db.Text
  tokenExpiry     DateTime  @db.Timestamptz
  zoomUserId      String    @db.Text
  accountId       String    @db.Text
  settings        Json?     // Store user's Zoom settings
  metadata        Json?
  createdAt       DateTime  @default(now()) @db.Timestamptz
  updatedAt       DateTime  @updatedAt @db.Timestamptz

  user            User      @relation(fields: [userDbId], references: [id])

  @@index([userDbId])
}

model ZoomMeeting {
  id              BigInt    @id @default(autoincrement())
  userId          String    @db.Text
  userDbId        BigInt
  meetingId       String    @db.Text
  topic          String    @db.Text
  status         MeetingStatus
  startTime      DateTime  @db.Timestamptz
  duration       Int       // Duration in minutes
  joinUrl        String    @db.Text
  password       String    @db.Text
  settings       Json?     // Meeting-specific settings
  recordingUrl   String?   @db.Text
  metadata       Json?
  createdAt      DateTime  @default(now()) @db.Timestamptz
  updatedAt      DateTime  @updatedAt @db.Timestamptz

  user           User      @relation(fields: [userDbId], references: [id])

  @@index([userDbId])
  @@index([status])
}

enum MeetingStatus {
  SCHEDULED
  STARTED
  ENDED
  CANCELED
}
```

### API Routes

```typescript
// app/api/zoom/auth/route.ts
GET /api/zoom/auth
- Initiate OAuth flow
- Response: Redirect to Zoom auth URL

GET /api/zoom/auth/callback
- Handle OAuth callback
- Query params: code, state
- Response: Redirect to success/error page

// app/api/zoom/meetings/route.ts
POST /api/zoom/meetings
- Create new meeting
- Request: { topic: string, startTime: string, duration: number }
- Response: { meeting: ZoomMeeting }

GET /api/zoom/meetings
- List user's meetings
- Query params: status, startDate, endDate
- Response: { meetings: ZoomMeeting[] }

// app/api/zoom/webhook/route.ts
POST /api/zoom/webhook
- Handle Zoom webhooks
- Validate signature
- Process meeting/recording updates
```

### Meeting Management
```typescript
// utils/zoom/meetings.ts
export async function createMeeting(params: {
  userId: string;
  topic: string;
  startTime: Date;
  duration: number;
  settings?: any;
}): Promise<ZoomMeeting> {
  const integration = await getZoomIntegration(params.userId);
  const meeting = await createZoomMeeting(integration, params);
  return await saveMeeting(meeting);
}

export async function updateMeeting(
  meetingId: string,
  params: UpdateMeetingParams
): Promise<ZoomMeeting> {
  // Update meeting details
}

export async function deleteMeeting(meetingId: string): Promise<void> {
  // Cancel/delete meeting
}
```

### Recording Management
```typescript
// utils/zoom/recordings.ts
export async function handleRecordingComplete(
  payload: ZoomWebhookPayload
): Promise<void> {
  // Process recording completion
  // Update meeting with recording URL
  // Trigger notifications
}

export async function downloadRecording(
  meetingId: string
): Promise<string> {
  // Download and process recording
  // Return processed URL
}
```

### Webhook Handling
```typescript
// utils/zoom/webhooks.ts
export async function handleWebhook(
  payload: any,
  signature: string
): Promise<void> {
  validateWebhookSignature(signature, payload);
  
  switch (payload.event) {
    case 'meeting.started':
      await handleMeetingStarted(payload);
      break;
    case 'meeting.ended':
      await handleMeetingEnded(payload);
      break;
    case 'recording.completed':
      await handleRecordingComplete(payload);
      break;
    // ... other event handlers
  }
}
```

## Implementation Plan

### Phase 1: Core Integration
- [x] Set up OAuth flow
- [x] Create database schema
- [x] Implement token management
- [x] Basic meeting creation

### Phase 2: Meeting Management
- [x] Implement webhook handling
- [x] Meeting updates/deletion
- [x] Basic notification system
- [ ] Meeting templates

### Phase 3: Recording Management
- [ ] Recording webhook handling
- [ ] Recording download/processing
- [ ] Storage integration
- [ ] Retention policies

### Phase 4: Advanced Features
- [ ] Custom meeting settings
- [ ] Recurring meetings
- [ ] Breakout rooms
- [ ] Analytics tracking

### Phase 5: Optimization
- [ ] Implement caching
- [ ] Add retry mechanisms
- [ ] Improve error handling
- [ ] Performance monitoring

## Error Handling
- Token refresh mechanism
- Webhook retry logic
- Meeting creation fallbacks
- API rate limit handling
- Error logging and monitoring

## Security Considerations
- Secure token storage
- Webhook signature validation
- Meeting password requirements
- Recording access control
- API key rotation

## Testing Strategy
- OAuth flow testing
- Meeting creation/updates
- Recording processing
- Webhook handling
- Load testing 