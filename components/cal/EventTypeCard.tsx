'use client'

import { Clock, Video, Trash2, Edit2, AlertTriangle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { EventType } from '@/utils/types/cal-event-types'

interface EventTypeCardProps {
  eventType: EventType
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onToggle: (id: string, enabled: boolean) => void
  isRequired: boolean
  canDisable?: boolean
}

export function EventTypeCard({ 
  eventType, 
  onEdit, 
  onDelete, 
  onToggle,
  isRequired,
  canDisable = false
}: EventTypeCardProps) {
  // Get appropriate icon and label based on scheduling type
  const getEventTypeInfo = () => {
    switch (eventType.schedulingType) {
      case 'OFFICE_HOURS':
        return {
          icon: '👥',
          label: 'Office Hours',
          color: 'text-orange-600'
        };
      case 'GROUP_SESSION':
        return {
          icon: '👨‍👩‍👧‍👦',
          label: 'Group Session',
          color: 'text-purple-600'
        };
      default:
        return {
          icon: eventType.free ? '🎁' : '⏱️',
          label: '1:1 Session',
          color: 'text-primary'
        };
    }
  };

  const eventTypeInfo = getEventTypeInfo();

  return (
    <Card className="relative overflow-hidden transition-all flex flex-col h-[250px] w-[350px]">
      {/* Changed from absolute positioning to integrated within CardHeader */}
      <CardHeader className="pb-0 space-y-1.5">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg flex items-center gap-2">
            {eventTypeInfo.icon} {eventType.name}
          </CardTitle>
          <div className="flex flex-wrap justify-end gap-1.5 max-w-[160px]">
            {eventType.free && (
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                Free session
              </Badge>
            )}
            
            {eventType.isDefault && !isRequired && (
              <Badge variant="outline" className="border-primary text-primary">
                Default
              </Badge>
            )}

            {eventType.schedulingType === 'OFFICE_HOURS' && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">
                Office Hours{eventType.discountPercentage ? ` (${eventType.discountPercentage}% off)` : ''}
              </Badge>
            )}

            {eventType.schedulingType === 'GROUP_SESSION' && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                Group Session{eventType.maxParticipants ? ` (Max ${eventType.maxParticipants})` : ''}
              </Badge>
            )}
          </div>
        </div>
        <CardDescription className="line-clamp-2 min-h-[40px]">
          {eventType.description.length > 95 ? `${eventType.description.slice(0, 95)}...` : eventType.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-3 pb-1">
        <div className="space-y-1">
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-1.5 text-primary" /> {eventType.duration} minutes
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Video className="h-4 w-4 mr-1.5 text-primary" /> Video call
          </div>
        </div>
      </CardContent>
      
      <div className="mt-auto">
        <CardFooter className="flex justify-between border-t pt-3">
          <div className="flex items-center space-x-2">
            <Switch 
              id={`enable-${eventType.id}`} 
              checked={eventType.enabled}
              onCheckedChange={(checked) => onToggle(eventType.id, checked)}
              disabled={isRequired && !canDisable}
            />
            <Label htmlFor={`enable-${eventType.id}`} className="text-sm">
              {eventType.enabled ? 'Active' : 'Inactive'}
            </Label>
          </div>
          
          {!isRequired ? (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 w-8 p-0" 
                onClick={() => onEdit(eventType.id)}
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span className="sr-only">Edit</span>
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 w-8 p-0 text-destructive" 
                onClick={() => onDelete(eventType.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="sr-only">Delete</span>
              </Button>
            </div>
          ) : (
            <div className="h-8 w-[72px]"></div>
          )}
        </CardFooter>
      </div>
    </Card>
  )
} 