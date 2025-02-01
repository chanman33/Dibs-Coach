# Stripe Schema Updates

## Overview
This document outlines the necessary schema updates to support Stripe payments in our coaching marketplace. We'll modify existing payment-related models and add new ones to support Stripe Connect, subscriptions, and marketplace payments.

## Existing Models to Update

### User Model
Add new fields:
```prisma
model User {
  // ... existing fields ...
  
  // Stripe-related fields
  stripeCustomerId        String?   @unique  // For regular users (mentees)
  stripeConnectAccountId  String?   @unique  // For coaches
  defaultPaymentMethodId  String?           // Default payment method for the user
  
  // Updated payment relations
  stripeConnectedAccount  StripeConnectedAccount?
  paymentMethods         PaymentMethod[]
  platformSubscription   Subscription?
  
  // ... rest of existing fields ...
}
```

### CoachProfile Model
Add new fields:
```prisma
model CoachProfile {
  // ... existing fields ...
  
  // Stripe-related fields
  payoutSchedule         String    @default("instant") // instant, daily, weekly, monthly
  platformFeePercentage  Decimal   @default(20.00) @db.Decimal(5,2) // 20% default
  minimumPayout         Decimal   @default(100.00) @db.Decimal(10,2)
  totalEarnings         Decimal   @default(0.00) @db.Decimal(10,2)
  availableBalance      Decimal   @default(0.00) @db.Decimal(10,2)
  pendingBalance        Decimal   @default(0.00) @db.Decimal(10,2)
  
  // ... rest of existing fields ...
}
```

### Session Model
Add new fields:
```prisma
model Session {
  // ... existing fields ...
  
  // Payment-related fields
  priceAmount           Decimal   @db.Decimal(10,2)
  currency             String    @default("USD")
  platformFeeAmount    Decimal   @db.Decimal(10,2)
  coachPayoutAmount    Decimal   @db.Decimal(10,2)
  paymentStatus        PaymentStatus @default(pending)
  stripePaymentIntentId String?
  
  // ... rest of existing fields ...
}
```

## New Models to Add

### StripeConnectedAccount Model
```prisma
model StripeConnectedAccount {
  id                  Int       @id @default(autoincrement())
  userDbId            Int       @unique
  stripeAccountId     String    @unique
  payoutsEnabled      Boolean   @default(false)
  detailsSubmitted    Boolean   @default(false)
  chargesEnabled      Boolean   @default(false)
  country             String
  defaultCurrency     String    @default("USD")
  requiresOnboarding  Boolean   @default(true)
  
  // Business details
  businessType        String?   // individual, company, non_profit
  businessProfile     Json?     // Stored business profile data
  
  // Verification and requirements
  verificationStatus  String?
  requirements        Json?     // Stored requirements from Stripe
  
  // Relations
  user               User      @relation(fields: [userDbId], references: [id], onDelete: Cascade)
  payouts            Payout[]
  
  createdAt          DateTime  @default(now()) @db.Timestamptz
  updatedAt          DateTime  @updatedAt @db.Timestamptz

  @@index([stripeAccountId])
}
```

### PaymentMethod Model (Replace existing enum)
```prisma
model PaymentMethod {
  id                  Int       @id @default(autoincrement())
  userDbId            Int
  stripePaymentMethodId String
  type                String    // credit, debit, etc.
  brand               String    // visa, mastercard, etc.
  last4               String
  expiryMonth         Int?
  expiryYear          Int?
  isDefault           Boolean   @default(false)
  
  // Relations
  user                User      @relation(fields: [userDbId], references: [id], onDelete: Cascade)
  
  createdAt           DateTime  @default(now()) @db.Timestamptz
  updatedAt           DateTime  @updatedAt @db.Timestamptz

  @@unique([userDbId, stripePaymentMethodId])
  @@index([userDbId])
}
```

### Subscription Model (Enhanced)
```prisma
model Subscription {
  id                  Int       @id @default(autoincrement())
  userDbId            Int       @unique
  stripeSubscriptionId String    @unique
  stripePriceId       String
  status              String    // active, canceled, past_due, etc.
  currentPeriodStart  DateTime  @db.Timestamptz
  currentPeriodEnd    DateTime  @db.Timestamptz
  cancelAtPeriodEnd   Boolean   @default(false)
  
  // Pricing details
  amount              Decimal   @db.Decimal(10,2)
  currency            String    @default("USD")
  interval            String    // month, year
  
  // Relations
  user                User      @relation(fields: [userDbId], references: [id], onDelete: Cascade)
  invoices            Invoice[]
  
  createdAt           DateTime  @default(now()) @db.Timestamptz
  updatedAt           DateTime  @updatedAt @db.Timestamptz

  @@index([stripeSubscriptionId])
}
```

### Transaction Model (New)
```prisma
model Transaction {
  id                  Int       @id @default(autoincrement())
  type                String    // subscription_payment, session_payment
  status              String    // pending, completed, failed, refunded
  amount              Decimal   @db.Decimal(10,2)
  currency            String    @default("USD")
  
  // Stripe IDs
  stripePaymentIntentId String?
  stripeTransferId     String?
  
  // Fee breakdown
  platformFee         Decimal   @db.Decimal(10,2)
  coachPayout         Decimal   @db.Decimal(10,2)
  
  // Relations
  sessionDbId         Int?
  session             Session?  @relation(fields: [sessionDbId], references: [id])
  payerDbId           Int
  payer               User      @relation("TransactionPayer", fields: [payerDbId], references: [id])
  coachDbId           Int?
  coach               User?     @relation("TransactionCoach", fields: [coachDbId], references: [id])
  
  // Metadata
  metadata            Json?
  
  createdAt           DateTime  @default(now()) @db.Timestamptz
  updatedAt           DateTime  @updatedAt @db.Timestamptz

  @@index([stripePaymentIntentId])
  @@index([sessionDbId])
  @@index([payerDbId])
  @@index([coachDbId])
}
```

### Payout Model (Enhanced)
```prisma
model Payout {
  id                  Int       @id @default(autoincrement())
  stripePayoutId      String    @unique
  amount              Decimal   @db.Decimal(10,2)
  currency            String    @default("USD")
  status              PayoutStatus @default(pending)
  
  // Relations
  userDbId            Int
  user                User      @relation("PayoutPayee", fields: [userDbId], references: [id])
  connectedAccountId  Int
  connectedAccount    StripeConnectedAccount @relation(fields: [connectedAccountId], references: [id])
  
  // Metadata
  arrivalDate         DateTime? @db.Timestamptz
  metadata            Json?
  
  createdAt           DateTime  @default(now()) @db.Timestamptz
  updatedAt           DateTime  @updatedAt @db.Timestamptz

  @@index([stripePayoutId])
  @@index([userDbId])
}
```

### Invoice Model (Enhanced)
```prisma
model Invoice {
  id                  Int       @id @default(autoincrement())
  stripeInvoiceId     String    @unique
  amount              Decimal   @db.Decimal(10,2)
  currency            String    @default("USD")
  status              String    // draft, open, paid, void, uncollectible
  
  // Relations
  userDbId            Int
  user                User      @relation(fields: [userDbId], references: [id])
  subscriptionId      Int?
  subscription        Subscription? @relation(fields: [subscriptionId], references: [id])
  
  // PDF details
  invoiceUrl          String?
  invoicePdf          String?
  
  // Dates
  dueDate             DateTime? @db.Timestamptz
  paidAt              DateTime? @db.Timestamptz
  
  createdAt           DateTime  @default(now()) @db.Timestamptz
  updatedAt           DateTime  @updatedAt @db.Timestamptz

  @@index([stripeInvoiceId])
  @@index([userDbId])
  @@index([subscriptionId])
}
```

## Implementation Notes

1. **Database Migrations**
   - Create backup before running migrations
   - Run migrations in staging first
   - Test data consistency after migration
   - Plan rollback strategy

2. **Data Consistency**
   - Add triggers for updating balances
   - Implement transaction boundaries
   - Add validation checks

3. **Indexes**
   - Added indexes on frequently queried fields
   - Added compound indexes for common queries
   - Optimized for payment lookups

4. **Security**
   - No sensitive payment data stored
   - All IDs properly referenced
   - Proper cascade deletion rules

5. **Audit Trail**
   - All models have timestamps
   - Status tracking for all operations
   - Metadata fields for additional info 