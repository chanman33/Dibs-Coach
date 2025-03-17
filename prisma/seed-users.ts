import { createClient } from '@supabase/supabase-js'
import { ulid } from 'ulid'
import dotenv from 'dotenv'

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

// Mock data for users - all regular users, no coaches
const mockUsers = [
  // Regular users for organizations
  {
    firstName: 'John',
    lastName: 'Smith',
    displayName: 'John Smith',
    email: 'john.smith@example.com',
    systemRole: 'USER',
    status: 'ACTIVE',
    profileImageUrl: 'https://ui-avatars.com/api/?name=John+Smith&background=4CAF50&color=fff',
    capabilities: ['MENTEE'],
    isMentee: true,
    isCoach: false,
    bio: 'Real estate professional with experience in residential property sales.',
    primaryDomain: 'REALTOR',
    realEstateDomains: ['REALTOR', 'PROPERTY_MANAGER']
  },
  {
    firstName: 'Emma',
    lastName: 'Johnson',
    displayName: 'Emma Johnson',
    email: 'emma.johnson@example.com',
    systemRole: 'USER',
    status: 'ACTIVE',
    profileImageUrl: 'https://ui-avatars.com/api/?name=Emma+Johnson&background=9C27B0&color=fff',
    capabilities: ['MENTEE'],
    isMentee: true,
    isCoach: false,
    bio: 'Investment specialist focusing on residential properties.',
    primaryDomain: 'INVESTOR',
    realEstateDomains: ['INVESTOR', 'REALTOR']
  },
  {
    firstName: 'James',
    lastName: 'Wilson',
    displayName: 'James Wilson',
    email: 'james.wilson@example.com',
    systemRole: 'USER',
    status: 'ACTIVE',
    profileImageUrl: 'https://ui-avatars.com/api/?name=James+Wilson&background=FF9800&color=fff',
    capabilities: ['MENTEE'],
    isMentee: true,
    isCoach: false,
    bio: 'New to real estate, looking to build knowledge in residential property sales.',
    primaryDomain: 'REALTOR',
    realEstateDomains: ['REALTOR']
  },
  {
    firstName: 'Emily',
    lastName: 'Davis',
    displayName: 'Emily Davis',
    email: 'emily.davis@example.com',
    systemRole: 'USER',
    status: 'ACTIVE',
    profileImageUrl: 'https://ui-avatars.com/api/?name=Emily+Davis&background=3F51B5&color=fff',
    capabilities: ['MENTEE'],
    isMentee: true,
    isCoach: false,
    bio: 'Recently licensed realtor seeking guidance in building my client base.',
    primaryDomain: 'REALTOR',
    realEstateDomains: ['REALTOR']
  },
  {
    firstName: 'Alex',
    lastName: 'Brown',
    displayName: 'Alex Brown',
    email: 'alex.brown@example.com',
    systemRole: 'USER',
    status: 'ACTIVE',
    profileImageUrl: 'https://ui-avatars.com/api/?name=Alex+Brown&background=009688&color=fff',
    capabilities: ['MENTEE'],
    isMentee: true,
    isCoach: false,
    bio: 'Property management professional interested in expanding knowledge.',
    primaryDomain: 'PROPERTY_MANAGER',
    realEstateDomains: ['PROPERTY_MANAGER', 'REALTOR']
  },
  {
    firstName: 'Jennifer',
    lastName: 'Taylor',
    displayName: 'Jennifer Taylor',
    email: 'jennifer.taylor@example.com',
    systemRole: 'USER',
    status: 'ACTIVE',
    profileImageUrl: 'https://ui-avatars.com/api/?name=Jennifer+Taylor&background=E91E63&color=fff',
    capabilities: ['MENTEE'],
    isMentee: true,
    isCoach: false,
    bio: 'Marketing specialist seeking to expand knowledge in real estate.',
    primaryDomain: 'REALTOR',
    realEstateDomains: ['REALTOR']
  },
  {
    firstName: 'Robert',
    lastName: 'Miller',
    displayName: 'Robert Miller',
    email: 'robert.miller@example.com',
    systemRole: 'USER',
    status: 'ACTIVE',
    profileImageUrl: 'https://ui-avatars.com/api/?name=Robert+Miller&background=673AB7&color=fff',
    capabilities: ['MENTEE'],
    isMentee: true,
    isCoach: false,
    bio: 'Commercial real estate professional looking to network with others.',
    primaryDomain: 'COMMERCIAL',
    realEstateDomains: ['COMMERCIAL', 'INVESTOR']
  },
  {
    firstName: 'Lisa',
    lastName: 'Anderson',
    displayName: 'Lisa Anderson',
    email: 'lisa.anderson@example.com',
    systemRole: 'USER',
    status: 'ACTIVE',
    profileImageUrl: 'https://ui-avatars.com/api/?name=Lisa+Anderson&background=FF5722&color=fff',
    capabilities: ['MENTEE'],
    isMentee: true,
    isCoach: false,
    bio: 'New investor looking to learn more about real estate opportunities.',
    primaryDomain: 'INVESTOR',
    realEstateDomains: ['INVESTOR']
  },
  {
    firstName: 'Thomas',
    lastName: 'Martin',
    displayName: 'Thomas Martin',
    email: 'thomas.martin@example.com',
    systemRole: 'USER',
    status: 'ACTIVE',
    profileImageUrl: 'https://ui-avatars.com/api/?name=Thomas+Martin&background=2196F3&color=fff',
    capabilities: ['MENTEE'],
    isMentee: true,
    isCoach: false,
    bio: 'Mortgage specialist with expertise in residential financing.',
    primaryDomain: 'MORTGAGE',
    realEstateDomains: ['MORTGAGE']
  },
  {
    firstName: 'Patricia',
    lastName: 'Garcia',
    displayName: 'Patricia Garcia',
    email: 'patricia.garcia@example.com',
    systemRole: 'USER',
    status: 'ACTIVE',
    profileImageUrl: 'https://ui-avatars.com/api/?name=Patricia+Garcia&background=FFC107&color=fff',
    capabilities: ['MENTEE'],
    isMentee: true,
    isCoach: false,
    bio: 'Title and escrow expert with experience in residential transactions.',
    primaryDomain: 'TITLE_ESCROW',
    realEstateDomains: ['TITLE_ESCROW']
  }
]

async function seedUsers() {
  console.log('Starting user seeding process...')
  
  try {
    // Check if users already exist
    const { data: existingUsers, error: checkError } = await supabase
      .from('User')
      .select('email')
    
    if (checkError) {
      console.error('Error checking existing users:', checkError)
      return
    }
    
    const existingEmails = new Set(existingUsers?.map(user => user.email.toLowerCase()) || [])
    
    // For each mock user
    for (const user of mockUsers) {
      if (existingEmails.has(user.email.toLowerCase())) {
        console.log(`User with email ${user.email} already exists, skipping...`)
        continue
      }
      
      console.log(`Creating user: ${user.firstName} ${user.lastName} (${user.email})`)
      
      // Generate a ULID for the user
      const userUlid = ulid()
      const userId = `user_${Math.random().toString(36).substring(2, 15)}`
      const currentTime = new Date().toISOString()
      
      // Create the user
      const { error: userError } = await supabase
        .from('User')
        .insert({
          ulid: userUlid,
          userId: userId,
          firstName: user.firstName,
          lastName: user.lastName,
          displayName: user.displayName,
          email: user.email,
          systemRole: user.systemRole,
          status: user.status,
          profileImageUrl: user.profileImageUrl,
          capabilities: user.capabilities,
          isMentee: user.isMentee,
          isCoach: user.isCoach,
          bio: user.bio,
          primaryDomain: user.primaryDomain,
          realEstateDomains: user.realEstateDomains,
          createdAt: currentTime,
          updatedAt: currentTime
        })
      
      if (userError) {
        console.error(`Error creating user ${user.email}:`, userError)
        continue
      }
      
      console.log(`Created user: ${user.firstName} ${user.lastName} (${userUlid})`)
    }
    
    console.log('User seeding completed successfully!')
  } catch (error) {
    console.error('Error during user seeding:', error)
  }
}

// Run the seed function
seedUsers()
  .then(() => {
    console.log('Seed script execution completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Seed script execution failed:', error)
    process.exit(1)
  }) 