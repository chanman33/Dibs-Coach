import { PrismaClient, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@dibs.com' },
    update: {},
    create: {
      email: 'admin@dibs.com',
      userId: 'admin_clerk_id', // Replace with actual Clerk ID
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.admin,
      status: 'active'
    },
  })

  // Create a realtor coach
  const coach = await prisma.user.upsert({
    where: { email: 'coach@dibs.com' },
    update: {},
    create: {
      email: 'coach@dibs.com',
      userId: 'coach_clerk_id', // Replace with actual Clerk ID
      firstName: 'Coach',
      lastName: 'Test',
      role: UserRole.realtor_coach,
      status: 'active',
      realtorProfile: {
        create: {
          companyName: 'Test Company',
          licenseNumber: 'TEST123',
          phoneNumber: '123-456-7890'
        }
      }
    },
  })

  // Create a realtor (mentee)
  const realtor = await prisma.user.upsert({
    where: { email: 'realtor@dibs.com' },
    update: {},
    create: {
      email: 'realtor@dibs.com',
      userId: 'realtor_clerk_id', // Replace with actual Clerk ID
      firstName: 'Realtor',
      lastName: 'Test',
      role: UserRole.realtor,
      status: 'active',
      realtorProfile: {
        create: {
          companyName: 'Test Realty',
          licenseNumber: 'TEST456',
          phoneNumber: '123-456-7891'
        }
      }
    },
  })

  // Create a test session
  const session = await prisma.session.create({
    data: {
      coachDbId: coach.id,
      menteeDbId: realtor.id,
      durationMinutes: 60,
      status: 'scheduled',
      startTime: new Date('2024-02-01T10:00:00Z'),
      endTime: new Date('2024-02-01T11:00:00Z'),
    },
  })

  console.log('Seed completed.')
  console.log({ admin, coach, realtor, session })
}

main()
  .catch((e) => {
    console.error('Error in seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 