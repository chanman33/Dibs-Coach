import { PaymentWebhookHandler } from '@/lib/stripe/webhooks/payment-webhook-handler';

const handler = new PaymentWebhookHandler();

export async function POST(request: Request) {
  return handler.processWebhook(request);
}
