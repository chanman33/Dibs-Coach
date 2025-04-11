import { format as formatBase } from "date-fns";
import { fromZonedTime, toZonedTime, format as formatInTimeZone } from 'date-fns-tz';

/**
 * Gets the user's local timezone string.
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Creates a correct UTC Date object from a date part and a time string in a specific timezone.
 * Example: createUtcDate(selectedDate, "11:00", "America/New_York")
 */
export function createUtcDate(baseDate: Date, timeString: string, timeZone: string): Date {
  const dateString = formatBase(baseDate, 'yyyy-MM-dd');
  const dateTimeString = `${dateString}T${timeString}`;
  try {
    return fromZonedTime(dateTimeString, timeZone);
  } catch (error) {
    console.error(`[CREATE_UTC_DATE_ERROR] Failed to create UTC date`, {
      dateTimeString,
      timeZone,
      error
    });
    return new Date(); // Consider a more robust fallback
  }
}

/**
 * Formats a UTC Date object into a string for display in a target timezone.
 */
export function formatUtcDateInTimezone(
  utcDate: Date,
  displayTimeZone: string,
  formatString: string = 'h:mm a' // Default format
): string {
  try {
    return formatInTimeZone(utcDate, formatString, { timeZone: displayTimeZone });
  } catch (error) {
    console.error(`[FORMAT_UTC_DATE_ERROR] Failed to format UTC date in timezone ${displayTimeZone}`, {
      utcDate,
      displayTimeZone,
      error
    });
    return formatBase(utcDate, formatString);
  }
}

/**
 * Gets the hour of a UTC Date object as it would be in a specific timezone.
 */
export function getHourInTimezone(utcDate: Date, timeZone: string): number {
  try {
    const zonedDate = toZonedTime(utcDate, timeZone);
    return zonedDate.getHours(); // Get hours from the zoned Date
  } catch (error) {
    console.error(`[GET_HOUR_IN_TIMEZONE_ERROR] Failed to get hour in timezone ${timeZone}`, {
      utcDate,
      timeZone,
      error
    });
    return utcDate.getUTCHours(); // Fallback to UTC hour
  }
}

/**
 * Checks if two timezones are different
 */
export function areTimezonesDifferent(timezone1: string | undefined, timezone2: string | undefined): boolean {
  // Handle undefined cases gracefully
  if (!timezone1 || !timezone2) return false;
  return timezone1 !== timezone2;
}

/**
 * Formats a date object into a string representing the time in a specific timezone.
 * IMPORTANT: This function assumes the input Date object's hour/minute values match the
 * wall-clock time in the *coach's* timezone, due to how Date objects were created upstream.
 * It then formats this wall-clock time for display in the target timezone.
 */
export function formatTimeInTimezone(
  date: Date,
  displayTimezone: string,
  formatStr: string = "h:mm a" // Default to 12-hour format with AM/PM
): string {
  try {
    // Use Intl.DateTimeFormat for robust timezone formatting
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true, // Use 12-hour format
      timeZone: displayTimezone,
    }).format(date);
  } catch (error) {
    console.error(`[FORMAT_TIME_IN_TIMEZONE_ERROR] Failed to format date in timezone ${displayTimezone}. Falling back.`, {
      date,
      displayTimezone,
      error
    });
    // Fallback to basic date-fns formatting if Intl fails (will use system local time)
    return formatBase(date, formatStr);
  }
}

/**
 * Creates a simple Date object representing a specific time on a given date,
 * based *only* on wall-clock time, ignoring actual timezone offsets.
 * The resulting Date object is based on the system's local timezone.
 * This reflects the current (problematic) way Date objects are created.
 */
export function createWallClockDate(baseDate: Date, timeString: string): Date {
  const [hours, minutes] = timeString.split(':').map(Number);
  const newDate = new Date(baseDate);
  // Set hours/minutes according to the timeString, interpreted in system local time
  newDate.setHours(hours, minutes, 0, 0);
  return newDate;
} 