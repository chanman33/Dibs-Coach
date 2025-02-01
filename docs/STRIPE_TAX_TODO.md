# Stripe Tax Integration TODO

## Overview
This document outlines the implementation plan for tax handling in our coaching marketplace using Stripe Tax as the primary solution, with considerations for supplementary services for complex cases.

## 1. Schema Updates

### Database Schema Updates
- [ ] Add tax-related fields to existing models:
  ```prisma
  // Session Model Updates
  model Session {
    // ... existing fields ...
    taxAmount          Decimal?  @db.Decimal(10,2)
    taxRates           Json?     // Store applied tax rates
    taxLocation        Json?     // Store tax jurisdiction info
  }

  // Transaction Model Updates
  model Transaction {
    // ... existing fields ...
    taxAmount          Decimal?  @db.Decimal(10,2)
    taxRates           Json?     // Store applied tax rates
    taxLocation        Json?     // Store tax jurisdiction info
    taxExempt          Boolean   @default(false)
    taxId              String?   // Customer's tax ID if applicable
  }

  // New Tax Report Model
  model TaxReport {
    id                  Int       @id @default(autoincrement())
    period              String    // e.g., "2024-Q1"
    type                String    // "vat", "sales_tax", etc.
    status              String    // "pending", "filed", "accepted"
    totalTransactions   Int
    totalTaxCollected   Decimal   @db.Decimal(10,2)
    currency            String    @default("USD")
    reportUrl           String?   // URL to downloaded report
    filingDue           DateTime  @db.Timestamptz
    filedAt             DateTime? @db.Timestamptz
    
    // Relations
    connectedAccountId  Int?
    connectedAccount    StripeConnectedAccount? @relation(fields: [connectedAccountId], references: [id])
    
    metadata            Json?
    createdAt           DateTime  @default(now()) @db.Timestamptz
    updatedAt           DateTime  @updatedAt @db.Timestamptz

    @@index([period])
    @@index([connectedAccountId])
  }
  ```

## 2. Stripe Tax Setup

### Platform Configuration
- [ ] Enable Stripe Tax in the dashboard
- [ ] Configure tax calculation behavior (inclusive/exclusive)
- [ ] Set up tax registration information
- [ ] Configure supported jurisdictions
- [ ] Set up tax codes for different service types

### API Integration
- [ ] Create tax calculation service:
  ```typescript
  // lib/stripe/tax.ts
  interface TaxCalculationParams {
    amount: number;
    currency: string;
    customerLocation: {
      country: string;
      state?: string;
      postalCode?: string;
    };
    serviceType: 'coaching' | 'subscription';
    taxId?: string;
  }

  async function calculateTax(params: TaxCalculationParams): Promise<TaxCalculationResult>
  ```

### Coach Onboarding Updates
- [ ] Add tax information collection to coach onboarding
- [ ] Implement tax ID validation
- [ ] Add tax registration number collection
- [ ] Store tax certificates and documentation

## 3. Tax Calculation Implementation

### Core Tax Service
- [ ] Implement primary tax calculation using Stripe Tax:
  ```typescript
  // services/tax/calculation.ts
  - [ ] Create base tax calculation service
  - [ ] Add support for different service types
  - [ ] Implement tax exemption handling
  - [ ] Add location-based tax determination
  - [ ] Implement tax ID validation
  ```

### Integration Points
- [ ] Add tax calculation to:
  - [ ] Session booking flow
  - [ ] Subscription creation
  - [ ] Payment processing
  - [ ] Invoice generation

### Error Handling
- [ ] Implement robust error handling:
  ```typescript
  // types/tax.ts
  interface TaxError {
    code: string;
    message: string;
    type: 'calculation_error' | 'validation_error' | 'api_error';
    details?: Record<string, any>;
  }
  ```

## 4. Tax Reporting System

### Report Generation
- [ ] Implement automated tax report generation:
  - [ ] Daily transaction summaries
  - [ ] Monthly tax calculations
  - [ ] Quarterly tax reports
  - [ ] Annual tax statements

### API Endpoints
- [ ] Create tax reporting endpoints:
  ```typescript
  // API Routes
  - [ ] GET /api/tax/reports - List tax reports
  - [ ] GET /api/tax/reports/[id] - Get specific report
  - [ ] POST /api/tax/reports/generate - Generate new report
  - [ ] GET /api/tax/summary - Get tax summary
  ```

### Dashboard Integration
- [ ] Add tax reporting to admin dashboard:
  - [ ] Tax collection overview
  - [ ] Report generation interface
  - [ ] Tax filing status tracking
  - [ ] Export functionality

## 5. User Interface Updates

### Coach Dashboard
- [ ] Add tax information management:
  - [ ] Tax ID management
  - [ ] Tax registration display
  - [ ] Tax collection summary
  - [ ] Generated revenue reports

### Client Booking Flow
- [ ] Update pricing display:
  - [ ] Show tax calculations
  - [ ] Display tax breakdown
  - [ ] Handle tax exemptions
  - [ ] Show location-based tax info

### Admin Interface
- [ ] Create tax management interface:
  - [ ] Tax rate overview
  - [ ] Tax report generation
  - [ ] Tax filing status
  - [ ] Audit log viewing

## 6. Testing Requirements

### Unit Tests
- [ ] Test tax calculation logic:
  ```typescript
  // tests/tax/calculation.test.ts
  - [ ] Test basic tax calculations
  - [ ] Test location-based calculations
  - [ ] Test tax exemption handling
  - [ ] Test error scenarios
  ```

### Integration Tests
- [ ] Test full tax workflow:
  - [ ] Session booking with tax
  - [ ] Subscription creation with tax
  - [ ] Tax report generation
  - [ ] Tax ID validation

### E2E Tests
- [ ] Test complete user flows:
  - [ ] Coach tax setup
  - [ ] Client booking with tax
  - [ ] Tax report generation
  - [ ] Tax export functionality

## 7. Documentation

### Technical Documentation
- [ ] Create implementation guides:
  - [ ] Tax calculation flows
  - [ ] Integration points
  - [ ] Error handling
  - [ ] Testing procedures

### User Documentation
- [ ] Create user guides:
  - [ ] Coach tax setup guide
  - [ ] Tax reporting guide
  - [ ] Tax compliance guide
  - [ ] FAQ for tax-related questions

## 8. Compliance & Security

### Data Security
- [ ] Implement security measures:
  - [ ] Encrypt tax IDs
  - [ ] Secure tax documents
  - [ ] Audit logging
  - [ ] Access controls

### Compliance Requirements
- [ ] Ensure compliance with:
  - [ ] Local tax laws
  - [ ] Data protection regulations
  - [ ] Record keeping requirements
  - [ ] Reporting requirements

## Implementation Order

1. Schema Updates & Basic Setup
   - Update database schema
   - Configure Stripe Tax
   - Set up basic tax calculation

2. Core Tax Calculation
   - Implement calculation service
   - Add to payment flows
   - Test basic scenarios

3. Reporting System
   - Build report generation
   - Create admin interface
   - Implement export functionality

4. User Interface
   - Update booking flow
   - Add tax management
   - Implement reporting views

5. Testing & Documentation
   - Write test suites
   - Create documentation
   - Perform security audit

## Environment Variables
```env
# Stripe Tax Configuration
STRIPE_TAX_ENABLED=true
STRIPE_TAX_CALCULATION_BEHAVIOR=inclusive
STRIPE_TAX_REGISTRATION_NUMBER=your_number

# Backup Services (Optional)
AVALARA_API_KEY=optional_backup_service
TAXJAR_API_KEY=optional_backup_service

# Tax Reporting
TAX_REPORT_SCHEDULE=daily|weekly|monthly
TAX_REPORT_RETENTION_DAYS=90
```

## Monitoring & Maintenance

### Monitoring
- [ ] Set up monitoring for:
  - [ ] Tax calculation errors
  - [ ] API response times
  - [ ] Report generation status
  - [ ] System health metrics

### Maintenance
- [ ] Regular tasks:
  - [ ] Tax rate updates
  - [ ] Report archiving
  - [ ] Performance optimization
  - [ ] Compliance updates 