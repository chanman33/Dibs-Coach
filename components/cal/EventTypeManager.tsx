'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Info } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { EventTypeCard, type EventType } from './EventTypeCard'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface EventTypeManagerProps {
  initialEventTypes?: EventType[];
  onEventTypesChange?: (eventTypes: EventType[]) => void;
}

// Required event types that every coach must have
const requiredEventTypes: EventType[] = [
  {
    id: 'required-coaching-session',
    name: 'Coaching Session',
    description: '30-minute 1:1 coaching video call',
    duration: 30,
    free: false,
    enabled: true,
    isDefault: true,
    isRequired: true, // New property to mark as permanent
    schedulingType: 'MANAGED',
    // Default Cal.com integration settings
    bookerLayouts: {
      defaultLayout: 'month',
      enabledLayouts: ['month', 'week', 'column']
    },
    locations: [
      {
        type: 'integrations:daily',
        displayName: 'Video Call'
      }
    ],
    minimumBookingNotice: 0,
    beforeEventBuffer: 5,
    afterEventBuffer: 5
  },
  {
    id: 'required-intro-session',
    name: 'Get to Know You',
    description: '15-minute goal setting and introduction session',
    duration: 15,
    free: true,
    enabled: true,
    isDefault: true,
    isRequired: true, // New property to mark as permanent
    canDisable: true, // Can be disabled but not deleted
    schedulingType: 'MANAGED',
    // Default Cal.com integration settings
    bookerLayouts: {
      defaultLayout: 'month',
      enabledLayouts: ['month', 'week', 'column']
    },
    locations: [
      {
        type: 'integrations:daily',
        displayName: 'Video Call'
      }
    ],
    minimumBookingNotice: 0,
    beforeEventBuffer: 0,
    afterEventBuffer: 0
  }
];

// Optional default event types
const optionalEventTypes: EventType[] = [
  {
    id: 'extended-coaching-session',
    name: 'Extended Coaching Session',
    description: 'Longer coaching session for complex topics',
    duration: 60,
    free: false,
    enabled: false,
    isDefault: false,
    schedulingType: 'MANAGED',
    // Default Cal.com integration settings
    bookerLayouts: {
      defaultLayout: 'month',
      enabledLayouts: ['month', 'week', 'column']
    },
    locations: [
      {
        type: 'integrations:daily',
        displayName: 'Video Call'
      }
    ],
    minimumBookingNotice: 0,
    beforeEventBuffer: 5,
    afterEventBuffer: 5
  },
  {
    id: 'office-hours',
    name: 'Office Hours',
    description: 'Drop-in coaching at discounted rate',
    duration: 60,
    free: false,
    enabled: false,
    isDefault: false,
    schedulingType: 'OFFICE_HOURS',
    maxParticipants: 5,
    discountPercentage: 30,
    // Default Cal.com integration settings
    bookerLayouts: {
      defaultLayout: 'month',
      enabledLayouts: ['month', 'week', 'column']
    },
    locations: [
      {
        type: 'integrations:daily',
        displayName: 'Video Call'
      }
    ],
    minimumBookingNotice: 0,
    beforeEventBuffer: 0,
    afterEventBuffer: 0
  }
];

export default function EventTypeManager({ initialEventTypes, onEventTypesChange }: EventTypeManagerProps) {
  // Initialize with required event types and merge with existing ones
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEventType, setCurrentEventType] = useState<EventType | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Merge required event types with initial/existing event types
  useEffect(() => {
    if (initialEventTypes && initialEventTypes.length > 0) {
      // Process existing event types
      const mergedEventTypes = [...initialEventTypes];
      
      // Ensure required event types exist and are properly configured
      requiredEventTypes.forEach(requiredType => {
        const existingTypeIndex = mergedEventTypes.findIndex(
          et => et.id === requiredType.id || 
               (et.name?.toLowerCase() === requiredType.name.toLowerCase() && 
                et.duration === requiredType.duration)
        );
        
        if (existingTypeIndex === -1) {
          // Add missing required type
          mergedEventTypes.push({...requiredType});
        } else {
          // Update existing event type to ensure required properties
          const existingType = mergedEventTypes[existingTypeIndex];
          mergedEventTypes[existingTypeIndex] = {
            ...existingType,
            isRequired: true,
            canDisable: requiredType.canDisable || false,
            // For the intro session, allow disabling but keep other properties fixed
            enabled: requiredType.id === 'required-intro-session' ? existingType.enabled : true,
          };
        }
      });
      
      setEventTypes(mergedEventTypes);
    } else {
      // No initial event types, use required and optional defaults
      setEventTypes([...requiredEventTypes, ...optionalEventTypes]);
    }
  }, [initialEventTypes]);

  // Update event types and notify parent component if callback provided
  const updateEventTypes = (newEventTypes: EventType[]) => {
    // Ensure required event types remain in the list
    const updatedTypes = [...newEventTypes];
    
    // Check if required types are present
    requiredEventTypes.forEach(requiredType => {
      const requiredTypeIndex = updatedTypes.findIndex(et => et.id === requiredType.id);
      if (requiredTypeIndex === -1) {
        updatedTypes.push({...requiredType});
      }
    });
    
    setEventTypes(updatedTypes);
    
    if (onEventTypesChange) {
      onEventTypesChange(updatedTypes);
    }
  };

  // Toggle event type active status
  const handleToggleEventType = (id: string, enabled: boolean) => {
    const eventType = eventTypes.find(et => et.id === id);
    
    // Check if this is a required event type that cannot be disabled
    if (eventType?.isRequired && !eventType.canDisable && !enabled) {
      toast.error('This event type cannot be disabled');
      return;
    }
    
    const updatedEventTypes = eventTypes.map(event => 
      event.id === id ? { ...event, enabled } : event
    );
    updateEventTypes(updatedEventTypes);
    toast.success(`${enabled ? 'Activated' : 'Deactivated'} event type`);
  }

  // Open edit dialog
  const handleEditEventType = (id: string) => {
    const eventType = eventTypes.find(event => event.id === id)
    if (eventType) {
      setCurrentEventType(eventType)
      setIsEditing(true)
      setDialogOpen(true)
    }
  }

  // Delete event type
  const handleDeleteEventType = (id: string) => {
    // Check if this is a required event type (cannot be deleted)
    const eventType = eventTypes.find(et => et.id === id);
    if (eventType?.isRequired) {
      toast.error('This event type cannot be deleted');
      return;
    }
    
    const updatedEventTypes = eventTypes.filter(event => event.id !== id);
    updateEventTypes(updatedEventTypes);
    toast.success('Event type deleted');
  }

  // Save event type changes
  const handleSaveEventType = (eventType: EventType) => {
    let updatedEventTypes;
    
    // Check if we're trying to modify a required property of a required event type
    if (isEditing && eventType.isRequired) {
      const originalEventType = eventTypes.find(et => et.id === eventType.id);
      
      // Preserve required properties
      eventType = {
        ...eventType,
        isRequired: true,
        name: originalEventType?.name || eventType.name,
        duration: originalEventType?.duration || eventType.duration,
        free: originalEventType?.free || eventType.free,
        // Allow disabling only if canDisable is true
        enabled: originalEventType?.canDisable ? eventType.enabled : true
      };
      
      // Show a toast if we're preserving settings
      toast.info('Some properties of required event types cannot be changed');
    }
    
    if (isEditing) {
      updatedEventTypes = eventTypes.map(event => 
        event.id === eventType.id ? eventType : event
      );
      toast.success('Event type updated');
    } else {
      // Create a new event with unique ID
      const newEventType = {
        ...eventType,
        id: Date.now().toString()
      };
      updatedEventTypes = [...eventTypes, newEventType];
      toast.success('New event type added');
    }
    
    updateEventTypes(updatedEventTypes);
    setDialogOpen(false);
    setCurrentEventType(null);
    setIsEditing(false);
  }

  // Add new event type
  const handleAddEventType = () => {
    const newEventType: EventType = {
      id: '',
      name: '',
      description: '',
      duration: 30,
      free: false,
      enabled: true,
      isDefault: false,
      isRequired: false,
      schedulingType: 'MANAGED',
      // Default Cal.com integration settings
      bookerLayouts: {
        defaultLayout: 'month',
        enabledLayouts: ['month', 'week', 'column']
      },
      locations: [
        {
          type: 'integrations:daily',
          displayName: 'Video Call'
        }
      ],
      minimumBookingNotice: 0,
      beforeEventBuffer: 0,
      afterEventBuffer: 0
    }
    setCurrentEventType(newEventType)
    setIsEditing(false)
    setDialogOpen(true)
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-1">
              Coaching Session Types
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 cursor-help text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p>Required session types cannot be deleted. The 30-minute coaching session must remain enabled at all times.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            <CardDescription>
              Configure and manage the types of coaching sessions you offer
            </CardDescription>
          </div>
          <Button onClick={handleAddEventType} className="gap-2">
            <Plus className="h-4 w-4" /> Add Event Type
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="relative overflow-x-auto pb-4">
          <div className="flex gap-2 min-w-min">
            {eventTypes.map(eventType => (
              <EventTypeCard 
                key={eventType.id}
                eventType={eventType}
                onEdit={handleEditEventType}
                onDelete={handleDeleteEventType}
                onToggle={handleToggleEventType}
                isRequired={eventType.isRequired || false}
                canDisable={eventType.canDisable || false}
              />
            ))}
          </div>
        </div>
        
        {/* Edit/Add Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Edit Event Type' : 'Add Event Type'}</DialogTitle>
              <DialogDescription>
                Configure the details for this coaching session type
              </DialogDescription>
            </DialogHeader>
            
            {currentEventType && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input 
                    id="name" 
                    placeholder="e.g. Coaching Session" 
                    value={currentEventType.name}
                    onChange={(e) => setCurrentEventType({...currentEventType, name: e.target.value})}
                    disabled={currentEventType.isRequired}
                  />
                  {currentEventType.isRequired && (
                    <p className="text-xs text-muted-foreground">Required event type name cannot be changed</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input 
                    id="description" 
                    placeholder="Brief description of the session" 
                    value={currentEventType.description}
                    onChange={(e) => setCurrentEventType({...currentEventType, description: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="schedulingType">Session Type</Label>
                  <Select 
                    value={currentEventType.schedulingType} 
                    onValueChange={(value: 'MANAGED' | 'OFFICE_HOURS' | 'GROUP_SESSION') => 
                      setCurrentEventType({...currentEventType, schedulingType: value})
                    }
                    disabled={currentEventType.isRequired}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select session type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MANAGED">1:1 Session</SelectItem>
                      <SelectItem value="OFFICE_HOURS">Office Hours</SelectItem>
                      <SelectItem value="GROUP_SESSION">Group Session</SelectItem>
                    </SelectContent>
                  </Select>
                  {currentEventType.isRequired && (
                    <p className="text-xs text-muted-foreground">Required event type format cannot be changed</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Select 
                    value={currentEventType.duration.toString()} 
                    onValueChange={(value) => setCurrentEventType({...currentEventType, duration: parseInt(value)})}
                    disabled={currentEventType.isRequired}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                      <SelectItem value="90">90 minutes</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                  {currentEventType.isRequired && (
                    <p className="text-xs text-muted-foreground">Required event type duration cannot be changed</p>
                  )}
                </div>
                
                {currentEventType.schedulingType === 'OFFICE_HOURS' && (
                  <div className="space-y-2">
                    <Label htmlFor="discountPercentage">Discount Percentage</Label>
                    <Select 
                      value={(currentEventType.discountPercentage || 0).toString()} 
                      onValueChange={(value) => setCurrentEventType({...currentEventType, discountPercentage: parseInt(value)})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select discount" />
                      </SelectTrigger>
                      <SelectContent>
                        {[0, 10, 20, 30, 40, 50].map(num => (
                          <SelectItem key={num} value={num.toString()}>{num}% discount</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {currentEventType.schedulingType === 'GROUP_SESSION' || currentEventType.schedulingType === 'OFFICE_HOURS' && (
                  <div className="space-y-2">
                    <Label htmlFor="maxParticipants">Maximum Participants</Label>
                    <Select 
                      value={(currentEventType.maxParticipants || 10).toString()} 
                      onValueChange={(value) => setCurrentEventType({...currentEventType, maxParticipants: parseInt(value)})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select max participants" />
                      </SelectTrigger>
                      <SelectContent>
                        {[5, 10, 15, 20, 30, 50, 100].map(num => (
                          <SelectItem key={num} value={num.toString()}>{num} participants</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {/* Free session toggle (only for 1:1 sessions) */}
                {currentEventType.schedulingType === 'MANAGED' && !currentEventType.isRequired && (
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="free"
                      checked={currentEventType.free} 
                      onCheckedChange={(checked) => setCurrentEventType({...currentEventType, free: checked})}
                    />
                    <Label htmlFor="free">Free Session</Label>
                  </div>
                )}
                {currentEventType.isRequired && currentEventType.free && (
                  <div className="flex items-center space-x-2">
                    <Switch id="free" checked={true} disabled />
                    <Label htmlFor="free">Free Session</Label>
                    <span className="text-xs text-muted-foreground">(Required)</span>
                  </div>
                )}
                {currentEventType.isRequired && !currentEventType.free && (
                  <div className="flex items-center space-x-2">
                    <Switch id="free" checked={false} disabled />
                    <Label htmlFor="free">Free Session</Label>
                    <span className="text-xs text-muted-foreground">(Paid session required)</span>
                  </div>
                )}
                
                {/* Active toggle */}
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="active"
                    checked={currentEventType.enabled} 
                    onCheckedChange={(checked) => setCurrentEventType({...currentEventType, enabled: checked})}
                    disabled={currentEventType.isRequired && !currentEventType.canDisable}
                  />
                  <Label htmlFor="active">Active</Label>
                  {currentEventType.isRequired && !currentEventType.canDisable && (
                    <span className="text-xs text-muted-foreground">(Required)</span>
                  )}
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={() => currentEventType && handleSaveEventType(currentEventType)}>
                {isEditing ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
} 