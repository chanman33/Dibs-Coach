import { env } from '@/lib/env';

interface CalWebhook {
  id: number;
  userId: number | null;
  eventTriggers: string[];
  subscriberUrl: string;
  active: boolean;
  payloadTemplate: string | null;
  createdAt: string;
  updatedAt: string;
}

interface WebhookResponse {
  webhooks: CalWebhook[];
}

interface WebhookResponseSingle {
  webhook: CalWebhook;
}

export const calWebhookService = {
  /**
   * Register a new webhook with Cal.com
   * @param calAccessToken The Cal.com access token to use for authentication
   * @param webhookUrl The URL to receive webhook events
   * @param eventTriggers Array of event triggers (e.g., BOOKING_CREATED)
   * @param appId Optional app ID if registering from an app
   * @returns The created webhook
   */
  async registerWebhook(
    calAccessToken: string, 
    webhookUrl: string,
    eventTriggers: string[] = ['BOOKING_CREATED', 'BOOKING_RESCHEDULED', 'BOOKING_CANCELLED'],
    appId?: number
  ): Promise<CalWebhook> {
    const body: any = {
      subscriberUrl: webhookUrl,
      eventTriggers,
      active: true
    };
    
    if (appId) {
      body.appId = appId;
    }
    
    const response = await fetch('https://api.cal.com/v2/webhooks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${calAccessToken}`,
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to register Cal.com webhook: ${JSON.stringify(error)}`);
    }
    
    const data = await response.json() as WebhookResponseSingle;
    return data.webhook;
  },
  
  /**
   * List all webhooks for a Cal.com user
   * @param calAccessToken The Cal.com access token to use for authentication
   * @returns List of webhooks
   */
  async listWebhooks(calAccessToken: string): Promise<CalWebhook[]> {
    const response = await fetch('https://api.cal.com/v2/webhooks', {
      headers: {
        Authorization: `Bearer ${calAccessToken}`,
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to list Cal.com webhooks: ${JSON.stringify(error)}`);
    }
    
    const data = await response.json() as WebhookResponse;
    return data.webhooks;
  },
  
  /**
   * Delete a webhook
   * @param calAccessToken The Cal.com access token to use for authentication
   * @param webhookId The ID of the webhook to delete
   * @returns Success status
   */
  async deleteWebhook(calAccessToken: string, webhookId: number): Promise<boolean> {
    const response = await fetch(`https://api.cal.com/v2/webhooks/${webhookId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${calAccessToken}`,
      },
    });
    
    return response.ok;
  },
  
  /**
   * Ensure a webhook exists for a user
   * Checks if a webhook already exists with the desired URL and event triggers, 
   * creates one if it doesn't, or updates an existing one if needed
   * @param calAccessToken The Cal.com access token to use for authentication
   * @param webhookUrl The URL to receive webhook events
   * @param eventTriggers Array of event triggers
   * @returns The webhook
   */
  async ensureWebhookExists(
    calAccessToken: string, 
    webhookUrl: string,
    eventTriggers: string[] = ['BOOKING_CREATED', 'BOOKING_RESCHEDULED', 'BOOKING_CANCELLED']
  ): Promise<CalWebhook> {
    try {
      // List existing webhooks
      const webhooks = await this.listWebhooks(calAccessToken);
      
      // Check if a webhook with this URL already exists
      const existingWebhook = webhooks.find(webhook => webhook.subscriberUrl === webhookUrl);
      
      if (existingWebhook) {
        // Check if the event triggers match
        const hasAllTriggers = eventTriggers.every(trigger => 
          existingWebhook.eventTriggers.includes(trigger)
        );
        
        if (hasAllTriggers && existingWebhook.active) {
          // Webhook already exists with the correct settings
          return existingWebhook;
        }
        
        // Delete the existing webhook to recreate it with updated settings
        await this.deleteWebhook(calAccessToken, existingWebhook.id);
      }
      
      // Create a new webhook
      return await this.registerWebhook(calAccessToken, webhookUrl, eventTriggers);
    } catch (error) {
      console.error('[CAL_WEBHOOK_ERROR]', error);
      throw error;
    }
  },
  
  /**
   * Helper to generate the webhook URL for a specific environment
   * @returns The full webhook URL
   */
  getWebhookUrl(): string {
    const baseDomain = env.FRONTEND_URL;
    return `${baseDomain}/api/cal/webhooks/receiver`;
  }
}; 