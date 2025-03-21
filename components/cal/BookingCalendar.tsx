import { useState, useEffect } from 'react';
import { format, addDays, addMinutes } from 'date-fns';
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { calApiClient, CalEventType, CalTimeSlot } from '@/lib/cal/cal-api';

export function BookingCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [eventTypes, setEventTypes] = useState<CalEventType[]>([]);
  const [selectedEventType, setSelectedEventType] = useState<CalEventType | null>(null);
  const [availableSlots, setAvailableSlots] = useState<CalTimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch event types on component mount
  useEffect(() => {
    async function fetchEventTypes() {
      try {
        const types = await calApiClient.getEventTypes();
        setEventTypes(types);
      } catch (error) {
        console.error('Failed to fetch event types:', error);
      }
    }
    
    fetchEventTypes();
  }, []);

  // Fetch available slots when date or event type changes
  const handleDateSelect = async (newDate: Date | undefined) => {
    setDate(newDate);
    if (newDate && selectedEventType) {
      setLoading(true);
      try {
        const slots = await calApiClient.getAvailability(
          selectedEventType.id,
          format(newDate, 'yyyy-MM-dd'),
          format(addDays(newDate, 1), 'yyyy-MM-dd')
        );
        setAvailableSlots(slots);
      } catch (error) {
        console.error('Failed to fetch availability:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle booking creation
  const handleBooking = async (slot: CalTimeSlot) => {
    if (!selectedEventType || !date) return;

    try {
      await calApiClient.createBooking({
        eventTypeId: selectedEventType.id,
        start: slot.time,
        end: format(addMinutes(new Date(slot.time), selectedEventType.length), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
        name: 'John Doe', // Replace with actual user input
        email: 'john@example.com', // Replace with actual user input
      });
    } catch (error) {
      console.error('Failed to create booking:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Event Type Selection */}
      <div className="grid grid-cols-2 gap-4">
        {eventTypes.map((type) => (
          <Button
            key={type.id}
            variant={selectedEventType?.id === type.id ? "default" : "outline"}
            onClick={() => setSelectedEventType(type)}
          >
            {type.title}
          </Button>
        ))}
      </div>

      {/* Calendar */}
      {selectedEventType && (
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          className="rounded-md border"
        />
      )}

      {/* Time Slots */}
      {loading ? (
        <div>Loading available slots...</div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {availableSlots.map((slot) => (
            <Button
              key={slot.time}
              variant="outline"
              onClick={() => handleBooking(slot)}
              disabled={!!slot.bookingId}
            >
              {format(new Date(slot.time), 'HH:mm')}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
} 