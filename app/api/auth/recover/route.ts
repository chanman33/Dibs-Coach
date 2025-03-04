import { NextResponse } from 'next/server'
import { createAuthClient } from '@/utils/auth'
import { generateUlid } from '@/utils/ulid'
import { SYSTEM_ROLES, USER_CAPABILITIES } from '@/utils/roles/roles'

// Define types to match database schema
type DbUser = {
  ulid: string
  userId: string
  email: string // Required in DB
  firstName: string | null
  lastName: string | null
  displayName: string | null
  systemRole: typeof SYSTEM_ROLES[keyof typeof SYSTEM_ROLES]
  capabilities: (typeof USER_CAPABILITIES[keyof typeof USER_CAPABILITIES])[]
  isCoach: boolean
  isMentee: boolean
  createdAt: string
  updatedAt: string
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  profileImageUrl: string | null
}

// Retry wrapper for database operations
const withRetry = async <T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> => {
  let lastError
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000))
    }
  }
  throw lastError
}

// Handle both GET and POST requests
async function handleRecovery(userId: string) {
  try {
    const supabase = await createAuthClient()
    
    // Get user data from Clerk first
    const userData = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    }).then(res => res.json())

    const userEmail = userData.email_addresses?.[0]?.email_address

    // More thorough user lookup using proper query builder syntax
    const { data: existingUser, error: lookupError } = await supabase
      .from('User')
      .select('ulid, userId, email, status')
      .or('userId.eq.' + userId + ',email.eq.' + userEmail)
      .not('status', 'eq', 'SUSPENDED')
      .order('createdAt', { ascending: false })
      .limit(1)
      .single()

    if (lookupError) {
      // Only log real errors, not "no rows returned"
      if (lookupError.code !== 'PGRST116') {
        console.error('[USER_LOOKUP_ERROR]', { 
          userId, 
          email: userEmail,
          error: lookupError 
        })
        throw lookupError
      }
    }

    if (existingUser) {
      // If user exists but userId doesn't match, we need to handle the edge case
      if (existingUser.userId !== userId) {
        console.error('[USER_MISMATCH]', { 
          existingUserId: existingUser.userId, 
          newUserId: userId,
          email: userEmail
        })
        return NextResponse.json({ 
          error: 'Account already exists with this email' 
        }, { status: 409 })
      }
      return NextResponse.json({ success: true, data: existingUser })
    }

    // Create new user with required fields
    const newUser: DbUser = {
      ulid: generateUlid(),
      userId: userId,
      email: userEmail || `${userId}@placeholder.com`,
      firstName: userData.first_name ?? null,
      lastName: userData.last_name ?? null,
      displayName: null,
      systemRole: SYSTEM_ROLES.USER,
      capabilities: [USER_CAPABILITIES.MENTEE],
      isCoach: false,
      isMentee: true,
      status: 'ACTIVE',
      profileImageUrl: userData.image_url ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Insert with retry and return created user
    await withRetry(async () => {
      const { error } = await supabase
        .from('User')
        .insert([newUser])
        .select()
        .single()

      if (error) throw error
    })

    return NextResponse.json({ success: true, data: newUser })

  } catch (error) {
    console.error('[RECOVERY_ERROR]', error)
    return NextResponse.json({ error: 'Recovery failed' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const userId = url.searchParams.get('userId')
  
  if (!userId) {
    return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 })
  }

  return handleRecovery(userId)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId } = body
    
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId in request' }, { status: 400 })
    }

    return handleRecovery(userId)

  } catch (error) {
    console.error('[RECOVERY_ERROR]', error)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
} 