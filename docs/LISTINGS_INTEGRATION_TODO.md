# Listings Integration Implementation Plan

## Overview
This document outlines the implementation plan for handling real estate listings in our coaching marketplace, with both MVP manual entry and future RESO/MLS integration in mind.

## Schema Updates

### New Models for MVP
```prisma
model Listing {
  id                Int      @id @default(autoincrement())
  listingKey        String?  @unique // Will be required for MLS integration
  listingId         String?  @unique // MLS-specific ID
  modificationTimestamp DateTime @updatedAt @db.Timestamptz
  
  // Core Details (RESO Standard Fields)
  propertyType      String   // StandardStatus enum: ["Active", "Pending", "Sold", etc.]
  propertySubType   String?
  status            String
  listPrice         Decimal  @db.Decimal(10,2)
  originalListPrice Decimal? @db.Decimal(10,2)
  closePrice        Decimal? @db.Decimal(10,2)
  listingContractDate DateTime? @db.Timestamptz
  closeDate         DateTime? @db.Timestamptz
  
  // Location (RESO Standard Fields)
  city              String
  stateOrProvince   String
  postalCode        String
  streetName        String
  streetNumber      String
  unit              String?
  
  // Property Characteristics (RESO Standard Fields)
  bedroomsTotal     Int
  bathroomsTotal    Decimal  @db.Decimal(3,1)
  livingArea        Decimal? @db.Decimal(10,2)
  lotSize           Decimal? @db.Decimal(10,2)
  yearBuilt         Int?
  
  // Media
  photos            Json?    // Array of photo URLs
  virtualTours      Json?    // Array of virtual tour URLs
  
  // Relations
  realtorProfileId  Int
  realtorProfile    RealtorProfile @relation(fields: [realtorProfileId], references: [id], onDelete: Cascade)
  
  // Featured Status
  isFeatured        Boolean  @default(false)
  featuredOrder     Int?     // For ordering featured listings
  
  // Manual Entry vs MLS Source
  source            String   @default("MANUAL") // enum: ["MANUAL", "MLS"]
  mlsSource         String?  // Which MLS system the data came from
  
  // Timestamps
  createdAt         DateTime @default(now()) @db.Timestamptz
  updatedAt         DateTime @updatedAt @db.Timestamptz

  @@index([realtorProfileId])
  @@index([listingKey])
  @@index([status])
}

// Update to RealtorProfile model
model RealtorProfile {
  // ... existing fields ...
  
  // Remove old featuredListings Json field
  listings          Listing[]
  
  // MLS Integration fields (for future use)
  mlsId             String?   @unique
  mlsName           String?
  mlsStatus         String?   // Active, Pending, Suspended
  
  // ... rest of existing fields ...
}
```

## Implementation Phases

### Phase 1: MVP Manual Entry
1. **Schema Implementation**
   - [x] Create Listing model
   - [ ] Update RealtorProfile model
   - [ ] Add necessary indexes
   - [ ] Implement migrations

2. **Manual Entry UI**
   - [ ] Create listing form with RESO-compliant fields
   - [ ] Add photo upload functionality
   - [ ] Implement featured listing selection
   - [ ] Add listing management dashboard

3. **Validation & Processing**
   - [ ] Implement Zod schemas for listing data
   - [ ] Add data validation
   - [ ] Create server actions for listing management
   - [ ] Add proper error handling

### Phase 2: MLS Integration (Future)
1. **RESO Web API Integration**
   - [ ] Implement RESO Web API client
   - [ ] Add OAuth2 authentication flow
   - [ ] Create data synchronization service
   - [ ] Implement rate limiting and caching

2. **Data Synchronization**
   - [ ] Create background sync jobs
   - [ ] Implement delta updates
   - [ ] Add conflict resolution
   - [ ] Create sync status monitoring

3. **MLS Account Connection**
   - [ ] Add MLS account verification
   - [ ] Implement license verification
   - [ ] Create MLS connection UI
   - [ ] Add connection status monitoring

## API Structure

### MVP Endpoints
```typescript
interface ListingAPI {
  // Create new listing
  createListing(data: CreateListingDTO): Promise<Listing>
  
  // Update existing listing
  updateListing(id: number, data: UpdateListingDTO): Promise<Listing>
  
  // Toggle featured status
  toggleFeatured(id: number, featured: boolean): Promise<Listing>
  
  // Reorder featured listings
  updateFeaturedOrder(listings: Array<{id: number, order: number}>): Promise<void>
  
  // Delete listing
  deleteListing(id: number): Promise<void>
}
```

### Future MLS Integration Endpoints
```typescript
interface MLSIntegrationAPI {
  // Connect MLS account
  connectMLS(credentials: MLSCredentials): Promise<void>
  
  // Sync listings from MLS
  syncListings(): Promise<SyncResult>
  
  // Get sync status
  getSyncStatus(): Promise<SyncStatus>
  
  // Disconnect MLS account
  disconnectMLS(): Promise<void>
}
```

## Security Considerations

1. **Data Access**
   - Implement RLS policies for listing access
   - Ensure proper user authorization
   - Validate listing ownership
   - Protect sensitive listing data

2. **MLS Integration**
   - Secure credential storage
   - Implement API key rotation
   - Add rate limiting
   - Monitor for abuse

## Monitoring & Analytics

1. **MVP Metrics**
   - Track listing creation/updates
   - Monitor featured listing engagement
   - Track photo upload usage
   - Monitor storage usage

2. **Future MLS Metrics**
   - Monitor sync success rates
   - Track API usage and limits
   - Monitor data freshness
   - Track error rates

## Notes
- All database operations must use Supabase client
- Follow RESO Data Dictionary standards for field names
- Implement proper error handling and validation
- Keep UI/UX consistent with existing design system
- Plan for scalability in data storage and retrieval 