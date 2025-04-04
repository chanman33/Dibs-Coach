import { NextResponse } from 'next/server'
import { createAuthClient } from '@/utils/auth'

export async function GET(request: Request) {
  try {
    // Extract parameters from the OAuth callback
    const url = new URL(request.url)
    const state = url.searchParams.get('state')
    const code = url.searchParams.get('code')
    const error = url.searchParams.get('error')
    const errorDescription = url.searchParams.get('error_description')
    
    console.log('[OFFICE_REDIRECT_DEBUG] Received Office365 OAuth redirect:', {
      hasState: !!state,
      hasCode: !!code,
      hasError: !!error,
      errorDescription,
      url: request.url,
      timestamp: new Date().toISOString()
    })
    
    // Get the host for redirect purposes
    const host = request.headers.get('host') || 'localhost:3000'
    const protocol = host.includes('localhost') ? 'http' : 'https'
    const baseUrl = `${protocol}://${host}`
    
    // If there's an error, redirect to the callback URL with the error
    if (error) {
      console.error('[OFFICE_REDIRECT_DEBUG] OAuth error:', {
        error,
        errorDescription,
        timestamp: new Date().toISOString()
      })
      
      const callbackUrl = new URL(`${baseUrl}/dashboard/integrations/office365-calendar-callback`)
      callbackUrl.searchParams.append('error', error)
      if (errorDescription) callbackUrl.searchParams.append('error_description', errorDescription)
      
      return NextResponse.redirect(callbackUrl)
    }
    
    // If state and code are missing, redirect to the callback with an error
    if (!state || !code) {
      console.error('[OFFICE_REDIRECT_DEBUG] Missing required OAuth parameters:', {
        hasState: !!state,
        hasCode: !!code,
        timestamp: new Date().toISOString()
      })
      
      const callbackUrl = new URL(`${baseUrl}/dashboard/integrations/office365-calendar-callback`)
      callbackUrl.searchParams.append('error', 'missing_params')
      callbackUrl.searchParams.append('error_description', 'Required OAuth parameters were missing')
      
      return NextResponse.redirect(callbackUrl)
    }
    
    // Call our save-oauth-cal-creds API directly
    console.log('[OFFICE_REDIRECT_DEBUG] Calling Cal API to save credentials')
    
    const calApiUrl = new URL(`${baseUrl}/api/cal/calendars/save-oauth-cal-creds`)
    calApiUrl.searchParams.append('state', state)
    calApiUrl.searchParams.append('code', code)
    calApiUrl.searchParams.append('type', 'office365') // Specify the calendar type
    
    const response = await fetch(calApiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    // Check the response
    const responseStatus = response.status
    
    try {
      const responseText = await response.text()
      console.log('[OFFICE_REDIRECT_DEBUG] Cal API save response:', {
        status: responseStatus,
        text: responseText
      })
    } catch (e) {
      console.error('[OFFICE_REDIRECT_DEBUG] Could not read response text:', e)
    }
    
    // Redirect to success or error page based on response
    if (response.ok) {
      // Use environment variable if available, otherwise construct URL
      const successUrl = process.env.NEXT_PUBLIC_CALENDAR_SUCCESS_URL || 
        `${baseUrl}/dashboard/settings?tab=integrations&success=true`;
      
      return NextResponse.redirect(new URL(successUrl))
    } else {
      // Use environment variable if available, otherwise construct URL
      const errorUrl = process.env.NEXT_PUBLIC_CALENDAR_ERROR_URL || 
        `${baseUrl}/dashboard/settings?tab=integrations&error=true`;
      
      return NextResponse.redirect(new URL(errorUrl))
    }
  } catch (error) {
    console.error('[OFFICE_REDIRECT_DEBUG] Error processing redirect:', error)
    
    // Get the host for redirect purposes
    const host = request.headers.get('host') || 'localhost:3000'
    const protocol = host.includes('localhost') ? 'http' : 'https'
    const baseUrl = `${protocol}://${host}`
    
    // Use environment variable if available, otherwise construct URL
    const errorUrl = process.env.NEXT_PUBLIC_CALENDAR_ERROR_URL || 
      `${baseUrl}/dashboard/settings?tab=integrations&error=true`;
    
    return NextResponse.redirect(new URL(errorUrl))
  }
} 