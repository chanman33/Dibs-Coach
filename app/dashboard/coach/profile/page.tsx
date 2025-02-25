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
    confirmedSpecialties,
    updateGeneralData,
    updateCoachData,
    updateRealtorData,
    updateInvestorData,
    updateMortgageData,
    updatePropertyManagerData,
    updateRecognitionsData,
    updateMarketingData,
    updateGoalsData,
    updateSelectedSpecialties,
    saveSpecialties,
    debugServerAction
  } = useProfileContext();

  // Handle specialty changes from the coach form
  const handleSpecialtiesChange = (specialties: string[]) => {
    updateSelectedSpecialties(specialties);
  };

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

  // Safely load the Investor Profile Form
  const getInvestorFormContent = () => {
    if (!selectedSpecialties.includes("INVESTOR")) return null;
    
    try {
      // First check if the module exists
      let InvestorModule;
      try {
        InvestorModule = require("@/components/profile/industry/investor/InvestorProfileForm");
      } catch (importError) {
        console.error("[INVESTOR_IMPORT_ERROR]", importError);
        return (
          <div className="p-6 bg-muted/20 rounded-lg text-center">
            <h3 className="text-lg font-medium mb-2">Investor Profile</h3>
            <p className="text-muted-foreground">
              There was an error loading the Investor profile form.
            </p>
          </div>
        );
      }
      
      // Check if the module has the expected component
      const InvestorProfileForm = InvestorModule.InvestorProfileForm || InvestorModule.default;
      
      if (!InvestorProfileForm) {
        console.error("[INVESTOR_FORM_ERROR] Component is undefined or not properly exported");
        return (
          <div className="p-6 bg-muted/20 rounded-lg text-center">
            <h3 className="text-lg font-medium mb-2">Investor Profile</h3>
            <p className="text-muted-foreground">
              There was an error loading the Investor profile form.
            </p>
          </div>
        );
      }
      
      return (
        <InvestorProfileForm
          initialData={investorData || {}}
          onSubmit={async (data: any) => {
            console.log("[INVESTOR_SUBMIT]", {
              data,
              timestamp: new Date().toISOString()
            });
            if (updateInvestorData) {
              await updateInvestorData(data);
            }
          }}
          isSubmitting={isSubmitting}
        />
      );
    } catch (error) {
      console.error("[INVESTOR_FORM_ERROR]", error);
      return (
        <div className="p-6 bg-muted/20 rounded-lg text-center">
          <h3 className="text-lg font-medium mb-2">Investor Profile</h3>
          <p className="text-muted-foreground">
            There was an error loading the Investor profile form.
          </p>
        </div>
      );
    }
  };

  // Safely load the Mortgage Profile Form
  const getMortgageFormContent = () => {
    if (!selectedSpecialties.includes("MORTGAGE")) return null;
    
    try {
      // First check if the module exists
      let MortgageModule;
      try {
        MortgageModule = require("@/components/profile/industry/mortgage/MortgageProfileForm");
      } catch (importError) {
        console.error("[MORTGAGE_IMPORT_ERROR]", importError);
        return (
          <div className="p-6 bg-muted/20 rounded-lg text-center">
            <h3 className="text-lg font-medium mb-2">Mortgage Professional Profile</h3>
            <p className="text-muted-foreground">
              There was an error loading the Mortgage Professional profile form.
            </p>
          </div>
        );
      }
      
      // Check if the module has the expected component
      const MortgageProfileForm = MortgageModule.MortgageProfileForm || MortgageModule.default;
      
      if (!MortgageProfileForm) {
        console.error("[MORTGAGE_FORM_ERROR] Component is undefined or not properly exported");
        return (
          <div className="p-6 bg-muted/20 rounded-lg text-center">
            <h3 className="text-lg font-medium mb-2">Mortgage Professional Profile</h3>
            <p className="text-muted-foreground">
              There was an error loading the Mortgage Professional profile form.
            </p>
          </div>
        );
      }
      
      return (
        <MortgageProfileForm
          initialData={mortgageData || {}}
          onSubmit={async (data: any) => {
            console.log("[MORTGAGE_SUBMIT]", {
              data,
              timestamp: new Date().toISOString()
            });
            if (updateMortgageData) {
              await updateMortgageData(data);
            }
          }}
          isSubmitting={isSubmitting}
        />
      );
    } catch (error) {
      console.error("[MORTGAGE_FORM_ERROR]", error);
      return (
        <div className="p-6 bg-muted/20 rounded-lg text-center">
          <h3 className="text-lg font-medium mb-2">Mortgage Professional Profile</h3>
          <p className="text-muted-foreground">
            There was an error loading the Mortgage Professional profile form.
          </p>
        </div>
      );
    }
  };

  // Safely load the Property Manager Profile Form
  const getPropertyManagerFormContent = () => {
    if (!selectedSpecialties.includes("PROPERTY_MANAGER")) return null;
    
    try {
      // First check if the module exists
      let PropertyManagerModule;
      try {
        PropertyManagerModule = require("@/components/profile/industry/property-manager/PropertyManagerProfileForm");
      } catch (importError) {
        console.error("[PROPERTY_MANAGER_IMPORT_ERROR]", importError);
        return (
          <div className="p-6 bg-muted/20 rounded-lg text-center">
            <h3 className="text-lg font-medium mb-2">Property Manager Profile</h3>
            <p className="text-muted-foreground">
              There was an error loading the Property Manager profile form.
            </p>
          </div>
        );
      }
      
      // Check if the module has the expected component
      const PropertyManagerProfileForm = PropertyManagerModule.PropertyManagerProfileForm || PropertyManagerModule.default;
      
      if (!PropertyManagerProfileForm) {
        console.error("[PROPERTY_MANAGER_FORM_ERROR] Component is undefined or not properly exported");
        return (
          <div className="p-6 bg-muted/20 rounded-lg text-center">
            <h3 className="text-lg font-medium mb-2">Property Manager Profile</h3>
            <p className="text-muted-foreground">
              There was an error loading the Property Manager profile form.
            </p>
          </div>
        );
      }
      
      return (
        <PropertyManagerProfileForm
          initialData={propertyManagerData || {}}
          onSubmit={async (data: any) => {
            console.log("[PROPERTY_MANAGER_SUBMIT]", {
              data,
              timestamp: new Date().toISOString()
            });
            if (updatePropertyManagerData) {
              await updatePropertyManagerData(data);
            }
          }}
          isSubmitting={isSubmitting}
        />
      );
    } catch (error) {
      console.error("[PROPERTY_MANAGER_FORM_ERROR]", error);
      return (
        <div className="p-6 bg-muted/20 rounded-lg text-center">
          <h3 className="text-lg font-medium mb-2">Property Manager Profile</h3>
          <p className="text-muted-foreground">
            There was an error loading the Property Manager profile form.
          </p>
        </div>
      );
    }
  };

  // Safely load the Insurance Profile Form
  const getInsuranceFormContent = () => {
    if (!selectedSpecialties.includes("INSURANCE")) return null;
    
    try {
      // First check if the module exists
      let InsuranceModule;
      try {
        InsuranceModule = require("@/components/profile/industry/insurance/InsuranceProfileForm");
      } catch (importError) {
        console.error("[INSURANCE_IMPORT_ERROR]", importError);
        return (
          <div className="p-6 bg-muted/20 rounded-lg text-center">
            <h3 className="text-lg font-medium mb-2">Insurance Profile</h3>
            <p className="text-muted-foreground">
              There was an error loading the Insurance profile form.
            </p>
          </div>
        );
      }
      
      // Check if the module has the expected component
      const InsuranceProfileForm = InsuranceModule.InsuranceProfileForm || InsuranceModule.default;
      
      if (!InsuranceProfileForm) {
        console.error("[INSURANCE_FORM_ERROR] Component is undefined or not properly exported");
        return (
          <div className="p-6 bg-muted/20 rounded-lg text-center">
            <h3 className="text-lg font-medium mb-2">Insurance Profile</h3>
            <p className="text-muted-foreground">
              There was an error loading the Insurance profile form.
            </p>
          </div>
        );
      }
      
      return (
        <InsuranceProfileForm
          initialData={{}}
          onSubmit={async (data: any) => {
            console.log("[INSURANCE_SUBMIT]", {
              data,
              timestamp: new Date().toISOString()
            });
            // TODO: Implement insurance profile update
          }}
          isSubmitting={isSubmitting}
        />
      );
    } catch (error) {
      console.error("[INSURANCE_FORM_ERROR]", error);
      return (
        <div className="p-6 bg-muted/20 rounded-lg text-center">
          <h3 className="text-lg font-medium mb-2">Insurance Profile</h3>
          <p className="text-muted-foreground">
            There was an error loading the Insurance profile form.
          </p>
        </div>
      );
    }
  };

  // Safely load the Title Escrow Profile Form
  const getTitleEscrowFormContent = () => {
    if (!selectedSpecialties.includes("TITLE_ESCROW")) return null;
    
    try {
      // First check if the module exists
      let TitleEscrowModule;
      try {
        TitleEscrowModule = require("@/components/profile/industry/title-escrow/TitleEscrowProfileForm");
      } catch (importError) {
        console.error("[TITLE_ESCROW_IMPORT_ERROR]", importError);
        return (
          <div className="p-6 bg-muted/20 rounded-lg text-center">
            <h3 className="text-lg font-medium mb-2">Title & Escrow Profile</h3>
            <p className="text-muted-foreground">
              There was an error loading the Title & Escrow profile form.
            </p>
          </div>
        );
      }
      
      // Check if the module has the expected component
      const TitleEscrowProfileForm = TitleEscrowModule.TitleEscrowProfileForm || TitleEscrowModule.default;
      
      if (!TitleEscrowProfileForm) {
        console.error("[TITLE_ESCROW_FORM_ERROR] Component is undefined or not properly exported");
        return (
          <div className="p-6 bg-muted/20 rounded-lg text-center">
            <h3 className="text-lg font-medium mb-2">Title & Escrow Profile</h3>
            <p className="text-muted-foreground">
              There was an error loading the Title & Escrow profile form.
            </p>
          </div>
        );
      }
      
      return (
        <TitleEscrowProfileForm
          initialData={{}}
          onSubmit={async (data: any) => {
            console.log("[TITLE_ESCROW_SUBMIT]", {
              data,
              timestamp: new Date().toISOString()
            });
            // TODO: Implement title & escrow profile update
          }}
          isSubmitting={isSubmitting}
        />
      );
    } catch (error) {
      console.error("[TITLE_ESCROW_FORM_ERROR]", error);
      return (
        <div className="p-6 bg-muted/20 rounded-lg text-center">
          <h3 className="text-lg font-medium mb-2">Title & Escrow Profile</h3>
          <p className="text-muted-foreground">
            There was an error loading the Title & Escrow profile form.
          </p>
        </div>
      );
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 md:container mx-auto py-4 sm:py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Coach Profile</h1>
        
        {/* Profile completion status badge */}
        <div className="mt-2 md:mt-0 flex items-center gap-2">
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
      
      {/* Tabs manager */}
      <ProfileTabsManager
        userCapabilities={userCapabilities}
        selectedSpecialties={selectedSpecialties}
        confirmedSpecialties={confirmedSpecialties}
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
            saveSpecialties={saveSpecialties}
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
        investorFormContent={getInvestorFormContent()}
        mortgageFormContent={getMortgageFormContent()}
        propertyManagerFormContent={getPropertyManagerFormContent()}
        titleEscrowFormContent={getTitleEscrowFormContent()}
        insuranceFormContent={getInsuranceFormContent()}
        initialRecognitions={recognitionsData}
        onSubmitRecognitions={updateRecognitionsData}
        initialMarketingInfo={marketingData}
        onSubmitMarketingInfo={updateMarketingData}
        initialGoals={goalsData}
        onSubmitGoals={updateGoalsData}
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
