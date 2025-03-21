'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trash2, RefreshCw, Plus, Check } from 'lucide-react';
import { useAuth } from '@/utils/hooks/useAuth';
import { calWebhookService } from '@/lib/cal/cal-webhook';

interface Webhook {
  id: number;
  subscriberUrl: string;
  eventTriggers: string[];
  active: boolean;
  createdAt: string;
}

export default function CalWebhookManagement() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState({
    'BOOKING_CREATED': true,
    'BOOKING_RESCHEDULED': true,
    'BOOKING_CANCELLED': true,
    'BOOKING_REJECTED': false,
    'BOOKING_REQUESTED': false,
    'MEETING_ENDED': false,
  });
  const [isDefaultEndpoint, setIsDefaultEndpoint] = useState(true);
  const { isSignedIn } = useAuth();

  useEffect(() => {
    if (isSignedIn) {
      fetchWebhooks();
    }
  }, [isSignedIn]);

  const fetchWebhooks = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch('/api/cal/webhooks');
      
      if (!response.ok) {
        throw new Error('Failed to fetch webhooks');
      }
      
      const data = await response.json();
      setWebhooks(data.webhooks || []);
    } catch (err) {
      console.error('[FETCH_WEBHOOKS_ERROR]', err);
      setError('Failed to fetch webhooks. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const registerWebhook = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Determine the URL to use
      const subscriberUrl = isDefaultEndpoint 
        ? calWebhookService.getWebhookUrl() 
        : newWebhookUrl;
      
      if (!isDefaultEndpoint && !newWebhookUrl) {
        throw new Error('Please enter a webhook URL');
      }
      
      // Determine which events to subscribe to
      const eventTriggers = Object.entries(selectedEvents)
        .filter(([_, isSelected]) => isSelected)
        .map(([event]) => event);
      
      if (eventTriggers.length === 0) {
        throw new Error('Please select at least one event trigger');
      }
      
      // Register the webhook
      const response = await fetch('/api/cal/webhooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriberUrl,
          eventTriggers,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to register webhook');
      }
      
      // Refresh the webhook list
      await fetchWebhooks();
      setSuccess('Webhook registered successfully');
      
      // Clear form if it was a custom URL
      if (!isDefaultEndpoint) {
        setNewWebhookUrl('');
      }
    } catch (err) {
      console.error('[REGISTER_WEBHOOK_ERROR]', err);
      setError(err instanceof Error ? err.message : 'Failed to register webhook');
    } finally {
      setIsLoading(false);
    }
  };

  const ensureWebhookExists = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch('/api/cal/webhooks', {
        method: 'PUT',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to ensure webhook exists');
      }
      
      const data = await response.json();
      await fetchWebhooks();
      setSuccess(data.message || 'Default webhook has been set up');
    } catch (err) {
      console.error('[ENSURE_WEBHOOK_ERROR]', err);
      setError(err instanceof Error ? err.message : 'Failed to set up default webhook');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteWebhook = async (id: number) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch(`/api/cal/webhooks?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete webhook');
      }
      
      await fetchWebhooks();
      setSuccess('Webhook deleted successfully');
    } catch (err) {
      console.error('[DELETE_WEBHOOK_ERROR]', err);
      setError(err instanceof Error ? err.message : 'Failed to delete webhook');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEventCheckboxChange = (event: string) => {
    setSelectedEvents(prev => ({
      ...prev,
      [event]: !prev[event as keyof typeof prev]
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };
  
  const toggleUrlInput = () => {
    setIsDefaultEndpoint(!isDefaultEndpoint);
    setNewWebhookUrl('');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cal.com Webhook Management</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Status Messages */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="mb-4 bg-green-50">
              <Check className="h-4 w-4 text-green-600" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          
          {/* One-Click Default Webhook Setup */}
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <h3 className="font-medium mb-2">Quick Setup</h3>
            <p className="text-sm mb-3">
              Register the default webhook endpoint to receive all booking events.
            </p>
            <Button
              onClick={ensureWebhookExists}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Set Up Default Webhook
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              URL: {calWebhookService.getWebhookUrl()}
            </p>
          </div>
          
          {/* Custom Webhook Registration */}
          <div className="mb-6">
            <h3 className="font-medium mb-3">Register New Webhook</h3>
            
            <div className="space-y-4">
              {/* URL Input Toggle */}
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="use-default-url" 
                  checked={isDefaultEndpoint}
                  onCheckedChange={toggleUrlInput}
                />
                <Label 
                  htmlFor="use-default-url" 
                  className="cursor-pointer"
                >
                  Use default endpoint URL
                </Label>
              </div>
              
              {/* Custom URL Input */}
              {!isDefaultEndpoint && (
                <div className="mb-4">
                  <Label htmlFor="webhook-url">Webhook URL</Label>
                  <Input
                    id="webhook-url"
                    placeholder="https://example.com/webhook"
                    value={newWebhookUrl}
                    onChange={(e) => setNewWebhookUrl(e.target.value)}
                    className="mt-1"
                  />
                </div>
              )}
              
              {/* Event Triggers */}
              <div>
                <Label className="mb-2 block">Event Triggers</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(selectedEvents).map(([event, isSelected]) => (
                    <div key={event} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`event-${event}`} 
                        checked={isSelected}
                        onCheckedChange={() => handleEventCheckboxChange(event)}
                      />
                      <Label 
                        htmlFor={`event-${event}`}
                        className="cursor-pointer"
                      >
                        {event.replace('_', ' ')}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Register Button */}
              <Button 
                onClick={registerWebhook} 
                disabled={isLoading}
                className="mt-4"
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Register Webhook
              </Button>
            </div>
          </div>
          
          {/* Existing Webhooks */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium">Existing Webhooks</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchWebhooks} 
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            </div>
            
            {webhooks.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No webhooks registered yet
              </div>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>URL</TableHead>
                      <TableHead>Events</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {webhooks.map((webhook) => (
                      <TableRow key={webhook.id}>
                        <TableCell className="font-mono text-xs break-all">
                          {webhook.subscriberUrl}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {webhook.eventTriggers.slice(0, 2).map((event) => (
                              <Badge key={event} variant="outline" className="text-xs">
                                {event.replace('_', ' ')}
                              </Badge>
                            ))}
                            {webhook.eventTriggers.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{webhook.eventTriggers.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={webhook.active ? "default" : "secondary"} className="text-xs">
                            {webhook.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatDate(webhook.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteWebhook(webhook.id)}
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 