'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function BookingCancelledPage() {
  const searchParams = useSearchParams();
  
  // Log event for debugging
  useEffect(() => {
    console.log('[BOOKING_CANCELLED]', {
      params: Object.fromEntries(searchParams.entries()),
      timestamp: new Date().toISOString()
    });
  }, [searchParams]);
  
  // Get booking details from query params if available
  const bookingUid = searchParams.get('uid');
  const reason = searchParams.get('reason') || 'The booking was cancelled';
  
  return (
    <div className="container mx-auto max-w-md py-12">
      <Card>
        <CardHeader>
          <CardTitle>Booking Cancelled</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle>Booking has been cancelled</AlertTitle>
            <AlertDescription>
              This appointment has been cancelled.
              {bookingUid && <p className="text-sm mt-1">Booking reference: {bookingUid}</p>}
            </AlertDescription>
          </Alert>
          
          {reason && (
            <div className="bg-muted p-4 rounded-md">
              <h3 className="font-medium mb-2">Cancellation details</h3>
              <p className="text-sm text-muted-foreground">{reason}</p>
            </div>
          )}
          
          <div className="flex justify-center space-x-4 pt-4">
            <Button asChild variant="outline">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/schedule">Schedule Again</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 