import CalWebhookTest from '@/components/cal/CalWebhookTest';
import { CalIntegrationCheck } from '@/components/cal/CalIntegrationCheck';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function CalWebhookTestPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Scheduling Webhook Testing</h1>
      
      {/* Display scheduling integration status with redirect link */}
      <div className="mb-6">
        <CalIntegrationCheck />
      </div>
      
      <Alert className="mb-6 bg-amber-50 border-amber-200">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertTitle>Developer Testing Tool</AlertTitle>
        <AlertDescription>
          This page is for testing webhook integrations. Visit the <Link href="/dashboard/settings?tab=integrations" className="underline">settings page</Link> to set up scheduling for your account.
        </AlertDescription>
      </Alert>
      
      <CalWebhookTest />
    </div>
  );
} 