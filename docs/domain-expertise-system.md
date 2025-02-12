# Domain Expertise System Implementation

## Overview
This document outlines the implementation plan for a flexible domain expertise system that allows both MENTEES and COACHES to have multiple domains of expertise (e.g., Realtor, Loan Officer).

## Current Limitations
- System is tightly coupled to RealtorProfile domain
- No flexibility for other professional domains
- Validation only occurs at listing creation
- No clear domain selection during signup
- No support for multiple domains per user

## Implementation Plan

### 1. Database Schema Updates

```prisma
// In prisma/schema.prisma
model User {
  id        BigInt   @id @default(autoincrement())
  userId    String   @unique // Clerk ID
  role      UserRole @default(MENTEE)
  domains   Domain[]
}

enum UserRole {
  MENTEE
  COACH
}

model Domain {
  id          BigInt     @id @default(autoincrement())
  type        DomainType
  userDbId    BigInt
  user        User       @relation(fields: [userDbId], references: [id])
  // Common fields for all domains
  verified    Boolean    @default(false)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  
  // Domain-specific profiles using one-to-one relations
  realtorProfile    RealtorProfile?
  loanOfficerProfile LoanOfficerProfile?
}

enum DomainType {
  REALTOR
  LOAN_OFFICER
  // Future domains...
}

model RealtorProfile {
  id          BigInt   @id @default(autoincrement())
  domainId    BigInt   @unique
  domain      Domain   @relation(fields: [domainId], references: [id])
  // Realtor-specific fields
  licenseNumber String
  brokerage    String
  // ... other realtor fields
}

model LoanOfficerProfile {
  id          BigInt   @id @default(autoincrement())
  domainId    BigInt   @unique
  domain      Domain   @relation(fields: [domainId], references: [id])
  // Loan officer specific fields
  nmlsId      String
  institution String
  // ... other loan officer fields
}
```

### 2. API Implementation

#### Domain Selection & Management
```typescript
// utils/actions/domain.ts
'use server'

import { auth } from "@clerk/nextjs/server"
import { createAuthClient } from "@/utils/auth"
import { DomainType } from "@prisma/client"

export async function addDomain(domainType: DomainType) {
  try {
    const { userId } = await auth();
    if (!userId) return { error: "Unauthorized" };
    
    const supabase = await createAuthClient();
    
    // Create domain entry
    const { data: domain, error } = await supabase
      .from("Domain")
      .insert({
        type: domainType,
        userDbId: userId,
      })
      .select()
      .single();
      
    if (error) return { error: "Failed to add domain" };
    
    return { data: domain };
  } catch (error) {
    console.error("[ADD_DOMAIN_ERROR]", error);
    return { error: "Failed to add domain" };
  }
}

export async function removeDomain(domainId: number) {
  try {
    const { userId } = await auth();
    if (!userId) return { error: "Unauthorized" };
    
    const supabase = await createAuthClient();
    
    const { error } = await supabase
      .from("Domain")
      .delete()
      .eq("id", domainId)
      .eq("user.userId", userId);
      
    if (error) return { error: "Failed to remove domain" };
    
    return { success: true };
  } catch (error) {
    console.error("[REMOVE_DOMAIN_ERROR]", error);
    return { error: "Failed to remove domain" };
  }
}

export async function getUserDomains() {
  try {
    const { userId } = await auth();
    if (!userId) return { error: "Unauthorized" };
    
    const supabase = await createAuthClient();
    
    const { data, error } = await supabase
      .from("Domain")
      .select(`
        *,
        realtorProfile (*),
        loanOfficerProfile (*)
      `)
      .eq("user.userId", userId);
      
    if (error) return { error: "Failed to fetch domains" };
    
    return { data };
  } catch (error) {
    console.error("[GET_USER_DOMAINS_ERROR]", error);
    return { error: "Failed to fetch domains" };
  }
}
```

### 3. Permission System

```typescript
// utils/permissions.ts
export async function checkDomainAccess(userId: string, requiredDomain: DomainType) {
  const supabase = await createAuthClient();
  
  const { data, error } = await supabase
    .from("Domain")
    .select("type, verified")
    .eq("user.userId", userId)
    .eq("type", requiredDomain)
    .single();
    
  return data?.verified ?? false;
}

export async function checkMultipleDomainAccess(userId: string, requiredDomains: DomainType[]) {
  const supabase = await createAuthClient();
  
  const { data, error } = await supabase
    .from("Domain")
    .select("type, verified")
    .eq("user.userId", userId)
    .in("type", requiredDomains);
    
  if (error || !data) return false;
  
  return data.every(domain => domain.verified);
}
```

### 4. UI Components

#### Domain Selection During Onboarding
```typescript
// components/onboarding/DomainSelection.tsx
'use client'

import { useState } from 'react'
import { addDomain } from '@/utils/actions/domain'
import { DomainType } from '@prisma/client'

export function DomainSelection() {
  const [selectedDomains, setSelectedDomains] = useState<DomainType[]>([])
  
  const handleDomainToggle = (domain: DomainType) => {
    setSelectedDomains(prev => 
      prev.includes(domain) 
        ? prev.filter(d => d !== domain)
        : [...prev, domain]
    )
  }
  
  const handleSubmit = async () => {
    for (const domain of selectedDomains) {
      await addDomain(domain)
    }
    // Redirect to domain-specific profile completion
  }
  
  return (
    <div>
      <h2>Select Your Areas of Expertise</h2>
      {Object.values(DomainType).map(domain => (
        <button
          key={domain}
          onClick={() => handleDomainToggle(domain)}
          className={selectedDomains.includes(domain) ? 'selected' : ''}
        >
          {domain}
        </button>
      ))}
      <button onClick={handleSubmit}>Continue</button>
    </div>
  )
}
```

#### Domain Management in Profile
```typescript
// components/profile/DomainManager.tsx
'use client'

import { useEffect, useState } from 'react'
import { getUserDomains, removeDomain, addDomain } from '@/utils/actions/domain'
import { DomainType } from '@prisma/client'

export function DomainManager() {
  const [domains, setDomains] = useState([])
  
  useEffect(() => {
    loadDomains()
  }, [])
  
  const loadDomains = async () => {
    const { data } = await getUserDomains()
    if (data) setDomains(data)
  }
  
  return (
    <div>
      <h2>Your Domains of Expertise</h2>
      {domains.map(domain => (
        <div key={domain.id}>
          <span>{domain.type}</span>
          <span>{domain.verified ? 'Verified' : 'Pending'}</span>
          <button onClick={() => removeDomain(domain.id)}>Remove</button>
        </div>
      ))}
      <button onClick={() => addDomain()}>Add New Domain</button>
    </div>
  )
}
```

### 5. Feature Access Control

```typescript
// components/DomainFeatures.tsx
'use client'

import { useUser } from '@/hooks/useUser'
import { ListingsManager } from './listings/ListingsManager'
import { LoanCalculator } from './loans/LoanCalculator'

export function DomainFeatures() {
  const { domains } = useUser()
  
  return (
    <div>
      {domains.includes("REALTOR") && (
        <div>
          <h2>Realtor Tools</h2>
          <ListingsManager />
        </div>
      )}
      
      {domains.includes("LOAN_OFFICER") && (
        <div>
          <h2>Loan Officer Tools</h2>
          <LoanCalculator />
        </div>
      )}
    </div>
  )
}
```

## Implementation Steps

1. **Database Migration**
   - Create new schema with Domain and related tables
   - Add migration scripts for existing data
   - Update indexes and relationships

2. **Backend Updates**
   - Implement domain management API endpoints
   - Update existing endpoints to check domain access
   - Add domain verification system
   - Update Supabase types and queries

3. **Frontend Updates**
   - Add domain selection to onboarding flow
   - Create domain management UI in profile
   - Update feature access based on domains
   - Add domain-specific forms and validation

4. **Testing**
   - Unit tests for domain management
   - Integration tests for feature access
   - Migration testing
   - User flow testing

## Security Considerations

1. Always verify domain access server-side
2. Implement rate limiting for domain operations
3. Validate domain verification requests
4. Audit domain changes
5. Protect domain-specific routes with middleware

## Future Enhancements

1. Domain verification automation
2. Domain-specific analytics
3. Domain expertise levels
4. Cross-domain collaboration features
5. Domain-specific content and resources 