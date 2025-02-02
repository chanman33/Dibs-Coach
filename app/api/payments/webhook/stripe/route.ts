import { DisputeWebhookHandler } from '@/lib/stripe/webhooks/dispute-webhook-handler';

const handler = new DisputeWebhookHandler();

export async function POST(request: Request) {
  return handler.processWebhook(request);
} 