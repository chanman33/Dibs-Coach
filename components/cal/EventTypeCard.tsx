'use client'

import { Clock, Video, Trash2, Edit2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

// Define event type interface
export interface EventType {
  id: string
  name: string
  description: string
  duration: number
  free: boolean
  enabled: boolean
  isDefault: boolean
  // New fields for Office Hours and Group Sessions
  schedulingType: 'MANAGED' | 'OFFICE_HOURS' | 'GROUP_SESSION'
  maxParticipants?: number
  discountPercentage?: number
  organizationId?: string
  // Additional Cal.com API fields
  bookerLayouts?: {
    defaultLayout: 'month' | 'week' | 'column'
    enabledLayouts: ('month' | 'week' | 'column')[]
  }
  locations?: {
    type: string
    displayName?: string
    address?: string
    public?: boolean
  }[]
  // Buffer settings
  beforeEventBuffer?: number
  afterEventBuffer?: number
  minimumBookingNotice?: number
}

interface EventTypeCardProps {
  eventType: EventType
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onToggle: (id: string, enabled: boolean) => void
  isRequired: boolean
}

export function EventTypeCard({ 
  eventType, 
  onEdit, 
  onDelete, 
  onToggle,
  isRequired 
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
    <Card className={`relative overflow-hidden transition-all ${eventType.enabled ? 'border-primary/30' : 'opacity-70'}`}>
      {eventType.isDefault && (
        <div className="absolute top-0 right-0">
          <Badge variant="outline" className="border-primary text-primary m-3">
            Default
          </Badge>
        </div>
      )}
      
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {eventTypeInfo.icon} {eventType.name}
            </CardTitle>
            <CardDescription className="mt-1">
              {eventType.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="flex items-center text-sm text-muted-foreground">
          <Clock className="h-4 w-4 mr-1 text-primary" /> {eventType.duration} minutes
        </div>
        <div className="flex items-center text-sm text-muted-foreground mt-1">
          <Video className="h-4 w-4 mr-1 text-primary" /> Video call
        </div>
        
        {/* Display badge based on scheduling type */}
        <Badge variant="secondary" className={`mt-2 ${
          eventType.schedulingType === 'OFFICE_HOURS' 
            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' 
            : eventType.schedulingType === 'GROUP_SESSION'
              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
              : eventType.free 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                : 'hidden'
        }`}>
          {eventType.schedulingType === 'OFFICE_HOURS' 
            ? `Office Hours${eventType.discountPercentage ? ` (${eventType.discountPercentage}% off)` : ''}` 
            : eventType.schedulingType === 'GROUP_SESSION'
              ? `Group Session${eventType.maxParticipants ? ` (Max ${eventType.maxParticipants})` : ''}`
              : 'Free session'}
        </Badge>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-2">
        <div className="flex items-center">
          <Label htmlFor={`enable-${eventType.id}`} className="mr-2 text-sm">
            {eventType.enabled ? 'Active' : 'Inactive'}
          </Label>
          <Switch 
            id={`enable-${eventType.id}`} 
            checked={eventType.enabled}
            onCheckedChange={(checked) => onToggle(eventType.id, checked)}
            disabled={isRequired && eventType.isDefault}
          />
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 px-2 text-blue-600" 
            onClick={() => onEdit(eventType.id)}
          >
            <Edit2 className="h-3.5 w-3.5" />
            <span className="sr-only">Edit</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 px-2 text-destructive" 
            onClick={() => onDelete(eventType.id)}
            disabled={isRequired && eventType.isDefault}
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
} 