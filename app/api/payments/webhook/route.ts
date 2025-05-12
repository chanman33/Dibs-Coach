import { PaymentWebhookHandler } from '@/lib/stripe/webhooks/payment-webhook-handler';

export const dynamic = 'force-dynamic';

const handler = new PaymentWebhookHandler();

export async function POST(request: Request) {
  return handler.processWebhook(request);
}
