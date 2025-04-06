# Coach Event Types System

This document explains the implementation of the required coach event types in our system.

## Overview

Every coach in our system must have two standard event types:

1. **Coaching Session** (30 minutes, paid) - This is a required session type that must always be enabled and cannot be deleted.
2. **Get to Know You** (15 minutes, free) - This is a required intro session that can be disabled but not deleted.

These event types are synced between our database and Cal.com to ensure consistency.

## Implementation Details

### Database Schema

The event types are stored in the `CalEventType` table with the following key fields:

- `ulid`: Primary identifier
- `calendarIntegrationUlid`: Foreign key to the calendar integration
- `calEventTypeId`: The ID in Cal.com's system
- `name`: The name of the event type
- `description`: Description of the event
- `duration`: Duration in minutes
- `isFree`: Whether this is a free event
- `isActive`: Whether the event type is currently active
- `isDefault`: Whether this is a default event type

### Frontend Components

1. **EventTypeManager** - The main component for managing event types
   - Ensures required event types always exist
   - Enforces constraints on required event types (cannot delete, cannot disable certain types)
   - Merges existing and required event types

2. **EventTypeCard** - Displays individual event types
   - Shows appropriate badges for required/free event types
   - Disables delete button for required event types
   - Disables activation toggle for required event types that cannot be disabled

### Backend Actions

1. **fetchCoachEventTypes** - Retrieves the coach's event types
   - Includes the coach's hourly rate for pricing calculations

2. **saveCoachEventTypes** - Saves changes to event types
   - Syncs changes to Cal.com
   - Ensures required event types remain intact

3. **createDefaultEventTypes** - Creates the default event types for a new coach
   - Creates both required event types in our database and on Cal.com

4. **createFreeIntroCallEventType** - Creates just the free intro session
   - Used in bulk operations to ensure all coaches have intro sessions

## Required Event Type Properties

### Coaching Session (30-minute paid session)
- Duration: 30 minutes
- Free: No
- Always enabled
- Cannot be deleted
- Video call format
- 5-minute buffer before and after

### Get to Know You (15-minute free session)
- Duration: 15 minutes
- Free: Yes
- Can be disabled (but not deleted)
- Video call format
- No buffer time

## Usage Notes

1. When a coach is first set up, both required event types are automatically created.
2. The UI prevents coaches from deleting these required types.
3. The 30-minute coaching session cannot be disabled, while the free intro session can be.
4. Certain properties of these required types (duration, name, price) cannot be modified.

## Admin Tools

Admin users can use the following API endpoints to manage event types across coaches:

1. `/api/cal/event-types/create-default-event-types` - Creates default event types for all coaches
2. `/api/cal/event-types/create-free-intro-event-types` - Ensures all coaches have a free intro event type

## Synchronization with Cal.com

Event types are synchronized with Cal.com using their v2 API. The synchronization process:

1. First creates/updates the event in Cal.com
2. Then updates our local database
3. Refreshes Cal.com tokens when needed

Pricing for paid sessions is calculated based on the coach's hourly rate stored in the `CoachProfile` table. 