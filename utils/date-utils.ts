import { format, addDays, isWithinInterval, parseISO, isSameDay } from "date-fns";

// Day mapping for converting day names to numbers (0 = Sunday, 1 = Monday, etc.)
export const dayMapping: Record<string, number> = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
  Sunday: 0
};

/**
 * Format time for display
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
 * Get tomorrow's date with time set to start of day
 */
export function getTomorrowDate(): Date {
  const today = new Date();
  const tomorrow = addDays(today, 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
}

/**
 * Get the maximum booking date (15 days from tomorrow)
 */
export function getMaxBookingDate(): Date {
  const maxDate = addDays(getTomorrowDate(), 15);
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
 * Convert day number to day name
 */
export function getDayNameFromNumber(dayNumber: number): string | undefined {
  const dayNames = Object.keys(dayMapping);
  return dayNames.find(day => dayMapping[day] === dayNumber);
}

/**
 * Check if a time slot overlaps with a busy time period
 */
export function doesTimeSlotOverlapWithBusyTime(
  slot: { startTime: Date; endTime: Date },
  busyStart: Date,
  busyEnd: Date
): boolean {
  return (
    isWithinInterval(slot.startTime, { start: busyStart, end: busyEnd }) ||
    isWithinInterval(slot.endTime, { start: busyStart, end: busyEnd }) ||
    (slot.startTime <= busyStart && slot.endTime >= busyEnd)
  );
} 