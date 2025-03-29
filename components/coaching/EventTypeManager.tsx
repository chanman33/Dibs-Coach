'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { EventTypeCard, type EventType } from './EventTypeCard'

interface EventTypeManagerProps {
  initialEventTypes?: EventType[];
  onEventTypesChange?: (eventTypes: EventType[]) => void;
}

export function EventTypeManager({ 
  initialEventTypes,
  onEventTypesChange
}: EventTypeManagerProps) {
  // Default event types
  const defaultEventTypes: EventType[] = [
    {
      id: '1',
      name: 'Coaching Session',
      description: 'Regular coaching video call session',
      duration: 30,
      free: false,
      enabled: true,
      isDefault: true,
      schedulingType: 'MANAGED'
    },
    {
      id: '2',
      name: 'Extended Coaching Session',
      description: 'Longer coaching session for complex topics',
      duration: 45,
      free: false,
      enabled: false,
      isDefault: false,
      schedulingType: 'MANAGED'
    },
    {
      id: '3',
      name: 'Office Hours',
      description: 'Drop-in coaching at discounted rate',
      duration: 60,
      free: false,
      enabled: false,
      isDefault: false,
      schedulingType: 'OFFICE_HOURS',
      maxParticipants: 5,
      discountPercentage: 30
    },
    {
      id: '4',
      name: 'Discovery Call',
      description: 'Get to know you and goal setting alignment',
      duration: 15,
      free: true,
      enabled: false,
      isDefault: false,
      schedulingType: 'MANAGED'
    },
    {
      id: '5',
      name: 'Group Training Session',
      description: 'Group coaching for organizations',
      duration: 60,
      free: false,
      enabled: false,
      isDefault: false,
      schedulingType: 'GROUP_SESSION',
      maxParticipants: 10
    }
  ]
  
  const [eventTypes, setEventTypes] = useState<EventType[]>(initialEventTypes || defaultEventTypes)
  const [isEditing, setIsEditing] = useState(false)
  const [currentEventType, setCurrentEventType] = useState<EventType | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Update event types and notify parent component if callback provided
  const updateEventTypes = (newEventTypes: EventType[]) => {
    setEventTypes(newEventTypes);
    if (onEventTypesChange) {
      onEventTypesChange(newEventTypes);
    }
  };

  // Toggle event type active status
  const handleToggleEventType = (id: string, enabled: boolean) => {
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
    const updatedEventTypes = eventTypes.filter(event => event.id !== id);
    updateEventTypes(updatedEventTypes);
    toast.success('Event type deleted');
  }

  // Save event type changes
  const handleSaveEventType = (eventType: EventType) => {
    let updatedEventTypes;
    
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
      schedulingType: 'MANAGED'
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
            <CardTitle>Coaching Session Types</CardTitle>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {eventTypes.map(eventType => (
            <EventTypeCard 
              key={eventType.id}
              eventType={eventType}
              onEdit={handleEditEventType}
              onDelete={handleDeleteEventType}
              onToggle={handleToggleEventType}
              isRequired={eventType.isDefault}
            />
          ))}
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
                  />
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
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Select 
                    value={currentEventType.duration.toString()} 
                    onValueChange={(value) => setCurrentEventType({...currentEventType, duration: parseInt(value)})}
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
                </div>
                
                {/* Additional fields for OFFICE_HOURS */}
                {currentEventType.schedulingType === 'OFFICE_HOURS' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="maxParticipants">Maximum Participants</Label>
                      <Select 
                        value={(currentEventType.maxParticipants || 5).toString()} 
                        onValueChange={(value) => setCurrentEventType({...currentEventType, maxParticipants: parseInt(value)})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select max participants" />
                        </SelectTrigger>
                        <SelectContent>
                          {[3, 5, 10, 15, 20, 25, 30].map(num => (
                            <SelectItem key={num} value={num.toString()}>{num} participants</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
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
                          {[0, 10, 20, 30, 40, 50, 60, 70].map(percent => (
                            <SelectItem key={percent} value={percent.toString()}>{percent}% off</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
                
                {/* Additional fields for GROUP_SESSION */}
                {currentEventType.schedulingType === 'GROUP_SESSION' && (
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
                {currentEventType.schedulingType === 'MANAGED' && (
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="free"
                      checked={currentEventType.free} 
                      onCheckedChange={(checked) => setCurrentEventType({...currentEventType, free: checked})}
                    />
                    <Label htmlFor="free">Free Session</Label>
                  </div>
                )}
                
                {/* Default session toggle */}
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="default"
                    checked={currentEventType.isDefault} 
                    onCheckedChange={(checked) => setCurrentEventType({...currentEventType, isDefault: checked})}
                  />
                  <Label htmlFor="default">Make Default</Label>
                </div>
                
                {/* Active toggle */}
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="active"
                    checked={currentEventType.enabled} 
                    onCheckedChange={(checked) => setCurrentEventType({...currentEventType, enabled: checked})}
                  />
                  <Label htmlFor="active">Active</Label>
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