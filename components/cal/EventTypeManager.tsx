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
import { CalSchedulingType } from '@prisma/client' // Import enum

interface EventTypeManagerProps {
  initialEventTypes?: EventType[];
  onEventTypesChange?: (eventTypes: EventType[]) => void;
  onCreateEventType: (eventType: Omit<EventType, 'id' | 'calEventTypeId'>) => Promise<void>;
  onUpdateEventType: (eventType: EventType) => Promise<void>;
  onDeleteEventType: (id: string) => Promise<void>;
  onToggleEventType: (id: string, enabled: boolean) => Promise<void>;
}

export default function EventTypeManager({ 
  initialEventTypes = [], // Default to empty array
  onEventTypesChange,
  onCreateEventType,
  onUpdateEventType,
  onDeleteEventType,
  onToggleEventType
}: EventTypeManagerProps) {
  const [eventTypes, setEventTypes] = useState<EventType[]>(initialEventTypes);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEventType, setCurrentEventType] = useState<EventType | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Directly use initialEventTypes from props
  useEffect(() => {
    setEventTypes(initialEventTypes);
  }, [initialEventTypes]);

  // This local update might be removed if parent handles refetching
  const updateLocalEventTypes = (newEventTypes: EventType[]) => {
    setEventTypes(newEventTypes);
    // Optionally call onEventTypesChange if parent needs immediate state update
    // if (onEventTypesChange) {
    //   onEventTypesChange(newEventTypes);
    // }
  };

  // Toggle event type active status - Calls parent handler
  const handleToggleEventType = async (id: string, enabled: boolean) => {
    const eventType = eventTypes.find(et => et.id === id);
    
    // Check if this is a default/required event type that cannot be disabled
    // Using isDefault as the indicator for now, adjust if needed
    if (eventType?.isDefault && !enabled) {
      toast.error('The default Coaching Session event type cannot be disabled.');
      return;
    }
    
    await onToggleEventType(id, enabled); // Let parent handle API call and refetch
    // Optionally update local state optimistically or rely on refetch
    // const updatedEventTypes = eventTypes.map(event => 
    //   event.id === id ? { ...event, enabled } : event
    // );
    // updateLocalEventTypes(updatedEventTypes);
  }

  // Open edit dialog
  const handleEditEventType = (id: string) => {
    const eventType = eventTypes.find(event => event.id === id)
    if (eventType) {
      // Ensure all expected fields are present, provide defaults if necessary
      const completeEventType: EventType = {
        ...eventType,
        name: eventType.name || '',
        description: eventType.description || '',
        duration: eventType.duration || 30,
        free: eventType.free ?? false, // Use nullish coalescing
        enabled: eventType.enabled ?? true,
        isDefault: eventType.isDefault ?? false,
        schedulingType: eventType.schedulingType || CalSchedulingType.MANAGED, // Default to MANAGED
        maxParticipants: eventType.maxParticipants,
        discountPercentage: eventType.discountPercentage,
        isRequired: eventType.isRequired ?? eventType.isDefault, // Assume default means required for now
        canDisable: eventType.canDisable ?? !eventType.isDefault, // Assume default cannot be disabled unless specified
        bookerLayouts: eventType.bookerLayouts || { defaultLayout: 'month', enabledLayouts: ['month', 'week', 'column'] },
        locations: eventType.locations || [{ type: 'integrations:daily', displayName: 'Video Call' }],
        minimumBookingNotice: eventType.minimumBookingNotice ?? 0,
        beforeEventBuffer: eventType.beforeEventBuffer ?? 0,
        afterEventBuffer: eventType.afterEventBuffer ?? 0,
        // Add other fields as needed
      };
      setCurrentEventType(completeEventType);
      setIsEditing(true);
      setDialogOpen(true);
    }
  }

  // Delete event type - Calls parent handler
  const handleDeleteEventType = async (id: string) => {
    const eventType = eventTypes.find(et => et.id === id);
    // Using isDefault as the indicator for non-deletable
    if (eventType?.isDefault) {
      toast.error('Default event types cannot be deleted.');
      return;
    }
    
    await onDeleteEventType(id); // Let parent handle API call and refetch
    // Optionally update local state optimistically or rely on refetch
    // const updatedEventTypes = eventTypes.filter(event => event.id !== id);
    // updateLocalEventTypes(updatedEventTypes);
  }

  // Save event type changes - Calls parent handler
  const handleSaveEventType = async (eventTypeToSave: EventType) => {
    let finalEventType = { ...eventTypeToSave };

    // Preserve properties of default/required event types if editing
    if (isEditing && finalEventType.isDefault) {
      const originalEventType = eventTypes.find(et => et.id === finalEventType.id);
      
      // Ensure core properties of the default type aren't changed via UI
      // (API should enforce this too)
      finalEventType = {
        ...finalEventType,
        isDefault: true, // Keep it default
        name: originalEventType?.name || finalEventType.name, // Keep original name
        duration: originalEventType?.duration || finalEventType.duration, // Keep original duration
        free: originalEventType?.free ?? finalEventType.free, // Keep original free status
        schedulingType: originalEventType?.schedulingType || finalEventType.schedulingType, // Keep original type
        enabled: true, // Default type must always be enabled
      };
      toast.info('Some properties of the default event type cannot be changed.');
    }

    if (isEditing) {
      await onUpdateEventType(finalEventType);
    } else {
      // Exclude id for creation
      const { id, ...newEventTypeData } = finalEventType;
      await onCreateEventType(newEventTypeData);
    }
    
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
      isDefault: false, // New types are not default
      isRequired: false,
      schedulingType: CalSchedulingType.MANAGED, // Default to MANAGED
      // Default Cal.com integration settings
      bookerLayouts: {
        defaultLayout: 'month',
        enabledLayouts: ['month', 'week', 'column']
      },
      locations: [
        {
          type: 'integrations:daily', // Use a sensible default like user's primary calendar or video
          displayName: 'Video Call'
        }
      ],
      minimumBookingNotice: 0,
      beforeEventBuffer: 0,
      afterEventBuffer: 0,
      // Initialize other fields as needed
      maxParticipants: undefined,
      discountPercentage: undefined,
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
                    <p>Manage the session types you offer. Default types (like the 30-min Coaching Session) have some restrictions.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            <CardDescription>
              Configure and manage the types of coaching sessions synchronized with your Cal.com account.
            </CardDescription>
          </div>
          <Button onClick={handleAddEventType} className="gap-2">
            <Plus className="h-4 w-4" /> Add Session Type
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {eventTypes.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No session types found. Add one to get started or sync with Cal.com.
          </div>
        ) : (
          <div className="relative overflow-x-auto pb-4">
            <div className="flex gap-2 min-w-min">
              {eventTypes.map(eventType => (
                <EventTypeCard 
                  key={eventType.id} // Use a stable key
                  eventType={eventType}
                  onEdit={handleEditEventType}
                  onDelete={handleDeleteEventType}
                  onToggle={handleToggleEventType}
                  // Pass flags based on fetched data
                  isRequired={Boolean(eventType.isDefault || eventType.isRequired)} // Ensure boolean type
                  canDisable={eventType.canDisable ?? !eventType.isDefault} // Determine ability to disable
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Edit/Add Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Edit Session Type' : 'Add Session Type'}</DialogTitle>
              <DialogDescription>
                Configure the details for this coaching session type. Changes will be synced with Cal.com.
              </DialogDescription>
            </DialogHeader>
            
            {currentEventType && (
              // Keep the form structure, but ensure disabled logic uses fetched flags
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input 
                    id="name" 
                    placeholder="e.g. Coaching Session" 
                    value={currentEventType.name}
                    onChange={(e) => setCurrentEventType({...currentEventType, name: e.target.value})}
                    disabled={currentEventType.isDefault && isEditing} // Disable editing name for default types
                  />
                  {currentEventType.isDefault && isEditing && (
                    <p className="text-xs text-muted-foreground">Default event type name cannot be changed.</p>
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
                  <Label htmlFor="schedulingType">Session Format</Label>
                  <Select 
                    value={currentEventType.schedulingType} 
                    onValueChange={(value: CalSchedulingType) => // Use enum type
                      setCurrentEventType({...currentEventType, schedulingType: value})
                    }
                    disabled={currentEventType.isDefault && isEditing} // Disable changing format for default types
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select session format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={CalSchedulingType.MANAGED}>1:1 Session</SelectItem>
                      <SelectItem value={CalSchedulingType.OFFICE_HOURS}>Office Hours</SelectItem>
                      <SelectItem value={CalSchedulingType.GROUP_SESSION}>Group Session</SelectItem>
                    </SelectContent>
                  </Select>
                  {currentEventType.isDefault && isEditing && (
                    <p className="text-xs text-muted-foreground">Default event type format cannot be changed.</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Select 
                    value={currentEventType.duration.toString()} 
                    onValueChange={(value) => setCurrentEventType({...currentEventType, duration: parseInt(value)})}
                    disabled={currentEventType.isDefault && isEditing} // Disable changing duration for default types
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      {[15, 30, 45, 60, 90, 120].map(d => (
                          <SelectItem key={d} value={d.toString()}>{d >= 60 ? `${d/60} hour${d > 60 ? 's' : ''}` : `${d} minutes`}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {currentEventType.isDefault && isEditing && (
                    <p className="text-xs text-muted-foreground">Default event type duration cannot be changed.</p>
                  )}
                </div>
                
                {/* Conditional fields for OFFICE_HOURS / GROUP_SESSION */}
                {(currentEventType.schedulingType === CalSchedulingType.OFFICE_HOURS || currentEventType.schedulingType === CalSchedulingType.GROUP_SESSION) && (
                  <>
                    {currentEventType.schedulingType === CalSchedulingType.OFFICE_HOURS && (
                      <div className="space-y-2">
                        <Label htmlFor="discountPercentage">Discount Percentage</Label>
                         <Select 
                           value={(currentEventType.discountPercentage ?? 0).toString()} // Use nullish coalescing
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
                    <div className="space-y-2">
                      <Label htmlFor="maxParticipants">Maximum Participants</Label>
                      <Select 
                        value={(currentEventType.maxParticipants ?? 10).toString()} // Use nullish coalescing
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
                  </>
                )}
                
                {/* Free session toggle - Disable if default */}
                <div className="flex items-center space-x-2 pt-2">
                   <Switch 
                     id="free"
                     checked={currentEventType.free} 
                     onCheckedChange={(checked) => setCurrentEventType({...currentEventType, free: checked})}
                     disabled={currentEventType.isDefault && isEditing} // Disable changing free status for default
                   />
                   <Label htmlFor="free">Free Session</Label>
                   {currentEventType.isDefault && isEditing && (
                    <span className="text-xs text-muted-foreground">({currentEventType.free ? 'Required Free' : 'Required Paid'})</span>
                  )}
                 </div>

                {/* Active toggle - Disable if default and cannot be disabled */}
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="active"
                    checked={currentEventType.enabled} 
                    onCheckedChange={(checked) => setCurrentEventType({...currentEventType, enabled: checked})}
                    // Disable toggle if it's the default event type (cannot be disabled)
                    disabled={currentEventType.isDefault && isEditing} 
                  />
                  <Label htmlFor="active">Active / Enabled</Label>
                  {currentEventType.isDefault && isEditing && (
                    <span className="text-xs text-muted-foreground">(Required Enabled)</span>
                  )}
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={() => currentEventType && handleSaveEventType(currentEventType)} disabled={!currentEventType}>
                {isEditing ? 'Update Session Type' : 'Create Session Type'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
} 