"use client";

import { useProfileContext, ProfileProvider } from "@/components/profile/context/ProfileContext";
import { CoachProfileForm } from "@/components/profile/coach/CoachProfileForm";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useCallback } from "react";
import type { CoachProfileFormValues, CoachProfileInitialData } from "@/components/profile/types";
import type { ProfileStatus, RealEstateDomain } from "@/utils/types/coach";
import { ProfileTabsManager } from "@/components/profile/common/ProfileTabsManager";
import type { Goal, GoalFormValues } from "@/utils/types/goals";
import type { GeneralFormData } from "@/utils/actions/user-profile-actions";
import ListingsForm from "@/components/profile/industry/realtor/ListingsForm";
import { RealtorProfileForm } from "@/components/profile/industry/realtor/RealtorProfileForm";
import { PropertyManagerProfileForm } from "@/components/profile/industry/property-manager/PropertyManagerProfileForm";
import { PropertyManagerListings } from "@/components/profile/industry/property-manager/PropertyManagerListings";
import { InvestorProfileForm } from "@/components/profile/industry/investor/InvestorProfileForm";
import { InvestorListings } from "@/components/profile/industry/investor/InvestorListings";
import { MortgageProfileForm } from "@/components/profile/industry/mortgage/MortgageProfileForm";
import { TitleEscrowProfileForm } from "@/components/profile/industry/title-escrow/TitleEscrowProfileForm";
import { InsuranceProfileForm } from "@/components/profile/industry/insurance/InsuranceProfileForm";
import { CommercialProfileForm } from "@/components/profile/industry/commercial/CommercialProfileForm";
import { CommercialListings } from "@/components/profile/industry/commercial/CommercialListings";
import { PrivateCreditProfileForm } from "@/components/profile/industry/private-credit/PrivateCreditProfileForm";
import { CreditListings } from "@/components/profile/industry/private-credit/CreditListings";

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
    activeListings,
    successfulTransactions,
    onSubmitListing,
    onUpdateListing,
    realtorData,
    propertyManagerData,
    updateRealtorData,
    updatePropertyManagerData,
    investorData,
    updateInvestorData,
    mortgageData,
    updateMortgageData,
    titleEscrowData,
    updateTitleEscrowData,
    insuranceData,
    updateInsuranceData,
    commercialData,
    updateCommercialData,
    privateCreditData,
    updatePrivateCreditData,
  } = useProfileContext();

  const handleProfileSubmit = useCallback(async (data: CoachProfileFormValues) => {
    console.log("[HANDLE_PROFILE_SUBMIT]", {
      data,
      timestamp: new Date().toISOString()
    });
    await updateCoachData(data);
  }, [updateCoachData]);

  const handleGeneralSubmit = useCallback(async (data: GeneralFormData) => {
    const result = await updateGeneralData(data);
    return { data: result.data ?? null, error: result.error ?? null };
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

  // Ensure we have all the required completion data
  const extendedCoachData: ExtendedCoachData = {
    ...coachData,
    yearsCoaching: coachData?.yearsCoaching ?? undefined,
    hourlyRate: coachData?.hourlyRate ?? undefined,
    status: coachData?.status || "DRAFT",
    completionPercentage: coachData?.completionPercentage || 0,
    missingFields: coachData?.missingFields || [],
    missingRequiredFields: coachData?.missingRequiredFields || [],
    optionalMissingFields: coachData?.optionalMissingFields || [],
    validationMessages: coachData?.validationMessages || {},
    canPublish: coachData?.canPublish || false,
  };

  console.log("[PROFILE_PAGE_RENDER]", {
    extendedCoachData,
    timestamp: new Date().toISOString()
  });

  console.log("[PROFILE_PAGE_DOMAINS_PASS]", {
    domainsToPass: realEstateDomains,
    timestamp: new Date().toISOString(),
    source: 'client',
    componentId: 'ProfilePage'
  });
      
  return (
    <ProfileTabsManager
      userCapabilities={userCapabilities}
      selectedSkills={selectedSkills}
      realEstateDomains={realEstateDomains}
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
      realtorFormContent={
        <RealtorProfileForm
          initialData={realtorData}
          onSubmit={updateRealtorData}
          isSubmitting={isSubmitting}
        />
      }
      realtorListingsContent={
        <ListingsForm
          onSubmit={onSubmitListing}
          onUpdate={onUpdateListing}
          activeListings={activeListings}
          successfulTransactions={successfulTransactions}
          isSubmitting={isSubmitting}
        />
      }
      propertyManagerFormContent={
        <PropertyManagerProfileForm
          initialData={propertyManagerData}
          onSubmit={updatePropertyManagerData}
          isSubmitting={isSubmitting}
        />
      }
      propertyManagerListingsContent={
        <PropertyManagerListings
          isSubmitting={isSubmitting}
        />
      }
      investorFormContent={
        <InvestorProfileForm
          initialData={investorData}
          onSubmit={updateInvestorData}
          isSubmitting={isSubmitting}
        />
      }
      investorListingsContent={
        <InvestorListings />
      }
      mortgageFormContent={
        <MortgageProfileForm
          initialData={mortgageData}
          onSubmit={updateMortgageData}
          isSubmitting={isSubmitting}
        />
      }
      titleEscrowFormContent={
        <TitleEscrowProfileForm
          initialData={titleEscrowData}
          onSubmit={updateTitleEscrowData}
          isSubmitting={isSubmitting}
        />
      }
      insuranceFormContent={
        <InsuranceProfileForm
          initialData={insuranceData}
          onSubmit={updateInsuranceData}
          isSubmitting={isSubmitting}
        />
      }
      commercialFormContent={
        <CommercialProfileForm
          initialData={commercialData}
          onSubmit={updateCommercialData}
          isSubmitting={isSubmitting}
        />
      }
      commercialListingsContent={
        <CommercialListings />
      }
      privateCreditFormContent={
        <PrivateCreditProfileForm
          initialData={privateCreditData}
          onSubmit={updatePrivateCreditData}
          isSubmitting={isSubmitting}
        />
      }
      creditListingsContent={
        <CreditListings />
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
