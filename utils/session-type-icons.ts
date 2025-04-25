/**
 * Session Type Icons Utility
 * 
 * Provides consistent emoji icons for different session types across the application.
 */

// Map session types to consistent emoji icons
export const getSessionTypeEmoji = (type: string): string => {
  // Normalize the type string for more reliable matching
  const normalizedType = type.toLowerCase().trim();
  
  // More specific matching patterns for common session types
  if (normalizedType === "coaching session" || 
      normalizedType === "standard coaching session" ||
      normalizedType === "regular coaching session" || 
      normalizedType.startsWith("coaching session")) {
    return '⏱️';
  }
  
  if (normalizedType.includes('get to know you') || 
      normalizedType.includes('introduction') || 
      normalizedType.includes('introductory')) {
    return '🎁';
  }
  
  if (normalizedType.includes('deep dive') || 
      normalizedType === "deep dive coaching call" ||
      normalizedType.includes('depth') || 
      normalizedType.includes('intensive')) {
    return '🔍';
  }
  
  if (normalizedType.includes('group') || normalizedType.includes('team')) {
    return '👥';
  }
  
  if (normalizedType.includes('office hours')) {
    return '📅';
  }
  
  // Log for debugging unmatched types in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEBUG] No specific emoji match for session type: "${type}"`);
  }
  
  // Default for coaching session
  return '⏱️';
};

// Function to determine emoji based on Cal.com scheduling type
export const getEmojiFromSchedulingType = (schedulingType: string): string => {
  if (!schedulingType) return '⏱️'; // Early return for undefined/null
  
  switch (schedulingType) {
    case 'GROUP_SESSION':
      return '👥';
    case 'OFFICE_HOURS':
      return '📅';
    case 'COLLECTIVE':
      return '🤝';
    case 'ROUND_ROBIN':
      return '🔄';
    default:
      return '⏱️'; // Default for one-on-one sessions
  }
};

// Component-friendly emoji renderer (non-JSX version)
export const getEmojiElement = (type?: string, schedulingType?: string, className: string = "") => {
  // Use scheduling type if available, otherwise fallback to name
  const emoji = schedulingType 
    ? getEmojiFromSchedulingType(schedulingType)
    : getSessionTypeEmoji(type || '');
    
  return {
    emoji,
    element: `<span class="${className}" role="img" aria-label="${type || schedulingType || 'session type'}">${emoji}</span>`
  };
}; 