"use client";

import { useState, useEffect } from "react";
import { Check, Clock, RotateCw, Loader2, Trash, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { syncCalendarSchedules } from "@/utils/actions/cal-integration-actions";
import { formatDay, formatTime } from "@/utils/date-time";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CoachingSchedule, SCHEDULE_SYNC_SOURCE } from "@/utils/types/schedule";

export default function CalAvailabilityPage() {
  const [schedules, setSchedules] = useState<CoachingSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedules = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/cal/test/availability");
      if (!response.ok) {
        throw new Error(`Failed to fetch schedules: ${response.status}`);
      }
      const data = await response.json();
      setSchedules(data.schedules || []);
    } catch (err) {
      console.error("Error fetching schedules:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      toast.error("Failed to load schedules");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const createSchedule = async () => {
    try {
      const response = await fetch("/api/cal/test/availability", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `New Schedule ${new Date().toLocaleTimeString()}`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create schedule");
      }

      toast.success("Schedule created successfully");
      fetchSchedules();
    } catch (error) {
      console.error("Error creating schedule:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create schedule");
    }
  };

  const deleteSchedule = async (id: number) => {
    try {
      const response = await fetch(`/api/cal/test/availability/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete schedule");
      }

      toast.success("Schedule deleted successfully");
      fetchSchedules();
    } catch (error) {
      console.error("Error deleting schedule:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete schedule");
    }
  };

  const syncSchedules = async () => {
    setSyncing(true);
    try {
      const result = await syncCalendarSchedules();
      
      // Check if there's an error in the API response
      if (result.error) {
        // If the error object is a string, use it directly
        const errorMessage = typeof result.error === 'string' 
          ? result.error 
          : (result.error.message || "Failed to sync schedules");
          
        throw new Error(errorMessage);
      }
      
      toast.success("Schedules synchronized successfully");
      fetchSchedules();
    } catch (error) {
      console.error("Error syncing schedules:", error);
      toast.error(error instanceof Error ? error.message : "Failed to sync schedules");
    } finally {
      setSyncing(false);
    }
  };

  const ScheduleCard = ({ schedule }: { schedule: CoachingSchedule }) => {
    // Determine if this is a read-only or default schedule
    const isDefault = schedule.name.toLowerCase().includes("default");
    const isReadOnly = schedule.syncSource === SCHEDULE_SYNC_SOURCE.CALCOM;
    
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">{schedule.name}</CardTitle>
              <CardDescription>
                {schedule.timeZone}
                {isDefault && <Badge className="ml-2 bg-blue-500">Default</Badge>}
                {isReadOnly && <Badge className="ml-2 bg-amber-500">Read-only</Badge>}
                {schedule.syncSource && (
                  <Badge className="ml-2 bg-green-500" variant="outline">
                    {schedule.syncSource}
                  </Badge>
                )}
              </CardDescription>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    disabled={isDefault || isReadOnly}
                    onClick={() => deleteSchedule(schedule.calScheduleId || 0)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isDefault || isReadOnly
                    ? "Cannot delete default or read-only schedules"
                    : "Delete this schedule"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="font-medium">Working Hours:</div>
            {schedule.availability && schedule.availability.length > 0 ? (
              <div className="grid grid-cols-1 gap-1">
                {schedule.availability.map((slot, index) => (
                  <div key={index} className="flex items-center text-xs">
                    <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                    <span className="font-medium">{formatDay(slot.days)}</span>
                    <span className="mx-1">•</span>
                    <span>
                      {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">No availability configured</div>
            )}
          </div>
        </CardContent>
        <CardFooter className="pt-1 text-xs text-muted-foreground">
          ID: {schedule.calScheduleId || "N/A"}
          {schedule.lastSyncedAt && (
            <span className="ml-auto flex items-center">
              <RefreshCw className="h-3 w-3 mr-1" />
              Last synced: {new Date(schedule.lastSyncedAt).toLocaleString()}
            </span>
          )}
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Cal.com Availability</h1>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={fetchSchedules} 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </>
            )}
          </Button>
          <Button 
            variant="default" 
            onClick={syncSchedules} 
            disabled={syncing}
          >
            {syncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RotateCw className="mr-2 h-4 w-4" />
                Sync Schedules
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={createSchedule} 
            disabled={loading}
          >
            <Check className="mr-2 h-4 w-4" />
            Create New Schedule
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">
          <p className="font-medium">Error loading schedules</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schedules.length > 0 ? (
            schedules.map((schedule) => (
              <ScheduleCard key={schedule.ulid} schedule={schedule} />
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <p className="text-lg">No schedules found</p>
              <p className="text-sm mt-2">
                Click &quot;Create New Schedule&quot; to create your first availability schedule
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 