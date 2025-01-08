import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const mockCoaches = [
  {
    userId: 'user_2r0JFaVbINR4TBRNFzcwIsyEXV1',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson.test@example.com',
    role: 'realtor_coach',
    profileImageUrl: 'https://img.clerk.com/placeholder.png',
    realtorProfile: {
      companyName: 'Luxury Homes Inc.',
      licenseNumber: 'RLT123456',
      phoneNumber: '555-0101'
    },
    coachProfile: {
      specialty: 'Luxury Real Estate',
      bio: 'Experienced luxury real estate coach with 15+ years in the industry.',
      experience: '15+ years in luxury real estate sales and team management',
      certifications: ['CRS', 'ABR', 'CLHMS'],
      availability: 'Monday-Friday, 9AM-5PM EST',
      sessionLength: '60 minutes',
      specialties: JSON.stringify(['Luxury Properties', 'Team Building', 'Marketing Strategy']),
      calendlyUrl: 'https://calendly.com/sarah-johnson',
      eventTypeUrl: 'https://calendly.com/sarah-johnson/coaching',
      hourlyRate: 200
    }
  },
  {
    userId: 'user_2r0JFaVbINR4TBRNFzcwIsyEXV2',
    firstName: 'Michael',
    lastName: 'Chen',
    email: 'michael.chen.test@example.com',
    role: 'realtor_coach',
    profileImageUrl: 'https://img.clerk.com/placeholder.png',
    realtorProfile: {
      companyName: 'Digital Realty Group',
      licenseNumber: 'RLT789012',
      phoneNumber: '555-0102'
    },
    coachProfile: {
      specialty: 'Digital Marketing',
      bio: 'Digital marketing expert specializing in real estate lead generation.',
      experience: '10 years in real estate digital marketing',
      certifications: ['Digital Marketing Certified', 'Google Ads Certified'],
      availability: 'Tuesday-Saturday, 10AM-6PM PST',
      sessionLength: '45 minutes',
      specialties: JSON.stringify(['Social Media', 'Lead Generation', 'Online Advertising']),
      calendlyUrl: 'https://calendly.com/michael-chen',
      eventTypeUrl: 'https://calendly.com/michael-chen/strategy',
      hourlyRate: 175
    }
  }
]

async function seedCoaches() {
  try {
    console.log('Starting to seed coaches...')

    for (const coach of mockCoaches) {
      // Check if user already exists by userId (Clerk ID)
      const { data: existingUser } = await supabase
        .from('User')
        .select('id, userId')
        .eq('userId', coach.userId)
        .single()

      let userData
      if (existingUser) {
        console.log(`User with Clerk ID ${coach.userId} already exists, updating...`)
        // Update existing user
        const { data: updatedUser, error: updateError } = await supabase
          .from('User')
          .update({
            firstName: coach.firstName,
            lastName: coach.lastName,
            email: coach.email,
            role: coach.role,
            profileImageUrl: coach.profileImageUrl,
            updatedAt: new Date().toISOString()
          })
          .eq('userId', coach.userId)
          .select()
          .single()

        if (updateError) {
          console.error('Error updating user:', updateError)
          throw updateError
        }
        userData = updatedUser
      } else {
        // Create new user
        const { data: newUser, error: userError } = await supabase
          .from('User')
          .insert({
            userId: coach.userId,
            firstName: coach.firstName,
            lastName: coach.lastName,
            email: coach.email,
            role: coach.role,
            profileImageUrl: coach.profileImageUrl,
            updatedAt: new Date().toISOString()
          })
          .select()
          .single()

        if (userError) {
          console.error('Error creating user:', userError)
          throw userError
        }
        userData = newUser
      }

      // Check if realtor profile exists
      const { data: existingRealtorProfile } = await supabase
        .from('RealtorProfile')
        .select('*')
        .eq('userDbId', userData.id)
        .single()

      let realtorProfileData
      if (existingRealtorProfile) {
        console.log(`Updating RealtorProfile for ${coach.email}...`)
        const { data: updatedProfile, error: updateError } = await supabase
          .from('RealtorProfile')
          .update({
            ...coach.realtorProfile,
            updatedAt: new Date().toISOString()
          })
          .eq('userDbId', userData.id)
          .select()
          .single()

        if (updateError) {
          console.error('Error updating realtor profile:', updateError)
          throw updateError
        }
        realtorProfileData = updatedProfile
      } else {
        // Create RealtorProfile
        const { data: newProfile, error: createError } = await supabase
          .from('RealtorProfile')
          .insert({
            userDbId: userData.id,
            ...coach.realtorProfile,
            updatedAt: new Date().toISOString()
          })
          .select()
          .single()

        if (createError) {
          console.error('Error creating realtor profile:', createError)
          throw createError
        }
        realtorProfileData = newProfile
      }

      // Check if coach profile exists
      const { data: existingCoachProfile } = await supabase
        .from('RealtorCoachProfile')
        .select('*')
        .eq('userDbId', userData.id)
        .single()

      if (existingCoachProfile) {
        console.log(`Updating RealtorCoachProfile for ${coach.email}...`)
        const { error: updateError } = await supabase
          .from('RealtorCoachProfile')
          .update({
            ...coach.coachProfile,
            updatedAt: new Date().toISOString()
          })
          .eq('userDbId', userData.id)
      } else {
        const { error: createError } = await supabase
          .from('RealtorCoachProfile')
          .insert({
            userDbId: userData.id,
            ...coach.coachProfile,
            updatedAt: new Date().toISOString()
          })

        if (createError) {
          console.error('Error creating coach profile:', createError)
          throw createError
        }
      }

      console.log(`Processed coach: ${coach.firstName} ${coach.lastName}`)
    }

    console.log('Seeding completed successfully!')
  } catch (error) {
    console.error('Seed error:', error)
    process.exit(1)
  }
}

seedCoaches() 