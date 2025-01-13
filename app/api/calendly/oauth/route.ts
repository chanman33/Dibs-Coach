import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Using Personal Access Token instead of OAuth
    const authUrl = `https://auth.calendly.com/oauth/authorize?client_id=${process.env.CALENDLY_CLIENT_ID}&response_type=token&redirect_uri=${process.env.CALENDLY_REDIRECT_URI}`

    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error('[CALENDLY_AUTH_ERROR]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 