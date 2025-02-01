# Stripe Payments Implementation TODO

## Overview
This document outlines the implementation plan for Stripe payments in our coaching marketplace. The system handles pay-as-you-go session payments and coaching bundles between coaches and clients.

## 1. Core Payment Infrastructure

### Stripe Account Setup
- [x] Configure Stripe Connect for marketplace payments
  - [x] Set up platform account
  - [x] Configure OAuth connection for coach onboarding
  - [x] Set up webhook endpoints for Connect events
  - [x] Implement automatic payouts for coaches

### Database Schema Updates
- [x] Create new tables and relationships:
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

## 2. Bundle Payment System

### Bundle Configuration
- [ ] Implement bundle management:
  - [ ] Define bundle types (e.g., 5, 10, 20 sessions)
  - [ ] Configure bundle pricing and discounts
  - [ ] Set up bundle expiration rules
  - [ ] Add bundle usage tracking

### Bundle Purchase Flow
- [ ] Create bundle payment endpoints:
  - [ ] `POST /api/payments/bundle/create` - Create bundle payment intent
  - [ ] `GET /api/payments/bundle/[id]` - Get bundle details
  - [ ] `POST /api/payments/bundle/redeem` - Redeem bundle session

### Bundle Analytics
- [ ] Add bundle tracking features:
  - [ ] Sessions remaining counter
  - [ ] Bundle usage history
  - [ ] Expiration tracking
  - [ ] Usage notifications

## 3. Session Payment System

### Coach Onboarding
- [x] Implement Stripe Connect onboarding:
  - [x] Create onboarding flow for coaches
  - [x] Handle account verification
  - [x] Implement payout settings
  - [x] Add banking information collection

### Payment Processing
- [x] Implement session payment flow:
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
- [x] Add endpoints:
  - [x] `POST /api/payments/session/create` - Create payment intent
  - [x] `POST /api/webhooks/stripe` - Handle webhooks
  - [x] `POST /api/payments/onboarding` - Coach onboarding
  - [x] `GET /api/payments/onboarding` - Get onboarding status

### Fee Management
- [x] Implement fee calculation system:
  - [x] Platform fee calculation (8.5% from coach)
  - [x] Agent fee calculation (3.5% from agent)
  - [x] Stripe fee handling
  - [x] Fee breakdown and reporting

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
- [x] Implement security measures:
  - [x] PCI compliance requirements
  - [x] Sensitive data encryption
  - [x] Audit logging
  - [x] Access controls

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
- [x] Implement webhook handling:
  - [x] Signature verification
  - [x] Event type handling
  - [x] Error handling and logging
  - [x] Retry mechanism

### Testing Requirements
- [ ] Unit tests for all payment functions
- [ ] Integration tests with Stripe API
- [ ] End-to-end payment flow tests
- [ ] Webhook handling tests
- [ ] Error scenario testing

## Migration Plan
1. ✅ Set up Stripe Connect account
2. ✅ Create and test database migrations
3. ✅ Implement core payment infrastructure
4. ⏳ Add subscription management
5. ✅ Build session payment system
6. ⏳ Deploy to staging for testing
7. ⏳ Conduct security audit
8. ⏳ Plan production rollout

## Documentation Requirements
- [ ] API documentation
- [ ] Integration guides
- [ ] Security procedures
- [ ] Troubleshooting guides
- [ ] User guides for coaches and clients 