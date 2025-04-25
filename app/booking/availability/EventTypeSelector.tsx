import { Clock, CheckCircle, Video, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { CalEventType } from "@/utils/types/coach-availability";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { SessionTypeEmoji } from "@/components/emoji/SessionTypeEmoji";

interface EventTypeSelectorProps {
  eventTypes: CalEventType[];
  selectedEventTypeId: string | null;
  onSelectEventType: (id: string) => void;
  isLoading?: boolean;
}

export function EventTypeSelector({
  eventTypes,
  selectedEventTypeId,
  onSelectEventType,
  isLoading = false
}: EventTypeSelectorProps) {
  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Session Type
          </CardTitle>
          <CardDescription>
            Loading available session types...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full whitespace-nowrap pb-4">
            <div className="flex space-x-4 pb-1">
              {[1, 2, 3].map(i => (
                <div 
                  key={i}
                  className="flex-shrink-0 w-[260px] rounded-lg overflow-hidden ring-1 ring-border"
                >
                  <div className="p-5 space-y-3">
                    <div className="flex justify-between items-start">
                      <Skeleton className="h-6 w-36" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <div className="pt-1 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-20" />
                      <div className="flex flex-wrap gap-1 pt-1">
                        <Skeleton className="h-6 w-24 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="mt-1" />
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  if (!eventTypes || eventTypes.length === 0) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Session Type
          </CardTitle>
          <CardDescription>
            No session types available
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-6">
            This coach doesn't have any session types configured.
            They may need to set up their Cal.com integration.
          </div>
        </CardContent>
      </Card>
    );
  }

  // If we only have one event type, auto-select it
  if (eventTypes.length === 1 && !selectedEventTypeId) {
    setTimeout(() => onSelectEventType(eventTypes[0].id), 0);
  }

  const getDisplayName = (eventType: CalEventType) => {
    return eventType.title || eventType.name || "Coaching Session";
  };

  const getDuration = (eventType: CalEventType) => {
    return eventType.length || eventType.duration || 30;
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Session Type
        </CardTitle>
        <CardDescription>
          Choose the type of session you'd like to book
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full whitespace-nowrap pb-4">
          <div className="flex space-x-4 pb-1">
            {eventTypes.map((eventType) => {
              const isSelected = selectedEventTypeId === eventType.id;
              return (
                <div 
                  key={eventType.id}
                  className={cn(
                    "flex-shrink-0 w-[260px] cursor-pointer transition-all duration-200",
                    "hover:shadow-md rounded-lg overflow-hidden border",
                    isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  )}
                  onClick={() => onSelectEventType(eventType.id)}
                >
                  <div className="p-4 relative">
                    {isSelected && (
                      <div className="absolute right-3 top-3">
                        <CheckCircle className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    
                    <div className="flex items-center mb-2">
                      <SessionTypeEmoji 
                        type={getDisplayName(eventType)}
                        schedulingType={eventType.schedulingType}
                        className="text-xl mr-2"
                      />
                      <h3 className="font-medium text-base text-foreground">
                        {getDisplayName(eventType)}
                      </h3>
                    </div>
                    
                    {eventType.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3 leading-snug">
                        {eventType.description}
                      </p>
                    )}
                    
                    <div className="space-y-1.5">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-1.5 text-primary" /> 
                        {getDuration(eventType)} minutes
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Video className="h-4 w-4 mr-1.5 text-primary" /> 
                        Video call
                      </div>
                      
                      <div className="flex flex-wrap gap-1 pt-2">
                        {eventType.schedulingType === 'OFFICE_HOURS' && (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                            Office Hours
                          </Badge>
                        )}
                        
                        {eventType.schedulingType === 'GROUP_SESSION' && (
                          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                            Group Session
                          </Badge>
                        )}
                        
                        {eventType.schedulingType !== 'OFFICE_HOURS' && 
                          eventType.schedulingType !== 'GROUP_SESSION' && (
                          <Badge variant="secondary" className="bg-primary/10 text-primary">
                            1:1 Session
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" className="mt-1" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 