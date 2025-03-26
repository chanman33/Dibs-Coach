# Cal.com API Implementation PRD (Priority Features)

## 1. Overview

This document outlines the **critical** Cal.com API integration features required for our Real Estate Agent Coaching Marketplace. Our platform connects real estate agents with professional coaches, and scheduling/booking functionality is core to our business model. This PRD prioritizes essential features to meet our urgent timeline.

## 2. Current Implementation Status

Based on the test pages we've implemented so far, we have made significant progress with Cal.com integration:

### 2.1 OAuth Authentication (`cal-oauth-test`)
- Integration with Cal.com OAuth flow
- Token management
- Ability to create managed users via API
- Ability to list existing managed users

### 2.2 Database Integration (`cal-db-test`)
- Schema design for storing Cal.com integration data
- Creating Cal.com managed users and storing their data in our database
- Retrieving integration data from database
- Token refresh flow

### 2.3 Webhook Management (`cal-webhook-management`)
- UI for listing, creating, and deleting webhooks
- Default webhook setup
- Configurable event triggers

### 2.4 Webhook Testing (`cal-webhook-test`)
- Simulating Cal.com webhook events
- Testing webhook signature verification
- Processing various booking events (created, rescheduled, cancelled)

## 3. Critical Implementation Features

### 3.1 Coach Availability Management (HIGHEST PRIORITY)

**Description**: Enable coaches to set and manage their availability through Cal.com.

**Requirements**:
- Create and sync availability schedules between our platform and Cal.com
- Support timezone handling for global coaches and clients
- Allow for recurring availability and exceptions
- Implement buffer times between sessions

**Implementation Steps**:
1. Integrate Cal.com OAuth for coach accounts
2. Sync coach availability from Cal.com to our platform
3. Implement availability display in the coach profiles
4. Add UI for coaches to manage their calendars

### 3.2 Session Booking (HIGHEST PRIORITY)

**Description**: Allow agents to book coaching sessions through an integrated calendar.

**Requirements**:
- Display available time slots based on coach's calendar
- Process bookings through Cal.com API
- Send confirmation emails to both parties
- Create calendar invites (Google, Outlook, etc.)
- Support session rescheduling and cancellation

**Implementation Steps**:
1. Implement booking widget with available time slots
2. Create API endpoints for booking creation/management
3. Set up webhook handlers for booking status updates
4. Implement email notifications for booking events

### 3.3 Webhook Integration (HIGH PRIORITY)

**Status**: MOSTLY IMPLEMENTED
- Webhook registration and management
- Event handling for booking events
- Security signature verification

**Requirements to complete**:
- Implement handling for additional event types
- Add error recovery and retry mechanisms
- Enhance monitoring and logging

### 3.4 Session Management (HIGH PRIORITY)

**Description**: Track and manage booked sessions between coaches and agents.

**Requirements**:
- Display upcoming and past sessions for both coaches and agents
- Support note-taking during and after sessions
- Track session attendance and completion
- Link sessions to Zoom meetings

**Implementation Steps**:
1. Create database models for storing session information
2. Build session management dashboard for users
3. Implement session status tracking
4. Integrate with Zoom API for video meetings

### 3.5 Payment Integration (MEDIUM PRIORITY)

**Description**: Connect Cal.com booking events with our payment processing system.

**Requirements**:
- Trigger payment collection on booking confirmation
- Handle refunds for cancellations based on policies
- Track payment status for bookings
- Generate invoices and receipts

**Implementation Steps**:
1. Create payment webhook handlers
2. Implement booking-payment status synchronization
3. Define cancellation and refund flows

## 4. Next Test Pages to Implement

Based on our current implementation and remaining priorities, we should implement the following test pages:

### 4.1 `cal-availability-test`
- Test retrieving and setting availability slots
- Test timezone handling
- Test recurring availability rules
- Includes:
  - UI to view coach availability
  - Controls to modify availability
  - Timezone selector to test global view

### 4.2 `cal-booking-test`
- Test end-to-end booking flow
- Test finding available slots
- Test creating bookings
- Test rescheduling/cancelling
- Includes:
  - Slot selection calendar
  - Booking form with custom fields
  - Booking management controls

### 4.3 `cal-event-types-test`
- Test creating and managing event types (coaching session types)
- Test updating event type properties
- Test listing available event types
- Includes:
  - Form to create new event types
  - Controls to modify durations, buffers, etc.
  - Event type listing and management

### 4.4 `cal-zoom-integration-test`
- Test connecting Zoom with Cal.com bookings
- Test automatic Zoom meeting creation
- Test meeting join URLs
- Includes:
  - Zoom connection interface
  - Meeting creation testing
  - Meeting configuration options

## 5. Technical Implementation Plan

### 5.1 Database Schema

We already have implemented:
- `CalendarIntegration` table for storing Cal.com tokens and user data
- `CalBooking` table for tracking bookings

Additional schema needed:
- `CoachingSession` table to extend booking with coaching-specific data
- `SessionNote` table for storing session notes
- `EventType` table for caching coach's event types

### 5.2 API Endpoints

We already have implemented:
- `/api/cal/oauth/callback` - OAuth callback handler
- `/api/cal/webhooks` - CRUD operations for webhooks
- `/api/cal/webhooks/receiver` - Webhook event handler
- `/api/cal/test/*` - Various test endpoints

Additional endpoints needed:
- `/api/cal/event-types` - CRUD for event types
- `/api/cal/availability` - Get/set availability
- `/api/cal/bookings` - Create and manage bookings
- `/api/cal/sessions` - Session management
- `/api/cal/zoom` - Zoom integration

### 5.3 UI Components

We already have components for:
- OAuth testing
- Webhook management
- Database integration testing

Additional components needed:
- Availability calendar display
- Booking widget
- Session management dashboard
- Event type management

## 6. Implementation Timeline

### Phase 1 (Day 1): Availability & Event Types
- Complete availability management test page
- Complete event types test page
- Implement core UI components for booking flow

### Phase 2 (Day 2): Booking System
- Complete booking test page
- Refine webhook handler for production use
- Implement production booking flow components

### Phase 3 (Day 3): Session Management & Zoom
- Implement Zoom integration test page
- Build session management dashboard
- Integrate email notifications
- Connect with payment system

## 7. Testing Strategy

- Test each page independently with mock data
- Create end-to-end test for full booking flow
- Test timezone edge cases
- Test cancellation and refund policies
- Test across different browsers and devices

## 8. Success Metrics

- 100% successful booking rate through Cal.com
- Real-time synchronization between our system and Cal.com
- <500ms response time for availability queries
- Zero data loss for booking information
- Successful delivery of all email notifications and calendar invites

## 9. Dependencies

- Cal.com API access and credentials (CONFIGURED)
- Zoom API integration for video sessions
- Email delivery service
- Payment processing system (Stripe)
- Existing authentication system (Clerk) 