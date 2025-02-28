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
import { InvestorListings } from "@/components/profile/industry/investor";
import { PropertyManagerListings } from "@/components/profile/industry/property-manager";
import { CommercialListings } from "@/components/profile/industry/commercial";
import { ProfessionalRecognition } from "@/utils/types/recognition";

// Main profile page content component
function ProfilePageContent() {
  const [isLocalLoading, setIsLocalLoading] = useState(true);
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
    missingRequiredFields,
    optionalMissingFields,
    validationMessages,
    canPublish,
    isSubmitting,
    isLoading: isContextLoading,
    userCapabilities,
    selectedSkills,
    industrySpecialties,
    updateGeneralData,
    updateCoachData,
    updateRealtorData,
    updateInvestorData,
    updateMortgageData,
    updatePropertyManagerData,
    updateRecognitionsData,
    updateMarketingData,
    updateGoalsData,
    onSkillsChange,
    saveSkills,
    commercialData,
    privateCreditData,
    updateCommercialData,
    updatePrivateCreditData,
    fetchError
  } = useProfileContext();

  // Handle skills changes from the coach form
  const handleSkillsChange = (skills: string[]) => {
    onSkillsChange(skills);
  };

  useEffect(() => {
    if (!isContextLoading) {
      setIsLocalLoading(false);
    }
  }, [isContextLoading]);

  if (isLocalLoading || isContextLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="w-full px-4 sm:px-6 md:container mx-auto py-4 sm:py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load profile data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Prepare user info for the general form
  const generalUserInfo = {
    displayName: generalData.displayName,
    bio: generalData.bio,
    primaryMarket: generalData.primaryMarket,
    totalYearsRE: generalData.totalYearsRE
  };

  // Safely load the Investor Profile Form
  const getInvestorFormContent = () => {
    if (!selectedSkills.includes("INVESTOR")) return null;
    
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
    if (!selectedSkills.includes("MORTGAGE")) return null;
    
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
    if (!selectedSkills.includes("PROPERTY_MANAGER")) return null;
    
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
    if (!selectedSkills.includes("INSURANCE")) return null;
    
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
    if (!selectedSkills.includes("TITLE_ESCROW")) return null;
    
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

  // Safely load the Commercial Profile Form
  const getCommercialFormContent = () => {
    if (!selectedSkills.includes("COMMERCIAL")) return null;
    
    try {
      // First check if the module exists
      let CommercialModule;
      try {
        CommercialModule = require("@/components/profile/industry/commercial/CommercialForm");
      } catch (importError) {
        console.error("[COMMERCIAL_IMPORT_ERROR]", importError);
        return (
          <div className="p-6 bg-muted/20 rounded-lg text-center">
            <h3 className="text-lg font-medium mb-2">Commercial Profile</h3>
            <p className="text-muted-foreground">
              There was an error loading the Commercial profile form.
            </p>
          </div>
        );
      }
      
      // Check if the module has the expected component
      const CommercialForm = CommercialModule.CommercialForm || CommercialModule.default;
      
      if (!CommercialForm) {
        console.error("[COMMERCIAL_FORM_ERROR] Component is undefined or not properly exported");
        return (
          <div className="p-6 bg-muted/20 rounded-lg text-center">
            <h3 className="text-lg font-medium mb-2">Commercial Profile</h3>
            <p className="text-muted-foreground">
              There was an error loading the Commercial profile form.
            </p>
          </div>
        );
      }
      
      return (
        <CommercialForm
          initialData={commercialData || {}}
          onSubmit={async (data: any) => {
            console.log("[COMMERCIAL_SUBMIT]", {
              data,
              timestamp: new Date().toISOString()
            });
            if (updateCommercialData) {
              await updateCommercialData(data);
            }
          }}
          isSubmitting={isSubmitting}
        />
      );
    } catch (error) {
      console.error("[COMMERCIAL_FORM_ERROR]", error);
      return (
        <div className="p-6 bg-muted/20 rounded-lg text-center">
          <h3 className="text-lg font-medium mb-2">Commercial Profile</h3>
          <p className="text-muted-foreground">
            There was an error loading the Commercial profile form.
          </p>
        </div>
      );
    }
  };

  // Safely load the Private Credit Profile Form
  const getPrivateCreditFormContent = () => {
    if (!selectedSkills.includes("PRIVATE_CREDIT")) return null;
    
    try {
      // First check if the module exists
      let PrivateCreditModule;
      try {
        PrivateCreditModule = require("@/components/profile/industry/private-credit/PrivateCreditForm");
      } catch (importError) {
        console.error("[PRIVATE_CREDIT_IMPORT_ERROR]", importError);
        return (
          <div className="p-6 bg-muted/20 rounded-lg text-center">
            <h3 className="text-lg font-medium mb-2">Private Credit Profile</h3>
            <p className="text-muted-foreground">
              There was an error loading the Private Credit profile form.
            </p>
          </div>
        );
      }
      
      // Check if the module has the expected component
      const PrivateCreditForm = PrivateCreditModule.PrivateCreditForm || PrivateCreditModule.default;
      
      if (!PrivateCreditForm) {
        console.error("[PRIVATE_CREDIT_FORM_ERROR] Component is undefined or not properly exported");
        return (
          <div className="p-6 bg-muted/20 rounded-lg text-center">
            <h3 className="text-lg font-medium mb-2">Private Credit Profile</h3>
            <p className="text-muted-foreground">
              There was an error loading the Private Credit profile form.
            </p>
          </div>
        );
      }
      
      return (
        <PrivateCreditForm
          initialData={privateCreditData || {}}
          onSubmit={async (data: any) => {
            console.log("[PRIVATE_CREDIT_SUBMIT]", {
              data,
              timestamp: new Date().toISOString()
            });
            if (updatePrivateCreditData) {
              await updatePrivateCreditData(data);
            }
          }}
          isSubmitting={isSubmitting}
        />
      );
    } catch (error) {
      console.error("[PRIVATE_CREDIT_FORM_ERROR]", error);
      return (
        <div className="p-6 bg-muted/20 rounded-lg text-center">
          <h3 className="text-lg font-medium mb-2">Private Credit Profile</h3>
          <p className="text-muted-foreground">
            There was an error loading the Private Credit profile form.
          </p>
        </div>
      );
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 md:container mx-auto py-4 sm:py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Coach Profile</h1>
      </div>
      
      {/* Tabs manager */}
      <ProfileTabsManager
        userCapabilities={userCapabilities}
        selectedSkills={selectedSkills}
        industrySpecialties={industrySpecialties}
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
            missingRequiredFields={missingRequiredFields}
            optionalMissingFields={optionalMissingFields}
            validationMessages={validationMessages}
            canPublish={canPublish}
            onSkillsChange={handleSkillsChange}
            saveSkills={saveSkills}
          />
        }
        realtorFormContent={
          selectedSkills.includes("REALTOR") ? (
            <RealtorProfileForm
              initialData={realtorData}
              onSubmit={updateRealtorData}
              isSubmitting={isSubmitting}
            />
          ) : null
        }
        investorFormContent={getInvestorFormContent()}
        investorListingsContent={
          selectedSkills.includes("INVESTOR") ? <InvestorListings /> : null
        }
        mortgageFormContent={getMortgageFormContent()}
        propertyManagerFormContent={getPropertyManagerFormContent()}
        propertyManagerListingsContent={
          selectedSkills.includes("PROPERTY_MANAGER") ? <PropertyManagerListings /> : null
        }
        titleEscrowFormContent={getTitleEscrowFormContent()}
        insuranceFormContent={getInsuranceFormContent()}
        commercialFormContent={getCommercialFormContent()}
        commercialListingsContent={
          selectedSkills.includes("COMMERCIAL") ? <CommercialListings /> : null
        }
        privateCreditFormContent={getPrivateCreditFormContent()}
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
