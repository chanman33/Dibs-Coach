"use client";

import { useProfileContext, ProfileProvider } from "@/components/profile/context/ProfileContext";
import { CoachProfileForm } from "@/components/profile/coach/CoachProfileForm";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useCallback } from "react";
import type { CoachProfileFormValues, CoachProfileInitialData } from "@/components/profile/types";
import type { ProfileStatus } from "@/utils/types/coach";
import { ProfileTabsManager } from "@/components/profile/common/ProfileTabsManager";
import type { Goal, GoalFormValues } from "@/utils/types/goals";
import type { GeneralFormData } from "@/utils/actions/user-profile-actions";

// Extended type for coach data that includes profile completion info
interface ExtendedCoachData extends CoachProfileInitialData {
  status: ProfileStatus;
  completionPercentage: number;
  missingFields: string[];
  missingRequiredFields: string[];
  optionalMissingFields: string[];
  validationMessages: Record<string, string>;
  canPublish: boolean;
}

function ProfilePageContent() {
  const {
    coachData,
    generalData,
    goalsData,
    recognitionsData,
    userCapabilities,
    selectedSkills,
    realEstateDomains,
    isLoading,
    isSubmitting,
    fetchError,
    updateCoachData,
    updateGeneralData,
    updateGoalsData,
    onSkillsChange,
    saveSkills,
  } = useProfileContext();

  const handleProfileSubmit = useCallback(async (data: CoachProfileFormValues) => {
    await updateCoachData(data);
  }, [updateCoachData]);

  const handleGeneralSubmit = useCallback(async (data: GeneralFormData) => {
    await updateGeneralData(data);
  }, [updateGeneralData]);

  const handleGoalsSubmit = useCallback(async (goals: Goal[]) => {
    await updateGoalsData(goals);
  }, [updateGoalsData]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show error state
  if (fetchError) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load profile data. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  // Cast coachData to ExtendedCoachData to include completion info
  const extendedCoachData = coachData as ExtendedCoachData;
      
  return (
    <ProfileTabsManager
      userCapabilities={userCapabilities}
      selectedSkills={selectedSkills}
      industrySpecialties={realEstateDomains}
      generalUserInfo={generalData}
      onSubmitGeneral={handleGeneralSubmit}
      onSubmitCoach={handleProfileSubmit}
      coachFormContent={
        <CoachProfileForm
          initialData={extendedCoachData}
          onSubmit={handleProfileSubmit}
          isSubmitting={isSubmitting}
          profileStatus={extendedCoachData.status}
          completionPercentage={extendedCoachData.completionPercentage}
          missingFields={extendedCoachData.missingFields}
          missingRequiredFields={extendedCoachData.missingRequiredFields}
          optionalMissingFields={extendedCoachData.optionalMissingFields}
          validationMessages={extendedCoachData.validationMessages}
          canPublish={extendedCoachData.canPublish}
          onSkillsChange={onSkillsChange}
          saveSkills={saveSkills}
        />
      }
      initialRecognitions={recognitionsData}
      onSubmitRecognitions={async (recognitions) => {
        // TODO: Implement recognitions submission
        console.log("Submitting recognitions:", recognitions);
      }}
      initialGoals={goalsData}
      onSubmitGoals={handleGoalsSubmit}
      isSubmitting={isSubmitting}
      saveSkills={saveSkills}
    />
  );
}

export default function CoachProfilePage() {
  return (
    <ProfileProvider>
      <div className="container py-6 space-y-6 max-w-5xl">
        <ProfilePageContent />
      </div>
    </ProfileProvider>
  );
}
