import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Server, Database, Globe, Clock } from "lucide-react";

export default async function MonitoringPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">System Monitoring</h1>
        <Badge variant="outline" className="px-4 py-1">
          Development Mode
        </Badge>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Status</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Operational</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database Status</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Connected</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">External Services</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>All Operational</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <span>{new Date().toLocaleTimeString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
          <TabsTrigger value="errors">Error Logs</TabsTrigger>
          <TabsTrigger value="integrations">Integration Status</TabsTrigger>
          <TabsTrigger value="security">Security Events</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <h4 className="font-medium">Development Mode Notice</h4>
                  <AlertDescription>
                    Performance metrics will be available in production environment. Consider implementing:
                    <ul className="list-disc list-inside mt-2">
                      <li>API Response Times</li>
                      <li>Database Query Performance</li>
                      <li>Memory Usage</li>
                      <li>CPU Utilization</li>
                      <li>Request/Response Latency</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Error Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <h4 className="font-medium">Development Mode Notice</h4>
                <AlertDescription>
                  Error logging will be implemented to track:
                  <ul className="list-disc list-inside mt-2">
                    <li>API Errors</li>
                    <li>Database Errors</li>
                    <li>Authentication Failures</li>
                    <li>Integration Errors</li>
                    <li>Rate Limit Violations</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integration Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Supabase</span>
                  </div>
                  <Badge>Connected</Badge>
                </div>
                <div className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Clerk</span>
                  </div>
                  <Badge>Connected</Badge>
                </div>
                <div className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />

                    <span>Calendly</span>
                  </div>
                  <Badge>Connected</Badge>
                </div>
                <div className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Zoom</span>
                  </div>
                  <Badge>Connected</Badge>
                </div>
                <div className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Stripe</span>
                  </div>
                  <Badge>Connected</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Events</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <h4 className="font-medium">Development Mode Notice</h4>
                <AlertDescription>
                  Security monitoring will track:
                  <ul className="list-disc list-inside mt-2">
                    <li>Failed Login Attempts</li>
                    <li>Permission Changes</li>
                    <li>API Key Usage</li>
                    <li>Suspicious Activities</li>
                    <li>Data Access Patterns</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
