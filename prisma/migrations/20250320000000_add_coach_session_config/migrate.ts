import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('Starting coach session config migration...');

  try {
    // Get all coach profiles with hourly rates
    const coaches = await prisma.realtorCoachProfile.findMany({
      where: {
        hourlyRate: {
          not: null
        }
      },
      select: {
        userDbId: true,
        hourlyRate: true
      }
    });

    console.log(`Found ${coaches.length} coaches with hourly rates to migrate`);

    // Process each coach
    for (const coach of coaches) {
      const hourlyRate = Number(coach.hourlyRate);
      
      // Calculate rates for different durations
      const rates = {
        "30": (hourlyRate / 2).toFixed(2),
        "60": hourlyRate.toFixed(2),
        "90": (hourlyRate * 1.5).toFixed(2)
      };

      // Insert new coach session config
      await prisma.CoachSessionConfig.create({
        data: {
          userDbId: coach.userDbId,
          durations: [30, 60, 90],
          rates,
          currency: 'USD',
          isActive: true
        }
      });

      console.log(`Migrated config for coach ${coach.userDbId}`);
    }

    console.log('Migration completed successfully');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 