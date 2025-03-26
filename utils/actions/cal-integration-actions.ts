'use server'

import { createAuthClient } from '@/utils/auth'
import { auth } from '@clerk/nextjs'
import { Database } from '@/types/supabase'
import { ApiResponse } from '@/utils/types/api'
import { env } from '@/lib/env'

export interface CalIntegrationDetails {
  isConnected: boolean
  calManagedUserId?: number
  calUsername?: string
  timeZone?: string | null
  createdAt?: string
  verifiedWithCal?: boolean
  verificationResponse?: any
}

/**
 * Fetch the current user's Cal.com integration status
 */
export async function fetchCalIntegrationStatus(): Promise<ApiResponse<CalIntegrationDetails>> {
  try {
    // Get the user's ID from auth
    const { userId } = auth()
    if (!userId) {
      console.log('[CAL_DEBUG] No user ID found in auth context')
      return {
        data: { isConnected: false },
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' }
      }
    }

    console.log('[CAL_DEBUG] Starting integration check for user:', userId)

    // Get the user's ULID from the database
    const supabase = createAuthClient()
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('ulid')
      .eq('userId', userId)
      .single()

    if (userError) {
      console.error('[FETCH_CAL_STATUS_ERROR]', {
        error: userError,
        userId,
        timestamp: new Date().toISOString()
      })
      return {
        data: { isConnected: false },
        error: { code: 'DATABASE_ERROR', message: 'Failed to find user in database' }
      }
    }

    console.log('[CAL_DEBUG] Found user ULID in database:', userData.ulid)

    // Get the Cal.com integration for this user
    const { data: integration, error: integrationError } = await supabase
      .from('CalendarIntegration')
      .select('calManagedUserId, calUsername, timeZone, createdAt')
      .eq('userUlid', userData.ulid)
      .maybeSingle()

    if (integrationError) {
      console.error('[FETCH_CAL_STATUS_ERROR]', {
        error: integrationError,
        userUlid: userData.ulid,
        timestamp: new Date().toISOString()
      })
      return {
        data: { isConnected: false },
        error: { code: 'DATABASE_ERROR', message: 'Failed to fetch integration data' }
      }
    }

    if (!integration) {
      // Not an error, just no integration found
      console.log('[CAL_DEBUG] No integration found for user ULID:', userData.ulid)
      return {
        data: { isConnected: false },
        error: null
      }
    }

    console.log('[CAL_DEBUG] Integration data from database:', {
      calManagedUserId: integration.calManagedUserId,
      calUsername: integration.calUsername,
      timeZone: integration.timeZone,
      createdAt: integration.createdAt
    })

    // Now verify with Cal.com API that the managed user still exists
    let verifiedWithCal = false
    let verificationResponse = null
    
    try {
      if (integration.calManagedUserId) {
        const calApiUrl = `https://api.cal.com/v2/oauth-clients/${env.NEXT_PUBLIC_CAL_CLIENT_ID}/users/${integration.calManagedUserId}`
        console.log('[CAL_DEBUG] Verifying with Cal.com API:', calApiUrl)
        
        const calResponse = await fetch(
          calApiUrl,
          {
            method: 'GET',
            headers: {
              'x-cal-client-id': env.NEXT_PUBLIC_CAL_CLIENT_ID || '',
              'x-cal-secret-key': env.CAL_CLIENT_SECRET || '',
              'Content-Type': 'application/json',
            }
          }
        )
        
        // Get the response body for debugging
        const responseText = await calResponse.text()
        let responseData = null
        try {
          responseData = JSON.parse(responseText)
        } catch (e) {
          // If not valid JSON, just keep the text
          responseData = responseText
        }
        
        verificationResponse = {
          status: calResponse.status,
          statusText: calResponse.statusText,
          data: responseData
        }
        
        console.log('[CAL_DEBUG] Cal.com API response:', verificationResponse)
        
        // User exists on Cal.com side
        if (calResponse.ok) {
          verifiedWithCal = true
          console.log('[CAL_DEBUG] Verification successful')
        } else {
          console.error('[CAL_INTEGRATION_VERIFICATION_ERROR]', {
            status: calResponse.status,
            statusText: calResponse.statusText,
            response: responseData,
            calManagedUserId: integration.calManagedUserId,
            userUlid: userData.ulid,
            timestamp: new Date().toISOString()
          })
          
          // If 404, the user was deleted or doesn't exist on Cal.com
          if (calResponse.status === 404) {
            console.log('[CAL_DEBUG] User exists in DB but not found on Cal.com (404 error)')
            return {
              data: { 
                isConnected: false,
                verifiedWithCal: false 
              },
              error: { 
                code: 'NOT_FOUND',
                message: 'User exists in database but was not found on Cal.com' 
              }
            }
          }
        }
      } else {
        console.log('[CAL_DEBUG] No Cal.com managed user ID - cannot verify')
      }
    } catch (calError) {
      console.error('[CAL_API_ERROR]', {
        error: calError,
        calManagedUserId: integration.calManagedUserId,
        timestamp: new Date().toISOString()
      })
      // Don't fail the entire request if Cal.com verification fails
      // Instead, just mark that verification wasn't possible
    }

    // Integration found, return the details
    const result = {
      data: {
        isConnected: true,
        calManagedUserId: integration.calManagedUserId,
        calUsername: integration.calUsername,
        timeZone: integration.timeZone,
        createdAt: integration.createdAt,
        verifiedWithCal,
        verificationResponse
      },
      error: null
    }
    
    console.log('[CAL_DEBUG] Returning integration status:', {
      isConnected: true,
      verifiedWithCal,
      calManagedUserId: integration.calManagedUserId
    })
    
    return result
  } catch (error) {
    console.error('[FETCH_CAL_STATUS_ERROR]', {
      error,
      timestamp: new Date().toISOString()
    })
    return {
      data: { isConnected: false },
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }
    }
  }
} 