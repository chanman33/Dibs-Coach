"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import Link from "next/link";

export default function BookingCancelledPage() {
  return (
    <div className="container mx-auto py-12 max-w-md">
      <Card className="shadow-lg">
        <CardHeader className="text-center bg-rose-50 rounded-t-lg">
          <div className="mx-auto mb-4">
            <XCircle className="h-16 w-16 text-rose-500 mx-auto" />
          </div>
          <CardTitle className="text-2xl text-rose-700">Booking Cancelled</CardTitle>
        </CardHeader>
        
        <CardContent className="pt-6">
          <p className="text-center mb-4">
            Your booking has been cancelled. You can book a new coaching session at any time.
          </p>
          
          <div className="bg-blue-50 p-4 rounded-lg mt-4">
            <p className="text-blue-700 text-sm text-center">
              If you cancelled by mistake, please return to the coach's profile 
              and start a new booking process.
            </p>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-center">
          <Button asChild>
            <Link href="/">Return Home</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
