import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const clientId = process.env.CALENDLY_CLIENT_ID
    const redirectUri = process.env.CALENDLY_REDIRECT_URI
    const scope = 'default'

    const authUrl = `https://auth.calendly.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scope}`

    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error('[CALENDLY_OAUTH_ERROR]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 