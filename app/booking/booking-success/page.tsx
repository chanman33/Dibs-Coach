"use client"

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarIcon, CheckCircle2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { createAuthClient } from "@/utils/auth";
import { getCalendarLinks } from "@/utils/actions/cal/booking-actions";
import { CalendarLink } from "@/utils/types/booking";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@clerk/nextjs";
import { fetchUserCapabilities } from "@/utils/actions/user-actions";
import { USER_CAPABILITIES } from "@/utils/roles/roles";

export default function BookingSuccessPage() {
  const searchParams = useSearchParams();
  const coachId = searchParams.get("coachId");
  const coachSlug = searchParams.get("slug");
  const startTime = searchParams.get("startTime");
  const endTime = searchParams.get("endTime");
  const bookingUid = searchParams.get("bookingUid");
  const [coachName, setCoachName] = useState("");
  const [calendarLinks, setCalendarLinks] = useState<CalendarLink[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [sessionsPath, setSessionsPath] = useState("/dashboard/sessions");
  const { user } = useUser();
  
  // Determine the correct sessions path based on user capabilities
  useEffect(() => {
    const determineSessionsPath = async () => {
      if (!user) return;
      
      try {
        const result = await fetchUserCapabilities();
        
        if (result.data) {
          const capabilities = result.data.capabilities;
          
          // Check if user has COACH capability
          if (capabilities.includes(USER_CAPABILITIES.COACH)) {
            setSessionsPath("/dashboard/coach/sessions");
          } 
          // Check if user has MENTEE capability
          else if (capabilities.includes(USER_CAPABILITIES.MENTEE)) {
            setSessionsPath("/dashboard/mentee/sessions");
          }
          // Default to general sessions page if no specific capability
          else {
            setSessionsPath("/dashboard/sessions");
          }
        }
      } catch (error) {
        console.error("[FETCH_CAPABILITIES_ERROR]", error);
        // Default to general sessions page on error
        setSessionsPath("/dashboard/sessions");
      }
    };
    
    determineSessionsPath();
  }, [user]);
  
  useEffect(() => {
    if (!coachId && !coachSlug) return;
    
    const fetchCoachInfo = async () => {
      try {
        const supabase = createAuthClient();
        
        // Determine how to find the coach
        if (coachSlug) {
          // If we have a slug, first get the coach profile
          const { data: profileData, error: profileError } = await supabase
            .from("CoachProfile")
            .select("userUlid")
            .eq("profileSlug", coachSlug)
            .single();
            
          if (profileError || !profileData) {
            console.error("[FETCH_COACH_PROFILE_ERROR]", profileError);
            return;
          }
          
          // Then get the user data
          const { data: userData, error: userError } = await supabase
            .from("User")
            .select("firstName, lastName")
            .eq("ulid", profileData.userUlid)
            .single();
            
          if (!userError && userData) {
            setCoachName(`${userData.firstName || ""} ${userData.lastName || ""}`);
          }
        } else if (coachId) {
          // Direct lookup by coach ID
          const { data, error } = await supabase
            .from("User")
            .select("firstName, lastName")
            .eq("ulid", coachId)
            .single();
            
          if (!error && data) {
            setCoachName(`${data.firstName || ""} ${data.lastName || ""}`);
          }
        }
      } catch (error) {
        console.error("[FETCH_COACH_ERROR]", error);
      }
    };
    
    fetchCoachInfo();
  }, [coachId, coachSlug]);
  
  // Fetch calendar links if we have a booking ID
  useEffect(() => {
    if (!bookingUid) return;
    
    const fetchCalendarLinks = async () => {
      try {
        setLoadingLinks(true);
        const result = await getCalendarLinks(bookingUid);
        
        if (result.data) {
          setCalendarLinks(result.data);
        }
      } catch (error) {
        console.error("[FETCH_CALENDAR_LINKS_ERROR]", error);
      } finally {
        setLoadingLinks(false);
      }
    };
    
    fetchCalendarLinks();
  }, [bookingUid]);
  
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
    <div className="container mx-auto py-12 max-w-2xl">
      <Card className="shadow-lg">
        <CardHeader className="text-center bg-green-50 rounded-t-lg">
          <div className="mx-auto mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
          </div>
          <CardTitle className="text-2xl text-green-700">Booking Confirmed!</CardTitle>
          <CardDescription className="text-green-600">
            Your coaching session has been scheduled
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6 space-y-4">
          <div className="border-b pb-4">
            <p className="text-sm text-muted-foreground">Coach</p>
            <p className="font-medium text-lg">{coachName}</p>
          </div>
          
          <div className="border-b pb-4">
            <p className="text-sm text-muted-foreground">Session Time</p>
            <div className="flex items-center mt-1">
              <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              <p className="font-medium">{formatDateTime(startTime)}</p>
            </div>
          </div>
          
          <div className="border-b pb-4">
            <p className="text-sm text-muted-foreground">Session Duration</p>
            <p className="font-medium">
              {startTime && endTime ? (
                `${(new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60)} minutes`
              ) : (
                "Not specified"
              )}
            </p>
          </div>
          
          {/* Calendar Links */}
          {bookingUid && (
            <div className="border-b pb-4">
              <p className="text-sm text-muted-foreground mb-2">Add to Calendar</p>
              {loadingLinks ? (
                <div className="space-y-2">
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ) : calendarLinks.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {calendarLinks.map((link, index) => (
                    <Button 
                      key={index} 
                      variant="outline" 
                      className="text-xs justify-start"
                      asChild
                    >
                      <Link href={link.link} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{link.label}</span>
                      </Link>
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Calendar links not available
                </p>
              )}
            </div>
          )}
          
          <div className="bg-blue-50 p-4 rounded-lg mt-6">
            <p className="text-blue-700 text-sm">
              You'll receive a confirmation email shortly with details about your session.
              The coach will also be notified about this booking.
            </p>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Button variant="outline" asChild>
            <Link href="/">Return to Dashboard</Link>
          </Button>
          <Button asChild>
            <Link href={sessionsPath}>View My Sessions</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
