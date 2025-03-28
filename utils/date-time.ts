/**
 * Date and time utility functions for formatting and displaying dates and times
 */

/**
 * Format an array of day numbers into a readable string
 * @param days Array of day numbers (0-6 for Sunday-Saturday)
 * @returns Formatted string representation of days
 */
export function formatDay(days: number[] | string[]): string {
  if (!days || days.length === 0) return 'No days selected';
  
  if (typeof days[0] === 'string') {
    return (days as string[]).join(', ');
  }
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return (days as number[]).map(d => {
    // Some APIs use 0-indexed days (0=Sunday), others use 1-indexed (1=Monday)
    // Normalize to 0-6 range
    const index = d % 7;
    return dayNames[index];
  }).join(', ');
}

/**
 * Format a time string into a readable 12-hour format
 * @param time Time string in HH:mm or HH:mm:ss format
 * @returns Formatted time string
 */
export function formatTime(time: string): string {
  try {
    // Handle both HH:mm and HH:mm:ss formats
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric',
      minute: '2-digit',
      hour12: true 
    });
  } catch (e) {
    return time;
  }
} 