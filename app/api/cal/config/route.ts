import { NextResponse } from 'next/server'
import { calConfig } from '@/lib/cal/cal'

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check if required environment variables are set
    const clientId = calConfig.clientId || process.env.NEXT_PUBLIC_CAL_CLIENT_ID || ''
    const clientSecret = calConfig.clientSecret || process.env.CAL_CLIENT_SECRET || ''
    const organizationId = calConfig.organizationId || process.env.NEXT_PUBLIC_CAL_ORGANIZATION_ID || ''
    const redirectUrl = calConfig.redirectUrl || process.env.NEXT_PUBLIC_CAL_REDIRECT_URL || ''
    
    // Determine if Cal.com is properly configured
    const isConfigured = !!(clientId && clientSecret && organizationId)
    
    // Return configuration status and public values
    return NextResponse.json({
      isConfigured,
      clientId,
      hasClientSecret: !!clientSecret,
      organizationId,
      redirectUrl
    })
  } catch (error) {
    console.error('[CAL_CONFIG_ERROR]', error)
    return NextResponse.json(
      { 
        error: 'Failed to check Cal.com configuration',
        isConfigured: false
      },
      { status: 500 }
    )
  }
} 