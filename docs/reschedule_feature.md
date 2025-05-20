# PRD: Cal.com Meeting Reschedule Feature

**Version:** 1.0
**Date:** 2023-10-27
**Author:** AI Assistant

## 1. Introduction

This document outlines the requirements for implementing a meeting reschedule feature within the platform. This feature will allow both Coaches and Mentees to reschedule existing meetings booked via Cal.com. The implementation will focus on providing a seamless user experience, incorporating smart conflict checking where possible, and adhering strictly to the project guidelines detailed in `.cursorrules`.

## 2. Goals

*   Enable Coaches to initiate meeting reschedules.
*   Enable Mentees to initiate meeting reschedules.
*   Integrate with the Cal.com API for fetching availability and updating meeting times.
*   Implement conflict checking logic based on the user's role (Coach/Mentee) and their Cal.com OAuth connection status.
*   Provide clear notifications and user interface (UI) guidance throughout the rescheduling process.
*   Ensure all backend and frontend implementations align with the project architecture, security, and data management rules specified in `.cursorrules`.

## 3. User Scenarios & System Behavior

The rescheduling logic varies based on who initiates the action and the Mentee's Cal.com OAuth connection status:

| **Action Initiator** | **Mentee OAuth Connected?** | **Who Picks New Time?** | **Smart Conflict Checking?**         | **System Behavior**                                         | **Recommended UX**                                                                                         |
| -------------------- | --------------------------- | ----------------------- | ------------------------------------ | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Coach**            | ✅ Yes                       | Coach                   | ✅ Coach + mentee conflict (optional) | Reschedule directly via Cal API                             | Notify mentee of new time, allow them to reschedule if needed                                              |
| **Coach**            | ❌ No                        | Coach                   | ✅ Coach only                         | Reschedule directly via Cal API                             | Notify mentee, include message: "Make sure this time works for you. Let us know if you need to change it." |
| **Mentee**           | ✅ Yes                       | Mentee                  | ✅ Mentee + coach availability        | Allow smart rescheduling                                    | Real-time availability UI with conflict checking                                                           |
| **Mentee**           | ❌ No                        | Mentee                  | ❌ Coach availability only            | Allow rescheduling, assume mentee is available              | Warn: "We can't check your calendar without access. Want to connect it?"                                   |

## 4. Proposed Solution

### 4.1. Frontend User Experience (UX)

*   **Access Point:** A "Reschedule" button/option will be available on the meeting details page for both Coach and Mentee, if they are participants in the meeting.
*   **Common Elements:**
    *   Date and time picker interface.
    *   Confirmation step before finalizing the reschedule.
    *   Clear loading states and feedback messages (success, error).
*   **Coach-Initiated Reschedule:**
    *   UI displays current meeting time and allows Coach to select a new date/time.
    *   If Mentee's Cal.com is connected: Optionally, the system can check for conflicts on both calendars. Coach should be informed if the new time conflicts with the mentee's known availability.
    *   If Mentee's Cal.com is not connected: Conflict checking is performed against the Coach's calendar only.
    *   Upon successful reschedule, Coach sees a confirmation, and a notification is triggered for the Mentee.
*   **Mentee-Initiated Reschedule:**
    *   UI displays current meeting time and allows Mentee to select a new date/time.
    *   If Mentee's Cal.com is connected:
        *   The UI should ideally query Cal.com to show available slots that work for both the Mentee and the Coach ("Smart Rescheduling").
        *   This might involve displaying a calendar view with mutual availabilities.
    *   If Mentee's Cal.com is not connected:
        *   Display a prominent warning: "We can't check your calendar for conflicts without access. The times shown are based on the coach's availability. Want to connect your Cal.com account now?" (with a link to connect).
        *   The time picker will show slots based on the Coach's Cal.com availability.
    *   Upon successful reschedule, Mentee sees a confirmation, and a notification is triggered for the Coach.
*   **Notifications:**
    *   In-app notifications for both parties upon successful reschedule.
    *   Consider email notifications as a secondary channel.
    *   Notification content should clearly state the old time, new time, and who initiated the change.

### 4.2. API Interaction (Cal.com)

*   **Authentication:**
    *   The system must securely manage and use Cal.com API keys/tokens for both coaches and mentees (if mentees have connected their Cal.com accounts).
    *   As per `.cursorrules` (Cal.com): "Always confirm that the user has a valid Cal.com token before performing any actions." Client initialization for Cal.com is defined in `utils/cal` via `createCalClient`. Cookies for Cal.com tokens should be handled via dynamic API routes.
*   **Key Cal.com API Endpoints (to be confirmed with `cal.mdc` / Cal.com documentation):**
    *   `GET /bookings/{id}`: To fetch existing booking details.
    *   `PATCH /bookings/{id}` or `PUT /bookings/{id}`: To update the meeting time. This is the primary endpoint for rescheduling.
    *   `GET /availability`: To fetch availability for a user (coach, or mentee if connected). This will be crucial for the "smart rescheduling" UX.
*   **Data Flow:**
    *   Frontend requests reschedule via a server action.
    *   Server action authenticates the user, fetches necessary Cal.com tokens.
    *   Server action calls Cal.com API to perform the reschedule.
    *   "Always confirm Cal.com successfully completed the action before updating the database." (`.cursorrules`).

### 4.3. Server Actions (`utils/actions`)

A primary server action will handle the reschedule logic.

*   **`rescheduleCalMeeting(bookingUlid: string, newStartTime: string, newEndTime: string): Promise<{ data: Booking | null, error: Error | null }>`**
    *   `'use server'` directive at the top of the file.
    *   **Authentication & Authorization:**
        *   Retrieve `userUlid` using Clerk authentication (e.g., via `withServerAction` wrapper if used, or standard Clerk helpers).
        *   Verify that the `userUlid` is a participant (coach or mentee) of the meeting associated with `bookingUlid` and has permission to reschedule.
    *   **Input Validation:**
        *   Validate `bookingUlid`, `newStartTime`, `newEndTime` using Zod schemas (as per `.cursorrules`).
    *   **Logic:**
        1.  Fetch internal booking details from Supabase using `bookingUlid` (this record should contain the `calBookingId`).
        2.  Retrieve the Cal.com API token for the user initiating the reschedule (and the other party, if needed for conflict checking and their Cal.com is connected).
        3.  **Conflict Checking (pre-API call, if applicable):**
            *   If Coach initiates & Mentee OAuth: Optionally call Cal.com availability for mentee.
            *   If Mentee initiates & Mentee OAuth: Call Cal.com availability for coach (and mentee, though mentee is picking).
        4.  **Cal.com API Call:**
            *   Use `createCalClient` to interact with the Cal.com API.
            *   Call the appropriate Cal.com endpoint to update the booking time using the `calBookingId`.
        5.  **Database Update:**
            *   If Cal.com API call is successful:
                *   Update the meeting record in the Supabase `Bookings` (or equivalent) table with the new `startTime`, `endTime`, and `updatedAt` (must be `new Date().toISOString()`). Use `ulid` for WHERE clauses.
                *   Ensure adherence to table naming (`PascalCase`) and column naming (`camelCase`) conventions from `.cursorrules`.
        6.  **Notifications:**
            *   Trigger in-app/email notifications to the other party.
    *   **Error Handling:**
        *   Implement robust try-catch blocks.
        *   Return structured errors as per `.cursorrules` (`{ data: null, error: { code, message, details } }`).
        *   Log errors with context (`console.error('[CAL_RESCHEDULE_ERROR]', error)`).
    *   **Location:** `utils/actions/calActions.ts` (or similar, following resource-based organization).

### 4.4. Database Considerations (Supabase)

*   **`Bookings` Table (example structure, verify with actual schema):**
    *   `ulid`: `String @id @db.Char(26)` (Primary Key, client-generated)
    *   `calBookingId`: `TEXT` (ID from Cal.com)
    *   `coachUserUlid`: `String @db.Char(26)` (FK to `User.ulid`)
    *   `menteeUserUlid`: `String @db.Char(26)` (FK to `User.ulid`)
    *   `startTime`: `TIMESTAMP WITH TIME ZONE`
    *   `endTime`: `TIMESTAMP WITH TIME ZONE`
    *   `createdAt`: `TIMESTAMP WITH TIME ZONE DEFAULT NOW()`
    *   `updatedAt`: `TIMESTAMP WITH TIME ZONE` (Must be updated on reschedule)
*   **`User` Table / `CalIntegrations` Table:**
    *   Needs to store whether a user (especially mentee) has connected their Cal.com account and their Cal.com API token/refresh token securely. This is critical for conflict checking and API calls.
    *   Secure storage and retrieval of Cal.com tokens are paramount. Follow Cal.com guidelines in `.cursorrules`.
*   All database operations must use the Supabase client as per `.cursorrules`. Prisma is for schema management only.

## 5. Technical Requirements & Adherence to `.cursorrules`

*   **Authentication:** Platform authentication via Clerk. Cal.com authentication via stored user tokens for API calls.
*   **Server Actions:**
    *   Located in `utils/actions`.
    *   Use `'use server'` directive.
    *   Follow naming conventions: `verbResource` (e.g., `rescheduleCalMeeting`).
*   **API Routes (`app/api`):** If any helper routes are needed for Cal.com OAuth flow or proxying, they must be dynamic (`export const dynamic = 'force-dynamic'`).
*   **Database:**
    *   All data operations via Supabase client (`createAuthClient` / `createServerAuthClient`).
    *   Table names in `PascalCase`, column names in `camelCase`.
    *   `updatedAt` field must be updated in all update operations.
    *   ULIDs generated client-side for new records, used for all internal relations.
*   **Types:**
    *   Zod for schema validation (`utils/types`).
    *   `PascalCase` for types, `camelCaseSchema` for Zod schemas.
*   **Error Handling:**
    *   Consistent error logging format (`console.error('[CONTEXT_ERROR]', error)`).
    *   Structured error responses from server actions.
*   **Cal.com Specifics (`.cursorrules`):**
    *   Use `createCalClient` from `utils/cal`.
    *   Confirm Cal.com token validity before actions.
    *   Confirm Cal.com action success before DB updates.
    *   Handle cookies for Cal.com tokens via dynamic API routes at runtime.

## 6. Out of Scope

*   Initial booking of Cal.com meetings (this PRD covers reschedule only).
*   Cancellation of meetings (unless the Cal.com reschedule API implicitly supports this with a specific status).
*   Rescheduling of group meetings (current logic assumes 1:1 coach-mentee meetings).
*   Complex UI for managing multiple Cal.com connections if a user has several.

## 7. Open Questions & Risks

*   **Cal.com API Specifics:**
    *   What are the exact Cal.com API endpoints, request/response payloads, and rate limits for rescheduling and availability checking? (Requires consulting `cal.mdc` or current Cal.com API documentation).
    *   How does Cal.com API handle concurrent reschedule attempts for the same event?
*   **Token Management:**
    *   Detailed strategy for secure storage, refresh, and revocation of Cal.com API tokens. The rules mention dynamic API routes for cookie access. This flow needs to be robust.
*   **UX for Availability:**
    *   Complexity of implementing a "smart" real-time availability UI that merges Coach and Mentee availability from Cal.com. What are the performance implications?
*   **Error Scenarios:** How to handle partial failures (e.g., Cal.com reschedule succeeds, but DB update fails)? A retry mechanism or compensation transaction might be needed.
*   **Timezone Handling:** Ensure consistent timezone management across the platform, Cal.com, and user displays. Cal.com API usually handles this well with ISO 8601 strings, but frontend display needs care. 