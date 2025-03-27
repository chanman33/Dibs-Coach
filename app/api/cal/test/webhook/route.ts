import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import crypto from 'crypto';

/**
 * Generate a webhook signature for testing
 */
function generateWebhookSignature(payload: string): string {
  // Validate webhook secret is configured
  if (!env.CAL_WEBHOOK_SECRET) {
    throw new Error('CAL_WEBHOOK_SECRET is not configured. Please add it to your environment variables.');
  }

  try {
    const hmac = crypto.createHmac('sha256', env.CAL_WEBHOOK_SECRET);
    const digest = hmac.update(payload).digest('hex');
    return `sha256=${digest}`;
  } catch (error) {
    console.error('[WEBHOOK_TEST_ERROR] Failed to generate signature:', error);
    throw new Error('Failed to generate webhook signature');
  }
}

/**
 * Test the Cal.com webhook with server-generated signature
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[CAL_WEBHOOK_TEST] Processing webhook test request', {
      timestamp: new Date().toISOString()
    });

    // Ensure webhook secret is configured
    if (!env.CAL_WEBHOOK_SECRET) {
      console.error('[CAL_WEBHOOK_TEST_ERROR] Webhook secret is not configured', {
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({
        success: false,
        message: 'Cal.com webhook secret is not configured',
        error: 'Missing CAL_WEBHOOK_SECRET environment variable'
      }, { status: 500 });
    }

    // Parse the request body
    let payload;
    try {
      payload = await request.json();
      console.log('[CAL_WEBHOOK_TEST] Received webhook payload', {
        type: payload.type || payload.triggerEvent,
        uid: payload.payload?.uid,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[CAL_WEBHOOK_TEST_ERROR] Invalid JSON payload', {
        error,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({
        success: false,
        message: 'Invalid JSON payload',
        error: 'The request body must be valid JSON'
      }, { status: 400 });
    }
    
    // Transform payload to match our internal format if needed
    // Cal.com API v2 uses 'type' while our internal code expects 'triggerEvent'
    if (payload.type && !payload.triggerEvent) {
      console.log('[CAL_WEBHOOK_TEST] Transforming payload format', {
        from: 'type',
        to: 'triggerEvent',
        value: payload.type,
        timestamp: new Date().toISOString()
      });
      payload.triggerEvent = payload.type;
    }
    
    // Generate a signature
    let signature;
    try {
      signature = generateWebhookSignature(JSON.stringify(payload));
      console.log('[CAL_WEBHOOK_TEST] Generated webhook signature', {
        signatureLength: signature.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[CAL_WEBHOOK_TEST_ERROR] Failed to generate signature', {
        error,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({
        success: false,
        message: 'Failed to generate webhook signature',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
    
    // Forward the request to the webhook endpoint
    let response;
    try {
      // Use the environment variable instead of the request origin
      const baseUrl = env.FRONTEND_URL;
      
      // Fix protocol for localhost (use http instead of https)
      const fixedBaseUrl = baseUrl.includes('localhost') ? baseUrl.replace('https:', 'http:') : baseUrl;
      // Use the correct API route path
      const webhookUrl = `${fixedBaseUrl}/api/cal/webhooks/receiver`;
      
      console.log('[CAL_WEBHOOK_TEST] Forwarding request to webhook endpoint', {
        environmentUrl: baseUrl,
        fixedUrl: fixedBaseUrl,
        webhookUrl,
        method: 'POST',
        triggerEvent: payload.triggerEvent || payload.type,
        timestamp: new Date().toISOString()
      });
      
      response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Cal-Signature-256': signature,
          'X-Test-Mode': 'true',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      console.log('[CAL_WEBHOOK_TEST] Received response from webhook endpoint', {
        status: response.status,
        ok: response.ok,
        contentType: response.headers.get('content-type'),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[CAL_WEBHOOK_TEST_ERROR] Failed to forward request', {
        error,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({
        success: false,
        message: 'Failed to forward request to webhook endpoint',
        error: error instanceof Error ? error.message : 'Network error'
      }, { status: 500 });
    }
    
    // Parse the response from the webhook endpoint
    let responseData;
    let responseText = '';
    
    try {
      // First try to get the response as text for debugging
      responseText = await response.text();
      
      // Check content type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('[CAL_WEBHOOK_TEST_ERROR] Received non-JSON response', {
          contentType,
          status: response.status,
          responsePreview: responseText.substring(0, 200),
          timestamp: new Date().toISOString()
        });
        
        // Return a meaningful error with details
        return NextResponse.json({
          success: false,
          message: 'Invalid response content type from webhook endpoint',
          error: 'The webhook endpoint returned a non-JSON response',
          statusCode: response.status,
          contentType: contentType || 'undefined',
          details: responseText.substring(0, 500), // Include more of the response for debugging
          solution: 'Check that the webhook endpoint is not redirecting to an authentication page'
        }, { status: 500 });
      }
      
      // Try to parse the text as JSON
      try {
        responseData = JSON.parse(responseText);
        console.log('[CAL_WEBHOOK_TEST] Parsed response data', {
          success: response.ok,
          data: responseData,
          timestamp: new Date().toISOString()
        });
      } catch (jsonError) {
        console.error('[CAL_WEBHOOK_TEST_ERROR] Failed to parse JSON response', {
          error: jsonError,
          responsePreview: responseText.substring(0, 200),
          timestamp: new Date().toISOString()
        });
        
        return NextResponse.json({
          success: false,
          message: 'Invalid JSON response from webhook endpoint',
          error: jsonError instanceof Error ? jsonError.message : 'JSON parse error',
          responseText: responseText.substring(0, 500) // Include more of the response for debugging
        }, { status: 500 });
      }
    } catch (error) {
      console.error('[CAL_WEBHOOK_TEST_ERROR] Invalid response from webhook endpoint', {
        error,
        status: response.status,
        statusText: response.statusText,
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json({
        success: false,
        message: 'Error reading response from webhook endpoint',
        error: error instanceof Error ? error.message : 'Unknown error',
        statusCode: response.status
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: response.ok,
      message: response.ok ? 'Webhook processed successfully' : 'Failed to process webhook',
      data: responseData,
      statusCode: response.status
    });
  } catch (error) {
    console.error('[CAL_WEBHOOK_TEST_ERROR] Unhandled exception', {
      error, 
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json({
      success: false,
      message: 'Error processing webhook test',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 