import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAuthClient } from '@/utils/auth'
import { updateProfileCompletion } from '@/utils/actions/update-profile-completion'

export const dynamic = 'force-dynamic';

/**
 * API endpoint to manually update profile completion
 * Can be used from anywhere to trigger a profile completion update
 */
export async function GET(request: Request) {
  try {
    // Check if user is authenticated
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get userUlid from database
    const supabase = createAuthClient()
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('ulid')
      .eq('userId', userId)
      .single()

    if (userError || !userData?.ulid) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      )
    }

    // Get force parameter from URL if available
    const url = new URL(request.url)
    const forceRefresh = url.searchParams.get('force') === 'true'

    // Update profile completion
    const result = await updateProfileCompletion(userData.ulid, forceRefresh)

    // Return the result
    return NextResponse.json({
      success: result.success,
      completionPercentage: result.completionPercentage,
      canPublish: result.canPublish
    })
  } catch (error) {
    console.error('[API_UPDATE_PROFILE_COMPLETION_ERROR]', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/**
 * Direct update API for forcing completion percentage
 * This is a fallback mechanism for specific users only
 */
export async function POST(request: Request) {
  try {
    // Check if user is authenticated
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { userUlid, forceValue } = body

    if (!userUlid || typeof forceValue !== 'number') {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Get caller's userUlid from database
    const supabase = createAuthClient()
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('ulid')
      .eq('userId', userId)
      .single()

    if (userError || !userData?.ulid) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      )
    }

    // Security check: Only allow direct updates for specific UIDs
    // or if user is updating their own profile
    const allowedUids = ['01JP3YZ89NV86YAPRFS2SS7VZ2']
    const isAllowed = userUlid === userData.ulid || allowedUids.includes(userUlid)

    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Not authorized to update this profile' },
        { status: 403 }
      )
    }

    // Directly update the profile completion percentage in the database
    const { error: updateError } = await supabase
      .from('CoachProfile')
      .update({
        completionPercentage: forceValue,
        updatedAt: new Date().toISOString()
      })
      .eq('userUlid', userUlid)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update profile completion' },
        { status: 500 }
      )
    }

    // Revalidate the profile page
    const { revalidatePath } = await import('next/cache')
    revalidatePath('/dashboard/coach/profile')

    // Return success
    return NextResponse.json({
      success: true,
      completionPercentage: forceValue,
      canPublish: forceValue >= 70
    })
  } catch (error) {
    console.error('[API_DIRECT_UPDATE_PROFILE_COMPLETION_ERROR]', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
} 