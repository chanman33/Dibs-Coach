import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAuthClient } from '@/utils/auth/auth-client' // Use your Supabase client creator
import type { AuthContext } from '@/utils/types/auth'
import { SYSTEM_ROLES } from '@/utils/roles/roles' // Import roles if needed for default values

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { userId } = auth()

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const supabase = createAuthClient()

    // Fetch user details based on Clerk userId
    // Adjust the select query to include all fields needed for AuthContext
    const { data: user, error: userError } = await supabase
      .from('User') // Ensure 'User' matches your table name exactly
      .select('ulid, systemRole, capabilities') // Add other fields like isCoach, isMentee if they are part of AuthContext
      .eq('userId', userId)
      .single() // Expecting only one user per clerk ID

    if (userError || !user) {
      console.error('[API /user/context] Error fetching user or user not found:', { userId, error: userError?.message })
      // Decide if a user not found in DB should be a 404 or treated differently
      // For now, returning 404 might be appropriate if user creation is handled elsewhere (e.g., onboarding)
      return new NextResponse("User context not found", { status: 404 }) 
    }

    // Construct the AuthContext object
    // Ensure this matches the definition in utils/types/auth.ts
    const authContext: AuthContext = {
      userId: userId, // Clerk ID
      userUlid: user.ulid, // Your database ULID
      systemRole: user.systemRole || SYSTEM_ROLES.USER, // Provide a default role if necessary
      capabilities: user.capabilities || [], // Provide default empty array
      // Add other required fields from your AuthContext type definition
      // e.g., isCoach: user.isCoach, isMentee: user.isMentee
    }

    return NextResponse.json(authContext)

  } catch (error) {
    console.error("[API /user/context] GET Error:", { 
        error: error instanceof Error ? error.message : JSON.stringify(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
    })
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 