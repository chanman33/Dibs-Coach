import { createClient } from '@supabase/supabase-js'
import { ulid } from 'ulid'
import dotenv from 'dotenv'
import { OrgType, OrgIndustry, OrgTier, OrgStatus, OrgLevel } from '../utils/types/organization'
import { REAL_ESTATE_DOMAINS } from '../utils/types/coach'

dotenv.config()

// Initialize Supabase client
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
let supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

// Handle the case where NEXT_PUBLIC_SUPABASE_URL references SUPABASE_URL
if (supabaseUrl && supabaseUrl.includes('${SUPABASE_URL}')) {
  supabaseUrl = process.env.SUPABASE_URL
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env file')
  process.exit(1)
}

console.log(`Using Supabase URL: ${supabaseUrl}`)

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// List of seed user emails that we will use for associations
// These should match the emails in seed-users.ts
const SEED_USER_EMAILS = [
  'john.smith@example.com',
  'emma.johnson@example.com',
  'james.wilson@example.com',
  'emily.davis@example.com',
  'alex.brown@example.com',
  'jennifer.taylor@example.com',
  'robert.miller@example.com',
  'lisa.anderson@example.com',
  'thomas.martin@example.com',
  'patricia.garcia@example.com'
];

// Interface for mock organization data
interface MockOrganization {
  name: string;
  description: string;
  type: string;
  industry: string;
  status: string;
  tier: string;
  level: string;
  metadata: {
    contactInfo: {
      email: string;
      phone: string;
      website: string;
    };
    employeeCount: number;
    yearEstablished: number;
    serviceAreas: string[];
  };
  primaryDomain: string;
  domains: string[];
  specializations: string[];
}

// Mapping between OrgIndustry and RealEstateDomain
const INDUSTRY_TO_DOMAIN_MAP = {
  [OrgIndustry.REAL_ESTATE_SALES]: REAL_ESTATE_DOMAINS.REALTOR,
  [OrgIndustry.MORTGAGE_LENDING]: REAL_ESTATE_DOMAINS.MORTGAGE,
  [OrgIndustry.PROPERTY_MANAGEMENT]: REAL_ESTATE_DOMAINS.PROPERTY_MANAGER,
  [OrgIndustry.REAL_ESTATE_INVESTMENT]: REAL_ESTATE_DOMAINS.INVESTOR,
  [OrgIndustry.TITLE_ESCROW]: REAL_ESTATE_DOMAINS.TITLE_ESCROW,
  [OrgIndustry.INSURANCE]: REAL_ESTATE_DOMAINS.INSURANCE,
  [OrgIndustry.COMMERCIAL]: REAL_ESTATE_DOMAINS.COMMERCIAL,
  [OrgIndustry.PRIVATE_CREDIT]: REAL_ESTATE_DOMAINS.PRIVATE_CREDIT,
  [OrgIndustry.OTHER]: null
} as const;

// Mock data for organizations
const mockOrganizations: MockOrganization[] = [
  {
    name: "Acme Real Estate",
    description: "A leading residential real estate agency focusing on luxury properties in urban areas.",
    type: OrgType.BUSINESS,
    industry: OrgIndustry.REAL_ESTATE_SALES,
    status: OrgStatus.ACTIVE,
    tier: OrgTier.PROFESSIONAL,
    level: OrgLevel.LOCAL,
    metadata: {
      contactInfo: {
        email: "contact@acmerealestate.com",
        phone: "+1 (555) 123-4567",
        website: "https://www.acmerealestate.com"
      },
      employeeCount: 35,
      yearEstablished: 2010,
      serviceAreas: ["San Francisco", "Oakland", "Berkeley"]
    },
    primaryDomain: REAL_ESTATE_DOMAINS.REALTOR,
    domains: [REAL_ESTATE_DOMAINS.REALTOR, REAL_ESTATE_DOMAINS.INVESTOR],
    specializations: ["Luxury Homes", "Urban Properties", "Condominiums"]
  },
  {
    name: "Skyline Properties",
    description: "A property management firm specializing in commercial real estate and multi-family residential units.",
    type: OrgType.ENTERPRISE,
    industry: OrgIndustry.PROPERTY_MANAGEMENT,
    status: OrgStatus.ACTIVE,
    tier: OrgTier.ENTERPRISE,
    level: OrgLevel.REGIONAL,
    metadata: {
      contactInfo: {
        email: "info@skylineproperties.com",
        phone: "+1 (555) 987-6543",
        website: "https://www.skylineproperties.com"
      },
      employeeCount: 120,
      yearEstablished: 2005,
      serviceAreas: ["Los Angeles", "San Diego", "Orange County"]
    },
    primaryDomain: REAL_ESTATE_DOMAINS.PROPERTY_MANAGER,
    domains: [REAL_ESTATE_DOMAINS.PROPERTY_MANAGER, REAL_ESTATE_DOMAINS.REALTOR],
    specializations: ["Commercial Properties", "Multi-Family Units", "Asset Management"]
  },
  {
    name: "Green Home Builders",
    description: "An eco-friendly residential construction company focused on sustainable building practices.",
    type: OrgType.BUSINESS,
    industry: OrgIndustry.REAL_ESTATE_INVESTMENT,
    status: OrgStatus.PENDING,
    tier: OrgTier.PROFESSIONAL,
    level: OrgLevel.LOCAL,
    metadata: {
      contactInfo: {
        email: "build@greenhomebuilders.com",
        phone: "+1 (555) 456-7890",
        website: "https://www.greenhomebuilders.com"
      },
      employeeCount: 45,
      yearEstablished: 2018,
      serviceAreas: ["Portland", "Seattle", "Vancouver"]
    },
    primaryDomain: REAL_ESTATE_DOMAINS.INVESTOR,
    domains: [REAL_ESTATE_DOMAINS.INVESTOR],
    specializations: ["Eco-Friendly Homes", "Sustainable Construction", "Energy Efficiency"]
  },
  {
    name: "City Living Apartments",
    description: "A property management company specializing in urban apartment complexes and rental units.",
    type: OrgType.BUSINESS,
    industry: OrgIndustry.PROPERTY_MANAGEMENT,
    status: OrgStatus.ACTIVE,
    tier: OrgTier.STARTER,
    level: OrgLevel.LOCAL,
    metadata: {
      contactInfo: {
        email: "rentals@citylivingapts.com",
        phone: "+1 (555) 234-5678",
        website: "https://www.citylivingapts.com"
      },
      employeeCount: 18,
      yearEstablished: 2020,
      serviceAreas: ["Chicago", "Milwaukee"]
    },
    primaryDomain: REAL_ESTATE_DOMAINS.PROPERTY_MANAGER,
    domains: [REAL_ESTATE_DOMAINS.PROPERTY_MANAGER],
    specializations: ["Urban Apartments", "Rental Management", "Student Housing"]
  },
  {
    name: "Coastal Realty Group",
    description: "A real estate brokerage focusing on coastal and waterfront properties.",
    type: OrgType.BUSINESS,
    industry: OrgIndustry.REAL_ESTATE_SALES,
    status: OrgStatus.SUSPENDED,
    tier: OrgTier.PROFESSIONAL,
    level: OrgLevel.REGIONAL,
    metadata: {
      contactInfo: {
        email: "info@coastalrealtygroup.com",
        phone: "+1 (555) 876-5432",
        website: "https://www.coastalrealtygroup.com"
      },
      employeeCount: 67,
      yearEstablished: 2008,
      serviceAreas: ["Miami", "Tampa", "Jacksonville"]
    },
    primaryDomain: REAL_ESTATE_DOMAINS.REALTOR,
    domains: [REAL_ESTATE_DOMAINS.REALTOR, REAL_ESTATE_DOMAINS.INVESTOR],
    specializations: ["Waterfront Properties", "Vacation Homes", "Luxury Real Estate"]
  },
  {
    name: "Capital Mortgage Solutions",
    description: "A mortgage lending company providing residential and commercial financing options.",
    type: OrgType.ENTERPRISE,
    industry: OrgIndustry.MORTGAGE_LENDING,
    status: OrgStatus.ACTIVE,
    tier: OrgTier.ENTERPRISE,
    level: OrgLevel.GLOBAL,
    metadata: {
      contactInfo: {
        email: "loans@capitalmortgage.com",
        phone: "+1 (555) 345-6789",
        website: "https://www.capitalmortgage.com"
      },
      employeeCount: 215,
      yearEstablished: 2000,
      serviceAreas: ["National Coverage"]
    },
    primaryDomain: REAL_ESTATE_DOMAINS.MORTGAGE,
    domains: [REAL_ESTATE_DOMAINS.MORTGAGE],
    specializations: ["Residential Mortgages", "Commercial Loans", "Refinancing"]
  },
  {
    name: "Reliable Title & Escrow",
    description: "A full-service title and escrow company serving residential and commercial real estate transactions.",
    type: OrgType.BUSINESS,
    industry: OrgIndustry.TITLE_ESCROW,
    status: OrgStatus.ACTIVE,
    tier: OrgTier.PROFESSIONAL,
    level: OrgLevel.REGIONAL,
    metadata: {
      contactInfo: {
        email: "service@reliabletitle.com",
        phone: "+1 (555) 567-8901",
        website: "https://www.reliabletitle.com"
      },
      employeeCount: 42,
      yearEstablished: 2012,
      serviceAreas: ["Phoenix", "Tucson", "Flagstaff"]
    },
    primaryDomain: REAL_ESTATE_DOMAINS.TITLE_ESCROW,
    domains: [REAL_ESTATE_DOMAINS.TITLE_ESCROW],
    specializations: ["Residential Closings", "Commercial Closings", "Title Insurance"]
  },
  {
    name: "HomeShield Insurance",
    description: "A property insurance provider specializing in homeowners and landlord insurance products.",
    type: OrgType.BUSINESS,
    industry: OrgIndustry.INSURANCE,
    status: OrgStatus.ACTIVE,
    tier: OrgTier.PROFESSIONAL,
    level: OrgLevel.REGIONAL,
    metadata: {
      contactInfo: {
        email: "policies@homeshield.com",
        phone: "+1 (555) 678-9012",
        website: "https://www.homeshield.com"
      },
      employeeCount: 51,
      yearEstablished: 2015,
      serviceAreas: ["Texas", "Oklahoma", "Louisiana"]
    },
    primaryDomain: REAL_ESTATE_DOMAINS.INSURANCE,
    domains: [REAL_ESTATE_DOMAINS.INSURANCE],
    specializations: ["Homeowners Insurance", "Landlord Insurance", "Flood Insurance"]
  },
  {
    name: "Metro Commercial Partners",
    description: "A commercial real estate brokerage focusing on retail, office, and industrial properties.",
    type: OrgType.BUSINESS,
    industry: OrgIndustry.COMMERCIAL,
    status: OrgStatus.ACTIVE,
    tier: OrgTier.ENTERPRISE,
    level: OrgLevel.REGIONAL,
    metadata: {
      contactInfo: {
        email: "info@metrocommercial.com",
        phone: "+1 (555) 789-0123",
        website: "https://www.metrocommercial.com"
      },
      employeeCount: 78,
      yearEstablished: 2007,
      serviceAreas: ["New York", "New Jersey", "Connecticut"]
    },
    primaryDomain: REAL_ESTATE_DOMAINS.COMMERCIAL,
    domains: [REAL_ESTATE_DOMAINS.COMMERCIAL, REAL_ESTATE_DOMAINS.INVESTOR],
    specializations: ["Retail Leasing", "Office Space", "Industrial Properties"]
  },
  {
    name: "Horizon Investment Fund",
    description: "A real estate investment fund focusing on multi-family and mixed-use development projects.",
    type: OrgType.BUSINESS,
    industry: OrgIndustry.PRIVATE_CREDIT,
    status: OrgStatus.ACTIVE,
    tier: OrgTier.ENTERPRISE,
    level: OrgLevel.REGIONAL,
    metadata: {
      contactInfo: {
        email: "investments@horizonfund.com",
        phone: "+1 (555) 890-1234",
        website: "https://www.horizonfund.com"
      },
      employeeCount: 23,
      yearEstablished: 2016,
      serviceAreas: ["Denver", "Boulder", "Colorado Springs"]
    },
    primaryDomain: REAL_ESTATE_DOMAINS.INVESTOR,
    domains: [REAL_ESTATE_DOMAINS.INVESTOR, REAL_ESTATE_DOMAINS.PRIVATE_CREDIT],
    specializations: ["Multi-Family Investments", "Development Projects", "Value-Add Properties"]
  }
]

async function seedOrganizations() {
  console.log('Starting organization seeding process...')
  
  try {
    // Find users from our seed list
    const { data: seedUsers, error: userError } = await supabase
      .from('User')
      .select('ulid, email, displayName')
      .in('email', SEED_USER_EMAILS)
    
    if (userError || !seedUsers || seedUsers.length === 0) {
      console.error('No seed users found in the system. Cannot add organization owners.')
      console.error('Please create seed users first using yarn seed-users before running this script.')
      process.exit(1)
    }
    
    console.log(`Found ${seedUsers.length} seed users to use for organizations`)
    
    // For each mock organization
    for (const org of mockOrganizations) {
      console.log(`Processing organization: ${org.name}`)
      
      // Generate a ULID for the organization
      const organizationUlid = ulid()
      const currentTime = new Date().toISOString()
      
      // Ensure consistency between industry and domain
      const primaryDomain = org.primaryDomain || 
        (org.industry && INDUSTRY_TO_DOMAIN_MAP[org.industry as keyof typeof INDUSTRY_TO_DOMAIN_MAP]) || 
        null;
      const domains = org.domains || (primaryDomain ? [primaryDomain] : []);
      
      // Create the organization
      const { error: orgError } = await supabase
        .from('Organization')
        .insert({
          ulid: organizationUlid,
          name: org.name,
          description: org.description,
          type: org.type,
          industry: org.industry,
          status: org.status,
          tier: org.tier,
          level: org.level,
          metadata: org.metadata,
          primaryDomain: primaryDomain,
          domains: domains,
          specializations: org.specializations,
          createdAt: currentTime,
          updatedAt: currentTime
        })
      
      if (orgError) {
        console.error(`Error creating organization ${org.name}:`, orgError)
        continue
      }
      
      console.log(`Created organization: ${org.name} (${organizationUlid})`)
      
      // Select a random user as owner from our seed users
      const selectedOwner = seedUsers[Math.floor(Math.random() * seedUsers.length)]
      
      // Add the selected user as an organization owner
      const { error: memberError } = await supabase
        .from('OrganizationMember')
        .insert({
          ulid: ulid(),
          organizationUlid: organizationUlid,
          userUlid: selectedOwner.ulid,
          role: 'OWNER',
          status: 'ACTIVE',
          createdAt: currentTime,
          updatedAt: currentTime
        })
      
      if (memberError) {
        console.error(`Error adding owner ${selectedOwner.email} to organization ${org.name}:`, memberError)
      } else {
        console.log(`Added owner ${selectedOwner.displayName} (${selectedOwner.email}) to organization ${org.name}`)
      }
      
      // Add 2-3 random members to each organization, selecting only from our seed users
      const memberCount = Math.floor(Math.random() * 2) + 2 // 2 to 3 members
      const availableMembers = seedUsers.filter(user => user.ulid !== selectedOwner.ulid)
      const shuffledMembers = availableMembers.sort(() => 0.5 - Math.random())
      const selectedMembers = shuffledMembers.slice(0, memberCount)
      
      const memberRoles = ['DIRECTOR', 'MANAGER', 'MEMBER', 'GUEST']
      
      for (const user of selectedMembers) {
        // Assign a random role
        const role = memberRoles[Math.floor(Math.random() * memberRoles.length)]
        
        const { error: addMemberError } = await supabase
          .from('OrganizationMember')
          .insert({
            ulid: ulid(),
            organizationUlid: organizationUlid,
            userUlid: user.ulid,
            role: role,
            status: 'ACTIVE',
            createdAt: currentTime,
            updatedAt: currentTime
          })
        
        if (addMemberError) {
          console.error(`Error adding member to organization ${org.name}:`, addMemberError)
        } else {
          console.log(`Added ${user.displayName} as ${role} to organization: ${org.name}`)
        }
      }
      
      console.log(`Added ${selectedMembers.length} members to organization: ${org.name}`)
    }
    
    console.log('Organization seeding completed successfully!')
  } catch (error) {
    console.error('Error during organization seeding:', error)
  }
}

// Run the seed function
seedOrganizations()
  .then(() => {
    console.log('Seed script execution completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Seed script execution failed:', error)
    process.exit(1)
  }) 