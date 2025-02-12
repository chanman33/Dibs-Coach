# Project Architecture

## Overview
The Real Estate Agent Coaching Marketplace is built using a modern tech stack with Next.js 14, focusing on scalability, security, and maintainable code structure. The application follows a modular architecture with clear separation of concerns.

## Tech Stack
- **Frontend**: Next.js 14, Tailwind CSS, Shadcn UI
- **Backend**: Next.js API Routes, Server Components
- **Database**:
  - Supabase (PostgreSQL) for data operations
  - Prisma for schema management and migrations
- **Authentication**: Clerk
- **Payment Processing**: Stripe
- **Video Conferencing**: Zoom API
- **Scheduling**: Calendly Integration

## Directory Structure

### Core Directories
- `/app` - Next.js application routes and pages
- `/components` - Reusable UI components
- `/lib` - Core API configurations
- `/utils` - Helpers, types, and server actions
- `/prisma` - Database schema and migrations

## Authentication & Authorization
- Clerk handles user authentication
- Server-side auth checks using `await auth()`
- Protected routes managed in middleware
- Role-based access control system:

## Database Architecture
### Data Layer Rules
1. Prisma: Schema management and migrations only
2. Supabase: All database operations
3. Row Level Security (RLS) enabled for data protection

### Schema Overview
The database schema includes models for:
- User profiles (Realtors, Loan Officers, Coaches)
- Sessions and Bookings
- Reviews and Feedback
- Messages and Communications
- Payments and Subscriptions

## API Structure
### Implementation Requirements
1. Authentication verification
2. Input validation using Zod schemas
3. Error handling with proper logging
4. Standardized response format

### Error Handling

## Frontend Architecture
### Component Structure
- Server Components: Default for data fetching
- Client Components: Marked with "use client"
- Shared UI components using Shadcn UI

### Theming and Styling

## Integration Architecture
### Video Conferencing (Zoom)
- Server-side meeting creation
- JWT authentication flow
- Webhook processing
- Meeting details stored in Supabase

### Scheduling (Calendly)
- Server-side event creation
- Client-side widget integration
- Real-time availability sync
- Event storage and user linking

#### Token Management & Sync System
1. **Background Jobs**
   - Hourly token refresh job
   - Availability sync process
   - Cache invalidation
   - Error recovery mechanisms

2. **Caching Strategy**
   - TTL-based availability caching
   - Proactive cache warmup
   - Cache invalidation on webhooks
   - Fallback mechanisms

3. **Webhook Integration**
   - Real-time event processing
   - Signature verification
   - Event queueing and retry
   - Error handling and logging

4. **Error Recovery**
   - Circuit breaker pattern
   - Exponential backoff
   - Automatic cleanup
   - User notifications

#### Database Tables
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
  updatedAt TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE CalendlyAvailabilityCache (
  id BIGINT PRIMARY KEY,
  userDbId BIGINT REFERENCES User(id),
  data JSONB NOT NULL,
  expiresAt TIMESTAMP WITH TIME ZONE NOT NULL,
  createdAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
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

#### OAuth Best Practices
- Use PKCE (Proof Key for Code Exchange) flow for security
- Ensure redirect URIs match exactly in app settings and environment config
- Use tunneling (e.g., ngrok) for local development
- Handle domain-specific cookie storage for auth state
- Implement proper error handling and logging

### Payment Processing (Stripe)
- Secure payment processing
- Webhook handling
- Transaction record storage
- Automated invoicing

## Security Measures
1. Environment Variables
   - Server-side: Direct access
   - Client-side: NEXT_PUBLIC_ prefix
   - Runtime validation

2. API Security
   - Rate limiting
   - Input sanitization
   - CORS headers
   - Authentication checks

3. Data Security
   - Row Level Security
   - Server-side API calls
   - Secure credential storage

## Development Workflow
1. Type Safety
   - TypeScript strict mode
   - Zod validation schemas
   - Exported type definitions

2. Error Handling
   - Standardized error logging
   - Context-specific error formats
   - Client-side error states

3. Code Style
   - Consistent import patterns
   - Proper async/await handling
   - Type annotations on exports

## Monitoring and Logging
- Structured error logging with contexts
- Performance monitoring
- Security event tracking
- User activity analytics

## Deployment and Scaling
- Vercel deployment
- Edge-ready architecture
- Scalable database design
- Caching strategies

## Type System Architecture
### Organization
Types are organized by domain in `/utils/types/`:
- Domain-specific files (user.ts, session.ts, etc.)
- Root types.ts for re-exports and common utilities
- No cross-domain type dependencies

### Type Definitions
Each domain file follows a consistent pattern:
```typescript
// Schema definitions
export const entitySchema = z.object({...});
export const entityCreateSchema = z.object({...});
export const entityUpdateSchema = z.object({...});

// Type exports
export type Entity = z.infer<typeof entitySchema>;
export type EntityCreate = z.infer<typeof entityCreateSchema>;
export type EntityUpdate = z.infer<typeof entityUpdateSchema>;
```

### Validation
- Zod schemas for runtime validation
- Prisma native enums for type safety
- Consistent nullability handling
- Proper date and ID types

### Best Practices
1. Use domain-specific files for related types
2. Follow naming conventions consistently
3. Include proper JSDoc documentation
4. Export both schemas and inferred types
5. Use Prisma enums where available

## Database Access

### Supabase Client Usage

1. **Client Initialization**
```typescript
// Always use createAuthClient from utils/auth.ts
import { createAuthClient } from '@/utils/auth'
import { cookies } from 'next/headers'

const supabase = await createAuthClient(cookies())
```

2. **Core Principles**
- Use Supabase for ALL database operations
- Never use Prisma for data operations (schema/migrations only)
- Always perform database operations server-side
- Include proper error handling and logging

3. **Query Patterns**
```typescript
// Table names must match exact PascalCase
const result = await supabase
  .from("User")
  .select()
  
// Column names must match exact camelCase
const user = await supabase
  .from("User")
  .select()
  .eq("userId", clerkId)
```

4. **Required Fields**
- Always include `updatedAt` in insert/update operations:
```typescript
await supabase
  .from("User")
  .update({ 
    name: "New Name",
    updatedAt: new Date().toISOString()
  })
```

5. **Error Handling**
```typescript
try {
  const { data, error } = await supabase.from("User").select()
  if (error) {
    console.error('[DB_ERROR]', error)
    throw error
  }
  return data
} catch (error) {
  console.error('[DB_ERROR]', error)
  throw error
}
```

6. **Best Practices**
- Use type-safe queries with proper column references
- Implement proper error handling and logging
- Include updatedAt in all mutations
- Use proper casing for table/column names
- Keep database logic in server components or API routes
- Never expose Supabase client keys in client-side code
