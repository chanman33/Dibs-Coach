import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seedAdminTables() {
  try {
    console.log("🌱 Seeding admin tables...")

    // Seed AdminMetrics with realistic initial data
    const { error: metricsError } = await supabase.from("AdminMetrics").insert({
      totalUsers: 0,
      activeUsers: 0,
      totalCoaches: 0,
      activeCoaches: 0,
      pendingCoaches: 0,
      totalSessions: 0,
      completedSessions: 0,
      totalRevenue: 0,
      monthlyRevenue: 0,
      updatedAt: new Date().toISOString(),
    })

    if (metricsError) {
      console.error('[SEED_ERROR] AdminMetrics:', metricsError)
      throw metricsError
    }

    // Seed AdminActivity with initial system events
    const activities = [
      {
        type: "SYSTEM",
        title: "System Initialization",
        description: "Admin dashboard initialized successfully",
        severity: "INFO",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ]

    const { error: activityError } = await supabase
      .from("AdminActivity")
      .insert(activities)

    if (activityError) {
      console.error('[SEED_ERROR] AdminActivity:', activityError)
      throw activityError
    }

    console.log("✅ Admin tables seeded successfully!")
  } catch (error) {
    console.error("❌ Error seeding admin tables:", error)
    throw error
  }
}

// Execute seeding
seedAdminTables()
  .catch((error) => {
    console.error('[SEED_ERROR] Failed to seed admin tables:', error)
    process.exit(1)
  })
  .finally(async () => {
    process.exit(0)
  }) 