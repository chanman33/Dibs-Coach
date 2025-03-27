'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function BookingSuccessPage() {
  const searchParams = useSearchParams();
  
  // Log event for debugging
  useEffect(() => {
    console.log('[BOOKING_SUCCESS]', {
      params: Object.fromEntries(searchParams.entries()),
      timestamp: new Date().toISOString()
    });
  }, [searchParams]);
  
  // Get booking details from query params if available
  const bookingUid = searchParams.get('uid');
  const title = searchParams.get('title') || 'New appointment';
  
  return (
    <div className="container mx-auto max-w-md py-12">
      <Card>
        <CardHeader>
          <CardTitle>Booking Confirmed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle>Success!</AlertTitle>
            <AlertDescription>
              Your booking has been successfully created.
              {bookingUid && <p className="text-sm mt-1">Booking reference: {bookingUid}</p>}
            </AlertDescription>
          </Alert>
          
          <div className="bg-muted p-4 rounded-md">
            <h3 className="font-medium mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground">
              You'll receive an email confirmation with all the details of your appointment.
            </p>
          </div>
          
          <div className="flex justify-center space-x-4 pt-4">
            <Button asChild variant="secondary">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 