const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const mockCoaches = [
  {
    email: 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'realtor_coach',
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
    role: 'realtor_coach',
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
  },
  {
    email: 'bob.johnson@example.com',
    firstName: 'Bob',
    lastName: 'Johnson',
    role: 'realtor_coach',
    userId: 'bob-johnson-id',
    coach: {
      specialty: 'Real Estate Leadership',
      imageUrl: '/placeholder.svg?height=200&width=200',
      rating: 4.9,
      reviewCount: 156,
      bio: 'Former real estate agency owner, now coaching the next generation of leaders.',
      experience: '20 years',
      certifications: ['Certified Leadership Coach', 'Real Estate Broker'],
      availability: 'Mon-Thu, 8AM-4PM',
      sessionLength: '90 minutes',
      specialties: JSON.stringify(['Team Building', 'Business Strategy', 'Performance Management']),
      calendlyUrl: 'https://calendly.com/bob-johnson',
      eventTypeUrl: '/event-type-3',
      hourlyRate: 120
    }
  },
  {
    email: 'alice.brown@example.com',
    firstName: 'Alice',
    lastName: 'Brown',
    role: 'realtor_coach',
    userId: 'alice-brown-id',
    coach: {
      specialty: 'Negotiation Skills',
      imageUrl: '/placeholder.svg?height=200&width=200',
      rating: 4.7,
      reviewCount: 112,
      bio: 'Master negotiator with a track record of closing high-value real estate deals.',
      experience: '12 years',
      certifications: ['Certified Negotiation Expert', 'Real Estate Negotiation Specialist'],
      availability: 'Wed-Sun, 11AM-7PM',
      sessionLength: '60 minutes',
      specialties: JSON.stringify(['Deal Structuring', 'Conflict Resolution', 'Value-based Selling']),
      calendlyUrl: 'https://calendly.com/alice-brown',
      eventTypeUrl: '/event-type-4',
      hourlyRate: 90
    }
  },
  {
    email: 'sarah.chen@example.com',
    firstName: 'Sarah',
    lastName: 'Chen',
    role: 'realtor_coach',
    userId: 'sarah-chen-id',
    coach: {
      specialty: 'Digital Marketing',
      imageUrl: '/placeholder.svg?height=200&width=200',
      rating: 4.8,
      reviewCount: 143,
      bio: 'Tech-savvy marketing expert helping realtors build their digital presence.',
      experience: '8 years',
      certifications: ['Digital Marketing Master', 'Social Media Marketing Expert'],
      availability: 'Mon-Fri, 10AM-6PM',
      sessionLength: '45 minutes',
      specialties: JSON.stringify(['Digital Advertising', 'Email Marketing', 'Personal Branding']),
      calendlyUrl: 'https://calendly.com/sarah-chen',
      eventTypeUrl: '/event-type-5',
      hourlyRate: 100
    }
  },
  {
    email: 'michael.torres@example.com',
    firstName: 'Michael',
    lastName: 'Torres',
    role: 'realtor_coach',
    userId: 'michael-torres-id',
    coach: {
      specialty: 'Luxury Real Estate',
      imageUrl: '/placeholder.svg?height=200&width=200',
      rating: 4.9,
      reviewCount: 167,
      bio: 'Luxury market specialist with expertise in high-end client relationships.',
      experience: '18 years',
      certifications: ['Luxury Marketing Specialist', 'High-Net-Worth Client Expert'],
      availability: 'Tue-Sat, 9AM-7PM',
      sessionLength: '75 minutes',
      specialties: JSON.stringify(['Luxury Marketing', 'High-End Client Service', 'Market Analysis']),
      calendlyUrl: 'https://calendly.com/michael-torres',
      eventTypeUrl: '/event-type-6',
      hourlyRate: 150
    }
  },
  {
    email: 'rachel.foster@example.com',
    firstName: 'Rachel',
    lastName: 'Foster',
    role: 'realtor_coach',
    userId: 'rachel-foster-id',
    coach: {
      specialty: 'Business Development',
      imageUrl: '/placeholder.svg?height=200&width=200',
      rating: 4.7,
      reviewCount: 132,
      bio: 'Strategic business coach focused on scaling real estate practices.',
      experience: '14 years',
      certifications: ['Business Development Specialist', 'Growth Strategy Expert'],
      availability: 'Mon-Thu, 8AM-6PM',
      sessionLength: '60 minutes',
      specialties: JSON.stringify(['Business Planning', 'Revenue Growth', 'Team Scaling']),
      calendlyUrl: 'https://calendly.com/rachel-foster',
      eventTypeUrl: '/event-type-7',
      hourlyRate: 100
    }
  },
  {
    email: 'david.kim@example.com',
    firstName: 'David',
    lastName: 'Kim',
    role: 'realtor_coach',
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
      eventTypeUrl: '/event-type-8',
      hourlyRate: 80
    }
  }
]

async function main() {
  console.log('Starting seed...')
  try {
    for (const coachData of mockCoaches) {
      // Create base user
      const { data: user, error: userError } = await supabase
        .from('User')
        .insert({
          email: coachData.email,
          firstName: coachData.firstName,
          lastName: coachData.lastName,
          role: coachData.role,
          userId: coachData.userId,
          updatedAt: new Date().toISOString()
        })
        .select()
        .single()

      if (userError) throw userError
      
      // Create realtor profile
      const { error: realtorError } = await supabase
        .from('RealtorProfile')
        .insert({
          userId: user.id,
          updatedAt: new Date().toISOString()
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
          hourlyRate: coachData.coach.hourlyRate,
          updatedAt: new Date().toISOString()
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