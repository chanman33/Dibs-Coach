# Lead Management System

This document provides an overview of the lead management system implemented in this application.

## Overview

The lead management system allows tracking and managing enterprise leads through various stages of the sales pipeline. It provides features for:

- Viewing and filtering leads by status, priority, and search terms
- Visualizing lead statistics and conversion rates
- Managing lead details, notes, and follow-up dates

## Data Model

The system uses the `EnterpriseLeads` table in the database with the following structure:

- **Core identifiers**
  - `ulid`: Unique identifier
  - `assignedToUlid`: Reference to the user assigned to the lead (optional)

- **Company Information**
  - `companyName`: Name of the company
  - `website`: Company website (optional)
  - `industry`: Industry type (from OrgIndustry enum)

- **Contact Information**
  - `fullName`: Full name of the contact person
  - `jobTitle`: Job title of the contact person
  - `email`: Email address
  - `phone`: Phone number

- **Company Details**
  - `teamSize`: Size of the team (e.g., "5-20", "20-50", "50-100", "100+")
  - `multipleOffices`: Whether the company has multiple offices

- **Lead Status**
  - `status`: Current status in the pipeline (NEW, CONTACTED, QUALIFIED, etc.)
  - `priority`: Priority level (LOW, MEDIUM, HIGH)

- **Tracking**
  - `notes`: Array of notes about the lead
  - `lastContactedAt`: When the lead was last contacted
  - `nextFollowUpDate`: When to follow up next
  - `metadata`: Additional metadata

## Components

The lead management system consists of the following components:

1. **Lead Management Page** (`app/dashboard/system/lead-mgmt/page.tsx`)
   - Main page that displays leads and provides filtering options

2. **Lead Filters** (`app/dashboard/system/lead-mgmt/_components/lead-filters.tsx`)
   - Component for filtering leads by status, priority, and search terms

3. **Lead Stats** (`app/dashboard/system/lead-mgmt/_components/lead-stats.tsx`)
   - Component for displaying lead statistics and conversion rates

4. **Lead Table Columns** (`app/dashboard/system/lead-mgmt/_components/columns.tsx`)
   - Configuration for the lead table columns

5. **Lead Actions** (`utils/actions/lead-actions.ts`)
   - Server actions for fetching and manipulating lead data

## Lead Statuses

The system tracks leads through the following statuses:

- `NEW`: Newly created leads
- `CONTACTED`: Leads that have been initially contacted
- `QUALIFIED`: Leads that have been qualified as potential customers
- `PROPOSAL`: Leads that have received a proposal
- `NEGOTIATION`: Leads in the negotiation phase
- `WON`: Successfully converted leads
- `LOST`: Leads that didn't convert
- `ARCHIVED`: Archived leads

## Development Data

For development purposes, you can seed the database with mock lead data using the provided scripts:

```bash
# Using yarn (recommended)
yarn seed-leads

# Or directly with Node
node scripts/seed-leads-direct.js
```

Make sure your `.env` file contains the following variables:
- `SUPABASE_URL`: Your Supabase project URL (direct URL, not a variable reference)
- `SUPABASE_SERVICE_KEY`: Your Supabase service key (with write access)

If your `.env` file uses variable references like `NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}`, make sure the base variables (`SUPABASE_URL`) are properly defined with actual values.

See `scripts/README-seed-leads.md` for more details on seeding options and customization.

## Future Enhancements

Potential future enhancements for the lead management system:

1. Lead detail page for viewing and editing individual leads
2. Email integration for tracking communications
3. Task management for follow-up activities
4. Automated lead scoring
5. Integration with CRM systems
6. Custom pipeline stages
7. Advanced reporting and analytics 