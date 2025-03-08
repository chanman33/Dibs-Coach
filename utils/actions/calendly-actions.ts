'use server'

import { createAuthClient } from '@/utils/auth'
import { fetchUserDbId } from './user-profile-actions'

/**
 * Fetches the Calendly connection status for the current coach from the database
 * This avoids making API calls to Calendly when we already know the user isn't connected
 */
export async function fetchCoachCalendlyStatus() {
  try {
    // Get the current user's database ID
    const userUlid = await fetchUserDbId()
    if (!userUlid) {
      return { 
        data: null, 
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } 
      }
    }

    // Create Supabase client
    const supabase = createAuthClient()
    
    // Query the CalendlyIntegration table directly
    const { data, error } = await supabase
      .from('CalendlyIntegration')
      .select('*')
      .eq('userUlid', userUlid)
      .single()
    
    if (error) {
      console.error('[FETCH_CALENDLY_STATUS_ERROR]', {
        error,
        userUlid,
        timestamp: new Date().toISOString()
      })
      
      // Not found is not an error in this context
      if (error.code === 'PGRST116') {
        return { 
          data: { connected: false }, 
          error: null 
        }
      }
      
      return { 
        data: null, 
        error: { 
          code: error.code, 
          message: 'Failed to fetch Calendly status from database' 
        } 
      }
    }
    
    // If we have data, the user is connected
    return { 
      data: { 
        connected: !!data,
        schedulingUrl: data?.schedulingUrl || null,
        userUri: data?.userId || null
      }, 
      error: null 
    }
  } catch (error) {
    console.error('[FETCH_CALENDLY_STATUS_ERROR]', {
      error,
      timestamp: new Date().toISOString()
    })
    
    return { 
      data: null, 
      error: { 
        code: 'UNKNOWN_ERROR', 
        message: 'An unexpected error occurred' 
      } 
    }
  }
} 