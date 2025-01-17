# Zoom Integration Documentation

## Overview
This document outlines the implementation of Zoom SDK integration in our Next.js application, using TypeScript, Clerk for authentication, and Supabase for data storage.

## Architecture

### Core Components

1. **ZoomService** (`lib/zoom/zoom-service.ts`)
   - Handles Zoom SDK initialization
   - Manages authentication and token generation
   - Provides type-safe methods for all Zoom operations
   - Integrates with Clerk auth and Supabase storage

2. **ZoomClient** (`lib/zoom/zoom-client.ts`)
   - Low-level SDK client implementation
   - Handles device management
   - Manages session lifecycle
   - Provides event handling

3. **Type Definitions** (`utils/types/zoom.ts`)
   - Complete TypeScript interfaces for Zoom entities
   - Zod schemas for request/response validation
   - SDK event type definitions
   - Session configuration types

### React Components

1. **ZoomVideo** (`components/zoom/zoom-video.tsx`)
   - Manages video rendering
   - Handles device selection
   - Controls video quality
   - Provides layout options

2. **ZoomControls** (`components/zoom/zoom-controls.tsx`)
   - Audio/video toggle controls
   - Device selection UI
   - Meeting control actions
   - Status indicators

3. **SessionDetails** (`components/zoom/session-details.tsx`)
   - Displays meeting information
   - Shows participant list
   - Manages session settings
   - Handles session actions

### React Hooks

1. **useZoom** (`utils/hooks/useZoom.ts`)
   - Manages Zoom SDK state
   - Handles initialization
   - Provides session methods
   - Manages device state

2. **useZoomDevices** (`utils/hooks/useZoomDevices.ts`)
   - Manages audio/video devices
   - Handles device selection
   - Provides device lists
   - Monitors device changes

### API Routes

#### Session Management
1. **Create Session** (`app/api/zoom/sessions/route.ts`)
   ```typescript
   POST /api/zoom/sessions
   Body: {
     topic: string
     duration: number
     settings?: ZoomSessionSettings
   }
   ```

2. **Join Session** (`app/api/zoom/sessions/join/route.ts`)
   ```typescript
   POST /api/zoom/sessions/join
   Body: {
     sessionId: string
     displayName: string
     role?: 'host' | 'participant'
   }
   ```

#### Token Management
1. **Generate Token** (`app/api/zoom/token/route.ts`)
   ```typescript
   POST /api/zoom/token
   Body: {
     sessionId: string
     role: 'host' | 'participant'
   }
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
   - Zod schemas for validation
   - TypeScript interfaces
   - Strict null checks
   - Event type definitions

2. **Security**
   - Server-side token generation
   - Role-based access control
   - Secure session storage
   - Input validation

3. **Performance**
   - Dynamic quality adjustment
   - Device optimization
   - Resource cleanup
   - Error recovery

## Environment Variables

```env
ZOOM_SDK_KEY=your_sdk_key
ZOOM_SDK_SECRET=your_sdk_secret
ZOOM_JWT_TOKEN=your_jwt_token
USE_MOCK_ZOOM=true|false
```

## Database Schema

```sql
CREATE TABLE ZoomSession (
  id BIGINT PRIMARY KEY,
  sessionId TEXT NOT NULL,
  hostId TEXT NOT NULL,
  topic TEXT NOT NULL,
  startTime TIMESTAMP WITH TIME ZONE,
  duration INTEGER,
  status TEXT,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE
);

CREATE TABLE ZoomParticipant (
  id BIGINT PRIMARY KEY,
  sessionId TEXT NOT NULL,
  userId TEXT NOT NULL,
  displayName TEXT NOT NULL,
  role TEXT NOT NULL,
  joinTime TIMESTAMP WITH TIME ZONE,
  leaveTime TIMESTAMP WITH TIME ZONE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE
);
```

## Integration with Calendly

1. **Session Creation**
   - Automatic Zoom session creation on Calendly booking
   - Token generation for host and participant
   - Session details storage in database
   - Notification system integration

2. **Session Management**
   - Real-time status updates
   - Participant tracking
   - Recording management
   - Analytics collection

3. **Error Recovery**
   - Automatic reconnection
   - Fallback mechanisms
   - User notification system
   - Session state recovery 