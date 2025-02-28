"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Award, Building, Home, ListChecks, User, Briefcase, Globe, Target, Info, List } from "lucide-react";
import { CoachProfileFormValues } from "../types";
import { ProfessionalRecognition } from "@/utils/types/recognition";
import GeneralForm from "./GeneralForm";
import { RecognitionsTab } from "../coach/RecognitionsTab";
import MarketingInfo from "../coach/MarketingInfo";
import { MarketingInfo as MarketingInfoType } from "@/utils/types/marketing";
import GoalsForm from "./GoalsForm";
import { Goal, GoalFormValues } from "@/utils/types/goals";
import ListingsForm from "../industry/realtor/ListingsForm";
import { toast } from "sonner";

export const INDUSTRY_SPECIALTIES = {
  REALTOR: "REALTOR",
  INVESTOR: "INVESTOR",
  MORTGAGE: "MORTGAGE",
  PROPERTY_MANAGER: "PROPERTY_MANAGER",
  TITLE_ESCROW: "TITLE_ESCROW",
  INSURANCE: "INSURANCE",
  COMMERCIAL: "COMMERCIAL",
  PRIVATE_CREDIT: "PRIVATE_CREDIT",
};

export type IndustrySpecialty = keyof typeof INDUSTRY_SPECIALTIES;

// Define the tab interface
export interface ProfileTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  requiredCapabilities?: string[];
  requiredSpecialties?: string[];
  requiredConfirmedSpecialties?: string[];
  subTabs?: ProfileSubTab[];
}

// Define the sub-tab interface
export interface ProfileSubTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

interface DomainTabsConfig {
  realtorFormContent?: React.ReactNode;
  investorFormContent?: React.ReactNode;
  investorListingsContent?: React.ReactNode;
  mortgageFormContent?: React.ReactNode;
  propertyManagerFormContent?: React.ReactNode;
  propertyManagerListingsContent?: React.ReactNode;
  titleEscrowFormContent?: React.ReactNode;
  insuranceFormContent?: React.ReactNode;
  commercialFormContent?: React.ReactNode;
  commercialListingsContent?: React.ReactNode;
  privateCreditFormContent?: React.ReactNode;
  isSubmitting: boolean;
}

const buildDomainSubTabs = (industrySpecialties: string[], config: DomainTabsConfig): ProfileSubTab[] => {
  const tabs: ProfileSubTab[] = [];
  
  if (industrySpecialties.includes(INDUSTRY_SPECIALTIES.REALTOR) && config.realtorFormContent) {
    tabs.push({
      id: "realtor",
      label: "Realtor Profile",
      icon: <Home className="h-4 w-4" />,
      content: config.realtorFormContent
    });
    
    tabs.push({
      id: "realtor-listings",
      label: "Listings",
      icon: <List className="h-4 w-4" />,
      content: (
        <ListingsForm 
          onSubmit={async (data) => {
            toast.success("Listing created successfully");
            return { data: null };
          }}
          onUpdate={async (ulid, data) => {
            toast.success("Listing updated successfully");
            return { data: null };
          }}
          activeListings={[]}
          successfulTransactions={[]}
          isSubmitting={config.isSubmitting}
        />
      )
    });
  }
  
  if (industrySpecialties.includes(INDUSTRY_SPECIALTIES.INVESTOR) && config.investorFormContent) {
    tabs.push({
      id: "investor",
      label: "Investor Profile",
      icon: <Building className="h-4 w-4" />,
      content: config.investorFormContent
    });
    
    if (config.investorListingsContent) {
      tabs.push({
        id: "investor-listings",
        label: "Investment Properties",
        icon: <List className="h-4 w-4" />,
        content: config.investorListingsContent
      });
    }
  }
  
  if (industrySpecialties.includes(INDUSTRY_SPECIALTIES.MORTGAGE) && config.mortgageFormContent) {
    tabs.push({
      id: "mortgage",
      label: "Mortgage Profile",
      icon: <Building className="h-4 w-4" />,
      content: config.mortgageFormContent
    });
  }
  
  if (industrySpecialties.includes(INDUSTRY_SPECIALTIES.PROPERTY_MANAGER) && config.propertyManagerFormContent) {
    tabs.push({
      id: "property-manager",
      label: "Property Manager Profile",
      icon: <Building className="h-4 w-4" />,
      content: config.propertyManagerFormContent
    });
    
    if (config.propertyManagerListingsContent) {
      tabs.push({
        id: "property-manager-listings",
        label: "Managed Properties",
        icon: <List className="h-4 w-4" />,
        content: config.propertyManagerListingsContent
      });
    }
  }
  
  if (industrySpecialties.includes(INDUSTRY_SPECIALTIES.TITLE_ESCROW) && config.titleEscrowFormContent) {
    tabs.push({
      id: "title-escrow",
      label: "Title & Escrow Profile",
      icon: <Building className="h-4 w-4" />,
      content: config.titleEscrowFormContent
    });
  }
  
  if (industrySpecialties.includes(INDUSTRY_SPECIALTIES.INSURANCE) && config.insuranceFormContent) {
    tabs.push({
      id: "insurance",
      label: "Insurance Profile",
      icon: <Building className="h-4 w-4" />,
      content: config.insuranceFormContent
    });
  }

  if (industrySpecialties.includes(INDUSTRY_SPECIALTIES.COMMERCIAL) && config.commercialFormContent) {
    tabs.push({
      id: "commercial",
      label: "Commercial Profile",
      icon: <Building className="h-4 w-4" />,
      content: config.commercialFormContent
    });
    
    if (config.commercialListingsContent) {
      tabs.push({
        id: "commercial-listings",
        label: "Commercial Properties",
        icon: <List className="h-4 w-4" />,
        content: config.commercialListingsContent
      });
    }
  }

  if (industrySpecialties.includes(INDUSTRY_SPECIALTIES.PRIVATE_CREDIT) && config.privateCreditFormContent) {
    tabs.push({
      id: "private-credit",
      label: "Private Credit Profile",
      icon: <Briefcase className="h-4 w-4" />,
      content: config.privateCreditFormContent
    });
  }

  return tabs;
};

interface ProfileTabsManagerProps {
  userCapabilities: string[];
  selectedSkills: string[];
  industrySpecialties: string[];
  generalUserInfo?: {
    displayName?: string | null;
    bio?: string | null;
    totalYearsRE?: number;
    primaryMarket?: string | null;
  };
  onSubmitGeneral?: (data: any) => Promise<void>;
  onSubmitCoach?: (data: CoachProfileFormValues) => Promise<void>;
  coachFormContent: React.ReactNode;
  realtorFormContent?: React.ReactNode;
  investorFormContent?: React.ReactNode;
  investorListingsContent?: React.ReactNode;
  mortgageFormContent?: React.ReactNode;
  propertyManagerFormContent?: React.ReactNode;
  propertyManagerListingsContent?: React.ReactNode;
  titleEscrowFormContent?: React.ReactNode;
  insuranceFormContent?: React.ReactNode;
  commercialFormContent?: React.ReactNode;
  commercialListingsContent?: React.ReactNode;
  privateCreditFormContent?: React.ReactNode;
  initialRecognitions?: ProfessionalRecognition[];
  onSubmitRecognitions: (recognitions: ProfessionalRecognition[]) => Promise<void>;
  initialMarketingInfo?: MarketingInfoType;
  onSubmitMarketingInfo?: (data: MarketingInfoType) => Promise<void>;
  initialGoals?: Goal[];
  onSubmitGoals?: (goals: Goal[]) => Promise<void>;
  isSubmitting?: boolean;
  saveSkills?: (skills: string[]) => Promise<boolean>;
}

export const ProfileTabsManager: React.FC<ProfileTabsManagerProps> = ({
  userCapabilities,
  selectedSkills,
  industrySpecialties,
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
  saveSkills,
}) => {
  // Memoize state to prevent unnecessary re-renders
  const [activeTab, setActiveTab] = useState("general");
  const [activeSubTab, setActiveSubTab] = useState("basic-info");
  const [showTabsDropdown, setShowTabsDropdown] = useState(false);
  const [showSubTabsDropdown, setShowSubTabsDropdown] = useState(false);

  // Track previous specialties for comparison
  const prevSpecialtiesRef = useRef<string>(JSON.stringify(industrySpecialties));

  // Memoize domain sub-tabs with proper dependency array
  const domainSubTabs = useMemo(
    () => {
      // Only rebuild if we have industry specialties and are on the coach tab
      if (!industrySpecialties?.length || activeTab !== 'coach') {
        return [];
      }

      return buildDomainSubTabs(industrySpecialties, {
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
      });
    },
    // Only depend on the specialties and form contents, not activeTab
    [
      industrySpecialties,
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
    ]
  );

  // Memoize all tabs to prevent unnecessary rebuilds
  const allTabs = useMemo<ProfileTab[]>(() => [
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
      subTabs: [] // Will be populated by activeTabObject
    },
    {
      id: "recognitions",
      label: "Professional Recognitions",
      icon: <Award className="h-4 w-4" />,
      content: (
        <RecognitionsTab 
          initialRecognitions={initialRecognitions}
          onSubmit={onSubmitRecognitions}
          isSubmitting={isSubmitting}
          selectedSkills={selectedSkills}
        />
      ),
      requiredCapabilities: ["COACH"],
    },
    {
      id: "marketing",
      label: "Marketing Info",
      icon: <Globe className="h-4 w-4" />,
      content: (
        <MarketingInfo
          initialData={initialMarketingInfo}
          onSubmit={onSubmitMarketingInfo}
          isSubmitting={isSubmitting}
        />
      ),
      requiredCapabilities: ["COACH"],
    },
    {
      id: "goals",
      label: "Goals & Objectives",
      icon: <Target className="h-4 w-4" />,
      content: (
        <GoalsForm
          open={true}
          onClose={() => {}}
          onSubmit={async (data: GoalFormValues) => {
            if (onSubmitGoals) {
              await onSubmitGoals([]);
            }
          }}
        />
      ),
      requiredCapabilities: ["COACH"],
    }
  ], [
    generalUserInfo,
    onSubmitGeneral,
    coachFormContent,
    initialRecognitions,
    onSubmitRecognitions,
    initialMarketingInfo,
    onSubmitMarketingInfo,
    onSubmitGoals,
    isSubmitting,
    selectedSkills
  ]);

  // Reset sub-tab only when specialties are actually different
  useEffect(() => {
    if (activeTab === "coach") {
      const currentSpecialties = JSON.stringify(industrySpecialties);
      
      if (prevSpecialtiesRef.current !== currentSpecialties) {
        setActiveSubTab("basic-info");
        prevSpecialtiesRef.current = currentSpecialties;
      }
    }
  }, [industrySpecialties, activeTab]);

  // Memoize filtered tabs to prevent unnecessary rebuilds
  const filteredTabs = useMemo(() => 
    allTabs.filter(tab => {
      if (!tab.requiredCapabilities) {
        return true;
      }
      return tab.requiredCapabilities.some(cap => userCapabilities.includes(cap));
    })
  , [allTabs, userCapabilities]);

  // Get the active tab object - memoize to prevent unnecessary rebuilds
  const activeTabObject = useMemo<ProfileTab | undefined>(() => {
    const tab = filteredTabs.find(tab => tab.id === activeTab);
    if (tab?.id === 'coach') {
      return {
        ...tab,
        subTabs: [
          {
            id: "basic-info",
            label: "Basic Info",
            icon: <Info className="h-4 w-4" />,
            content: coachFormContent
          },
          ...domainSubTabs
        ]
      };
    }
    return tab;
  }, [filteredTabs, activeTab, coachFormContent, domainSubTabs]);

  // Get the active content based on current tab/subtab
  const activeContent = useMemo(() => {
    if (activeTab === "coach" && activeTabObject?.subTabs) {
      const activeSubTabObject = activeTabObject.subTabs.find(subTab => subTab.id === activeSubTab);
      return activeSubTabObject?.content || activeTabObject.content;
    }
    return activeTabObject?.content;
  }, [activeTab, activeTabObject, activeSubTab]);

  const handleTabSelect = useCallback((tabId: string) => {
    setActiveTab(tabId);
    setShowTabsDropdown(false);
    
    // Reset sub-tab to first one when changing main tab
    const selectedTab = filteredTabs.find(tab => tab.id === tabId);
    if (selectedTab?.subTabs && selectedTab.subTabs.length > 0) {
      setActiveSubTab(selectedTab.subTabs[0].id);
    }
  }, [filteredTabs]);

  const handleSubTabSelect = useCallback((subTabId: string) => {
    setActiveSubTab(subTabId);
    setShowSubTabsDropdown(false);
  }, []);

  const handleCoachSubmit = async (data: CoachProfileFormValues) => {
    // Log the coach submit
    // console.log("[PROFILE_TABS_COACH_SUBMIT]", {
    //   data,
    //   timestamp: new Date().toISOString()
    // });
    
    if (onSubmitCoach) {
      await onSubmitCoach(data);
    }
  };

  // Remove console.log to prevent unnecessary re-renders
  // console.log("[PROFILE_TABS_RENDER]", {...});

  return (
    <Tabs value={activeTab} onValueChange={handleTabSelect} className="w-full">
      {/* Mobile view: Dropdown for tabs */}
      <div className="md:hidden mb-6">
        <div className="relative">
          <button
            onClick={() => setShowTabsDropdown(!showTabsDropdown)}
            className="flex items-center justify-between w-full p-3 bg-background border rounded-md shadow-sm text-left"
          >
            <div className="flex items-center gap-2">
              {filteredTabs.find(tab => tab.id === activeTab)?.icon}
              <span>{filteredTabs.find(tab => tab.id === activeTab)?.label}</span>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`h-4 w-4 transition-transform ${showTabsDropdown ? 'rotate-180' : ''}`}
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          
          {showTabsDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg">
              {filteredTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleTabSelect(tab.id)}
                  className={`flex items-center gap-2 w-full p-3 text-left hover:bg-muted transition-colors ${
                    activeTab === tab.id ? 'bg-muted font-medium' : ''
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Desktop view: Horizontal tabs */}
      <div className="hidden md:block">
        <TabsList className="mb-6 flex flex-wrap gap-1 justify-start w-full bg-background border-b pb-0">
          {filteredTabs.map(tab => (
            <TabsTrigger 
              key={tab.id} 
              value={tab.id} 
              className="flex items-center gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:rounded-none data-[state=active]:shadow-none"
            >
              {tab.icon}
              <span>{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      
      {/* Mobile view: Dropdown for sub-tabs */}
      {activeTab === "coach" && activeTabObject?.subTabs && activeTabObject.subTabs.length > 0 && (
        <>
          {/* Mobile view: Dropdown for sub-tabs */}
          <div className="md:hidden mb-4">
            <div className="relative">
              <button
                onClick={() => setShowSubTabsDropdown(!showSubTabsDropdown)}
                className="flex items-center justify-between w-full p-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-md shadow-sm text-left"
              >
                <div className="flex items-center gap-2">
                  {activeTabObject.subTabs.find(subTab => subTab.id === activeSubTab)?.icon}
                  <span>{activeTabObject.subTabs.find(subTab => subTab.id === activeSubTab)?.label}</span>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`h-4 w-4 transition-transform ${showSubTabsDropdown ? 'rotate-180' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              
              {showSubTabsDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-blue-200 rounded-md shadow-lg">
                  {activeTabObject.subTabs.map(subTab => (
                    <button
                      key={subTab.id}
                      onClick={() => handleSubTabSelect(subTab.id)}
                      className={`flex items-center gap-2 w-full p-2 text-left hover:bg-blue-50 transition-colors ${
                        activeSubTab === subTab.id ? 'bg-blue-50 text-blue-700 font-medium' : ''
                      }`}
                    >
                      {subTab.icon}
                      <span>{subTab.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Desktop view: Horizontal sub-tabs */}
          <div className="hidden md:block mb-6">
            <div className="flex flex-wrap gap-1 justify-start w-full bg-blue-50 p-2 rounded-md border border-blue-100">
              {activeTabObject.subTabs.map(subTab => (
                <button
                  key={subTab.id}
                  onClick={() => handleSubTabSelect(subTab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                    activeSubTab === subTab.id 
                      ? 'bg-blue-200 text-blue-800 font-medium' 
                      : 'text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  {subTab.icon}
                  <span>{subTab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
      
      {/* Tab content */}
      <div className="mt-6">
        {activeTab === "coach" && activeTabObject?.subTabs ? (
          // Render the active sub-tab content for Coach Profile
          activeContent
        ) : (
          // Render regular tab content for other tabs
          filteredTabs.map(tab => (
            <TabsContent key={tab.id} value={tab.id} className="px-0">
              {tab.content}
            </TabsContent>
          ))
        )}
      </div>
    </Tabs>
  );
}; 