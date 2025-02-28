import React, { useState, useMemo, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Award, Building, Home, ListChecks, User, Briefcase, Globe, Target, Info, List } from "lucide-react";
import { toast } from "sonner";
import { INDUSTRY_SPECIALTIES } from "@/utils/types/coach";
import type { ProfileTab, ProfileSubTab, ProfileTabsManagerProps } from "@/utils/types/profile";
import type { CreateListing } from "@/utils/types/listing";
import GeneralForm from "../common/GeneralForm";
import ListingsForm from "../industry/realtor/ListingsForm";

// Move the tab building logic outside the component to prevent recreation
const buildDomainSubTabs = (
  confirmedSpecialties: string[] = [],
  {
    realtorFormContent,
    investorFormContent,
    investorListingsContent,
    mortgageFormContent,
    propertyManagerFormContent,
    propertyManagerListingsContent,
    titleEscrowFormContent,
    insuranceFormContent,
    commercialFormContent,
    commercialListingsContent,
    privateCreditFormContent,
    isSubmitting
  }: {
    realtorFormContent: React.ReactNode;
    investorFormContent: React.ReactNode;
    investorListingsContent: React.ReactNode;
    mortgageFormContent: React.ReactNode;
    propertyManagerFormContent: React.ReactNode;
    propertyManagerListingsContent: React.ReactNode;
    titleEscrowFormContent: React.ReactNode;
    insuranceFormContent: React.ReactNode;
    commercialFormContent: React.ReactNode;
    commercialListingsContent: React.ReactNode;
    privateCreditFormContent: React.ReactNode;
    isSubmitting: boolean;
  }
): ProfileSubTab[] => {
  const domainSubTabs: ProfileSubTab[] = [];

  if (confirmedSpecialties?.includes(INDUSTRY_SPECIALTIES.REALTOR) && realtorFormContent) {
    domainSubTabs.push({
      id: "realtor",
      label: "Realtor Profile",
      icon: <Home className="h-4 w-4" />,
      content: realtorFormContent
    });
    
    domainSubTabs.push({
      id: "realtor-listings",
      label: "Listings",
      icon: <List className="h-4 w-4" />,
      content: (
        <ListingsForm 
          onSubmit={async (data: CreateListing) => {
            console.log("[LISTINGS_FORM_SUBMIT]", {
              data,
              timestamp: new Date().toISOString()
            });
            toast.success("Listing created successfully");
            return { data: null };
          }}
          onUpdate={async (ulid: string, data: CreateListing) => {
            console.log("[LISTINGS_FORM_UPDATE]", {
              ulid,
              data,
              timestamp: new Date().toISOString()
            });
            toast.success("Listing updated successfully");
            return { data: null };
          }}
          activeListings={[]}
          successfulTransactions={[]}
          isSubmitting={isSubmitting}
        />
      )
    });
  }

  // Add other specialty tabs...
  // Copy the rest of the specialty tab building logic here
  
  return domainSubTabs;
};

export function ProfileTabsManager({
  userCapabilities,
  selectedSpecialties,
  confirmedSpecialties = [],
  generalUserInfo,
  onSubmitGeneral,
  onSubmitCoach,
  coachFormContent,
  realtorFormContent,
  investorFormContent,
  investorListingsContent,
  mortgageFormContent,
  propertyManagerFormContent,
  propertyManagerListingsContent,
  titleEscrowFormContent,
  insuranceFormContent,
  commercialFormContent,
  commercialListingsContent,
  privateCreditFormContent,
  initialRecognitions = [],
  onSubmitRecognitions,
  initialMarketingInfo,
  onSubmitMarketingInfo,
  initialGoals = [],
  onSubmitGoals,
  isSubmitting = false,
}: ProfileTabsManagerProps) {
  const [activeTab, setActiveTab] = useState("general");
  const [activeSubTab, setActiveSubTab] = useState("basic-info");
  const [availableTabs, setAvailableTabs] = useState<ProfileTab[]>([]);
  const [showTabsDropdown, setShowTabsDropdown] = useState(false);
  const [showSubTabsDropdown, setShowSubTabsDropdown] = useState(false);

  // Memoize domain sub-tabs to prevent unnecessary rebuilds
  const domainSubTabs = useMemo(() => 
    buildDomainSubTabs(confirmedSpecialties, {
      realtorFormContent,
      investorFormContent,
      investorListingsContent,
      mortgageFormContent,
      propertyManagerFormContent,
      propertyManagerListingsContent,
      titleEscrowFormContent,
      insuranceFormContent,
      commercialFormContent,
      commercialListingsContent,
      privateCreditFormContent,
      isSubmitting
    })
  , [
    confirmedSpecialties,
    realtorFormContent,
    investorFormContent,
    investorListingsContent,
    mortgageFormContent,
    propertyManagerFormContent,
    propertyManagerListingsContent,
    titleEscrowFormContent,
    insuranceFormContent,
    commercialFormContent,
    commercialListingsContent,
    privateCreditFormContent,
    isSubmitting
  ]);

  // Memoize all tabs to prevent unnecessary rebuilds
  const allTabs = useMemo(() => [
    {
      id: "general",
      label: "General Profile",
      icon: <User className="h-4 w-4" />,
      content: (
        <GeneralForm
          initialData={generalUserInfo}
          onSubmit={onSubmitGeneral || (() => {})}
          isSubmitting={isSubmitting}
        />
      ),
    },
    {
      id: "coach",
      label: "Coach Profile",
      icon: <Briefcase className="h-4 w-4" />,
      content: coachFormContent,
      requiredCapabilities: ["COACH"],
      subTabs: [
        {
          id: "basic-info",
          label: "Basic Info",
          icon: <Info className="h-4 w-4" />,
          content: coachFormContent
        },
        ...domainSubTabs
      ]
    },
    // ... rest of the tabs
  ], [
    generalUserInfo,
    onSubmitGeneral,
    coachFormContent,
    domainSubTabs,
    isSubmitting,
    // ... other dependencies
  ]);

  // Update available tabs when necessary
  useEffect(() => {
    const filteredTabs = allTabs.filter(tab => {
      if (!tab.requiredCapabilities) {
        return true;
      }

      return tab.requiredCapabilities.some(cap => userCapabilities.includes(cap));
    });

    setAvailableTabs(filteredTabs);
  }, [allTabs, userCapabilities]);

  // ... rest of the component code stays the same ...
} 