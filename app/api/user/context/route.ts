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
      // Return JSON for unauthorized access
      return NextResponse.json({ error: "Unauthorized", code: "NO_CLERK_USER_ID" }, { status: 401 });
    }

    const supabase = createAuthClient()

    // Fetch user details based on Clerk userId
    // Adjust the select query to include all fields needed for AuthContext
    const { data: user, error: userError } = await supabase
      .from('User') // Ensure 'User' matches your table name exactly
      .select('ulid, systemRole, capabilities') // Add other fields like isCoach, isMentee if they are part of AuthContext
      .eq('userId', userId)
      .single() // Expecting only one user per clerk ID

    if (userError) {
      // Return JSON for database errors
      console.error('[API /user/context] Database error fetching user:', { userId, dbErrorCode: userError.code, dbErrorMessage: userError.message });
      if (userError.code === 'PGRST116') { // Specific check for "No rows found"
        return NextResponse.json({ error: "User context not found in DB", code: "USER_NOT_FOUND_IN_DB_YET", details: userError.message }, { status: 404 });
      }
      return NextResponse.json({ error: "Database error", code: "DB_QUERY_ERROR", details: userError.message }, { status: 500 });
    }
    
    if (!user) {
      // Return JSON if user not found in DB
      console.warn('[API /user/context] User not found in database:', { userId });
      return NextResponse.json({ error: "User context not found in DB", code: "USER_NOT_FOUND_IN_DB" }, { status: 404 });
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

    // Ensure Content-Type header for JSON response
    return NextResponse.json(authContext, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    // Return JSON for any other unexpected errors
    console.error("[API /user/context] Unexpected GET Error:", { 
        errorMessage: error instanceof Error ? error.message : JSON.stringify(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
    });
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      code: "INTERNAL_SERVER_ERROR", 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 