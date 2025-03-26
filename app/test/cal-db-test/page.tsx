import CalDbTest from '@/components/cal/CalDbTest';

export default function CalDbTestPage() {
  return (
    <div className="container mx-auto">
      <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-2xl font-bold mb-4">Cal.com Database Integration Test</h1>
        
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">How this test works:</h2>
          <ul className="list-disc list-inside space-y-1 text-blue-700">
            <li>The <strong>Create Cal User</strong> button creates a temporary test user in your database with a random email</li>
            <li>It then creates a managed user in Cal.com and saves the integration data to your database</li>
            <li>The <strong>Get Cal Integration</strong> button retrieves the most recently created test user's integration</li>
            <li>This test operates independently from your currently logged-in user</li>
          </ul>
        </div>
        
        <CalDbTest />
      </div>
    </div>
  );
} 