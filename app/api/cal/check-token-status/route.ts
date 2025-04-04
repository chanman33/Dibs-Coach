import { NextResponse } from 'next/server'
import { createAuthClient } from '@/utils/auth'
import { auth } from '@clerk/nextjs'

/**
 * API endpoint to check if the Cal.com access token is expired or about to expire
 * Returns { expired: boolean, expiringImminent: boolean }
 */
export async function GET() {
  try {
    // Authenticate the user
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ 
        error: 'Unauthorized' 
      }, { status: 401 })
    }
    
    // Get the user's ULID from the database
    const supabase = createAuthClient()
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('ulid')
      .eq('userId', userId)
      .single()
      
    if (userError || !userData) {
      console.error('[CAL_TOKEN_STATUS] User not found:', { 
        error: userError,
        userId,
        timestamp: new Date().toISOString()
      })
      
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 })
    }
    
    // Get the Cal.com integration for this user
    const { data: integration, error: integrationError } = await supabase
      .from('CalendarIntegration')
      .select('calAccessTokenExpiresAt')
      .eq('userUlid', userData.ulid)
      .maybeSingle()
      
    if (integrationError || !integration) {
      console.error('[CAL_TOKEN_STATUS] Integration not found:', {
        error: integrationError,
        userUlid: userData.ulid,
        timestamp: new Date().toISOString()
      })
      
      // If no integration exists, treat it as requiring refresh
      return NextResponse.json({ 
        expired: true,
        expiringImminent: true
      })
    }
    
    // Check token expiration
    const tokenExpiresAt = new Date(integration.calAccessTokenExpiresAt || '');
    const now = new Date();
    
    // Determine if token is expired
    const expired = !isNaN(tokenExpiresAt.getTime()) && tokenExpiresAt <= now;
    
    // Add a buffer time to identify tokens that will expire soon (5 minutes)
    const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
    const expiringImminent = !isNaN(tokenExpiresAt.getTime()) && 
                            (tokenExpiresAt.getTime() - now.getTime() < bufferTime);
    
    // Log token status
    console.log('[CAL_TOKEN_STATUS] Token expiration check:', {
      expired,
      expiringImminent,
      expiresAt: integration.calAccessTokenExpiresAt,
      now: now.toISOString(),
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json({
      expired,
      expiringImminent
    })
  } catch (error) {
    console.error('[CAL_TOKEN_STATUS] Error checking token status:', {
      error,
      timestamp: new Date().toISOString()
    })
    
    // On error, indicate refresh is needed as a fallback
    return NextResponse.json({
      expired: true,
      expiringImminent: true,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 