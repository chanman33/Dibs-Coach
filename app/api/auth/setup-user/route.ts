import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createUserIfNotExists } from '@/utils/auth/user-management'

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const requestId = Math.random().toString(36).substring(7)
  const startTime = Date.now()
  
  try {
    // Verify authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized',
        code: 'UNAUTHORIZED' 
      }, { 
        status: 401,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
    }

    // Create user if not exists
    const user = await createUserIfNotExists(userId)

    // Return success with user data
    return NextResponse.json({ 
      success: true,
      user: {
        userId: user.userId,
        userUlid: user.userUlid,
        systemRole: user.systemRole,
        capabilities: user.capabilities,
        isNewUser: user.isNewUser
      }
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error: any) {
    // Always log errors
    console.error('[SETUP_USER_ERROR]', {
      requestId,
      error: error.message,
      stack: error.stack,
      duration: Date.now() - startTime
    })

    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to set up user',
        code: error.code || 'UNKNOWN_ERROR'
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    )
  }
} 