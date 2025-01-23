# Getting Started

## Project Description: Real Estate Agent Coaching Marketplace

The Real Estate Agent Coaching Marketplace is a web-based platform designed to connect real estate agents with professional coaches, fostering skill enhancement and career growth. The platform provides personalized coaching, group workshops, and access to curated learning materials. It aims to streamline the coaching experience, helping agents achieve measurable improvements in client acquisition, negotiation, marketing, and other critical areas of real estate.

The marketplace incorporates features such as user-friendly navigation, real-time scheduling, secure payment processing, and analytics dashboards for both agents and coaches. The project emphasizes scalability, data security, and a seamless user experience to accommodate an expanding user base.

## Project Scope

### Key Features

#### Agent Onboarding
- User registration and profile setup
- Define goals and select areas of focus for coaching

#### Coach Onboarding
- Registration process for coaches, including verification and skill profiling
- Ability to define coaching packages and availability

#### Search and Discovery
- Advanced search with filters for coaching specialties, pricing, and ratings
- AI-powered recommendations based on agent goals and preferences

#### Scheduling and Booking
- Integrated calendar for real-time session scheduling
- Notifications for upcoming sessions and booking changes

#### Payment and Billing
- Secure payment gateway for session booking and package purchases
- Automatic invoicing and transaction history

#### Learning Resources
- Repository of articles, videos, and templates for agents
- Ability to tag and recommend resources to users based on activity

#### Session Management
- Virtual meeting integration (e.g., Zoom or proprietary video system)
- Notes and action items feature for session follow-ups

#### Feedback and Ratings
- Post-session reviews and feedback from agents
- Rating system to ensure quality standards

#### Admin Panel
- Management tools for user accounts, payments, and content moderation
- Analytics and reporting on platform usage

### Technical Requirements

#### Backend
- Scalable architecture with robust APIs for feature integration (Next.js, Tailwind CSS, Supabase, Clerk, Stripe)

#### Frontend
- Responsive design optimized for web and mobile platforms (Next.js, Tailwind CSS)

#### Database
- Secure and reliable data storage for user information and transaction logs (Supabase)

#### Third-Party Integrations
- Payment processing (e.g., Stripe)
- Scheduling (e.g., Calendly)
- Video conferencing APIs (Zoom)

## Prerequisites
- Node.js and yarn/bun installed
- Accounts and API keys for:
  - Supabase
  - Stripe (if using payments)
  - Clerk (if using authentication)

## Setup

1. Clone the repository:
   ```
   git clone <repository-url>
   cd <project-directory>
   ```

2. Install dependencies:
   ```
   yarn
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   SUPABASE_URL=<your-supabase-project-url>
   SUPABASE_SERVICE_KEY=<your-supabase-service-key>

   # If using Stripe
   STRIPE_SECRET_KEY=<your-stripe-secret-key>
   NEXT_PUBLIC_STRIPE_PRICE_ID=<your-stripe-price-id>

   # If using Clerk
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<your-clerk-publishable-key>
   CLERK_SECRET_KEY=<your-clerk-secret-key>
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

   For Calendly OAuth setup:
   ```
   CALENDLY_CLIENT_ID=<your-calendly-client-id>
   CALENDLY_CLIENT_SECRET=<your-calendly-client-secret>
   CALENDLY_REDIRECT_URI=<your-domain>/api/calendly/oauth/callback
   ```
   Note: For local development, use a tunneling service (e.g., ngrok) and set the redirect URI to your tunnel URL.
   ```

4. Configure features:
   In `config.ts`, set the desired features:
   ```typescript
   const config = {
     auth: {
       enabled: true, // Set to false if not using Clerk
     },
     payments: {
       enabled: true, // Set to false if not using Stripe
     }
   };
   ```

5. Set up the database:
   Run Prisma migrations:
   ```
   npx prisma migrate dev
   ```

   Here's the prisma schema visualized: [prisma-visualized.txt](prisma/prisma-visualized.txt)
   or png [prisma-visualized.png](prisma/prisma-visualized.png)
   

6. Start the development server:
   ```
   yarn dev
   ```

7. Open your browser and navigate to `http://localhost:3000` to see your application running.

## Additional Configuration

- Webhooks: Set up webhooks for Clerk (if using auth) at `/api/auth/webhook` and for Stripe (if using payments) at `/api/payments/webhook`.
- Customize the landing page, dashboard, and other components as needed.
- Modify the Prisma schema in `prisma/schema.prisma` if you need to change the database structure.

## Important Security Notes

- Enable Row Level Security (RLS) in your Supabase project to ensure data protection at the database level.
- Always make Supabase calls on the server-side (in API routes or server components) to keep your service key secure.

## Learn More

Refer to the documentation of the individual technologies used in this project for more detailed information:
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Supabase Documentation](https://supabase.io/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Clerk Documentation](https://clerk.dev/docs) (if using auth)
- [Stripe Documentation](https://stripe.com/docs) (if using payments)
