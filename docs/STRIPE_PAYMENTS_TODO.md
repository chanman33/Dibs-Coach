# Stripe Payments Implementation TODO

## Overview
This document outlines the implementation plan for Stripe payments in our coaching peer-to-peer marketplace. The system needs to handle both subscription-based payments for platform access and direct payments between coaches and clients.

## 1. Core Payment Infrastructure

### Stripe Account Setup
- [ ] Configure Stripe Connect for marketplace payments
  - [ ] Set up platform account
  - [ ] Configure OAuth connection for coach onboarding
  - [ ] Set up webhook endpoints for Connect events
  - [ ] Implement automatic payouts for coaches

### Database Schema Updates
- [ ] Create new tables and relationships:
  ```sql
  -- For tracking connected accounts (coaches)
  CREATE TABLE stripe_connected_accounts (
    id BIGINT PRIMARY KEY,
    userDbId BIGINT NOT NULL REFERENCES User(id),
    stripeAccountId TEXT NOT NULL,
    payoutsEnabled BOOLEAN DEFAULT false,
    country TEXT NOT NULL,
    defaultCurrency TEXT NOT NULL,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE
  );

  -- For tracking payment methods
  CREATE TABLE payment_methods (
    id BIGINT PRIMARY KEY,
    userDbId BIGINT NOT NULL REFERENCES User(id),
    stripePaymentMethodId TEXT NOT NULL,
    type TEXT NOT NULL,
    last4 TEXT NOT NULL,
    expiryMonth INTEGER,
    expiryYear INTEGER,
    isDefault BOOLEAN DEFAULT false,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE
  );

  -- For tracking platform subscriptions
  CREATE TABLE subscriptions (
    id BIGINT PRIMARY KEY,
    userDbId BIGINT NOT NULL REFERENCES User(id),
    stripeSubscriptionId TEXT NOT NULL,
    stripePriceId TEXT NOT NULL,
    status TEXT NOT NULL,
    currentPeriodStart TIMESTAMP WITH TIME ZONE,
    currentPeriodEnd TIMESTAMP WITH TIME ZONE,
    cancelAtPeriodEnd BOOLEAN DEFAULT false,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE
  );

  -- For tracking all transactions
  CREATE TABLE transactions (
    id BIGINT PRIMARY KEY,
    type TEXT NOT NULL, -- 'subscription' or 'session_payment'
    status TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL,
    stripePaymentIntentId TEXT,
    stripeTransferId TEXT,
    platformFee DECIMAL(10,2),
    coachPayout DECIMAL(10,2),
    sessionDbId BIGINT REFERENCES Session(id),
    payerDbId BIGINT REFERENCES User(id),
    coachDbId BIGINT REFERENCES User(id),
    metadata JSONB,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE
  );
  ```

## 2. Subscription Management System

### API Endpoints
- [ ] Create subscription management endpoints:
  - [ ] `POST /api/subscriptions/create` - Create new subscription
  - [ ] `GET /api/subscriptions/[id]` - Get subscription details
  - [ ] `PUT /api/subscriptions/[id]` - Update subscription
  - [ ] `DELETE /api/subscriptions/[id]` - Cancel subscription
  - [ ] `POST /api/subscriptions/[id]/resume` - Resume cancelled subscription

### Subscription Plans
- [ ] Implement plan management:
  - [ ] Create standard plans in Stripe dashboard
  - [ ] Store plan configurations in database
  - [ ] Implement plan CRUD operations
  - [ ] Add plan comparison features

### Billing System
- [ ] Implement billing logic:
  - [ ] Set up recurring billing with Stripe
  - [ ] Handle failed payments and retries
  - [ ] Implement proration for plan changes
  - [ ] Add support for coupons and promotions

### Invoice Generation
- [ ] Create invoice system:
  - [ ] Generate PDF invoices using Stripe's API
  - [ ] Store invoice history in database
  - [ ] Implement invoice download functionality
  - [ ] Add invoice email notifications

## 3. Session Payment System

### Coach Onboarding
- [ ] Implement Stripe Connect onboarding:
  - [ ] Create onboarding flow for coaches
  - [ ] Handle account verification
  - [ ] Implement payout settings
  - [ ] Add banking information collection

### Payment Processing
- [ ] Implement session payment flow:
  ```typescript
  interface SessionPayment {
    sessionId: string;
    amount: number;
    currency: string;
    coachId: string;
    clientId: string;
    platformFee: number;
  }
  ```
- [ ] Add endpoints:
  - [ ] `POST /api/payments/session/create` - Create payment intent
  - [ ] `POST /api/payments/session/confirm` - Confirm payment
  - [ ] `POST /api/payments/session/refund` - Process refund

### Payment Methods
- [ ] Add payment method management:
  - [ ] Save and retrieve payment methods
  - [ ] Set default payment method
  - [ ] Handle expired/invalid cards
  - [ ] Implement automatic card updates

### Currency Management
- [ ] Implement multi-currency support:
  - [ ] Store supported currencies
  - [ ] Handle currency conversion
  - [ ] Display prices in local currency
  - [ ] Handle exchange rate updates

## 4. Dispute and Refund Management

### Dispute Handling
- [ ] Create dispute management system:
  - [ ] Handle Stripe dispute webhooks
  - [ ] Store dispute information
  - [ ] Implement dispute resolution flow
  - [ ] Add evidence submission interface

### Refund Processing
- [ ] Implement refund system:
  - [ ] Full and partial refunds
  - [ ] Refund reason tracking
  - [ ] Handle platform fee refunds
  - [ ] Update session status on refund

## 5. Analytics and Reporting

### Financial Reporting
- [ ] Create financial dashboards:
  - [ ] Revenue overview
  - [ ] Transaction history
  - [ ] Payout tracking
  - [ ] Subscription metrics

### Coach Analytics
- [ ] Implement coach-specific analytics:
  - [ ] Earnings overview
  - [ ] Session payment history
  - [ ] Payout schedule
  - [ ] Revenue projections

## 6. Security and Compliance

### Data Security
- [ ] Implement security measures:
  - [ ] PCI compliance requirements
  - [ ] Sensitive data encryption
  - [ ] Audit logging
  - [ ] Access controls

### Compliance
- [ ] Ensure regulatory compliance:
  - [ ] Tax reporting capabilities
  - [ ] GDPR compliance
  - [ ] Data retention policies
  - [ ] Privacy policy updates

## Implementation Guidelines

### Error Handling
```typescript
interface PaymentError {
  code: string;
  message: string;
  type: 'card_error' | 'validation_error' | 'api_error';
  details?: Record<string, any>;
}

function handlePaymentError(error: PaymentError) {
  // Log error
  console.error(`Payment Error: ${error.type}`, error);
  
  // Return user-friendly message
  return {
    success: false,
    message: getUserFriendlyErrorMessage(error),
    error: error
  };
}
```

### Webhook Processing
```typescript
async function processStripeWebhook(event: Stripe.Event) {
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handleSuccessfulPayment(event.data.object);
      break;
    case 'payment_intent.payment_failed':
      await handleFailedPayment(event.data.object);
      break;
    // ... handle other events
  }
}
```

### Testing Requirements
- [ ] Unit tests for all payment functions
- [ ] Integration tests with Stripe API
- [ ] End-to-end payment flow tests
- [ ] Webhook handling tests
- [ ] Error scenario testing

## Migration Plan
1. Set up Stripe Connect account
2. Create and test database migrations
3. Implement core payment infrastructure
4. Add subscription management
5. Build session payment system
6. Deploy to staging for testing
7. Conduct security audit
8. Plan production rollout

## Documentation Requirements
- [ ] API documentation
- [ ] Integration guides
- [ ] Security procedures
- [ ] Troubleshooting guides
- [ ] User guides for coaches and clients 