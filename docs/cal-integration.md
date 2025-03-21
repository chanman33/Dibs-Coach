# Cal.com Integration Guide

This guide explains how to use the Cal.com integration in your Next.js application.

## Setup

1. Set up environment variables in your `.env` file:
```env
FRONTEND_URL=https://your-domain.com
NEXT_PUBLIC_CAL_API_KEY=your_cal_api_key
```

2. Ensure you have the required dependencies:
```bash
yarn add date-fns zod
```

## API Client Usage

The `calApiClient` provides three main methods:

### 1. Fetch Event Types
```typescript
const eventTypes = await calApiClient.getEventTypes();
```

### 2. Get Availability
```typescript
const availability = await calApiClient.getAvailability(
  eventTypeId,
  startDate,
  endDate
);
```

### 3. Create Booking
```typescript
const booking = await calApiClient.createBooking({
  eventTypeId: 123,
  start: "2024-03-20T10:00:00Z",
  end: "2024-03-20T11:00:00Z",
  name: "John Doe",
  email: "john@example.com"
});
```

## Component Usage

The `BookingCalendar` component provides a complete booking flow:

```typescript
import { BookingCalendar } from '@/components/BookingCalendar';

export default function BookingPage() {
  return <BookingCalendar />;
}
```

## Configuration

The Cal.com integration uses two main configuration files:

1. `lib/config/cal.ts` - Cal.com specific configuration
2. `lib/config/env.ts` - Environment variable validation

### Custom Redirect URLs

You can customize redirect URLs using the `getCalUrls` utility:

```typescript
import { getCalUrls } from '@/lib/config/cal';

const urls = getCalUrls('/custom-success-page');
```

## Error Handling

All API methods throw errors when requests fail. Wrap API calls in try-catch blocks:

```typescript
try {
  const eventTypes = await calApiClient.getEventTypes();
} catch (error) {
  console.error('Failed to fetch event types:', error);
}
```

## TypeScript Support

The integration includes full TypeScript support. Key types:

- `CalEventType`
- `CalTimeSlot`
- `CreateBookingData`
- `CalConfig`
- `CalUrls`

## Best Practices

1. Always validate environment variables before using them
2. Use the provided TypeScript types for type safety
3. Handle loading and error states in your UI
4. Use the `getCalUrls` utility for dynamic redirect URLs
5. Implement proper error handling for API calls 