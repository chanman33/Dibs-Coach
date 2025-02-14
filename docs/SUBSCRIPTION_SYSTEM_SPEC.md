# Subscription System Specification
Version: 2.0.0

## Overview
Comprehensive specification for the subscription and payment system, including pricing tiers, Stripe integration, tax handling, and implementation details.

## Table of Contents
1. [Subscription Tiers](#subscription-tiers)
2. [Payment Processing](#payment-processing)
3. [Tax Handling](#tax-handling)
4. [Database Schema](#database-schema)
5. [API Routes](#api-routes)
6. [Implementation Details](#implementation-details)
7. [Migration Plan](#migration-plan)

## Subscription Tiers

### Free Tier
- Limited access to basic features
- RealtorGPT: GPT-3.5 with message limits
- Basic analytics
- Standard support

### Professional Tier ($49/month)
- Full access to core features
- RealtorGPT: GPT-4 with higher limits
- Advanced analytics
- Priority support
- Custom branding options

### Enterprise Tier (Custom Pricing)
- All Professional features
- Custom GPT model training
- Dedicated support
- Custom integrations
- Volume discounts
- SLA guarantees

## Payment Processing

### Stripe Integration
```typescript
// utils/stripe/client.ts
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
});

// Types for Stripe entities
export interface StripeCustomer {
  id: string;
  metadata: {
    userDbId: string;
  };
}

export interface StripeSubscription {
  id: string;
  status: string;
  current_period_end: number;
  items: {
    data: Array<{
      price: { product: string };
    }>;
  };
}
```

### Webhook Handling
```typescript
// app/api/webhooks/stripe/route.ts
export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature')!;
  
  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscriptionChange(event.data.object);
        break;
      // ... other event handlers
    }
    
    return new Response(null, { status: 200 });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return new Response('Webhook Error', { status: 400 });
  }
}
```

## Tax Handling

### Tax Configuration
- Automated tax calculation via Stripe Tax
- Tax ID validation and collection
- Regional tax compliance
- Digital service tax handling

### Implementation
```typescript
// utils/stripe/tax.ts
export async function calculateTax(params: {
  customerId: string;
  priceId: string;
  taxId?: string;
}): Promise<{
  tax: number;
  taxDetails: any;
}> {
  const taxCalculation = await stripe.tax.calculations.create({
    customer: params.customerId,
    line_items: [{
      price: params.priceId,
      quantity: 1,
    }],
    customer_details: {
      tax_ids: params.taxId ? [{
        type: 'eu_vat',
        value: params.taxId,
      }] : undefined,
    },
  });
  
  return {
    tax: taxCalculation.tax_amount_exclusive,
    taxDetails: taxCalculation.tax_breakdown,
  };
}
```

## Database Schema

```prisma
model Subscription {
  id              BigInt      @id @default(autoincrement())
  userId          String      @db.Text
  userDbId        BigInt
  stripeCustomerId String     @db.Text
  stripePriceId   String?     @db.Text
  stripeSubId     String?     @db.Text
  status          SubStatus
  currentPeriodEnd DateTime   @db.Timestamptz
  cancelAtPeriodEnd Boolean   @default(false)
  features        Json?
  metadata        Json?
  createdAt       DateTime    @default(now()) @db.Timestamptz
  updatedAt       DateTime    @updatedAt @db.Timestamptz

  user            User        @relation(fields: [userDbId], references: [id])

  @@index([userDbId])
  @@index([status])
}

model SubscriptionFeature {
  id              BigInt      @id @default(autoincrement())
  name            String      @db.Text
  description     String      @db.Text
  tier            SubTier
  limits          Json?
  metadata        Json?
  createdAt       DateTime    @default(now()) @db.Timestamptz
  updatedAt       DateTime    @updatedAt @db.Timestamptz

  @@index([tier])
}

enum SubStatus {
  ACTIVE
  PAST_DUE
  CANCELED
  INCOMPLETE
  INCOMPLETE_EXPIRED
  TRIALING
  UNPAID
}

enum SubTier {
  FREE
  PROFESSIONAL
  ENTERPRISE
}
```

## API Routes

### Subscription Management
```typescript
// app/api/subscription/route.ts
POST /api/subscription
- Create/update subscription
- Request: { priceId: string, taxId?: string }

GET /api/subscription
- Get current subscription
- Response: { subscription: Subscription }

DELETE /api/subscription
- Cancel subscription
- Query: { immediate: boolean }

// app/api/subscription/preview/route.ts
POST /api/subscription/preview
- Preview subscription cost
- Request: { priceId: string, taxId?: string }
- Response: { subtotal: number, tax: number, total: number }
```

## Implementation Details

### Feature Access Control
```typescript
// utils/subscription/features.ts
export async function hasAccess(
  userId: string,
  feature: string
): Promise<boolean> {
  const subscription = await getSubscription(userId);
  return checkFeatureAccess(subscription, feature);
}

export async function getFeatureLimits(
  userId: string,
  feature: string
): Promise<{
  allowed: boolean;
  limits: any;
}> {
  const subscription = await getSubscription(userId);
  return getFeatureLimitsByTier(subscription.tier, feature);
}
```

### Usage Tracking
```typescript
// utils/subscription/usage.ts
export async function trackUsage(params: {
  userId: string;
  feature: string;
  usage: number;
}): Promise<void> {
  // Track usage and enforce limits
}

export async function getUsage(
  userId: string
): Promise<Record<string, number>> {
  // Get current usage stats
}
```

## Migration Plan

### Phase 1: Core Implementation
- [ ] Set up Stripe integration
- [ ] Implement basic subscription management
- [ ] Create database schema
- [ ] Set up webhook handling

### Phase 2: Tax System
- [ ] Configure Stripe Tax
- [ ] Implement tax calculation
- [ ] Add tax ID collection
- [ ] Test international transactions

### Phase 3: Feature Controls
- [ ] Implement feature access control
- [ ] Set up usage tracking
- [ ] Create admin dashboard
- [ ] Add monitoring and alerts

### Phase 4: Optimization
- [ ] Implement caching
- [ ] Add performance monitoring
- [ ] Create automated tests
- [ ] Set up error tracking

### Phase 5: Enterprise Features
- [ ] Custom pricing support
- [ ] Volume discount system
- [ ] Enterprise billing options
- [ ] Custom contract management 