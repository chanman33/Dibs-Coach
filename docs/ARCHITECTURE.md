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
