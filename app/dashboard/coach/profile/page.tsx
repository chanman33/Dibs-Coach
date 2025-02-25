"use client";

import { useEffect, useState } from "react";
import { ProfileProvider } from "@/components/profile/context/ProfileContext";
import { useProfileContext } from "@/components/profile/context/ProfileContext";
import { ProfileTabsManager } from "@/components/profile/common/ProfileTabsManager";
import { CoachProfileForm } from "@/components/profile/coach/CoachProfileForm";
import { RealtorProfileForm } from "@/components/profile/industry/realtor/RealtorProfileForm";
import { RecognitionsSection } from "@/components/profile/coach/RecognitionsSection";
import MarketingInfo from "@/components/profile/coach/MarketingInfo";
import GoalsForm from "@/components/profile/common/GoalsForm";
import { Loader } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

// Main profile page content component
function ProfilePageContent() {
  const {
    generalData,
    coachData,
    realtorData,
    investorData,
    mortgageData,
    propertyManagerData,
    recognitionsData,
    marketingData,
    goalsData,
    profileStatus,
    completionPercentage,
    missingFields,
    canPublish,
    isLoading,
    isSubmitting,
    userCapabilities,
    selectedSpecialties,
    updateGeneralData,
    updateCoachData,
    updateRealtorData,
    updateInvestorData,
    updateMortgageData,
    updatePropertyManagerData,
    updateRecognitionsData,
    updateMarketingData,
    updateGoalsData,
    updateSelectedSpecialties
  } = useProfileContext();

  // Handle specialty changes from the coach form
  const handleSpecialtiesChange = (specialties: string[]) => {
    updateSelectedSpecialties(specialties);
  };

  // Debug log to check capabilities and specialties
  useEffect(() => {
    console.log("Page - User capabilities:", userCapabilities);
    console.log("Page - Selected specialties:", selectedSpecialties);
  }, [userCapabilities, selectedSpecialties]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Prepare user info for the general form
  const generalUserInfo = {
    displayName: generalData.displayName,
    bio: generalData.bio,
    primaryMarket: generalData.primaryMarket
  };

  return (
    <div className="w-full px-4 sm:px-6 md:container mx-auto py-4 sm:py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Coach Profile</h1>
        
        {/* Profile completion status badge */}
        <div className="mt-2 md:mt-0">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-50 text-primary-700">
            <span className="mr-2">Profile Completion:</span>
            <span className="font-bold">{completionPercentage}%</span>
          </div>
        </div>
      </div>
      
      {/* Profile completion alert */}
      {completionPercentage < 100 && (
        <Alert className="mb-4 sm:mb-8">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Profile Incomplete</AlertTitle>
          <AlertDescription>
            Your profile is {completionPercentage}% complete. Please fill in the following fields to complete your profile:
            <ul className="list-disc list-inside mt-2">
              {missingFields.map((field, index) => (
                <li key={index}>{field}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Debug info - only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-2 sm:p-4 bg-gray-100 rounded-md text-xs sm:text-sm">
          <h3 className="font-semibold">Debug Info:</h3>
          <p>User Capabilities: {userCapabilities.join(', ') || 'None'}</p>
          <p>Selected Specialties: {selectedSpecialties.join(', ') || 'None'}</p>
        </div>
      )}
      
      {/* Tabs manager */}
      <ProfileTabsManager
        userCapabilities={userCapabilities}
        selectedSpecialties={selectedSpecialties}
        generalUserInfo={generalUserInfo}
        onSubmitGeneral={updateGeneralData}
        coachFormContent={
          <CoachProfileForm
            initialData={coachData}
            onSubmit={updateCoachData}
            isSubmitting={isSubmitting}
            profileStatus={profileStatus}
            completionPercentage={completionPercentage}
            missingFields={missingFields}
            canPublish={canPublish}
            onSpecialtiesChange={handleSpecialtiesChange}
          />
        }
        realtorFormContent={
          selectedSpecialties.includes("REALTOR") ? (
            <RealtorProfileForm
              initialData={realtorData}
              onSubmit={updateRealtorData}
              isSubmitting={isSubmitting}
            />
          ) : null
        }
        investorFormContent={
          selectedSpecialties.includes("INVESTOR") ? (
            <div>Investor profile form will go here</div>
          ) : null
        }
        mortgageFormContent={
          selectedSpecialties.includes("MORTGAGE") ? (
            <div>Mortgage profile form will go here</div>
          ) : null
        }
        propertyManagerFormContent={
          selectedSpecialties.includes("PROPERTY_MANAGER") ? (
            <div>Property Manager profile form will go here</div>
          ) : null
        }
        initialRecognitions={recognitionsData}
        onSubmitRecognitions={updateRecognitionsData}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

// Page component with context provider
export default function CoachProfilePage() {
  return (
    <ProfileProvider>
      <ProfilePageContent />
    </ProfileProvider>
  );
}
