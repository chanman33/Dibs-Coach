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
  hasAvailabilitySchedule?: boolean | null;
  coachRealEstateDomains?: string[] | null;
  coachPrimaryDomain?: string | null;
  [key: string]: any;
};

interface FieldConfig {
  weight: number;
  required: boolean;
}

export const REQUIRED_FIELDS: Record<string, FieldConfig> = {
  firstName: { weight: 10, required: true },
  lastName: { weight: 10, required: true },
  bio: { weight: 15, required: true },
  profileImageUrl: { weight: 15, required: true },
  coachingSpecialties: { weight: 15, required: true },
  hourlyRate: { weight: 10, required: true },
  yearsCoaching: { weight: 10, required: true },
  hasAvailabilitySchedule: { weight: 15, required: true },
  coachRealEstateDomains: { weight: 10, required: true }
};

export const OPTIONAL_FIELDS: Record<string, FieldConfig> = {
  // Add optional fields here with their weights
};

export const PUBLICATION_THRESHOLD = 80;

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

  // Check required fields
  for (const [field, config] of Object.entries(REQUIRED_FIELDS)) {
    totalRequiredWeight += config.weight;

    // Log field check
    console.log("[PROFILE_FIELD_CHECK]", {
      field,
      value: profile[field],
      isComplete: isFieldComplete(field, profile[field]),
      weight: config.weight,
      required: config.required,
      timestamp: new Date().toISOString()
    });

    if (isFieldComplete(field, profile[field])) {
      completedRequiredWeight += config.weight;
    } else {
      missingFields.push(field);
      if (config.required) {
        missingRequiredFields.push(field);
        // Add validation message for required fields
        if (field === 'bio') {
          validationMessages[field] = 'Professional bio must be at least 50 characters to properly describe your expertise';
        } else {
          validationMessages[field] = `${getFieldDisplayName(field)} is required`;
        }
      }
    }
  }

  // Check optional fields
  for (const [field, config] of Object.entries(OPTIONAL_FIELDS)) {
    totalOptionalWeight += config.weight;

    if (isFieldComplete(field, profile[field])) {
      completedOptionalWeight += config.weight;
    } else {
      missingFields.push(field);
      optionalMissingFields.push(field);
      validationMessages[field] = `Adding ${getFieldDisplayName(field)} will improve your profile`;
    }
  }

  // Calculate percentages
  const requiredPercentage = Math.round((completedRequiredWeight / totalRequiredWeight) * 100);
  const optionalPercentage = totalOptionalWeight > 0 
    ? Math.round((completedOptionalWeight / totalOptionalWeight) * 100)
    : 0;

  // Overall percentage weighted towards required fields (80% required, 20% optional)
  const percentage = Math.round(
    totalOptionalWeight > 0
      ? (requiredPercentage * 0.8) + (optionalPercentage * 0.2)
      : requiredPercentage
  );

  const canPublish = percentage >= PUBLICATION_THRESHOLD && missingRequiredFields.length === 0;

  // Log completion result
  console.log("[PROFILE_COMPLETION_RESULT]", {
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

function isFieldComplete(field: string, value: any): boolean {
  if (value === undefined || value === null) return false;

  switch (field) {
    case 'firstName':
    case 'lastName':
      return typeof value === 'string' && value.trim().length > 0;
    
    case 'bio':
      return typeof value === 'string' && value.trim().length >= 50;
    
    case 'profileImageUrl':
      return typeof value === 'string' && value.trim().length > 0;
    
    case 'coachingSpecialties':
      return Array.isArray(value) && value.length >= 1;
    
    case 'coachRealEstateDomains':
      return Array.isArray(value) && value.length >= 1;
    
    case 'coachPrimaryDomain':
      return typeof value === 'string' && value.trim().length > 0;
    
    case 'hourlyRate':
      // Must be explicitly set, not just default value
      return typeof value === 'number' && value >= 100 && value <= 3000;
    
    case 'yearsCoaching':
      // Must be explicitly set, not just default value
      return typeof value === 'number' && value > 0;
    
    case 'hasAvailabilitySchedule':
      return value === true;
    
    default:
      return false;
  }
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
    coachRealEstateDomains: 'Real Estate Domains',
    coachPrimaryDomain: 'Primary Domain',
    hourlyRate: 'Hourly Rate',
    yearsCoaching: 'Years of Experience',
    hasAvailabilitySchedule: 'Availability Schedule'
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