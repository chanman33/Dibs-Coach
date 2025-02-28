"use client";

import { useProfileContext, ProfileProvider } from "@/components/profile/context/ProfileContext";
import { CoachProfileForm } from "@/components/profile/coach/CoachProfileForm";
import { RecognitionsSection } from "@/components/profile/coach/RecognitionsSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useCallback } from "react";
import type { CoachProfileFormValues, CoachProfileInitialData } from "@/components/profile/types";
import type { ProfileStatus } from "@/utils/types/coach";

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
    recognitionsData,
    userCapabilities,
    selectedSkills,
    isLoading,
    isSubmitting,
    fetchError,
    updateCoachData,
    onSkillsChange,
    saveSkills,
  } = useProfileContext();

  const handleProfileSubmit = useCallback(async (data: CoachProfileFormValues) => {
    await updateCoachData(data);
  }, [updateCoachData]);

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
    <Tabs defaultValue="basic" className="space-y-6">
      <TabsList>
        <TabsTrigger value="basic">Basic Info</TabsTrigger>
        <TabsTrigger value="recognitions">Recognitions</TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="space-y-6">
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
      </TabsContent>

      <TabsContent value="recognitions">
        <RecognitionsSection
          initialRecognitions={recognitionsData}
          selectedSpecialties={selectedSkills}
        />
      </TabsContent>
    </Tabs>
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
