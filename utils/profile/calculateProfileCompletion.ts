/**
 * Utility to calculate profile completion percentage and determine if it meets
 * the requirements for publication.
 */

export type ProfileField = {
  name: string;
  weight: number; // Weight of this field in the completion percentage (1-10)
  required: boolean; // Is this field required for publication?
  checkFn: (value: any) => boolean; // Function to check if the field is complete
};

export type CoachProfileData = {
  firstName?: string | null;
  lastName?: string | null;
  bio?: string | null;
  profileImageUrl?: string | null;
  coachingSpecialties?: string[] | null;
  hourlyRate?: number | null;
  yearsCoaching?: number | null;
  calendlyUrl?: string | null;
  eventTypeUrl?: string | null;
  [key: string]: any;
};

// Define the fields that contribute to profile completion
const PROFILE_FIELDS: ProfileField[] = [
  {
    name: 'firstName',
    weight: 10,
    required: true,
    checkFn: (value) => !!value && value.trim().length > 0,
  },
  {
    name: 'lastName',
    weight: 10,
    required: true,
    checkFn: (value) => !!value && value.trim().length > 0,
  },
  {
    name: 'bio',
    weight: 15,
    required: true,
    checkFn: (value) => !!value && value.trim().length >= 50, // Minimum bio length
  },
  {
    name: 'profileImageUrl',
    weight: 15,
    required: true,
    checkFn: (value) => !!value && value.trim().length > 0,
  },
  {
    name: 'coachingSpecialties',
    weight: 15,
    required: true,
    checkFn: (value) => Array.isArray(value) && value.length > 0,
  },
  {
    name: 'hourlyRate',
    weight: 10,
    required: true,
    checkFn: (value) => value !== null && value !== undefined && value > 0,
  },
  {
    name: 'yearsCoaching',
    weight: 5,
    required: false,
    checkFn: (value) => value !== null && value !== undefined && value >= 0,
  },
  {
    name: 'calendlyUrl',
    weight: 10,
    required: false,
    checkFn: (value) => !!value && value.trim().length > 0,
  },
  {
    name: 'eventTypeUrl',
    weight: 10,
    required: false,
    checkFn: (value) => !!value && value.trim().length > 0,
  },
];

// Minimum percentage required for profile to be published
export const PUBLICATION_THRESHOLD = 80;

/**
 * Calculate the profile completion percentage based on fields
 */
export function calculateProfileCompletion(profile: CoachProfileData): {
  percentage: number;
  missingFields: string[];
  canPublish: boolean;
} {
  let totalWeight = 0;
  let completedWeight = 0;
  const missingFields: string[] = [];

  // Calculate total weight and completed weight
  PROFILE_FIELDS.forEach((field) => {
    totalWeight += field.weight;
    
    // Check if the field is complete
    const isComplete = field.checkFn(profile[field.name]);
    
    if (isComplete) {
      completedWeight += field.weight;
    } else if (field.required) {
      missingFields.push(field.name);
    }
  });

  // Calculate percentage
  const percentage = Math.round((completedWeight / totalWeight) * 100);
  
  // Determine if the profile can be published
  const canPublish = percentage >= PUBLICATION_THRESHOLD && missingFields.length === 0;

  return {
    percentage,
    missingFields,
    canPublish,
  };
}

/**
 * Get human-readable names for fields
 */
export function getFieldDisplayName(fieldName: string): string {
  const displayNames: Record<string, string> = {
    firstName: 'First Name',
    lastName: 'Last Name',
    bio: 'Coach Bio',
    profileImageUrl: 'Profile Image',
    coachingSpecialties: 'Coaching Specialties',
    hourlyRate: 'Hourly Rate',
    yearsCoaching: 'Years of Experience',
    calendlyUrl: 'Calendly URL',
    eventTypeUrl: 'Event Type URL',
  };

  return displayNames[fieldName] || fieldName;
}

/**
 * Get the missing required fields formatted for display
 */
export function getMissingFieldsMessage(missingFields: string[]): string {
  if (missingFields.length === 0) {
    return '';
  }

  const formattedFields = missingFields.map(getFieldDisplayName);
  
  if (formattedFields.length === 1) {
    return `${formattedFields[0]} is required for profile publication.`;
  }
  
  const lastField = formattedFields.pop();
  return `${formattedFields.join(', ')} and ${lastField} are required for profile publication.`;
} 