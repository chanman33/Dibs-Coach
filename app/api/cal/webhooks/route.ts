import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient } from '@/utils/auth';
import { calWebhookService } from '@/lib/cal/cal-webhook';
import { CalTokenService } from '@/lib/cal/cal-service';
import { env } from '@/lib/env';
import { getAuthenticatedUserUlid, getAuthenticatedCalUser } from '@/utils/auth';

export const dynamic = 'force-dynamic';

/**
 * GET - List all webhooks for the current user
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate the request using our helper
    const authResult = await getAuthenticatedCalUser();
    if (authResult.error || !authResult.data) {
      console.error('[LIST_WEBHOOKS_ERROR] Authentication failed:', authResult.error);
      return NextResponse.json(
        { error: authResult.error?.message || 'Authentication failed' },
        { status: authResult.error?.code === 'UNAUTHORIZED' ? 401 : 500 }
      );
    }
    
    const { userUlid, calManagedUserId } = authResult.data;
    
    // Get the user's access token using the token service
    const tokenResult = await CalTokenService.ensureValidToken(userUlid);
    
    if (!tokenResult.success) {
      console.error('[LIST_WEBHOOKS_ERROR] Failed to get valid token:', tokenResult.error);
      return NextResponse.json({ error: 'Failed to get valid token' }, { status: 401 });
    }
    
    // List all webhooks
    const webhooks = await calWebhookService.listWebhooks(tokenResult.accessToken);
    
    return NextResponse.json({ webhooks });
  } catch (error) {
    console.error('[LIST_WEBHOOKS_ERROR]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list webhooks' },
      { status: 500 }
    );
  }
}

/**
 * POST - Register a new webhook for the current user
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate the request using our helper
    const authResult = await getAuthenticatedUserUlid();
    if (authResult.error || !authResult.data) {
      console.error('[REGISTER_WEBHOOK_ERROR] Authentication failed:', authResult.error);
      return NextResponse.json(
        { error: authResult.error?.message || 'Authentication failed' },
        { status: authResult.error?.code === 'UNAUTHORIZED' ? 401 : 500 }
      );
    }
    
    const userUlid = authResult.data.userUlid;
    
    // Get the request body
    const body = await request.json();
    const { subscriberUrl, eventTriggers } = body;
    
    if (!subscriberUrl) {
      return NextResponse.json(
        { error: 'Subscriber URL is required' },
        { status: 400 }
      );
    }
    
    // Get the user's access token using the token service
    const tokenResult = await CalTokenService.ensureValidToken(userUlid);
    
    if (!tokenResult.success) {
      console.error('[REGISTER_WEBHOOK_ERROR] Failed to get valid token:', tokenResult.error);
      return NextResponse.json({ error: 'Failed to get valid token' }, { status: 401 });
    }
    
    // Register the webhook
    const webhook = await calWebhookService.registerWebhook(
      tokenResult.accessToken,
      subscriberUrl,
      eventTriggers
    );
    
    return NextResponse.json({ webhook });
  } catch (error) {
    console.error('[REGISTER_WEBHOOK_ERROR]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to register webhook' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Ensure a webhook exists for the current user
 */
export async function PUT(request: NextRequest) {
  try {
    // Authenticate the request using our helper
    const authResult = await getAuthenticatedUserUlid();
    if (authResult.error || !authResult.data) {
      console.error('[ENSURE_WEBHOOK_ERROR] Authentication failed:', authResult.error);
      return NextResponse.json(
        { error: authResult.error?.message || 'Authentication failed' },
        { status: authResult.error?.code === 'UNAUTHORIZED' ? 401 : 500 }
      );
    }
    
    const userUlid = authResult.data.userUlid;
    
    // Get the request body or use default settings
    let subscriberUrl: string;
    let eventTriggers: string[] = ['BOOKING_CREATED', 'BOOKING_RESCHEDULED', 'BOOKING_CANCELLED'];
    
    try {
      const body = await request.json();
      subscriberUrl = body.subscriberUrl || calWebhookService.getWebhookUrl();
      eventTriggers = body.eventTriggers || eventTriggers;
    } catch (e) {
      // If no body, use default webhook URL
      subscriberUrl = calWebhookService.getWebhookUrl();
    }
    
    // Get the user's access token using the token service
    const tokenResult = await CalTokenService.ensureValidToken(userUlid);
    
    if (!tokenResult.success) {
      console.error('[ENSURE_WEBHOOK_ERROR] Failed to get valid token:', tokenResult.error);
      return NextResponse.json({ error: 'Failed to get valid token' }, { status: 401 });
    }
    
    // Ensure the webhook exists
    const webhook = await calWebhookService.ensureWebhookExists(
      tokenResult.accessToken,
      subscriberUrl,
      eventTriggers
    );
    
    return NextResponse.json({ 
      success: true,
      webhook,
      message: 'Webhook has been registered or updated' 
    });
  } catch (error) {
    console.error('[ENSURE_WEBHOOK_ERROR]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to ensure webhook exists' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a webhook
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate the request using our helper
    const authResult = await getAuthenticatedUserUlid();
    if (authResult.error || !authResult.data) {
      console.error('[DELETE_WEBHOOK_ERROR] Authentication failed:', authResult.error);
      return NextResponse.json(
        { error: authResult.error?.message || 'Authentication failed' },
        { status: authResult.error?.code === 'UNAUTHORIZED' ? 401 : 500 }
      );
    }
    
    const userUlid = authResult.data.userUlid;
    
    // Get the webhook ID from the query params
    const { searchParams } = new URL(request.url);
    const webhookId = searchParams.get('id');
    
    if (!webhookId) {
      return NextResponse.json(
        { error: 'Webhook ID is required' },
        { status: 400 }
      );
    }
    
    // Get the user's access token using the token service
    const tokenResult = await CalTokenService.ensureValidToken(userUlid);
    
    if (!tokenResult.success) {
      console.error('[DELETE_WEBHOOK_ERROR] Failed to get valid token:', tokenResult.error);
      return NextResponse.json({ error: 'Failed to get valid token' }, { status: 401 });
    }
    
    // Delete the webhook
    const success = await calWebhookService.deleteWebhook(tokenResult.accessToken, parseInt(webhookId));
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete webhook' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE_WEBHOOK_ERROR]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete webhook' },
      { status: 500 }
    );
  }
} 