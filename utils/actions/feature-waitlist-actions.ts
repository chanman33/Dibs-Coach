"use server"

import { createAuthClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { auth } from "@clerk/nextjs/server"

export type FeatureWaitlistEntry = {
  id?: string
  email: string
  feature_id: string
  user_id?: string
  organization_id?: string
  created_at?: string
  updated_at?: string
}

/**
 * Add an email to the feature waitlist
 */
export async function addToFeatureWaitlist({
  email,
  featureId,
  organizationId
}: {
  email: string
  featureId: string
  organizationId?: string
}) {
  const supabase = createAuthClient()
  
  try {
    // Get user from Clerk auth
    const { userId: clerkUserId } = auth()
    
    // Debug: Log input parameters and auth user data
    console.log("[FEATURE_WAITLIST_DEBUG]", {
      email,
      featureId,
      organizationId,
      clerkUserId
    })
    
    // If the user is authenticated, lookup their database ID from User table
    let userDbId = null
    if (clerkUserId) {
      const { data: userData } = await supabase
        .from('User')
        .select('ulid')
        .eq('userId', clerkUserId)
        .single()
        
      userDbId = userData?.ulid
      console.log("[FEATURE_WAITLIST_USER_MAPPING]", { 
        clerkUserId, 
        userDbId 
      })
      
      // If user is authenticated but no organizationId was provided, try to find their organization
      if (!organizationId && userDbId) {
        const { data: orgMember } = await supabase
          .from('OrganizationMember')
          .select('organizationUlid')
          .eq('userUlid', userDbId)
          .eq('status', 'ACTIVE')
          .single()
          
        if (orgMember?.organizationUlid) {
          organizationId = orgMember.organizationUlid
          console.log("[FEATURE_WAITLIST_ORG_LOOKUP]", { 
            userDbId, 
            foundOrganizationId: organizationId 
          })
        }
      }
    }
    
    // Create the waitlist entry with ID
    const waitlistEntry = {
      id: crypto.randomUUID(),
      email,
      feature_id: featureId,
      user_id: userDbId,
      organization_id: organizationId || null,
      updated_at: new Date().toISOString()
    }
    
    // Debug: Log the waitlist entry being created
    console.log("[FEATURE_WAITLIST_ENTRY]", waitlistEntry)
    
    // Insert into database
    const { data, error } = await supabase
      .from('FeatureWaitlist')
      .upsert(waitlistEntry, { 
        onConflict: 'email,feature_id',
        ignoreDuplicates: false
      })
      .select()
      .single()
    
    if (error) {
      console.error("[FEATURE_WAITLIST_ERROR]", error)
      throw error
    }
    
    // Debug: Log the returned data
    console.log("[FEATURE_WAITLIST_RESULT]", data)
    
    return { success: true, data }
  } catch (error) {
    console.error("[ADD_TO_FEATURE_WAITLIST_ERROR]", error)
    return { success: false, error: "Failed to add to waitlist" }
  }
}

/**
 * Get all waitlist entries for an organization
 */
export async function getOrganizationWaitlistEntries(organizationId: string) {
  const supabase = createAuthClient()
  
  try {
    // Debug: Log the organization ID being queried
    console.log("[FEATURE_WAITLIST_ORG_QUERY]", { organizationId })
    
    const { data, error } = await supabase
      .from('FeatureWaitlist')
      .select(`
        id,
        email,
        feature_id,
        user_id,
        organization_id,
        created_at
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error("[FEATURE_WAITLIST_ORG_ERROR]", error)
      throw error
    }
    
    // Debug: Log the returned entries
    console.log("[FEATURE_WAITLIST_ORG_RESULTS]", {
      count: data?.length,
      entries: data?.slice(0, 3) // Log first 3 entries only to avoid excessive logging
    })
    
    return { success: true, data }
  } catch (error) {
    console.error("[GET_ORGANIZATION_WAITLIST_ERROR]", error)
    return { success: false, error: "Failed to get waitlist entries" }
  }
} 