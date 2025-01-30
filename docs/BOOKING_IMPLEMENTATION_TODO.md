# Real-Time Booking System Implementation Plan

## Overview
This document outlines the implementation plan for connecting coach profiles with real-time booking functionality, including session durations, rates, and availability management.

## Current State Analysis

### Existing Components
1. `CoachProfileModal.tsx`: Shows coach profile with basic availability info
2. `BookingFlow.tsx`: Handles the booking process
3. `BookingConfirmation.tsx`: Displays booking details and confirmation
4. `CoachingCalendar.tsx`: Manages calendar view and slot selection

### Existing Database Models
1. `RealtorCoachProfile`:
   ```prisma
   model RealtorCoachProfile {
     sessionLength   String?
     hourlyRate      Decimal?
     availability    String?
     calendlyUrl     String?
     eventTypeUrl    String?
   }
   ```

2. `CoachingAvailabilitySchedule`:
   ```prisma
   model CoachingAvailabilitySchedule {
     timezone  String
     rules     Json
     isDefault Boolean
     active    Boolean
   }
   ```

3. `Session`:
   ```prisma
   model Session {
     startTime            DateTime
     endTime              DateTime
     durationMinutes      Int
     status              String
     calendlyEventId      String?
     calendlySchedulingUrl String?
   }
   ```

## Implementation Plan

### 1. Database Schema Updates

#### New Model: CoachSessionConfig
```prisma
model CoachSessionConfig {
  id              Int      @id @default(autoincrement())
  userDbId        Int      @unique
  durations       Json     // [30, 60, 90]
  rates           Json     // {"30": 50, "60": 90, "90": 120}
  currency        Currency @default(USD)
  isActive        Boolean  @default(true)
  
  user            User     @relation(fields: [userDbId], references: [id], onDelete: Cascade)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([userDbId])
}
```

#### Update RealtorCoachProfile
```prisma
model RealtorCoachProfile {
  // Existing fields...
  
  // New fields
  defaultDuration    Int       @default(60)
  allowCustomDuration Boolean  @default(false)
  minimumDuration    Int       @default(30)
  maximumDuration    Int       @default(120)
}
```

#### Update Session
```prisma
model Session {
  // Existing fields...
  
  rateAtBooking    Decimal?  @db.Decimal(10,2)
  currencyCode     Currency  @default(USD)
}
```

### 2. API Endpoint Updates

#### a. Session Configuration Endpoints
```typescript
// app/api/coach/config/route.ts
interface SessionConfig {
  durations: number[];
  rates: Record<string, number>;
  currency: string;
  defaultDuration: number;
  allowCustomDuration: boolean;
  minimumDuration: number;
  maximumDuration: number;
}

// GET /api/coach/config
export async function GET() {
  // Fetch coach's session configuration
}

// POST /api/coach/config
export async function POST(request: Request) {
  // Update coach's session configuration
}
```

#### b. Enhanced Availability Endpoint
```typescript
// app/api/coaching/sessions/available/route.ts
interface AvailabilityResponse {
  availableSlots: {
    startTime: string;
    endTime: string;
    duration: number;
    rate: number;
    currency: string;
  }[];
  timezone: string;
  sessionConfig: SessionConfig;
}
```

#### c. Enhanced Booking Endpoint
```typescript
// app/api/coaching/sessions/book/route.ts
interface BookingRequest {
  coachId: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  rate: number;
  currency: string;
}
```

### 3. Frontend Component Updates

#### a. CoachProfileModal.tsx
```typescript
interface SessionLength {
  duration: number;
  rate: number;
  currency: string;
}

function CoachProfileModal({ coach }: Props) {
  return (
    <div>
      {/* Existing profile info */}
      
      <div className="space-y-4">
        <h3>Available Session Lengths</h3>
        {coach.sessionLengths.map((session: SessionLength) => (
          <div key={session.duration} className="flex justify-between">
            <span>{session.duration} minutes</span>
            <span>{formatCurrency(session.rate, session.currency)}</span>
          </div>
        ))}
      </div>
      
      <div className="mt-4">
        <h3>Availability</h3>
        <AvailabilityCalendar coach={coach} />
      </div>
    </div>
  )
}
```

#### b. BookingFlow.tsx
```typescript
interface BookingFlowProps {
  coach: Coach;
  onComplete: (session: Session) => void;
}

function BookingFlow({ coach, onComplete }: BookingFlowProps) {
  const [step, setStep] = useState<'duration' | 'datetime' | 'confirmation'>('duration');
  const [selectedDuration, setSelectedDuration] = useState<number>();
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot>();

  return (
    <div>
      {step === 'duration' && (
        <DurationSelector 
          durations={coach.sessionConfig.durations}
          rates={coach.sessionConfig.rates}
          onSelect={duration => {
            setSelectedDuration(duration);
            setStep('datetime');
          }}
        />
      )}
      
      {step === 'datetime' && (
        <DateTimeSelector
          coach={coach}
          duration={selectedDuration!}
          onSelect={slot => {
            setSelectedSlot(slot);
            setStep('confirmation');
          }}
        />
      )}
      
      {step === 'confirmation' && (
        <BookingConfirmation
          coach={coach}
          duration={selectedDuration!}
          slot={selectedSlot!}
          onConfirm={async () => {
            const session = await bookSession({
              coachId: coach.id,
              startTime: selectedSlot!.startTime,
              endTime: selectedSlot!.endTime,
              duration: selectedDuration!,
              rate: coach.sessionConfig.rates[selectedDuration!]
            });
            onComplete(session);
          }}
        />
      )}
    </div>
  )
}
```

### 4. Migration Steps

1. **Database Migration**
```sql
-- Create new tables
CREATE TABLE "CoachSessionConfig" (
  -- ... fields as defined in schema
);

-- Add new columns to existing tables
ALTER TABLE "RealtorCoachProfile" 
ADD COLUMN "defaultDuration" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN "allowCustomDuration" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "minimumDuration" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN "maximumDuration" INTEGER NOT NULL DEFAULT 120;

ALTER TABLE "Session"
ADD COLUMN "rateAtBooking" DECIMAL(10,2),
ADD COLUMN "currencyCode" VARCHAR NOT NULL DEFAULT 'USD';
```

2. **Data Migration Script**
```typescript
async function migrateCoachConfigs() {
  const coaches = await prisma.realtorCoachProfile.findMany({
    where: {
      hourlyRate: { not: null }
    }
  });

  for (const coach of coaches) {
    // Convert hourly rate to duration-based rates
    const hourlyRate = coach.hourlyRate!;
    const rates = {
      "30": Number(hourlyRate) / 2,
      "60": Number(hourlyRate),
      "90": Number(hourlyRate) * 1.5
    };

    await prisma.coachSessionConfig.create({
      data: {
        userDbId: coach.userDbId,
        durations: [30, 60, 90],
        rates,
        currency: "USD",
        isActive: true
      }
    });
  }
}
```

### 5. Testing Plan

1. **Unit Tests**
```typescript
describe('CoachSessionConfig', () => {
  it('should validate duration and rate combinations', () => {
    // Test validation
  });

  it('should handle currency conversions', () => {
    // Test currency handling
  });
});

describe('BookingFlow', () => {
  it('should show available slots for selected duration', () => {
    // Test slot availability
  });

  it('should calculate correct price for duration', () => {
    // Test price calculation
  });
});
```

2. **Integration Tests**
```typescript
describe('Booking Process', () => {
  it('should complete full booking flow', async () => {
    // Test end-to-end booking
  });

  it('should handle concurrent bookings', async () => {
    // Test race conditions
  });
});
```

### 6. Deployment Strategy

1. **Phase 1: Database Updates**
   - Deploy schema changes
   - Run data migration scripts
   - Verify data integrity

2. **Phase 2: API Updates**
   - Deploy new endpoints
   - Update existing endpoints
   - Monitor for errors

3. **Phase 3: Frontend Updates**
   - Deploy component changes
   - Enable new booking flow
   - Monitor user feedback

4. **Phase 4: Cleanup**
   - Remove deprecated fields
   - Clean up old code
   - Update documentation

### 7. Monitoring and Analytics

1. **Key Metrics to Track**
   - Booking completion rate
   - Popular session durations
   - Average booking value
   - Availability utilization
   - Error rates in booking flow

2. **Logging**
```typescript
// Example logging implementation
const logger = {
  bookingStarted: (coachId: string, duration: number) => {
    // Log booking attempt
  },
  bookingCompleted: (sessionId: string, details: BookingDetails) => {
    // Log successful booking
  },
  bookingError: (error: Error, context: BookingContext) => {
    // Log booking error
  }
};
```

### 8. Future Enhancements

1. **Pricing**
   - Package deals
   - Early booking discounts

2. **Advanced Availability**
   - Buffer times between sessions
   - Recurring availability patterns
   - Holiday calendar integration

3. **Booking Features**
   - Waitlist functionality
   - Rescheduling flow
   - Group session booking

## Notes

- All database operations should use Supabase client as per project standards
- Maintain compatibility with existing Calendly integration
- Follow existing error handling patterns
- Ensure proper type safety throughout the implementation
- Keep UI/UX consistent with existing design system 