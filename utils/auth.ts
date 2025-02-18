import { createServerClient } from '@supabase/ssr'
import { cookies as getCookie } from 'next/headers'
import { auth, currentUser } from "@clerk/nextjs/server"
import { SYSTEM_ROLES, USER_CAPABILITIES } from './roles/roles'
import { generateUlid } from './ulid'
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'

// Create a reusable Supabase client for auth operations
export function createAuthClient() {
  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    {
      cookies: {
        get: async (name: string) => {
          const cookies = await getCookie()
          const cookie = cookies.get(name)
          return cookie?.value
        },
      },
    }
  )
}

// Get user's ULID and role
export async function getUserUlidAndRole(userId: string) {
  const supabase = await createAuthClient()

  const { data: user, error } = await supabase
    .from('User')
    .select('ulid, systemRole')
    .eq('userId', userId)
    .single()

  if (error || !user) {
    console.error('[AUTH_ERROR] Error fetching user:', error)
    return { userUlid: null, systemRole: null }
  }

  return { userUlid: user.ulid, systemRole: user.systemRole }
}

// Ensure user exists in database
export async function ensureUserExists() {
  const { userId } = await auth()
  if (!userId) {
    throw new Error('Not authenticated')
  }

  const supabase = await createAuthClient()

  // Check if user exists by userId or email
  const user = await currentUser()
  if (!user) {
    throw new Error('User data not available')
  }

  const { data: existingUser, error: checkError } = await supabase
    .from("User")
    .select("ulid, userId, email, firstName, lastName, displayName, profileImageUrl, systemRole, memberStatus, capabilities")
    .or(`userId.eq."${userId}",email.eq."${user.emailAddresses[0]?.emailAddress}"`)
    .single()

  if (checkError && checkError.code !== 'PGRST116') {
    throw checkError
  }

  // If user exists, update their Clerk ID if needed and return
  if (existingUser) {
    // If user exists with different Clerk ID, update it
    if (existingUser.userId !== userId) {
      const { data: updatedUser, error: updateError } = await supabase
        .from("User")
        .update({ 
          userId,
          updatedAt: new Date().toISOString()
        })
        .eq('ulid', existingUser.ulid)
        .select("ulid, userId, email, firstName, lastName, displayName, profileImageUrl, systemRole, memberStatus, capabilities")
        .single()

      if (updateError) {
        throw updateError
      }
      return updatedUser
    }
    return existingUser
  }

  // If user doesn't exist, create them
  const { data: newUser, error: createError } = await supabase
    .from("User")
    .insert({
      ulid: generateUlid(),
      userId: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}`.trim() : user.emailAddresses[0]?.emailAddress?.split('@')[0],
      profileImageUrl: user.imageUrl,
      systemRole: SYSTEM_ROLES.USER,
      memberStatus: 'active',
      capabilities: [USER_CAPABILITIES.MENTEE], // Set initial capabilities
      isCoach: false,
      isMentee: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    .select("ulid, userId, email, firstName, lastName, displayName, profileImageUrl, systemRole, memberStatus, capabilities")
    .single()

  if (createError) {
    throw createError
  }

  return newUser
}

// Update user data
export async function updateUser({
  userId,
  email,
  firstName,
  lastName,
  profileImageUrl,
}: {
  userId: string
  email?: string
  firstName?: string
  lastName?: string
  profileImageUrl?: string
}) {
  const supabase = await createAuthClient()

  // First get the user's ULID
  const { data: user, error: userError } = await supabase
    .from('User')
    .select('ulid')
    .eq('userId', userId)
    .single()

  if (userError || !user) {
    console.error('[USER_UPDATE_ERROR] User not found:', userError)
    throw new Error('User not found')
  }

  const updates = {
    ...(email && { email }),
    ...(firstName && { firstName }),
    ...(lastName && { lastName }),
    ...(profileImageUrl && { profileImageUrl }),
    updatedAt: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('User')
    .update(updates)
    .eq('ulid', user.ulid)
    .select("ulid, userId, email, firstName, lastName, displayName, profileImageUrl, systemRole")
    .single()

  if (error) {
    console.error('[USER_UPDATE_ERROR]', error)
    throw error
  }

  return data
}

// Utility function to convert Clerk ID to ULID
export async function getUlidFromClerkId(clerkUserId: string): Promise<string | null> {
  const supabase = await createAuthClient()
  
  const { data: user, error } = await supabase
    .from('User')
    .select('ulid')
    .eq('userId', clerkUserId)
    .single()
    
  if (error || !user) {
    console.error('[AUTH_ERROR] Error converting Clerk ID to ULID:', error)
    return null
  }
  
  return user.ulid
}

// Utility function to convert ULID to Clerk ID
export async function getClerkIdFromUlid(ulid: string): Promise<string | null> {
  const supabase = await createAuthClient()
  
  const { data: user, error } = await supabase
    .from('User')
    .select('userId')
    .eq('ulid', ulid)
    .single()
    
  if (error || !user) {
    console.error('[AUTH_ERROR] Error converting ULID to Clerk ID:', error)
    return null
  }
  
  return user.userId
}

// Validate that a user exists with both IDs
export async function validateUserIds(params: { clerkUserId?: string, ulid?: string }): Promise<boolean> {
  const supabase = await createAuthClient()
  const query = supabase.from('User').select('ulid, userId')
  
  if (params.clerkUserId) {
    query.eq('userId', params.clerkUserId)
  }
  if (params.ulid) {
    query.eq('ulid', params.ulid)
  }
  
  const { data: user, error } = await query.single()
  
  if (error || !user) {
    console.error('[AUTH_ERROR] User validation failed:', { params, error })
    return false
  }
  
  return true
} 