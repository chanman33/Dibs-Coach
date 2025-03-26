import CalWebhookTest from '@/components/cal/CalWebhookTest';
import { CalIntegrationCheck } from '@/components/cal/CalIntegrationCheck';

export default function CalWebhookTestPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Cal.com Webhook Testing</h1>
      
      {/* Display Cal integration status with redirect link */}
      <CalIntegrationCheck />
      
      <CalWebhookTest />
    </div>
  );
} 