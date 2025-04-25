import { getSessionTypeEmoji, getEmojiFromSchedulingType } from "@/utils/session-type-icons";

interface SessionTypeEmojiProps {
  type?: string;
  schedulingType?: string;
  className?: string;
}

/**
 * SessionTypeEmoji Component
 * 
 * Renders consistent emoji icons for session types with accessibility support.
 * The component prioritizes name matching first, then falls back to schedulingType
 * for standardized event types.
 */
export function SessionTypeEmoji({ 
  type, 
  schedulingType,
  className = "text-xl"
}: SessionTypeEmojiProps) {
  // First try to match by name, as it's more specific
  // Then fall back to schedulingType if name doesn't yield a specific emoji
  let emoji: string;
  
  if (type) {
    // Try to get emoji based on type name first
    emoji = getSessionTypeEmoji(type);
    
    // If we got the default clock emoji and we also have a schedulingType,
    // see if that gives us a more specific emoji
    if (emoji === '⏱️' && schedulingType) {
      const schedulingEmoji = getEmojiFromSchedulingType(schedulingType);
      // Only use scheduling emoji if it's different from the default
      if (schedulingEmoji !== '⏱️') {
        emoji = schedulingEmoji;
      }
    }
  } else if (schedulingType) {
    // If we don't have a name, use scheduling type
    emoji = getEmojiFromSchedulingType(schedulingType);
  } else {
    // Default if neither is provided
    emoji = '⏱️';
  }
  
  // Generate an accessible label
  const label = type || schedulingType || 'session type';
  
  return (
    <span 
      className={className} 
      role="img" 
      aria-label={label}
    >
      {emoji}
    </span>
  );
} 