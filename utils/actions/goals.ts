'use server'

import { auth } from "@clerk/nextjs/server"
import { createAuthClient } from "../auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// Goal validation schema
const goalSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  target: z.number().min(0, "Target must be a positive number").transform(val => Number(val.toFixed(2))),
  current: z.number().min(0, "Current value must be a positive number").transform(val => Number(val.toFixed(2))),
  deadline: z.string().min(1, "Deadline is required"),
  type: z.enum([
    // Coaching & Mentorship
    "coaching_sessions",
    "group_sessions",
    "session_revenue",
    "active_mentees",
    "mentee_satisfaction",
    "response_time",
    "session_completion",
    "mentee_milestones",
    
    // Financial Goals
    "sales_volume",
    "commission_income",
    "gci",
    "avg_sale_price",
    
    // Transaction Goals
    "listings",
    "buyer_transactions",
    "closed_deals",
    "days_on_market",
    
    // Client Goals
    "new_clients",
    "referrals",
    "client_retention",
    "reviews",
    
    // Market Presence
    "market_share",
    "territory_expansion",
    "social_media",
    "website_traffic",
    
    // Professional Development
    "certifications",
    "training_hours",
    "networking_events",
    
    "custom"
  ]),
  status: z.enum(["in_progress", "completed", "overdue"]).default("in_progress"),
})

type GoalInput = z.infer<typeof goalSchema>

// Helper function to determine format based on goal type
function getFormatForGoalType(type: GoalInput["type"]): "number" | "currency" | "percentage" | "time" {
  switch (type) {
    // Currency format
    case "sales_volume":
    case "commission_income":
    case "gci":
    case "avg_sale_price":
    case "session_revenue":
      return "currency"
    
    // Percentage format
    case "market_share":
    case "client_retention":
    case "mentee_satisfaction":
    case "session_completion":
      return "percentage"
    
    // Time format (hours)
    case "response_time":
    case "training_hours":
    case "days_on_market":
      return "time"
    
    // Number format (default)
    default:
      return "number"
  }
}

export async function createGoal(data: GoalInput) {
  try {
    const { userId } = await auth()
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const supabase = await createAuthClient()

    // Get user's database ID
    const { data: user, error: userError } = await supabase
      .from("User")
      .select("id")
      .eq("userId", userId)
      .single()

    if (userError || !user) {
      throw new Error("User not found")
    }

    const now = new Date().toISOString()

    // Create goal without format field
    const { data: goal, error: goalError } = await supabase
      .from("Goal")
      .insert({
        userDbId: user.id,
        title: data.title,
        description: data.description,
        target: data.target,
        current: data.current,
        deadline: new Date(data.deadline).toISOString(),
        type: data.type,
        status: data.status,
        updatedAt: now,
        createdAt: now,
      })
      .select()
      .single()

    if (goalError) {
      throw goalError
    }

    revalidatePath("/dashboard")
    return { data: goal, error: null }
  } catch (error) {
    console.error("[CREATE_GOAL_ERROR]", error)
    return { data: null, error: error as Error }
  }
}

export async function updateGoal(goalId: number, data: Partial<GoalInput>) {
  try {
    const { userId } = await auth()
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const supabase = await createAuthClient()

    // Get user's database ID
    const { data: user, error: userError } = await supabase
      .from("User")
      .select("id")
      .eq("userId", userId)
      .single()

    if (userError || !user) {
      throw new Error("User not found")
    }

    // Create update data with proper typing
    const updateData: Record<string, any> = {
      ...data,
      deadline: data.deadline ? new Date(data.deadline).toISOString() : undefined,
      updatedAt: new Date().toISOString(),
    }

    // Update goal without format field
    const { data: goal, error: goalError } = await supabase
      .from("Goal")
      .update(updateData)
      .eq("id", goalId)
      .eq("userDbId", user.id)
      .select()
      .single()

    if (goalError) {
      throw goalError
    }

    revalidatePath("/dashboard")
    return { data: goal, error: null }
  } catch (error) {
    console.error("[UPDATE_GOAL_ERROR]", error)
    return { data: null, error: error as Error }
  }
}

export async function deleteGoal(goalId: number) {
  try {
    const { userId } = await auth()
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const supabase = await createAuthClient()

    // Get user's database ID
    const { data: user, error: userError } = await supabase
      .from("User")
      .select("id")
      .eq("userId", userId)
      .single()

    if (userError || !user) {
      throw new Error("User not found")
    }

    // Delete goal
    const { error: goalError } = await supabase
      .from("Goal")
      .delete()
      .eq("id", goalId)
      .eq("userDbId", user.id) // Ensure user owns the goal

    if (goalError) {
      throw goalError
    }

    revalidatePath("/dashboard")
    return { error: null }
  } catch (error) {
    console.error("[DELETE_GOAL_ERROR]", error)
    return { error: error as Error }
  }
}

export async function fetchGoals() {
  try {
    const { userId } = await auth()
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const supabase = await createAuthClient()

    // Get user's database ID
    const { data: user, error: userError } = await supabase
      .from("User")
      .select("id")
      .eq("userId", userId)
      .single()

    if (userError || !user) {
      throw new Error("User not found")
    }

    // Fetch goals
    const { data: goals, error: goalsError } = await supabase
      .from("Goal")
      .select("*")
      .eq("userDbId", user.id)
      .order("createdAt", { ascending: false })

    if (goalsError) {
      throw goalsError
    }

    return { data: goals, error: null }
  } catch (error) {
    console.error("[FETCH_GOALS_ERROR]", error)
    return { data: null, error: error as Error }
  }
} 