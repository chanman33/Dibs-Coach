// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { ulid } from 'ulid'

dotenv.config()

const prisma = new PrismaClient()

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

// Helper to format datetime in ISO format
const formatDateTime = () => new Date().toISOString()

async function main() {
  try {
    console.log('Starting seed...')

    const now = formatDateTime()

    // Seed SystemHealth
    const { error: healthError } = await supabase
      .from('SystemHealth')
      .insert({
        ulid: ulid(),
        status: 1, // 1 = healthy, 2 = degraded, 3 = critical
        activeSessions: 0,
        pendingReviews: 0,
        securityAlerts: 0,
        uptime: 100,
        createdAt: now,
        updatedAt: now
      })

    if (healthError) {
      console.error('Error seeding SystemHealth:', healthError)
    }

    // Seed AdminMetrics
    const { error: metricsError } = await supabase
      .from('AdminMetrics')
      .insert({
        ulid: ulid(),
        totalUsers: 0,
        activeUsers: 0,
        totalCoaches: 0,
        activeCoaches: 0,
        pendingCoaches: 0,
        totalSessions: 0,
        completedSessions: 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
        createdAt: now,
        updatedAt: now
      })

    if (metricsError) {
      console.error('Error seeding AdminMetrics:', metricsError)
    }

    // Seed initial SystemActivity
    const { error: activityError } = await supabase
      .from('SystemActivity')
      .insert({
        ulid: ulid(),
        type: 'SYSTEM_EVENT',
        title: 'System Initialized',
        description: 'System has been initialized with default settings',
        severity: 'info',
        createdAt: now,
        updatedAt: now
      })

    if (activityError) {
      console.error('Error seeding SystemActivity:', activityError)
    }

    // Seed initial SystemAlerts
    const { error: alertError } = await supabase
      .from('SystemAlerts')
      .insert({
        ulid: ulid(),
        type: 'SYSTEM_EVENT',
        title: 'System Setup Complete',
        message: 'Initial system setup has been completed successfully',
        severity: 'info',
        createdAt: now,
        updatedAt: now
      })

    if (alertError) {
      console.error('Error seeding SystemAlerts:', alertError)
    }

    console.log('Seed completed successfully')
  } catch (error) {
    console.error('Error during seed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })