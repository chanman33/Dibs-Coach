#!/usr/bin/env node

/**
 * This script seeds the EnterpriseLeads table with mock data for development purposes.
 * It directly inserts the data using the Supabase client.
 * 
 * Usage:
 * node scripts/seed-leads-direct.js
 */

const { createClient } = require('@supabase/supabase-js');
const { ulid } = require('ulid');
require('dotenv').config();

// Initialize Supabase client
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Handle the case where NEXT_PUBLIC_SUPABASE_URL references SUPABASE_URL
if (supabaseUrl && supabaseUrl.includes('${SUPABASE_URL}')) {
  supabaseUrl = process.env.SUPABASE_URL;
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env file');
  process.exit(1);
}

console.log(`Using Supabase URL: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Mock data for leads
const mockLeads = [
  // Lead 1: New high priority lead
  {
    ulid: ulid(),
    companyName: 'Skyline Realty Group',
    website: 'https://skylinerealty.com',
    industry: 'REAL_ESTATE_SALES',
    fullName: 'Michael Johnson',
    jobTitle: 'Director of Operations',
    email: 'michael@skylinerealty.com',
    phone: '(555) 123-4567',
    teamSize: '20-50',
    multipleOffices: true,
    status: 'NEW',
    priority: 'HIGH',
    notes: [
      {
        id: 'note1',
        content: 'Initial contact made through website inquiry',
        createdAt: '2023-11-01T10:30:00Z',
        createdBy: 'system',
        type: 'NOTE'
      }
    ],
    nextFollowUpDate: '2023-11-15T14:00:00Z',
    createdAt: '2023-11-01T10:00:00Z',
    updatedAt: '2023-11-01T10:00:00Z'
  },
  
  // Lead 2: Contacted medium priority lead
  {
    ulid: ulid(),
    companyName: 'Horizon Mortgage Solutions',
    website: 'https://horizonmortgage.com',
    industry: 'MORTGAGE_LENDING',
    fullName: 'Sarah Williams',
    jobTitle: 'VP of Sales',
    email: 'sarah@horizonmortgage.com',
    phone: '(555) 234-5678',
    teamSize: '50-100',
    multipleOffices: true,
    status: 'CONTACTED',
    priority: 'MEDIUM',
    notes: [
      {
        id: 'note1',
        content: 'Initial call completed, interested in team coaching',
        createdAt: '2023-10-15T11:30:00Z',
        createdBy: 'system',
        type: 'CALL'
      },
      {
        id: 'note2',
        content: 'Sent follow-up email with pricing information',
        createdAt: '2023-10-20T09:15:00Z',
        createdBy: 'system',
        type: 'EMAIL'
      }
    ],
    lastContactedAt: '2023-10-20T09:15:00Z',
    nextFollowUpDate: '2023-11-10T10:00:00Z',
    createdAt: '2023-10-15T09:00:00Z',
    updatedAt: '2023-10-20T09:15:00Z'
  },
  
  // Lead 3: Qualified high priority lead
  {
    ulid: ulid(),
    companyName: 'Elite Property Management',
    website: 'https://elitepm.com',
    industry: 'PROPERTY_MANAGEMENT',
    fullName: 'David Chen',
    jobTitle: 'CEO',
    email: 'david@elitepm.com',
    phone: '(555) 345-6789',
    teamSize: '20-50',
    multipleOffices: false,
    status: 'QUALIFIED',
    priority: 'HIGH',
    notes: [
      {
        id: 'note1',
        content: 'Discovery call completed, good fit for enterprise plan',
        createdAt: '2023-10-05T14:00:00Z',
        createdBy: 'system',
        type: 'CALL'
      },
      {
        id: 'note2',
        content: 'Scheduled demo with management team',
        createdAt: '2023-10-10T11:30:00Z',
        createdBy: 'system',
        type: 'MEETING'
      }
    ],
    lastContactedAt: '2023-10-10T11:30:00Z',
    nextFollowUpDate: '2023-11-05T15:00:00Z',
    createdAt: '2023-10-01T08:00:00Z',
    updatedAt: '2023-10-10T11:30:00Z'
  },
  
  // Lead 4: Proposal stage medium priority
  {
    ulid: ulid(),
    companyName: 'Cornerstone Investments',
    website: 'https://cornerstoneinv.com',
    industry: 'REAL_ESTATE_INVESTMENT',
    fullName: 'Jennifer Lopez',
    jobTitle: 'Managing Director',
    email: 'jennifer@cornerstoneinv.com',
    phone: '(555) 456-7890',
    teamSize: '5-20',
    multipleOffices: false,
    status: 'PROPOSAL',
    priority: 'MEDIUM',
    notes: [
      {
        id: 'note1',
        content: 'Proposal sent for team of 15 agents',
        createdAt: '2023-09-25T16:45:00Z',
        createdBy: 'system',
        type: 'EMAIL'
      },
      {
        id: 'note2',
        content: 'Client requested additional information on coaching curriculum',
        createdAt: '2023-09-28T10:20:00Z',
        createdBy: 'system',
        type: 'EMAIL'
      }
    ],
    lastContactedAt: '2023-09-28T10:20:00Z',
    nextFollowUpDate: '2023-11-02T11:00:00Z',
    createdAt: '2023-09-20T13:30:00Z',
    updatedAt: '2023-09-28T10:20:00Z'
  },
  
  // Lead 5: Negotiation stage high priority
  {
    ulid: ulid(),
    companyName: 'Premier Title & Escrow',
    website: 'https://premiertitle.com',
    industry: 'TITLE_ESCROW',
    fullName: 'Robert Smith',
    jobTitle: 'President',
    email: 'robert@premiertitle.com',
    phone: '(555) 567-8901',
    teamSize: '20-50',
    multipleOffices: true,
    status: 'NEGOTIATION',
    priority: 'HIGH',
    notes: [
      {
        id: 'note1',
        content: 'Negotiating contract terms, client wants custom training modules',
        createdAt: '2023-09-15T13:00:00Z',
        createdBy: 'system',
        type: 'MEETING'
      },
      {
        id: 'note2',
        content: 'Revised proposal sent with custom training options',
        createdAt: '2023-09-18T15:30:00Z',
        createdBy: 'system',
        type: 'EMAIL'
      }
    ],
    lastContactedAt: '2023-09-18T15:30:00Z',
    nextFollowUpDate: '2023-10-30T14:00:00Z',
    createdAt: '2023-09-10T09:45:00Z',
    updatedAt: '2023-09-18T15:30:00Z'
  },
  
  // Lead 6: Won deal
  {
    ulid: ulid(),
    companyName: 'Guardian Insurance Group',
    website: 'https://guardianins.com',
    industry: 'INSURANCE',
    fullName: 'Amanda Taylor',
    jobTitle: 'COO',
    email: 'amanda@guardianins.com',
    phone: '(555) 678-9012',
    teamSize: '50-100',
    multipleOffices: true,
    status: 'WON',
    priority: 'MEDIUM',
    notes: [
      {
        id: 'note1',
        content: 'Contract signed for 12-month coaching program',
        createdAt: '2023-09-05T11:15:00Z',
        createdBy: 'system',
        type: 'NOTE'
      },
      {
        id: 'note2',
        content: 'Kickoff meeting scheduled for next week',
        createdAt: '2023-09-08T14:20:00Z',
        createdBy: 'system',
        type: 'MEETING'
      }
    ],
    lastContactedAt: '2023-09-08T14:20:00Z',
    createdAt: '2023-08-15T10:30:00Z',
    updatedAt: '2023-09-08T14:20:00Z'
  },
  
  // Lead 7: Lost deal
  {
    ulid: ulid(),
    companyName: 'Metropolitan Commercial',
    website: 'https://metrocommercial.com',
    industry: 'COMMERCIAL',
    fullName: 'Thomas Wilson',
    jobTitle: 'Director of Training',
    email: 'thomas@metrocommercial.com',
    phone: '(555) 789-0123',
    teamSize: '100+',
    multipleOffices: true,
    status: 'LOST',
    priority: 'LOW',
    notes: [
      {
        id: 'note1',
        content: 'Client decided to go with internal training program',
        createdAt: '2023-08-28T09:45:00Z',
        createdBy: 'system',
        type: 'CALL'
      },
      {
        id: 'note2',
        content: 'Send follow-up in 6 months to check on results',
        createdAt: '2023-08-28T10:00:00Z',
        createdBy: 'system',
        type: 'NOTE'
      }
    ],
    lastContactedAt: '2023-08-28T09:45:00Z',
    nextFollowUpDate: '2024-02-28T10:00:00Z',
    createdAt: '2023-08-10T13:15:00Z',
    updatedAt: '2023-08-28T10:00:00Z'
  },
  
  // Lead 8: Archived lead
  {
    ulid: ulid(),
    companyName: 'Legacy Lending Partners',
    website: 'https://legacylending.com',
    industry: 'PRIVATE_CREDIT',
    fullName: 'Richard Brown',
    jobTitle: 'Managing Partner',
    email: 'richard@legacylending.com',
    phone: '(555) 890-1234',
    teamSize: '5-20',
    multipleOffices: false,
    status: 'ARCHIVED',
    priority: 'LOW',
    notes: [
      {
        id: 'note1',
        content: 'Company acquired by larger firm, no longer a fit',
        createdAt: '2023-07-20T11:30:00Z',
        createdBy: 'system',
        type: 'NOTE'
      }
    ],
    lastContactedAt: '2023-07-20T11:30:00Z',
    createdAt: '2023-07-01T09:00:00Z',
    updatedAt: '2023-07-20T11:30:00Z'
  }
];

async function seedLeads() {
  try {
    console.log('Clearing existing leads...');
    const { error: deleteError } = await supabase
      .from('EnterpriseLeads')
      .delete()
      .neq('ulid', 'preserve-real-data'); // This condition ensures all rows are deleted

    if (deleteError) {
      throw deleteError;
    }

    console.log('Inserting mock leads...');
    const { error: insertError } = await supabase
      .from('EnterpriseLeads')
      .insert(mockLeads);

    if (insertError) {
      throw insertError;
    }

    console.log('✅ Successfully seeded EnterpriseLeads table with mock data!');
    console.log(`Added ${mockLeads.length} mock leads.`);
  } catch (error) {
    console.error('Error seeding leads:', error);
    process.exit(1);
  }
}

seedLeads(); 