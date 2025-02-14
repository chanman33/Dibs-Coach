# B2C & B2B Subscription System Implementation Plan

## Overview

This document outlines the implementation plan for our B2C (individual real estate agents) and B2B (brokerages) subscription system, including credit management, rollover policies, and enterprise features.

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Database Schema Updates](#database-schema-updates)
3. [Implementation Phases](#implementation-phases)
4. [API Endpoints](#api-endpoints)
5. [Feature Details](#feature-details)
6. [Testing Strategy](#testing-strategy)

## System Architecture

### Core Components

1. **Subscription Management**
   - Stripe Integration for recurring billing
   - Credit wallet system
   - Rollover management
   - Seat management (B2B)

2. **User Types & Access Levels**
   - Individual users (B2C)
   - Brokerage admins
   - Team managers
   - Individual brokerage members

3. **Credit System**
   - Credit allocation
   - Pooled credits (B2B)
   - Rollover tracking
   - Usage analytics

## Database Schema Updates

```sql
-- Subscription Plans
CREATE TABLE subscription_plans (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'b2c' or 'b2b'
    stripePriceId TEXT NOT NULL,
    monthlyCredits INTEGER NOT NULL,
    features JSONB NOT NULL,
    minSeats INTEGER DEFAULT 1,
    maxSeats INTEGER,
    isActive BOOLEAN DEFAULT true,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE
);

-- Organization/Brokerage
CREATE TABLE organizations (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'small', 'professional', 'enterprise', 'white_label'
    subscriptionDbId BIGINT REFERENCES subscriptions(id),
    totalSeats INTEGER NOT NULL,
    usedSeats INTEGER DEFAULT 0,
    settings JSONB,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE
);

-- Organization Members
CREATE TABLE organization_members (
    id BIGINT PRIMARY KEY,
    organizationDbId BIGINT REFERENCES organizations(id),
    userDbId BIGINT REFERENCES User(id),
    role TEXT NOT NULL, -- 'admin', 'manager', 'member'
    monthlyLimit INTEGER, -- Optional credit limit per user
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE
);

-- Credit Wallet
CREATE TABLE credit_wallets (
    id BIGINT PRIMARY KEY,
    ownerType TEXT NOT NULL, -- 'user' or 'organization'
    ownerDbId BIGINT NOT NULL, -- References User(id) or organizations(id)
    balance INTEGER NOT NULL DEFAULT 0,
    lifetimeCredits INTEGER NOT NULL DEFAULT 0,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE
);

-- Credit Transactions
CREATE TABLE credit_transactions (
    id BIGINT PRIMARY KEY,
    walletDbId BIGINT REFERENCES credit_wallets(id),
    type TEXT NOT NULL, -- 'credit', 'debit', 'rollover', 'expiry'
    amount INTEGER NOT NULL,
    description TEXT,
    metadata JSONB,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Credit Rollovers
CREATE TABLE credit_rollovers (
    id BIGINT PRIMARY KEY,
    walletDbId BIGINT REFERENCES credit_wallets(id),
    amount INTEGER NOT NULL,
    expiresAt TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL, -- 'active', 'used', 'expired'
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE
);
```

## Implementation Phases

### Phase 1: Core B2C Implementation (1-2 Months)

1. **Database Setup**
   - [ ] Create new tables and relationships
   - [ ] Add indexes and constraints
   - [ ] Implement migration scripts

2. **Subscription Management**
   - [ ] Implement Stripe plan creation
   - [ ] Set up recurring billing
   - [ ] Create subscription lifecycle hooks

3. **Credit System**
   - [ ] Build credit wallet system
   - [ ] Implement credit allocation
   - [ ] Add rollover logic
   - [ ] Create expiration tracking

4. **B2C User Interface**
   - [ ] Subscription management dashboard
   - [ ] Credit balance display
   - [ ] Usage history
   - [ ] Plan upgrade/downgrade flow

### Phase 2: B2B Foundation (2-3 Months)

1. **Organization Management**
   - [ ] Brokerage profile creation
   - [ ] Team structure implementation
   - [ ] Seat management system
   - [ ] Admin dashboard

2. **B2B Subscription Features**
   - [ ] Implement seat-based billing
   - [ ] Create pooled credit system
   - [ ] Add organization-level settings
   - [ ] Build team management tools

3. **Credit Distribution**
   - [ ] Pooled credit allocation
   - [ ] Per-user credit limits
   - [ ] Usage tracking by seat
   - [ ] Rollover management for teams

### Phase 3: Enterprise Features (3-4 Months)

1. **White-Label Solutions**
   - [ ] Custom branding options
   - [ ] Domain customization
   - [ ] Branded notifications
   - [ ] Custom analytics

2. **Advanced Analytics**
   - [ ] Usage patterns
   - [ ] ROI tracking
   - [ ] Team performance metrics
   - [ ] Credit utilization reports

3. **Enterprise Integration**
   - [ ] SSO implementation
   - [ ] API access
   - [ ] Custom webhook support
   - [ ] Data export capabilities

## API Endpoints

### Subscription Management

```typescript
// Subscription Routes
POST /api/subscriptions/create
POST /api/subscriptions/update
POST /api/subscriptions/cancel
GET /api/subscriptions/status

// Credit Management
GET /api/credits/balance
POST /api/credits/transfer
GET /api/credits/history
GET /api/credits/rollover-status

// B2B Organization Management
POST /api/organization/create
POST /api/organization/update
POST /api/organization/seats/manage
GET /api/organization/analytics

// Member Management
POST /api/organization/members/add
POST /api/organization/members/remove
POST /api/organization/members/update-role
GET /api/organization/members/list
```

## Feature Details

### B2C Subscription Tiers

1. **Free (Pay-as-you-go)**
   - No monthly fee
   - Standard platform fees (8.5% coach, 4.5% user)
   - Basic features access

2. **Pro ($200/month)**
   - $150 monthly credits
   - Premium features
   - Waived user-side fees
   - 6-month credit rollover (max $900)

3. **Premium ($300-400/month)**
   - $250+ monthly credits
   - All premium features
   - Advanced AI tools
   - Priority support

### B2B Subscription Tiers

1. **Small Brokerage**
   - 5+ seats
   - $99/seat/month
   - Pooled credits
   - Basic team features

2. **Professional Brokerage**
   - 10+ seats
   - $125/seat/month
   - Advanced features
   - Priority support

3. **Enterprise Brokerage**
   - 25+ seats
   - Custom pricing
   - White-label options
   - Dedicated support

4. **White-Label Custom**
   - 50+ seats
   - Fully custom solution
   - Custom integrations
   - Dedicated success team

## Testing Strategy

### Unit Tests

1. **Credit System**
   - Credit allocation
   - Rollover logic
   - Expiration handling
   - Pool management

2. **Subscription Logic**
   - Plan changes
   - Proration
   - Cancellation
   - Seat management

3. **Organization Management**
   - Member operations
   - Role management
   - Settings updates

### Integration Tests

1. **Stripe Integration**
   - Subscription creation
   - Payment processing
   - Webhook handling
   - Refund processing

2. **User Flows**
   - Subscription purchase
   - Credit usage
   - Plan upgrades
   - Team management

### End-to-End Tests

1. **B2C Scenarios**
   - Complete subscription lifecycle
   - Credit usage and rollover
   - Plan changes
   - Cancellation flow

2. **B2B Scenarios**
   - Organization setup
   - Team management
   - Pooled credit usage
   - Enterprise features

## Security Considerations

1. **Access Control**
   - Role-based permissions
   - Organization boundaries
   - API authentication
   - Audit logging

2. **Data Protection**
   - Encryption at rest
   - Secure API endpoints
   - PII handling
   - GDPR compliance

3. **Financial Security**
   - Transaction logging
   - Credit audit trail
   - Payment security
   - Fraud prevention

## Monitoring & Analytics

1. **System Health**
   - Subscription status
   - Credit allocation
   - Rollover processing
   - Error tracking

2. **Business Metrics**
   - MRR tracking
   - User engagement
   - Credit utilization
   - Conversion rates

3. **Custom Reports**
   - Organization usage
   - Team performance
   - ROI analysis
   - Trend analysis

## Next Steps

1. Begin Phase 1 implementation:
   - Set up database schema
   - Implement core subscription logic
   - Build credit system
   - Create B2C user interface

2. Prepare for Phase 2:
   - Design organization structure
   - Plan B2B features
   - Develop team management tools

3. Document and test:
   - Write technical documentation
   - Create test plans
   - Set up monitoring
   - Plan rollout strategy 