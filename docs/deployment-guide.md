# Deployment Guide

## Prerequisites

1. **Accounts Setup**
   - [ ] Vercel account (for hosting)
   - [ ] Supabase account (for database)
   - [ ] Clerk account (for authentication)
   - [ ] Cal OAuth application

2. **Domain & SSL**
   - [ ] Domain name (optional, Vercel provides a default domain)
   - [ ] SSL certificate (automatically handled by Vercel)

## Step-by-Step Deployment

### 1. Environment Setup

```env
# Required Environment Variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

CALENDLY_CLIENT_ID=your_calendly_client_id
CALENDLY_CLIENT_SECRET=your_calendly_secret
CALENDLY_WEBHOOK_SIGNING_KEY=your_webhook_key

CRON_SECRET=your_generated_cron_secret

# Optional Environment Variables
NODE_ENV=production
NEXT_PUBLIC_APP_URL=your_app_url
```

### 2. Database Setup

1. **Supabase Project**
   ```bash
   # Install Supabase CLI
   npm install -g supabase-cli

   # Login to Supabase
   supabase login

   # Link your project
   supabase link --project-ref your_project_ref
   ```

2. **Run Migrations**
   ```bash
   # Push database schema
   supabase db push

   # Verify tables
   supabase db verify
   ```

3. **Set up Row Level Security (RLS)**
   ```sql
   -- Enable RLS on all tables
   ALTER TABLE "CalendlyIntegration" ENABLE ROW LEVEL SECURITY;
   ALTER TABLE "CalendlyAvailabilityCache" ENABLE ROW LEVEL SECURITY;
   ALTER TABLE "CalendlyWebhookEvent" ENABLE ROW LEVEL SECURITY;
   ALTER TABLE "CalendlyBooking" ENABLE ROW LEVEL SECURITY;
   ```

### 3. Clerk Authentication Setup

1. Configure Clerk Application:
   - Set allowed domains
   - Configure OAuth providers
   - Set up webhooks
   - Add redirect URLs

2. Update Environment Variables:
   ```env
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
   ```

### 4. Cal.com Deployment - see docs. Self-host available


### 5. Vercel Deployment

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Login to Vercel
   vercel login

   # Link project
   vercel link
   ```

2. **Configure Project**
   ```bash
   # Set up environment variables
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add SUPABASE_SERVICE_KEY
   # ... add all required env variables

   # Deploy project
   vercel deploy --prod
   ```

3. **Set up Cron Jobs**
   - Verify vercel.json configuration:
   ```json
   - Setup Cal.com CRON jobs - see docs


### 6. Post-Deployment Verification

1. **Database Connectivity**
   ```bash
   # Test database connection
   curl https://your-domain.com/api/health/db
   ```

2. **Authentication**
   - Test sign-in flow
   - Verify OAuth redirects
   - Check user session management

3. **Cal Integration**
   - Test OAuth connection
   - Verify webhook delivery
   - Check availability sync
   - Test booking flow

4. **Monitoring Setup**
   - Set up error tracking
   - Configure performance monitoring
   - Set up alerts for:
     - Failed token refreshes
     - Webhook failures
     - Database errors

### 7. Security Checklist

1. **Environment Variables**
   - [ ] All secrets properly set
   - [ ] No exposed keys in code
   - [ ] Production URLs configured

2. **Database Security**
   - [ ] RLS policies enabled
   - [ ] Secure connection strings
   - [ ] Backup strategy configured

3. **API Security**
   - [ ] Rate limiting enabled
   - [ ] CORS configured
   - [ ] Authentication required
   - [ ] Webhook signatures verified

### 8. Maintenance Tasks

1. **Regular Updates**
   ```bash
   # Update dependencies
   npm update

   # Check for security vulnerabilities
   npm audit

   # Deploy updates
   vercel deploy --prod
   ```

2. **Database Maintenance**
   - Regular backups
   - Index optimization
   - Query performance monitoring

3. **Monitoring**
   - Check error logs daily
   - Monitor performance metrics
   - Track integration status

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   ```bash
   # Check database status
   supabase status

   # Verify connection string
   echo $NEXT_PUBLIC_SUPABASE_URL
   ```

2. **Webhook Failures**
   - Verify webhook signing key
   - Check webhook endpoint accessibility
   - Validate payload format

3. **Token Refresh Issues**
   - Check Cal API status
   - Verify OAuth credentials
   - Check token expiration times

### Support Resources

1. **Documentation**
   - [Next.js Deployment](https://nextjs.org/docs/deployment)
   - [Vercel Documentation](https://vercel.com/docs)
   - [Supabase Documentation](https://supabase.io/docs)
   - [Clerk Documentation](https://clerk.dev/docs)
   - [Cal.com Documentation] (https://cal.com/docs/developing/introduction)

2. **Support Channels**
   - Vercel Support
   - Supabase Discord
   - Clerk Discord
   - Cal API Support 