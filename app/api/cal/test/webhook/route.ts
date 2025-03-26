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
    // Ensure webhook secret is configured
    if (!env.CAL_WEBHOOK_SECRET) {
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
    } catch (error) {
      return NextResponse.json({
        success: false,
        message: 'Invalid JSON payload',
        error: 'The request body must be valid JSON'
      }, { status: 400 });
    }
    
    // Generate a signature
    let signature;
    try {
      signature = generateWebhookSignature(JSON.stringify(payload));
    } catch (error) {
      return NextResponse.json({
        success: false,
        message: 'Failed to generate webhook signature',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
    
    // Forward the request to the webhook endpoint
    let response;
    try {
      response = await fetch(new URL('/api/cal/webhooks/receiver', request.url), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Cal-Signature-256': signature,
          'X-Test-Mode': 'true'
        },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      return NextResponse.json({
        success: false,
        message: 'Failed to forward request to webhook endpoint',
        error: error instanceof Error ? error.message : 'Network error'
      }, { status: 500 });
    }
    
    // Parse the response from the webhook endpoint
    let responseData;
    try {
      responseData = await response.json();
    } catch (error) {
      return NextResponse.json({
        success: false,
        message: 'Invalid response from webhook endpoint',
        error: 'The webhook endpoint returned an invalid response'
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: response.ok,
      message: response.ok ? 'Webhook processed successfully' : 'Failed to process webhook',
      data: responseData,
      statusCode: response.status
    });
  } catch (error) {
    console.error('[WEBHOOK_TEST_ERROR]', {
      error, 
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json({
      success: false,
      message: 'Error processing webhook test',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 