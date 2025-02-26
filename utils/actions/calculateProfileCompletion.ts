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
    required: true,
    checkFn: (value) => !!value && value.trim().length > 0,
  },
  {
    name: 'eventTypeUrl',
    weight: 10,
    required: true,
    checkFn: (value) => !!value && value.trim().length > 0,
  },
];

// Minimum percentage required for profile to be published
export const PUBLICATION_THRESHOLD = 70;

/**
 * Calculate the profile completion percentage based on fields
 */
export function calculateProfileCompletion(profile: CoachProfileData): {
  percentage: number;
  missingFields: string[];
  missingRequiredFields: string[];
  optionalMissingFields: string[];
  canPublish: boolean;
  validationMessages: Record<string, string>;
} {
  console.log('[PROFILE_COMPLETION_CALC] Starting calculation with profile:', {
    ...profile,
    timestamp: new Date().toISOString()
  });

  let totalRequiredWeight = 0;
  let completedRequiredWeight = 0;
  let totalOptionalWeight = 0;
  let completedOptionalWeight = 0;
  const missingFields: string[] = [];
  const missingRequiredFields: string[] = [];
  const optionalMissingFields: string[] = [];
  const validationMessages: Record<string, string> = {};

  // Calculate weights and track missing fields
  PROFILE_FIELDS.forEach((field) => {
    if (field.required) {
      totalRequiredWeight += field.weight;
    } else {
      totalOptionalWeight += field.weight;
    }
    
    // Check if the field is complete
    const isComplete = field.checkFn(profile[field.name]);
    
    if (isComplete) {
      if (field.required) {
        completedRequiredWeight += field.weight;
      } else {
        completedOptionalWeight += field.weight;
      }
    } else {
      missingFields.push(field.name);
      if (field.required) {
        missingRequiredFields.push(field.name);
        // Add validation message for required fields
        if (field.name === 'bio') {
          validationMessages[field.name] = 'Bio must be at least 50 characters long';
        } else {
          validationMessages[field.name] = `${getFieldDisplayName(field.name)} is required`;
        }
      } else {
        optionalMissingFields.push(field.name);
        validationMessages[field.name] = `Adding ${getFieldDisplayName(field.name)} will improve your profile`;
      }
    }

    // Log each field's status
    console.log('[PROFILE_FIELD_CHECK]', {
      field: field.name,
      value: profile[field.name],
      isComplete,
      weight: field.weight,
      required: field.required,
      timestamp: new Date().toISOString()
    });
  });

  // Calculate percentage based primarily on required fields
  const requiredPercentage = totalRequiredWeight > 0 
    ? Math.round((completedRequiredWeight / totalRequiredWeight) * 100)
    : 0;
    
  const optionalPercentage = totalOptionalWeight > 0
    ? Math.round((completedOptionalWeight / totalOptionalWeight) * 100)
    : 0;

  // Weight the final percentage to favor required fields (80% required, 20% optional)
  const percentage = Math.round((requiredPercentage * 0.8) + (optionalPercentage * 0.2));
  
  // Can only publish if ALL required fields are complete
  const canPublish = missingRequiredFields.length === 0;

  console.log('[PROFILE_COMPLETION_RESULT]', {
    totalRequiredWeight,
    completedRequiredWeight,
    totalOptionalWeight,
    completedOptionalWeight,
    requiredPercentage,
    optionalPercentage,
    percentage,
    missingFields,
    missingRequiredFields,
    optionalMissingFields,
    canPublish,
    timestamp: new Date().toISOString()
  });

  return {
    percentage,
    missingFields,
    missingRequiredFields,
    optionalMissingFields,
    canPublish,
    validationMessages
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
    return `${formattedFields[0]} would improve your profile completion.`;
  }
  
  const lastField = formattedFields.pop();
  return `Adding ${formattedFields.join(', ')} and ${lastField} would improve your profile completion.`;
} 