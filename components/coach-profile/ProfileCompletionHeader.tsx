"use client"

import { ProfileCompletionAlert } from "@/components/coaching/ProfileCompletionAlert";
import { ProfileStatus } from "@/utils/types/coach";

interface ProfileCompletionHeaderProps {
  completionPercentage: number;
  profileStatus: ProfileStatus;
  canPublish: boolean;
  missingFields: string[];
}

/**
 * Wrapper component for ProfileCompletionAlert with consistent styling
 */
export function ProfileCompletionHeader({
  completionPercentage,
  profileStatus,
  canPublish,
  missingFields,
}: ProfileCompletionHeaderProps) {
  return (
    <div className="mb-6">
      <ProfileCompletionAlert
        completionPercentage={completionPercentage}
        profileStatus={profileStatus}
        canPublish={canPublish}
        missingFields={missingFields}
        onEdit={() => {
          // Scroll to form when edit is clicked
          document.getElementById('coach-profile-form')?.scrollIntoView({ behavior: 'smooth' });
        }}
      />
    </div>
  );
} 