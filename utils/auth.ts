import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { auth, currentUser } from "@clerk/nextjs/server"
import { ROLES } from './roles/roles'
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'

// Create a reusable Supabase client for auth operations
export function createAuthClient() {
  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    {
      cookies: {
        get(name: string) {
          // @ts-ignore - cookies() is actually synchronous in Next.js App Router
          return cookies().get(name)?.value
        },
      },
    }
  )
}

// Get user's database ID and role
export async function getUserDbIdAndRole(userId: string) {
  const supabase = await createAuthClient()

  const { data: user, error } = await supabase
    .from('User')
    .select('id, role')
    .eq('userId', userId)
    .single()

  if (error || !user) {
    console.error('[AUTH_ERROR] Error fetching user:', error)
    return { userDbId: null, role: null }
  }

  return { userDbId: user.id, role: user.role }
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
    .select("*")
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
        .eq('id', existingUser.id)
        .select()
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
      userId: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.imageUrl,
      role: ROLES.MENTEE,
      memberStatus: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    .select()
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
    .eq('userId', userId)
    .select()
    .single()

  if (error) {
    console.error('[USER_UPDATE_ERROR]', error)
    throw error
  }

  return data
} 