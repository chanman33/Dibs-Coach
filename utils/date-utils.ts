import { format, addDays, isWithinInterval, parseISO, isSameDay } from "date-fns";
import { TimeSlot } from "./types/booking";

// Day mapping for converting between day names and day numbers
export const dayMapping: Record<string, number> = {
  "Sunday": 0,
  "Monday": 1,
  "Tuesday": 2,
  "Wednesday": 3,
  "Thursday": 4,
  "Friday": 5,
  "Saturday": 6,
};

/**
 * Format a time consistently for display
 */
export function formatTime(date: Date): string {
  return format(date, "h:mm a");
}

/**
 * Format duration in minutes to readable format
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minutes`;
  } else if (minutes === 60) {
    return '1 hour';
  } else if (minutes % 60 === 0) {
    return `${minutes / 60} hours`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`;
  }
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  return format(date, "EEEE, MMMM d, yyyy");
}

/**
 * Get tomorrow's date (for booking policy)
 * Ensures we get tomorrow at 00:00:00 local time
 */
export function getTomorrowDate(): Date {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
}

/**
 * Get the maximum date allowed for booking (15 days from tomorrow)
 * Returns the 15th day after tomorrow at 23:59:59 local time
 */
export function getMaxBookingDate(): Date {
  const tomorrow = getTomorrowDate();
  // Add 14 days to tomorrow to get 15 days total
  const maxDate = new Date(tomorrow);
  maxDate.setDate(tomorrow.getDate() + 14);
  maxDate.setHours(23, 59, 59, 999);
  return maxDate;
}

/**
 * Check if two dates are the same day
 */
export function isSameDayFn(date1: Date, date2: Date): boolean {
  return isSameDay(date1, date2);
}

/**
 * Convert a day number (0-6) to day name (Sunday-Saturday)
 */
export function getDayNameFromNumber(dayNumber: number): string | null {
  return Object.keys(dayMapping).find(day => dayMapping[day] === dayNumber) || null;
}

/**
 * Check if a time slot overlaps with busy times
 */
export function doesTimeSlotOverlapWithBusyTime(
  slot: TimeSlot,
  busyStart: Date,
  busyEnd: Date
): boolean {
  // Slot starts during busy time
  const slotStartsDuringBusyTime = 
    slot.startTime >= busyStart && slot.startTime < busyEnd;
  
  // Slot ends during busy time
  const slotEndsDuringBusyTime = 
    slot.endTime > busyStart && slot.endTime <= busyEnd;
  
  // Slot completely contains busy time
  const slotContainsBusyTime = 
    slot.startTime <= busyStart && slot.endTime >= busyEnd;
  
  return slotStartsDuringBusyTime || slotEndsDuringBusyTime || slotContainsBusyTime;
} 