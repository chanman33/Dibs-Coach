/**
 * Cal.com Managed Users API - Create Managed User
 * 
 * This API route creates a new managed user in Cal.com's API v2.
 * It uses the client ID and secret from environment variables.
 */

import { createAuthClient } from '@/utils/auth'
import { env } from '@/lib/env'
import { NextResponse } from 'next/server'
import { createUserIfNotExists } from '@/utils/auth/user-management'
import { generateUlid } from '@/utils/ulid'
import { 
  createCalManagedUserPayloadSchema, 
  type CreateCalManagedUserPayload
} from '@/utils/types/cal-managed-user'

export async function POST(req: Request) {
  const supabase = createAuthClient()
  let createdCalUserId: number | null = null

  try {
    // 1. Authenticate User
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      console.error('[CREATE_MANAGED_USER_AUTH_ERROR]', { error: sessionError })
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    const user = session.user
    console.log('[CREATE_MANAGED_USER_START]', { userId: user.id, email: user.email })

    // 2. Ensure User Exists in DB & Get ULID
    const userContext = await createUserIfNotExists(user.id)
    if (!userContext?.userUlid) {
      console.error('[CREATE_MANAGED_USER_DB_USER_ERROR]', { userId: user.id, error: 'Failed to get or create user context' })
      return NextResponse.json({ error: 'Failed to verify or create user in database' }, { status: 500 })
    }
    const userUlid = userContext.userUlid
    console.log('[CREATE_MANAGED_USER_DB_USER_CONFIRMED]', { userUlid, isNewUser: userContext.isNewUser })

    // 3. Parse and Validate Request Body
    let body
    try {
      body = await req.json()
    } catch (parseError) {
      console.error('[CREATE_MANAGED_USER_PARSE_ERROR]', { error: parseError })
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    
    const validationResult = createCalManagedUserPayloadSchema.safeParse(body)
    if (!validationResult.success) {
      console.error('[CREATE_MANAGED_USER_VALIDATION_ERROR]', { errors: validationResult.error.flatten() })
      return NextResponse.json({ 
        error: 'Invalid input', 
        details: validationResult.error.flatten() 
      }, { status: 400 })
    }
    
    const validatedPayload: CreateCalManagedUserPayload = validationResult.data
    console.log('[CREATE_MANAGED_USER_PAYLOAD]', { ...validatedPayload, userUlid })

    // 4. Check for Existing Integration
    const { data: existingIntegration, error: checkError } = await supabase
      .from('CalendarIntegration')
      .select('ulid, calManagedUserId, calUsername')
      .eq('userUlid', userUlid)
      .maybeSingle()

    if (checkError) {
      console.error('[CREATE_MANAGED_USER_DB_CHECK_ERROR]', { userUlid, error: checkError })
      return NextResponse.json({ error: 'Failed to check existing integration' }, { status: 500 })
    }

    if (existingIntegration) {
      console.log('[CREATE_MANAGED_USER_INFO] Integration already exists for user', { 
        userUlid, 
        calManagedUserId: existingIntegration.calManagedUserId,
        calUsername: existingIntegration.calUsername
      })
      
      await supabase
        .from('CalendarIntegration')
        .update({ 
          syncEnabled: true,
          updatedAt: new Date().toISOString() 
        })
        .eq('ulid', existingIntegration.ulid)
      
      return NextResponse.json({ 
        success: true, 
        message: 'Integration already exists and has been updated.', 
        calManagedUserId: existingIntegration.calManagedUserId,
        calUsername: existingIntegration.calUsername
      })
    }

    // 5. Create Cal.com Managed User using direct API
    const clientId = env.NEXT_PUBLIC_CAL_CLIENT_ID
    const clientSecret = env.CAL_CLIENT_SECRET
    
    if (!clientId || !clientSecret) {
      console.error('[CREATE_MANAGED_USER_CONFIG_ERROR]', { 
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret
      })
      return NextResponse.json({ 
        error: 'Cal.com API configuration is missing' 
      }, { status: 500 })
    }

    // Prepare payload for Cal.com API - exact format required by Cal.com
    const calUserPayload = {
      email: validatedPayload.email,
      name: validatedPayload.name,
      timeFormat: validatedPayload.timeFormat || 12,
      weekStart: validatedPayload.weekStart || "Monday",
      timeZone: validatedPayload.timeZone,
      locale: validatedPayload.locale || "en",
      avatarUrl: validatedPayload.avatarUrl || null
    }
    
    console.log('[CREATE_MANAGED_USER_CAL_PAYLOAD]', { 
      calUserPayload,
      validatedFields: Object.keys(validatedPayload)
    })

    try {
      // Make direct API call to Cal.com using the correct structure
      const apiUrl = `https://api.cal.com/v2/oauth-clients/${clientId}/users`;
      
      // Prepare headers exactly as required by Cal.com
      const headers = {
        'Content-Type': 'application/json',
        'x-cal-secret-key': clientSecret
      };
      
      // Log request details without exposing secrets
      console.log('[CREATE_MANAGED_USER_REQUEST]', {
        url: apiUrl,
        method: 'POST',
        headers: Object.keys(headers),
        payload: calUserPayload,
        timestamp: new Date().toISOString()
      });
      
      // Make the API call
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(calUserPayload)
      });
      
      // Log basic response info
      console.log('[CREATE_MANAGED_USER_RESPONSE]', { 
        status: response.status, 
        statusText: response.statusText,
        ok: response.ok,
        timestamp: new Date().toISOString()
      });
      
      // Get response body as text first for logging
      const responseText = await response.text();
      let calUserResponse;
      
      // Try to parse as JSON if possible
      try {
        calUserResponse = JSON.parse(responseText);
        console.log('[CREATE_MANAGED_USER_RESPONSE_PARSED]', {
          hasUser: !!calUserResponse?.user,
          userId: calUserResponse?.user?.id,
          hasToken: !!calUserResponse?.accessToken,
          fields: calUserResponse ? Object.keys(calUserResponse) : []
        });
      } catch (parseError) {
        console.error('[CREATE_MANAGED_USER_RESPONSE_PARSE_ERROR]', {
          error: parseError,
          responseText
        });
        return NextResponse.json({ 
          error: 'Failed to parse Cal.com API response', 
          details: responseText 
        }, { status: 500 });
      }

      if (!calUserResponse?.user?.id) {
        console.error('[CREATE_MANAGED_USER_INVALID_RESPONSE]', { 
          error: 'Invalid response format from Cal.com API', 
          response: calUserResponse 
        });
        return NextResponse.json({ 
          error: 'Failed to create user in Cal.com: Invalid response format',
          details: calUserResponse
        }, { status: 500 });
      }

      // Check for error response from Cal.com
      if (!response.ok || calUserResponse.error) {
        console.error('[CREATE_MANAGED_USER_ERROR_RESPONSE]', {
          status: response.status,
          errorMessage: calUserResponse.error || 'Unknown error',
          response: calUserResponse
        });
        
        return NextResponse.json({
          error: 'Cal.com API returned an error',
          details: calUserResponse
        }, { status: response.status || 500 });
      }
      
      createdCalUserId = calUserResponse.user.id;
      const calUsername = calUserResponse.user.username || 'cal-user';
      
      console.log('[CREATE_MANAGED_USER_CAL_SUCCESS]', { 
        calUserId: createdCalUserId,
        calUsername
      })

      // 6. Insert into Supabase CalendarIntegration Table
      const integrationUlid = generateUlid();
      
      // Extract response data from Cal.com response
      // Use type casting to ensure proper types
      const insertData = {
        ulid: integrationUlid,
        userUlid: userUlid,
        provider: 'CAL',
        calManagedUserId: createdCalUserId as number,
        calUsername: calUsername,
        calAccessToken: calUserResponse.accessToken || '',
        calRefreshToken: calUserResponse.refreshToken || '',
        calAccessTokenExpiresAt: calUserResponse.accessTokenExpiresAt 
          ? new Date(calUserResponse.accessTokenExpiresAt).toISOString()
          : new Date(Date.now() + 86400000).toISOString(), // Default to 24hr expiry
        timeZone: validatedPayload.timeZone,
        locale: validatedPayload.locale || 'en',
        weekStart: validatedPayload.weekStart || 'Monday',
        timeFormat: validatedPayload.timeFormat || 12,
        syncEnabled: true,
        googleCalendarConnected: false,
        office365CalendarConnected: false,
        updatedAt: new Date().toISOString()
      };
      
      console.log('[CREATE_MANAGED_USER_DB_INSERT]', {
        ulid: insertData.ulid,
        userUlid: insertData.userUlid,
        calManagedUserId: insertData.calManagedUserId,
        calUsername: insertData.calUsername,
        hasCalToken: !!insertData.calAccessToken
      });

      const { error: insertError } = await supabase
        .from('CalendarIntegration')
        .insert(insertData as any) // Type assertion to bypass TypeScript checks

      if (insertError) {
        console.error('[CREATE_MANAGED_USER_DB_INSERT_ERROR]', { 
          userUlid, 
          calManagedUserId: createdCalUserId, 
          error: insertError 
        })

        // Cleanup: delete the Cal.com user if we can't save to our database
        if (createdCalUserId) {
          try {
            console.warn(`[CREATE_MANAGED_USER_CLEANUP] Attempting to delete orphaned Cal.com user: ${createdCalUserId}`)
            const deleteResponse = await fetch(`https://api.cal.com/v2/oauth-clients/${clientId}/users/${createdCalUserId}`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                'x-cal-secret-key': clientSecret
              }
            })
            
            if (deleteResponse.ok) {
              console.log(`[CREATE_MANAGED_USER_CLEANUP] Successfully deleted orphaned Cal.com user: ${createdCalUserId}`)
            } else {
              console.error(`[CREATE_MANAGED_USER_CLEANUP_ERROR] Failed to delete Cal.com user, status: ${deleteResponse.status}`)
            }
          } catch (cleanupError) {
            console.error(`[CREATE_MANAGED_USER_CLEANUP_ERROR] Failed to delete orphaned Cal.com user: ${createdCalUserId}`, { cleanupError })
          }
        }
        
        return NextResponse.json({ 
          error: 'Failed to save integration details after creating Cal.com user.',
          details: insertError.message
        }, { status: 500 })
      }

      console.log('[CREATE_MANAGED_USER_FINAL_SUCCESS]', { 
        userId: user.id, 
        userUlid, 
        calIntegrationUlid: integrationUlid,
        calManagedUserId: createdCalUserId,
        calUsername
      })
      
      return NextResponse.json({ 
        success: true, 
        calUserId: createdCalUserId,
        calUsername
      })
      
    } catch (calApiError) {
      console.error('[CREATE_MANAGED_USER_CAL_API_EXCEPTION]', { 
        error: calApiError, 
        stack: calApiError instanceof Error ? calApiError.stack : undefined
      })
      return NextResponse.json({ 
        error: 'Error while creating Cal.com user', 
        details: calApiError instanceof Error ? calApiError.message : String(calApiError)
      }, { status: 500 })
    }
  } catch (error) {
    console.error('[CREATE_MANAGED_USER_UNEXPECTED_ERROR]', { error })

    // Cleanup: delete the Cal.com user if it was created but we hit another error
    if (createdCalUserId) {
      try {
        const clientId = env.NEXT_PUBLIC_CAL_CLIENT_ID
        const clientSecret = env.CAL_CLIENT_SECRET
        
        if (clientId && clientSecret) {
          console.warn(`[CREATE_MANAGED_USER_UNEXPECTED_CLEANUP] Attempting to delete orphaned Cal.com user: ${createdCalUserId}`)
          const deleteResponse = await fetch(`https://api.cal.com/v2/oauth-clients/${clientId}/users/${createdCalUserId}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'x-cal-secret-key': clientSecret
            }
          })
          
          if (deleteResponse.ok) {
            console.log(`[CREATE_MANAGED_USER_UNEXPECTED_CLEANUP] Successfully deleted orphaned Cal.com user: ${createdCalUserId}`)
          } else {
            console.error(`[CREATE_MANAGED_USER_UNEXPECTED_CLEANUP_ERROR] Failed to delete Cal.com user, status: ${deleteResponse.status}`)
          }
        }
      } catch (cleanupError) {
        console.error(`[CREATE_MANAGED_USER_UNEXPECTED_CLEANUP_ERROR] Failed to delete orphaned Cal.com user: ${createdCalUserId}`, { cleanupError })
      }
    }

    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
} 