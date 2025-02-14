# Subscription and Pricing System Specification

## Overview

This document provides a comprehensive specification for our subscription and pricing system, covering both B2C (individual real estate agents) and B2B (brokerages) implementations. It includes subscription plans, credit management, rollover policies, and enterprise features.

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Subscription Plans](#subscription-plans)
3. [Credit Management](#credit-management)
4. [B2B Features](#b2b-features)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Implementation Plan](#implementation-plan)
8. [Security & Compliance](#security--compliance)

## System Architecture

### Core Components

1. **Subscription Management**
   - Stripe Integration for recurring billing
   - Credit wallet system
   - Rollover management
   - Seat management (B2B)

2. **User Types & Permissions**
   ```typescript
   type UserType = 'individual' | 'brokerage_admin' | 'brokerage_manager' | 'brokerage_member';
   
   interface UserPermissions {
     canManageBilling: boolean;
     canViewAnalytics: boolean;
     canManageTeam: boolean;
     canUseCredits: boolean;
     canApproveRequests: boolean;
   }
   ```

3. **Credit System**
   ```typescript
   interface CreditSystem {
     type: 'individual' | 'pooled';
     monthlyAllocation: number;
     rolloverLimit: number;
     rolloverDuration: number; // in months
     expiryRules: {
       enabled: boolean;
       warningDays: number[];
       gracePeriod: number; // in days
     };
   }
   ```

## Subscription Plans

### B2C Plans

1. **Free (Pay-as-you-go)**
   ```typescript
   interface PayAsYouGoPlan {
     type: 'pay_as_you_go';
     platformFees: {
       coach: 0.085; // 8.5%
       user: 0.045;  // 4.5%
     };
     features: string[];
   }
   ```

2. **Pro ($200/month)**
   ```typescript
   interface ProPlan {
     type: 'pro';
     monthlyFee: 200;
     monthlyCredits: 150;
     platformFees: {
       coach: 0.085;
       user: 0;  // Waived
     };
     features: string[];
     rollover: {
       enabled: true;
       maxMonths: 6;
       maxAmount: 900;
     };
   }
   ```

3. **Premium ($300-400/month)**
   ```typescript
   interface PremiumPlan {
     type: 'premium';
     monthlyFee: 300;
     monthlyCredits: 250;
     platformFees: {
       coach: 0.085;
       user: 0;
     };
     features: string[];
     rollover: {
       enabled: true;
       maxMonths: 6;
       maxAmount: 900;
     };
     additionalPerks: string[];
   }
   ```

### B2B Plans

1. **Small Brokerage**
   ```typescript
   interface SmallBrokeragePlan {
     type: 'small_brokerage';
     minSeats: 5;
     pricePerSeat: 99;
     monthlyCreditsPerSeat: 50;
     features: string[];
     rollover: {
       enabled: true;
       maxMonths: 6;
       maxAmountPerSeat: 900;
     };
   }
   ```

2. **Professional Brokerage**
   ```typescript
   interface ProfessionalBrokeragePlan {
     type: 'professional_brokerage';
     minSeats: 10;
     pricePerSeat: 125;
     monthlyCreditsPerSeat: 75;
     features: string[];
     rollover: {
       enabled: true;
       maxMonths: 6;
       maxAmountPerSeat: 900;
     };
   }
   ```

3. **Enterprise Brokerage**
   ```typescript
   interface EnterpriseBrokeragePlan {
     type: 'enterprise_brokerage';
     minSeats: 25;
     customPricing: true;
     monthlyCreditsPerSeat: 100;
     features: string[];
     rollover: {
       enabled: true;
       maxMonths: 6;
       maxAmountPerSeat: 900;
     };
     enterpriseFeatures: string[];
   }
   ```

## Credit Management

### Credit Allocation

```typescript
interface CreditAllocation {
  type: 'individual' | 'pooled';
  monthlyAmount: number;
  rolloverRules: {
    enabled: boolean;
    maxMonths: number;
    maxAmount: number;
  };
  usageRules: {
    minBookingAmount?: number;
    maxBookingAmount?: number;
    restrictedFeatures?: string[];
  };
}
```

### Usage Tracking

```typescript
interface CreditUsage {
  userId: string;
  sessionId: string;
  amount: number;
  timestamp: Date;
  type: 'booking' | 'feature_access' | 'other';
  metadata: {
    coachId?: string;
    featureId?: string;
    description: string;
  };
}
```

### Credit Policies

1. **Rollover Rules**
   - Credits roll over for up to 6 months
   - Maximum rollover cap of $900 per seat
   - First-in, first-out (FIFO) expiration
   - 30-day and 7-day expiration warnings

2. **Usage Limits**
   - Individual limits can be set per user
   - Pooled credits for B2B accounts
   - Optional approval workflow for exceeding limits
   - Automatic notifications for low balance

3. **Credit Types**
   - Session credits (for booking coaching sessions)
   - Feature credits (for accessing premium features)
   - Bonus credits (promotional or compensation)

## B2B Features

### Administrative Dashboard

```typescript
interface AdminDashboard {
  overview: {
    activeSeats: number;
    totalCredits: number;
    usedCredits: number;
    expiringCredits: number;
    subscriptionStatus: 'active' | 'past_due' | 'canceled';
    nextBillingDate: Date;
  };
  teamMetrics: {
    activeUsers: number;
    averageUsagePerUser: number;
    topUsers: Array<{
      userId: string;
      creditsUsed: number;
      sessionsBooked: number;
      lastSessionDate: Date;
      averageSessionRating: number;
    }>;
    inactiveUsers: Array<{
      userId: string;
      lastActive: Date;
      assignedCredits: number;
    }>;
  };
  creditMetrics: {
    monthlyAllocation: number;
    currentPool: number;
    rollingOver: number;
    expiringSoon: number;
    usageBreakdown: {
      coaching: number;
      features: number;
      other: number;
    };
    monthlyTrend: Array<{
      month: string;
      used: number;
      rolled: number;
      expired: number;
    }>;
  };
  alerts: Array<{
    type: 'credit' | 'billing' | 'seat' | 'system';
    priority: 'high' | 'medium' | 'low';
    message: string;
    action?: string;
    timestamp: Date;
  }>;
}

interface AdminActions {
  quickActions: {
    addSeats: () => Promise<void>;
    adjustLimits: () => Promise<void>;
    generateReport: () => Promise<void>;
    manageUsers: () => Promise<void>;
    accessSupport: () => Promise<void>;
  };
  navigation: {
    dashboard: string;
    team: string;
    credits: string;
    billing: string;
    reports: string;
    settings: string;
  };
}
```

### Credit Management System

#### 1. Credit Pool Configuration
```typescript
interface CreditPoolConfig {
  totalMonthlyCredits: number;
  rolloverLimit: number;
  perUserLimits: {
    enabled: boolean;
    defaultLimit?: number;
    customLimits: Record<string, number>;
    overagePolicy: 'block' | 'warn' | 'approve';
  };
  notifications: {
    lowBalanceThreshold: number;
    expirationWarningDays: number[];
    recipientRoles: ('admin' | 'manager' | 'member')[];
    notificationChannels: ('email' | 'in_app' | 'slack')[];
  };
  usageVisibility: {
    showTeamBalance: boolean;
    showIndividualUsage: boolean;
    showTeamAnalytics: boolean;
  };
}
```

#### 2. Credit Allocation Policies

```typescript
interface CreditPolicy {
  hardLimits: {
    type: 'hard';
    monthlyLimit: number;
    overageAction: 'block' | 'request_approval';
    approvalWorkflow?: {
      approvers: string[];
      autoApproveUnder?: number;
      expiresAfterHours: number;
      notificationSettings: {
        channels: string[];
        reminderFrequency: number;
      };
    };
  };
  softLimits: {
    type: 'soft';
    monthlyTarget: number;
    warningThresholds: number[];
    notifyManager: boolean;
    autoNotifyThreshold: number;
    escalationRules?: {
      threshold: number;
      action: 'notify' | 'restrict' | 'require_approval';
      notifyRoles: string[];
    }[];
  };
  specialAllocations: {
    newUserBonus?: number;
    referralBonus?: number;
    promotionalCredits?: {
      amount: number;
      expiryDays: number;
    };
  };
}
```

### Team Management

```typescript
interface TeamManagement {
  seats: {
    total: number;
    active: number;
    pending: number;
    available: number;
    reservations?: Array<{
      email: string;
      expiresAt: Date;
      role: string;
    }>;
  };
  members: Array<{
    userId: string;
    role: 'admin' | 'manager' | 'member';
    status: 'active' | 'pending' | 'suspended';
    creditLimit?: number;
    usage: {
      currentMonth: number;
      average: number;
      history: Array<{
        month: string;
        used: number;
        limit: number;
      }>;
    };
    permissions: {
      canManageBilling: boolean;
      canViewAnalytics: boolean;
      canManageTeam: boolean;
      canApproveRequests: boolean;
      customPermissions?: string[];
    };
    preferences: {
      notificationChannels: string[];
      reportFrequency?: 'daily' | 'weekly' | 'monthly';
      dashboardView?: 'simple' | 'detailed';
    };
  }>;
  hierarchy?: {
    teams: Array<{
      id: string;
      name: string;
      leaderId: string;
      memberIds: string[];
      creditAllocation?: number;
    }>;
    departments?: Array<{
      id: string;
      name: string;
      teamIds: string[];
      budgetLimit?: number;
    }>;
  };
}
```

### Enterprise Features

#### 1. White Labeling
```typescript
interface WhiteLabelConfig {
  branding: {
    logo: {
      light: string;
      dark: string;
      favicon: string;
    };
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
    };
    fonts: {
      primary: string;
      secondary: string;
    };
  };
  domain: {
    custom: string;
    sslCertificate: boolean;
    redirects: Array<{
      from: string;
      to: string;
    }>;
  };
  communication: {
    emailTemplates: Record<string, {
      subject: string;
      body: string;
      variables: string[];
    }>;
    notificationTemplates: Record<string, {
      title: string;
      body: string;
      priority: string;
    }>;
  };
  customization: {
    features: string[];
    terminology: Record<string, string>;
    landingPage?: {
      sections: string[];
      content: Record<string, any>;
    };
  };
}
```

#### 2. Advanced Analytics
```typescript
interface EnterpriseAnalytics {
  usage: {
    overview: {
      totalSessions: number;
      totalHours: number;
      averageRating: number;
      totalUsers: number;
      activeUsers: number;
    };
    trends: Array<{
      period: string;
      metrics: Record<string, number>;
      growth: Record<string, number>;
    }>;
  };
  roi: {
    investment: {
      totalSpent: number;
      averagePerUser: number;
      projectedAnnual: number;
    };
    outcomes: {
      salesIncrease?: number;
      skillProgress?: number;
      satisfaction?: number;
      retention?: number;
    };
    benchmarks: {
      industry: Record<string, number>;
      similarSize: Record<string, number>;
      topPerformers: Record<string, number>;
    };
  };
  reporting: {
    scheduled: Array<{
      name: string;
      frequency: string;
      recipients: string[];
      metrics: string[];
      format: string;
    }>;
    custom: {
      availableMetrics: string[];
      filters: Record<string, any>;
      exportFormats: string[];
    };
  };
}
```

#### 3. Integration Options
```typescript
interface EnterpriseIntegrations {
  sso: {
    providers: Array<{
      name: string;
      type: 'SAML' | 'OAuth2' | 'OIDC';
      config: Record<string, any>;
      mappings: Record<string, string>;
    }>;
    features: {
      jit: boolean;
      scim: boolean;
      autoProvision: boolean;
    };
  };
  api: {
    access: {
      keys: Array<{
        id: string;
        scopes: string[];
        expiresAt?: Date;
      }>;
      rateLimit: number;
      ipWhitelist?: string[];
    };
    webhooks: Array<{
      event: string;
      url: string;
      secret: string;
      active: boolean;
    }>;
  };
  dataExport: {
    scheduled: Array<{
      frequency: string;
      format: string;
      destination: {
        type: string;
        config: Record<string, any>;
      };
    }>;
    realtime: {
      enabled: boolean;
      endpoints: Record<string, string>;
    };
  };
}
```

### Credit Approval Workflow

```typescript
interface CreditApprovalSystem {
  requests: Array<{
    id: string;
    userId: string;
    amount: number;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    created: Date;
    expires: Date;
    approver?: {
      userId: string;
      decision?: string;
      timestamp?: Date;
    };
  }>;
  policies: {
    autoApprovalThreshold?: number;
    expirationHours: number;
    requireReason: boolean;
    allowedReasons?: string[];
    escalationRules: Array<{
      condition: string;
      approvers: string[];
    }>;
  };
  notifications: {
    channels: string[];
    templates: Record<string, string>;
    reminders: {
      frequency: number;
      maxReminders: number;
    };
  };
}
```

### Usage Visibility Controls

```typescript
interface UsageVisibility {
  teamView: {
    showTotalPool: boolean;
    showIndividualUsage: boolean;
    showTeamComparison: boolean;
    showRemainingCredits: boolean;
  };
  memberView: {
    showPersonalUsage: boolean;
    showTeamAverage: boolean;
    showAllocationDetails: boolean;
    showExpirationWarnings: boolean;
  };
  managerControls: {
    canAdjustVisibility: boolean;
    canSetIndividualLimits: boolean;
    canViewDetailedReports: boolean;
  };
  privacySettings: {
    maskUserNames: boolean;
    aggregateTeamData: boolean;
    restrictSensitiveData: boolean;
  };
}
```

## Database Schema

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

-- Active Subscriptions
CREATE TABLE subscriptions (
    id BIGINT PRIMARY KEY,
    planDbId BIGINT REFERENCES subscription_plans(id),
    subscriberType TEXT NOT NULL, -- 'individual' or 'organization'
    subscriberDbId BIGINT NOT NULL, -- References User(id) or organizations(id)
    status TEXT NOT NULL,
    currentPeriodStart TIMESTAMP WITH TIME ZONE,
    currentPeriodEnd TIMESTAMP WITH TIME ZONE,
    cancelAtPeriodEnd BOOLEAN DEFAULT false,
    stripePriceId TEXT NOT NULL,
    stripeSubscriptionId TEXT NOT NULL,
    metadata JSONB,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE
);

-- Organizations (B2B)
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

-- Credit System
CREATE TABLE credit_wallets (
    id BIGINT PRIMARY KEY,
    ownerType TEXT NOT NULL, -- 'user' or 'organization'
    ownerDbId BIGINT NOT NULL,
    balance INTEGER NOT NULL DEFAULT 0,
    lifetimeCredits INTEGER NOT NULL DEFAULT 0,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE
);

CREATE TABLE credit_transactions (
    id BIGINT PRIMARY KEY,
    walletDbId BIGINT REFERENCES credit_wallets(id),
    type TEXT NOT NULL, -- 'credit', 'debit', 'rollover', 'expiry'
    amount INTEGER NOT NULL,
    description TEXT,
    metadata JSONB,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE credit_rollovers (
    id BIGINT PRIMARY KEY,
    walletDbId BIGINT REFERENCES credit_wallets(id),
    amount INTEGER NOT NULL,
    expiresAt TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL, -- 'active', 'used', 'expired'
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE
);

-- B2B Specific Tables
CREATE TABLE team_activity_log (
    id BIGINT PRIMARY KEY,
    organizationDbId BIGINT REFERENCES organizations(id),
    actorDbId BIGINT REFERENCES User(id),
    targetDbId BIGINT REFERENCES User(id),
    action TEXT NOT NULL,
    metadata JSONB,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE credit_approval_requests (
    id BIGINT PRIMARY KEY,
    organizationDbId BIGINT REFERENCES organizations(id),
    requestedByDbId BIGINT REFERENCES User(id),
    approverDbId BIGINT REFERENCES User(id),
    amount INTEGER NOT NULL,
    status TEXT NOT NULL, -- 'pending', 'approved', 'rejected'
    reason TEXT,
    expiresAt TIMESTAMP WITH TIME ZONE,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE
);

CREATE TABLE organization_settings (
    id BIGINT PRIMARY KEY,
    organizationDbId BIGINT REFERENCES organizations(id),
    creditLimitPolicy JSONB,
    notificationPreferences JSONB,
    visibilitySettings JSONB,
    customBranding JSONB,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE
);
```

## API Endpoints

```typescript
// Subscription Management
POST /api/subscriptions/create
POST /api/subscriptions/update
POST /api/subscriptions/cancel
GET /api/subscriptions/status

// Credit Management
GET /api/credits/balance
POST /api/credits/transfer
GET /api/credits/history
GET /api/credits/rollover-status

// B2B Organization
POST /api/organization/create
POST /api/organization/update
POST /api/organization/seats/manage
GET /api/organization/analytics

// Team Management
POST /api/organization/members/add
POST /api/organization/members/remove
POST /api/organization/members/update-role
GET /api/organization/members/list

// Reporting
GET /api/reports/usage/team
GET /api/reports/usage/user/:id
GET /api/reports/roi
GET /api/reports/export
```

## Implementation Plan

### Phase 1: Core Subscription System (1-2 Months)
- [ ] Database schema implementation
- [ ] Stripe integration for B2C plans
- [ ] Basic credit wallet system
- [ ] Individual subscription management

### Phase 2: B2B Foundation (2-3 Months)
- [ ] Organization management
- [ ] Team member handling
- [ ] Pooled credit system
- [ ] Basic administrative tools

### Phase 3: Advanced B2B Features (2-3 Months)
- [ ] Advanced analytics
- [ ] Custom branding options
- [ ] API access
- [ ] Enterprise integrations

### Phase 4: Enterprise Tools (2-3 Months)
- [ ] SSO implementation
- [ ] Advanced reporting
- [ ] Custom workflows
- [ ] White-label solutions

## Security & Compliance

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

## Next Steps

1. Begin Phase 1:
   - Set up database schema
   - Implement Stripe integration
   - Build credit system
   - Create subscription management

2. Prepare for Phase 2:
   - Design organization structure
   - Plan B2B features
   - Develop team management

3. Documentation:
   - API documentation
   - Integration guides
   - User guides
   - Admin documentation 