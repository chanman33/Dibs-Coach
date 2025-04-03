/**
 * Cal.com Managed Users API - Refresh Managed User Token
 * 
 * This API route refreshes tokens for a managed user in Cal.com's API v2.
 * It implements the refresh endpoint documented at:
 * https://cal.com/docs/api-reference/v2/platform-managed-users/refresh-managed-user-tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createAuthClient } from '@/utils/auth';
import { env } from '@/lib/env';
import { updateCalTokens } from '@/utils/actions/cal-tokens';

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json();
    const forceRefresh = !!body.forceRefresh;
    const userUlid = body.userUlid;
    const isServerAction = body.isServerAction === true;
    
    // If this is not a server action, validate authentication
    if (!isServerAction) {
      // Check authentication
      const { userId } = auth();
      if (!userId) {
        console.error('[CAL_REFRESH_TOKEN_ERROR]', {
          context: 'AUTH',
          error: 'User not authenticated',
          timestamp: new Date().toISOString()
        });
        return NextResponse.json({ 
          success: false,
          error: 'Unauthorized' 
        }, { status: 401 });
      }
    } else {
      console.log('[CAL_REFRESH_TOKEN]', {
        context: 'SERVER_ACTION',
        userUlid,
        forceRefresh,
        timestamp: new Date().toISOString()
      });
      
      // For server actions, we MUST have a userUlid
      if (!userUlid) {
        console.error('[CAL_REFRESH_TOKEN_ERROR]', {
          context: 'SERVER_ACTION_MISSING_ULID',
          timestamp: new Date().toISOString()
        });
        return NextResponse.json({
          success: false,
          error: 'User ULID is required for server action calls'
        }, { status: 400 });
      }
    }
    
    // Get client credentials
    const clientId = env.NEXT_PUBLIC_CAL_CLIENT_ID;
    const clientSecret = env.CAL_CLIENT_SECRET;

    // Check for required environment variables
    if (!clientId || !clientSecret) {
      console.error('[CAL_REFRESH_TOKEN_ERROR]', {
        context: 'ENV',
        clientIdPresent: !!clientId,
        clientSecretPresent: !!clientSecret,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({
        success: false,
        error: 'Missing required environment variables'
      }, { status: 500 });
    }

    // Get the user's refresh token if not provided in request
    let refreshToken = body.refreshToken;
    let calManagedUserId;

    if (!refreshToken) {
      // Fetch the user's Cal.com integration data if refresh token wasn't provided
      const supabase = createAuthClient();
      
      const { data: integration, error: integrationError } = await supabase
        .from('CalendarIntegration')
        .select('calRefreshToken, calManagedUserId')
        .eq('userUlid', userUlid)
        .single();

      if (integrationError || !integration) {
        console.error('[CAL_REFRESH_TOKEN_ERROR]', {
          context: 'DB_INTEGRATION',
          error: integrationError || 'Integration not found',
          userUlid,
          timestamp: new Date().toISOString()
        });
        return NextResponse.json({ 
          success: false,
          error: 'Calendar integration not found' 
        }, { status: 404 });
      }

      if (!integration.calRefreshToken) {
        console.error('[CAL_REFRESH_TOKEN_ERROR]', {
          context: 'NO_REFRESH_TOKEN',
          userUlid,
          timestamp: new Date().toISOString()
        });
        return NextResponse.json({
          success: false,
          error: 'No refresh token available'
        }, { status: 400 });
      }

      refreshToken = integration.calRefreshToken;
      calManagedUserId = integration.calManagedUserId;
    }

    console.log('[CAL_REFRESH_TOKEN]', {
      clientId,
      userUlid,
      calManagedUserId,
      forceRefresh,
      timestamp: new Date().toISOString()
    });

    // If force refresh is requested and we have a managed user ID, go directly to force refresh
    if (forceRefresh && calManagedUserId) {
      console.log('[CAL_REFRESH_TOKEN] Using force refresh as requested by client');
      
      // Call force-refresh endpoint
      const forceRefreshResponse = await fetch(
        `https://api.cal.com/v2/oauth-clients/${clientId}/users/${calManagedUserId}/force-refresh`, 
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-cal-secret-key': clientSecret
          }
        }
      );

      if (forceRefreshResponse.ok) {
        const forceRefreshData = await forceRefreshResponse.json();
        
        if (forceRefreshData?.status === 'success' && forceRefreshData?.data) {
          // Update token in database if userUlid is available
          if (userUlid) {
            // Call the server action to update the token
            try {
              const updatedTokens = {
                accessToken: forceRefreshData.data.accessToken,
                refreshToken: forceRefreshData.data.refreshToken,
                accessTokenExpiresAt: forceRefreshData.data.accessTokenExpiresAt
              };
              
              // Use our server action to update the tokens in the database
              const updateResult = await updateCalTokens(userUlid, updatedTokens);
              
              if (!updateResult.success) {
                console.error('[CAL_REFRESH_TOKEN_ERROR]', {
                  context: 'DB_UPDATE',
                  error: updateResult.error,
                  userUlid,
                  timestamp: new Date().toISOString()
                });
              }
              
              console.log('[CAL_REFRESH_TOKEN_SUCCESS] Force refresh successful', {
                tokenUpdated: updateResult.success,
                timestamp: new Date().toISOString()
              });
              
              return NextResponse.json({
                success: true,
                data: updatedTokens,
                method: 'force-refresh',
                tokenUpdated: updateResult.success
              });
            } catch (updateError) {
              console.error('[CAL_REFRESH_TOKEN_ERROR]', {
                context: 'DB_UPDATE',
                error: updateError,
                timestamp: new Date().toISOString()
              });
              
              // Still return the tokens even if DB update failed
              return NextResponse.json({
                success: true,
                data: {
                  accessToken: forceRefreshData.data.accessToken,
                  refreshToken: forceRefreshData.data.refreshToken,
                  accessTokenExpiresAt: forceRefreshData.data.accessTokenExpiresAt
                },
                method: 'force-refresh',
                warning: 'Token was refreshed but database update failed'
              });
            }
          }
          
          return NextResponse.json({
            success: true,
            data: {
              accessToken: forceRefreshData.data.accessToken,
              refreshToken: forceRefreshData.data.refreshToken,
              accessTokenExpiresAt: forceRefreshData.data.accessTokenExpiresAt
            },
            method: 'force-refresh'
          });
        }
        
        console.error('[CAL_REFRESH_TOKEN_ERROR]', {
          context: 'FORCE_REFRESH_INVALID_RESPONSE',
          response: forceRefreshData,
          timestamp: new Date().toISOString()
        });
        
        return NextResponse.json({
          success: false,
          error: 'Invalid force refresh response from Cal.com'
        }, { status: 500 });
      }
      
      console.error('[CAL_REFRESH_TOKEN_ERROR]', {
        context: 'FORCE_REFRESH_FAILED',
        status: forceRefreshResponse.status,
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json({
        success: false,
        error: `Force refresh failed with status ${forceRefreshResponse.status}`
      }, { status: forceRefreshResponse.status === 401 ? 401 : 500 });
    }

    // For regular flow (or if we don't have managed user ID), try normal token refresh
    // Call Cal.com API to refresh the token
    // Using the endpoint from docs: https://cal.com/docs/api-reference/v2/platform-managed-users/refresh-managed-user-tokens
    const response = await fetch(`https://api.cal.com/v2/oauth/${clientId}/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cal-secret-key': clientSecret
      },
      body: JSON.stringify({
        refreshToken
      })
    });

    // Handle API response
    if (!response.ok) {
      let errorDetail = '';
      try {
        const errorData = await response.json();
        errorDetail = errorData?.error || errorData?.message || '';
      } catch {
        // Unable to parse error response
      }

      console.error('[CAL_REFRESH_TOKEN_ERROR]', {
        context: 'API',
        status: response.status,
        error: errorDetail || response.statusText,
        timestamp: new Date().toISOString()
      });

      // If regular refresh fails and we have a managed user ID, try force refresh
      if (calManagedUserId) {
        console.log('[CAL_REFRESH_TOKEN] Regular refresh failed, attempting force refresh');
        
        // Call force-refresh endpoint as fallback
        const forceRefreshResponse = await fetch(
          `https://api.cal.com/v2/oauth-clients/${clientId}/users/${calManagedUserId}/force-refresh`, 
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-cal-secret-key': clientSecret
            }
          }
        );

        if (forceRefreshResponse.ok) {
          const forceRefreshData = await forceRefreshResponse.json();
          
          if (forceRefreshData?.status === 'success' && forceRefreshData?.data) {
            // Update token in database if userUlid is available
            if (userUlid) {
              // Call the server action to update the token
              try {
                const updatedTokens = {
                  accessToken: forceRefreshData.data.accessToken,
                  refreshToken: forceRefreshData.data.refreshToken,
                  accessTokenExpiresAt: forceRefreshData.data.accessTokenExpiresAt
                };
                
                // Use our server action to update the tokens in the database
                const updateResult = await updateCalTokens(userUlid, updatedTokens);
                
                if (!updateResult.success) {
                  console.error('[CAL_REFRESH_TOKEN_ERROR]', {
                    context: 'DB_UPDATE',
                    error: updateResult.error,
                    userUlid,
                    timestamp: new Date().toISOString()
                  });
                }
                
                console.log('[CAL_REFRESH_TOKEN_SUCCESS] Force refresh successful', {
                  tokenUpdated: updateResult.success,
                  timestamp: new Date().toISOString()
                });
                
                return NextResponse.json({
                  success: true,
                  data: updatedTokens,
                  method: 'force-refresh',
                  tokenUpdated: updateResult.success
                });
              } catch (updateError) {
                console.error('[CAL_REFRESH_TOKEN_ERROR]', {
                  context: 'DB_UPDATE',
                  error: updateError,
                  timestamp: new Date().toISOString()
                });
                
                // Still return the tokens even if DB update failed
                return NextResponse.json({
                  success: true,
                  data: {
                    accessToken: forceRefreshData.data.accessToken,
                    refreshToken: forceRefreshData.data.refreshToken,
                    accessTokenExpiresAt: forceRefreshData.data.accessTokenExpiresAt
                  },
                  method: 'force-refresh',
                  warning: 'Token was refreshed but database update failed'
                });
              }
            }
            
            return NextResponse.json({
              success: true,
              data: {
                accessToken: forceRefreshData.data.accessToken,
                refreshToken: forceRefreshData.data.refreshToken,
                accessTokenExpiresAt: forceRefreshData.data.accessTokenExpiresAt
              },
              method: 'force-refresh'
            });
          }
        }
        
        // If force refresh also failed
        console.error('[CAL_REFRESH_TOKEN_ERROR]', {
          context: 'FORCE_REFRESH_FAILED',
          status: forceRefreshResponse.status,
          timestamp: new Date().toISOString()
        });
      }

      return NextResponse.json({
        success: false,
        error: errorDetail || `Token refresh failed with status ${response.status}`
      }, { status: response.status === 401 ? 401 : 500 });
    }

    // Parse successful response
    const tokenData = await response.json();
    
    if (tokenData?.status !== 'success' || !tokenData?.data?.accessToken) {
      console.error('[CAL_REFRESH_TOKEN_ERROR]', {
        context: 'INVALID_RESPONSE',
        response: tokenData,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({
        success: false,
        error: 'Invalid token response from Cal.com'
      }, { status: 500 });
    }

    // If we have the user's ULID, update the token in database
    if (userUlid) {
      const updatedTokens = {
        accessToken: tokenData.data.accessToken,
        refreshToken: tokenData.data.refreshToken,
        accessTokenExpiresAt: tokenData.data.accessTokenExpiresAt
      };
      
      // Use our server action to update the tokens in the database
      const updateResult = await updateCalTokens(userUlid, updatedTokens);
      
      if (!updateResult.success) {
        console.error('[CAL_REFRESH_TOKEN_ERROR]', {
          context: 'DB_UPDATE',
          error: updateResult.error,
          userUlid,
          timestamp: new Date().toISOString()
        });
        
        // Still return the tokens even if DB update failed
        return NextResponse.json({
          success: true,
          data: updatedTokens,
          warning: 'Token was refreshed but database update failed',
          tokenUpdated: false
        });
      }
      
      console.log('[CAL_REFRESH_TOKEN_SUCCESS]', {
        tokenUpdated: true,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json({
        success: true,
        data: updatedTokens,
        method: 'refresh',
        tokenUpdated: true
      });
    }

    // Return the refreshed token
    return NextResponse.json({
      success: true,
      data: {
        accessToken: tokenData.data.accessToken,
        refreshToken: tokenData.data.refreshToken,
        accessTokenExpiresAt: tokenData.data.accessTokenExpiresAt
      }
    });
  } catch (error) {
    console.error('[CAL_REFRESH_TOKEN_ERROR]', {
      context: 'GENERAL',
      error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
} 