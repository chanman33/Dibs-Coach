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

// Mock data for coaches
const mockCoaches = [
  {
    firstName: 'Sarah',
    lastName: 'Johnson',
    displayName: 'Sarah J.',
    email: 'sarah.johnson@example.com',
    bio: 'With over 10 years of experience in real estate, I specialize in helping agents scale their business through effective lead generation and client relationship management. My coaching approach focuses on practical strategies that can be implemented immediately.',
    profileImageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    skills: ['Lead Generation Strategy', 'Client Acquisition & Retention', 'Listing Presentation Mastery'],
    realEstateDomains: ['REALTOR', 'INVESTOR'],
    primaryDomain: 'REALTOR',
    coachRealEstateDomains: ['REALTOR', 'INVESTOR'],
    coachPrimaryDomain: 'REALTOR',
    slogan: 'Helping agents build sustainable businesses through effective lead generation',
    totalYearsRE: 10,
    languages: ['en'],
    hourlyRate: 150,
    yearsCoaching: 5,
    totalSessions: 120,
    averageRating: 4.8
  },
  {
    firstName: 'Michael',
    lastName: 'Chen',
    displayName: 'Mike Chen',
    email: 'michael.chen@example.com',
    bio: 'I help real estate professionals build sustainable businesses through effective systems and processes. My background in both technology and real estate gives me a unique perspective on how to leverage digital tools for maximum efficiency.',
    profileImageUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    skills: ['Process Automation & Systems', 'Digital Tools & Innovation', 'Team Leadership & Management'],
    realEstateDomains: ['REALTOR', 'PROPERTY_MANAGER'],
    primaryDomain: 'REALTOR',
    coachRealEstateDomains: ['REALTOR', 'PROPERTY_MANAGER'],
    coachPrimaryDomain: 'REALTOR',
    slogan: 'Building efficient real estate businesses through systems and technology',
    totalYearsRE: 12,
    languages: ['en', 'zh'],
    hourlyRate: 175,
    yearsCoaching: 7,
    totalSessions: 210,
    averageRating: 4.9
  },
  {
    firstName: 'Jessica',
    lastName: 'Martinez',
    displayName: 'Jess Martinez',
    email: 'jessica.martinez@example.com',
    bio: 'As a former top-producing agent, I now dedicate my time to helping new agents establish themselves in competitive markets. I believe in a holistic approach to real estate success that balances business growth with personal wellbeing.',
    profileImageUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    skills: ['First-Time Buyer Guidance', 'Personal Brand Development', 'Social Media Influence'],
    realEstateDomains: ['REALTOR'],
    primaryDomain: 'REALTOR',
    coachRealEstateDomains: ['REALTOR'],
    coachPrimaryDomain: 'REALTOR',
    slogan: 'Helping new agents establish themselves in competitive markets',
    totalYearsRE: 8,
    languages: ['en', 'es'],
    hourlyRate: 125,
    yearsCoaching: 3,
    totalSessions: 85,
    averageRating: 4.7
  }
]

async function seedCoaches() {
  console.log('Starting coach seeding process...')
  
  try {
    // For each mock coach
    for (const coach of mockCoaches) {
      console.log(`Processing coach: ${coach.firstName} ${coach.lastName}`)
      
      // Check if user already exists
      const { data: existingUsers, error: findError } = await supabase
        .from('User')
        .select('ulid, isCoach, capabilities')
        .eq('email', coach.email)
        .limit(1)
      
      if (findError) {
        console.error(`Error finding user for ${coach.email}:`, findError)
        continue
      }
      
      let userUlid: string
      
      // If user exists, update it
      if (existingUsers && existingUsers.length > 0) {
        userUlid = existingUsers[0].ulid
        console.log(`User ${coach.email} already exists (${userUlid}), updating...`)
        
        // Update user to have coach capabilities if they don't already
        if (!existingUsers[0].isCoach) {
          const { error: updateError } = await supabase
            .from('User')
            .update({
              firstName: coach.firstName,
              lastName: coach.lastName,
              displayName: coach.displayName,
              profileImageUrl: coach.profileImageUrl,
              bio: coach.bio,
              isCoach: true,
              capabilities: [...(existingUsers[0].capabilities || []), 'COACH'],
              realEstateDomains: coach.realEstateDomains,
              primaryDomain: coach.primaryDomain,
              totalYearsRE: coach.totalYearsRE,
              languages: coach.languages,
              updatedAt: new Date().toISOString()
            })
            .eq('ulid', userUlid)
          
          if (updateError) {
            console.error(`Error updating user ${coach.email}:`, updateError)
            continue
          }
          
          console.log(`Updated user ${coach.email} with coach capabilities`)
        } else {
          console.log(`User ${coach.email} already has coach capabilities`)
        }
      } else {
        // Create a new user
        userUlid = ulid()
        const userId = `user_${Math.random().toString(36).substring(2, 15)}`
        
        const { error: userError } = await supabase
          .from('User')
          .insert({
            ulid: userUlid,
            userId: userId,
            firstName: coach.firstName,
            lastName: coach.lastName,
            displayName: coach.displayName,
            email: coach.email,
            profileImageUrl: coach.profileImageUrl,
            bio: coach.bio,
            status: 'ACTIVE',
            isCoach: true,
            capabilities: ['COACH'],
            realEstateDomains: coach.realEstateDomains,
            primaryDomain: coach.primaryDomain,
            totalYearsRE: coach.totalYearsRE,
            languages: coach.languages,
            updatedAt: new Date().toISOString()
          })
        
        if (userError) {
          console.error(`Error creating user for ${coach.firstName} ${coach.lastName}:`, userError)
          continue
        }
        
        console.log(`Created new user: ${coach.firstName} ${coach.lastName} (${userUlid})`)
      }
      
      // Check if coach profile already exists for this user
      const { data: existingProfiles, error: findProfileError } = await supabase
        .from('CoachProfile')
        .select('ulid')
        .eq('userUlid', userUlid)
        .limit(1)
      
      if (findProfileError) {
        console.error(`Error finding coach profile for user ${userUlid}:`, findProfileError)
        continue
      }
      
      // If coach profile exists, update it
      if (existingProfiles && existingProfiles.length > 0) {
        const coachProfileUlid = existingProfiles[0].ulid
        console.log(`Coach profile for ${coach.email} already exists (${coachProfileUlid}), updating...`)
        
        const { error: updateProfileError } = await supabase
          .from('CoachProfile')
          .update({
            coachSkills: coach.skills,
            hourlyRate: coach.hourlyRate,
            yearsCoaching: coach.yearsCoaching,
            totalSessions: coach.totalSessions,
            averageRating: coach.averageRating,
            coachRealEstateDomains: coach.coachRealEstateDomains,
            coachPrimaryDomain: coach.coachPrimaryDomain,
            slogan: coach.slogan,
            defaultDuration: 60,
            minimumDuration: 30,
            maximumDuration: 90,
            allowCustomDuration: false,
            isActive: true,
            profileStatus: 'PUBLISHED',
            completionPercentage: 100,
            updatedAt: new Date().toISOString()
          })
          .eq('ulid', coachProfileUlid)
        
        if (updateProfileError) {
          console.error(`Error updating coach profile for ${coach.email}:`, updateProfileError)
          continue
        }
        
        console.log(`Updated coach profile for ${coach.email}`)
      } else {
        // Create a new coach profile
        const coachProfileUlid = ulid()
        
        const { error: coachError } = await supabase
          .from('CoachProfile')
          .insert({
            ulid: coachProfileUlid,
            userUlid: userUlid,
            coachSkills: coach.skills,
            hourlyRate: coach.hourlyRate,
            yearsCoaching: coach.yearsCoaching,
            totalSessions: coach.totalSessions,
            averageRating: coach.averageRating,
            coachRealEstateDomains: coach.coachRealEstateDomains,
            coachPrimaryDomain: coach.coachPrimaryDomain,
            slogan: coach.slogan,
            defaultDuration: 60,
            minimumDuration: 30,
            maximumDuration: 90,
            allowCustomDuration: false,
            isActive: true,
            profileStatus: 'PUBLISHED',
            completionPercentage: 100,
            updatedAt: new Date().toISOString()
          })
        
        if (coachError) {
          console.error(`Error creating coach profile for ${coach.firstName} ${coach.lastName}:`, coachError)
          continue
        }
        
        console.log(`Created new coach profile: ${coach.firstName} ${coach.lastName} (${coachProfileUlid})`)
      }
    }
    
    console.log('Coach seeding completed successfully!')
  } catch (error) {
    console.error('Error during coach seeding:', error)
  }
}

// Run the seed function
seedCoaches()
  .then(() => {
    console.log('Seed script execution completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Seed script execution failed:', error)
    process.exit(1)
  }) 