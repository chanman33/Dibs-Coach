"use client"

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays } from "lucide-react";
import Link from "next/link";
import { createAuthClient } from "@/utils/auth";

export default function BookingRescheduledPage() {
  const searchParams = useSearchParams();
  const coachId = searchParams.get("coachId");
  const startTime = searchParams.get("startTime");
  const endTime = searchParams.get("endTime");
  const [coachName, setCoachName] = useState("");
  
  useEffect(() => {
    if (!coachId) return;
    
    const fetchCoachInfo = async () => {
      try {
        const supabase = createAuthClient();
        const { data, error } = await supabase
          .from("User")
          .select("firstName, lastName")
          .eq("ulid", coachId)
          .single();
          
        if (!error && data) {
          setCoachName(`${data.firstName || ""} ${data.lastName || ""}`);
        }
      } catch (error) {
        console.error("[FETCH_COACH_ERROR]", error);
      }
    };
    
    fetchCoachInfo();
  }, [coachId]);
  
  // Format date/time for display
  const formatDateTime = (dateTimeStr: string | null) => {
    if (!dateTimeStr) return "";
    try {
      return format(parseISO(dateTimeStr), "EEEE, MMMM d, yyyy 'at' h:mm a");
    } catch (error) {
      return "Invalid date";
    }
  };
  
  return (
    <div className="container mx-auto py-12 max-w-md">
      <Card className="shadow-lg">
        <CardHeader className="text-center bg-blue-50 rounded-t-lg">
          <div className="mx-auto mb-4">
            <CalendarDays className="h-16 w-16 text-blue-500 mx-auto" />
          </div>
          <CardTitle className="text-2xl text-blue-700">Session Rescheduled</CardTitle>
        </CardHeader>
        
        <CardContent className="pt-6 space-y-4">
          <div className="border-b pb-4">
            <p className="text-sm text-muted-foreground">Coach</p>
            <p className="font-medium text-lg">{coachName}</p>
          </div>
          
          <div className="border-b pb-4">
            <p className="text-sm text-muted-foreground">New Session Time</p>
            <p className="font-medium">{formatDateTime(startTime)}</p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">Session Duration</p>
            <p className="font-medium">
              {startTime && endTime ? (
                `${(new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60)} minutes`
              ) : (
                "Not specified"
              )}
            </p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg mt-4">
            <p className="text-blue-700 text-sm text-center">
              Your session has been successfully rescheduled.
              A confirmation email will be sent to you shortly.
            </p>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-center">
          <Button asChild>
            <Link href="/dashboard/sessions">View My Sessions</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
