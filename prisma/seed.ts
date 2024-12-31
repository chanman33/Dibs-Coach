import { createClient } from '@supabase/supabase-js'
import { UserRole } from '@prisma/client'
import 'dotenv/config'

type MockCoach = {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  userId: string;
  coach: {
    specialty: string;
    imageUrl: string;
    rating: number;
    reviewCount: number;
    bio: string;
    experience: string;
    certifications: string[];
    availability: string;
    sessionLength: string;
    specialties: string;
    calendlyUrl: string;
    eventTypeUrl: string;
    hourlyRate: number;
  }
}

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

async function main() {
  console.log('Starting seed...')
  try {
    const mockCoaches: MockCoach[] = [
      {
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'realtor_coach' as UserRole,
        userId: 'john-doe-id',
        coach: {
          specialty: 'Sales Strategy',
          imageUrl: '/placeholder.svg?height=200&width=200',
          rating: 4.8,
          reviewCount: 124,
          bio: 'Expert in real estate sales strategies with over 15 years of experience.',
          experience: '15 years',
          certifications: ['Certified Real Estate Coach', 'Sales Performance Specialist'],
          availability: 'Mon-Fri, 9AM-5PM',
          sessionLength: '60 minutes',
          specialties: JSON.stringify(['Negotiation', 'Lead Generation', 'Client Retention']),
          calendlyUrl: 'https://calendly.com/john-doe',
          eventTypeUrl: 'https://calendly.com/john-doe/30min',
          hourlyRate: 150
        }
      },
      {
        email: 'jane.smith@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'realtor_coach' as UserRole,
        userId: 'jane-smith-id',
        coach: {
          specialty: 'Marketing for Realtors',
          imageUrl: '/placeholder.svg?height=200&width=200',
          rating: 4.6,
          reviewCount: 98,
          bio: 'Digital marketing guru specializing in real estate lead generation.',
          experience: '10 years',
          certifications: ['Digital Marketing Certified', 'Real Estate Marketing Specialist'],
          availability: 'Tue-Sat, 10AM-6PM',
          sessionLength: '45 minutes',
          specialties: JSON.stringify(['Social Media Marketing', 'Content Strategy', 'SEO for Realtors']),
          calendlyUrl: 'https://calendly.com/jane-smith',
          eventTypeUrl: '/event-type-2',
          hourlyRate: 80
        }
      }
      ,
      {
        email: 'bob.johnson@example.com',
        firstName: 'Bob',
        lastName: 'Johnson', 
        role: 'realtor_coach' as UserRole,
        userId: 'bob-johnson-id',
        coach: {
          specialty: 'Real Estate Leadership',
          imageUrl: '/placeholder.svg?height=200&width=200',
          rating: 4.9,
          reviewCount: 156,
          bio: 'Former real estate agency owner, now coaching the next generation of leaders.',
          experience: '20 years',
          certifications: ['Certified Leadership Coach', 'Real Estate Broker'],
          availability: 'Mon-Fri, 10AM-4PM',
          sessionLength: '60 minutes',
          specialties: JSON.stringify(['Business Planning', 'Revenue Growth', 'Team Scaling']),
          calendlyUrl: 'https://calendly.com/bob-johnson',
          eventTypeUrl: '/event-type-3',
          hourlyRate: 200
        }
      },
      {
        email: 'sarah.wilson@example.com',
        firstName: 'Sarah',
        lastName: 'Wilson',
        role: 'realtor_coach' as UserRole,
        userId: 'sarah-wilson-id',
        coach: {
          specialty: 'Luxury Real Estate',
          imageUrl: '/placeholder.svg?height=200&width=200',
          rating: 4.7,
          reviewCount: 112,
          bio: 'Luxury market specialist with expertise in high-end property transactions.',
          experience: '12 years',
          certifications: ['Luxury Marketing Specialist', 'High-End Property Expert'],
          availability: 'Tue-Sat, 11AM-7PM',
          sessionLength: '90 minutes',
          specialties: JSON.stringify(['Luxury Marketing', 'High-Net-Worth Clients', 'Property Staging']),
          calendlyUrl: 'https://calendly.com/sarah-wilson',
          eventTypeUrl: '/event-type-4',
          hourlyRate: 175
        }
      },
      {
        email: 'michael.brown@example.com',
        firstName: 'Michael',
        lastName: 'Brown',
        role: 'realtor_coach' as UserRole,
        userId: 'michael-brown-id',
        coach: {
          specialty: 'New Agent Development',
          imageUrl: '/placeholder.svg?height=200&width=200',
          rating: 4.5,
          reviewCount: 78,
          bio: 'Dedicated to helping new agents build strong foundations in real estate.',
          experience: '8 years',
          certifications: ['New Agent Training Specialist', 'Real Estate Educator'],
          availability: 'Mon-Thu, 9AM-3PM',
          sessionLength: '45 minutes',
          specialties: JSON.stringify(['Business Basics', 'Client Acquisition', 'Time Management']),
          calendlyUrl: 'https://calendly.com/michael-brown',
          eventTypeUrl: '/event-type-5',
          hourlyRate: 90
        }
      },
      {
        email: 'rachel.foster@example.com',
        firstName: 'Rachel',
        lastName: 'Foster',
        role: 'realtor_coach' as UserRole,
        userId: 'rachel-foster-id',
        coach: {
          specialty: 'Commercial Real Estate',
          imageUrl: '/placeholder.svg?height=200&width=200',
          rating: 4.8,
          reviewCount: 134,
          bio: 'Commercial real estate expert specializing in investment strategies.',
          experience: '15 years',
          certifications: ['Commercial Real Estate Specialist', 'Investment Property Advisor'],
          availability: 'Mon-Thu, 8AM-6PM',
          sessionLength: '60 minutes',
          specialties: JSON.stringify(['Investment Analysis', 'Commercial Negotiations', 'Market Research']),
          calendlyUrl: 'https://calendly.com/rachel-foster',
          eventTypeUrl: '/event-type-6',
          hourlyRate: 160
        }
      },
      {
        email: 'david.kim@example.com',
        firstName: 'David',
        lastName: 'Kim',
        role: 'realtor_coach' as UserRole,
        userId: 'david-kim-id',
        coach: {
          specialty: 'Technology Integration',
          imageUrl: '/placeholder.svg?height=200&width=200',
          rating: 4.6,
          reviewCount: 89,
          bio: 'PropTech expert helping realtors leverage the latest technology tools.',
          experience: '9 years',
          certifications: ['PropTech Specialist', 'Real Estate Technology Advisor'],
          availability: 'Wed-Sun, 9AM-5PM',
          sessionLength: '60 minutes',
          specialties: JSON.stringify(['CRM Implementation', 'Automation Tools', 'Virtual Tours']),
          calendlyUrl: 'https://calendly.com/david-kim',
          eventTypeUrl: '/event-type-7',
          hourlyRate: 120
        }
      },
      {
        email: 'lisa.garcia@example.com',
        firstName: 'Lisa',
        lastName: 'Garcia',
        role: 'realtor_coach' as UserRole,
        userId: 'lisa-garcia-id',
        coach: {
          specialty: 'International Real Estate',
          imageUrl: '/placeholder.svg?height=200&width=200',
          rating: 4.7,
          reviewCount: 92,
          bio: 'International real estate specialist with expertise in global markets.',
          experience: '11 years',
          certifications: ['International Property Specialist', 'Global Real Estate Advisor'],
          availability: 'Tue-Sat, 8AM-4PM',
          sessionLength: '60 minutes',
          specialties: JSON.stringify(['Global Markets', 'Cross-Border Transactions', 'Cultural Competency']),
          calendlyUrl: 'https://calendly.com/lisa-garcia',
          eventTypeUrl: '/event-type-8',
          hourlyRate: 140
        }
      }
    ]

    for (const coachData of mockCoaches) {
      // Create base user
      const { data: user, error: userError } = await supabase
        .from('User')
        .insert({
          email: coachData.email,
          firstName: coachData.firstName,
          lastName: coachData.lastName,
          role: coachData.role,
          userId: coachData.userId
        })
        .select()
        .single()

      if (userError) throw userError
      
      // Create realtor profile
      const { error: realtorError } = await supabase
        .from('RealtorProfile')
        .insert({
          userId: user.id
        })

      if (realtorError) throw realtorError

      // Create coach profile
      const { error: coachError } = await supabase
        .from('RealtorCoachProfile')
        .insert({
          userId: user.id,
          specialty: coachData.coach.specialty,
          imageUrl: coachData.coach.imageUrl,
          rating: coachData.coach.rating,
          reviewCount: coachData.coach.reviewCount,
          bio: coachData.coach.bio,
          experience: coachData.coach.experience,
          certifications: coachData.coach.certifications,
          availability: coachData.coach.availability,
          sessionLength: coachData.coach.sessionLength,
          specialties: coachData.coach.specialties,
          calendlyUrl: coachData.coach.calendlyUrl,
          eventTypeUrl: coachData.coach.eventTypeUrl,
          hourlyRate: coachData.coach.hourlyRate
        })

      if (coachError) throw coachError
    }
  } catch (error) {
    console.error('Seed error:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  }) 