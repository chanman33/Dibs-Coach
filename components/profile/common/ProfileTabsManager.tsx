"use client";

import { useState, useEffect, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Award, Building, Home, ListChecks, User, Briefcase, Globe, Target, Info, List } from "lucide-react";
import { ProfessionalRecognition, CoachProfileFormValues } from "../types";
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

interface ProfileTabsManagerProps {
  userCapabilities: string[];
  selectedSpecialties: string[];
  confirmedSpecialties: string[];
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
}

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

  // Move the memoization outside useEffect
  const domainSubTabs = useMemo(() => {
    console.log("[DOMAIN_SUBTABS_REBUILD]", {
      confirmedSpecialties,
      activeTab,
      activeSubTab,
      timestamp: new Date().toISOString()
    });
    
    const tabs: ProfileSubTab[] = [];
    
    if (confirmedSpecialties.includes(INDUSTRY_SPECIALTIES.REALTOR) && realtorFormContent) {
      tabs.push({
        id: "realtor",
        label: "Realtor Profile",
        icon: <Home className="h-4 w-4" />,
        content: realtorFormContent
      });
      
      tabs.push({
        id: "realtor-listings",
        label: "Listings",
        icon: <List className="h-4 w-4" />,
        content: (
          <ListingsForm 
            onSubmit={async (data) => {
              console.log("[LISTINGS_FORM_SUBMIT]", {
                data,
                timestamp: new Date().toISOString()
              });
              toast.success("Listing created successfully");
              return { data: null };
            }}
            onUpdate={async (ulid, data) => {
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
    
    if (confirmedSpecialties.includes(INDUSTRY_SPECIALTIES.INVESTOR) && investorFormContent) {
      tabs.push({
        id: "investor",
        label: "Investor Profile",
        icon: <Building className="h-4 w-4" />,
        content: investorFormContent
      });
      
      if (investorListingsContent) {
        tabs.push({
          id: "investor-listings",
          label: "Investment Properties",
          icon: <List className="h-4 w-4" />,
          content: investorListingsContent
        });
      }
    }
    
    if (confirmedSpecialties.includes(INDUSTRY_SPECIALTIES.MORTGAGE) && mortgageFormContent) {
      tabs.push({
        id: "mortgage",
        label: "Mortgage Profile",
        icon: <Building className="h-4 w-4" />,
        content: mortgageFormContent
      });
    }
    
    if (confirmedSpecialties.includes(INDUSTRY_SPECIALTIES.PROPERTY_MANAGER) && propertyManagerFormContent) {
      tabs.push({
        id: "property-manager",
        label: "Property Manager Profile",
        icon: <Building className="h-4 w-4" />,
        content: propertyManagerFormContent
      });
      
      if (propertyManagerListingsContent) {
        tabs.push({
          id: "property-manager-listings",
          label: "Managed Properties",
          icon: <List className="h-4 w-4" />,
          content: propertyManagerListingsContent
        });
      }
    }
    
    if (confirmedSpecialties.includes(INDUSTRY_SPECIALTIES.TITLE_ESCROW) && titleEscrowFormContent) {
      tabs.push({
        id: "title-escrow",
        label: "Title & Escrow Profile",
        icon: <Building className="h-4 w-4" />,
        content: titleEscrowFormContent
      });
    }
    
    if (confirmedSpecialties.includes(INDUSTRY_SPECIALTIES.INSURANCE) && insuranceFormContent) {
      tabs.push({
        id: "insurance",
        label: "Insurance Profile",
        icon: <Building className="h-4 w-4" />,
        content: insuranceFormContent
      });
    }

    if (confirmedSpecialties.includes(INDUSTRY_SPECIALTIES.COMMERCIAL) && commercialFormContent) {
      tabs.push({
        id: "commercial",
        label: "Commercial Profile",
        icon: <Building className="h-4 w-4" />,
        content: commercialFormContent
      });
      
      if (commercialListingsContent) {
        tabs.push({
          id: "commercial-listings",
          label: "Commercial Properties",
          icon: <List className="h-4 w-4" />,
          content: commercialListingsContent
        });
      }
    }

    if (confirmedSpecialties.includes(INDUSTRY_SPECIALTIES.PRIVATE_CREDIT) && privateCreditFormContent) {
      tabs.push({
        id: "private-credit",
        label: "Private Credit Profile",
        icon: <Briefcase className="h-4 w-4" />,
        content: privateCreditFormContent
      });
    }

    return tabs;
  }, [
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

  const allTabs = useMemo(() => {
    return [
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
      {
        id: "recognitions",
        label: "Professional Recognitions",
        icon: <Award className="h-4 w-4" />,
        content: (
          <RecognitionsTab 
            initialRecognitions={initialRecognitions}
            onSubmit={onSubmitRecognitions}
            isSubmitting={isSubmitting}
            selectedSpecialties={selectedSpecialties}
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
    ];
  }, [
    generalUserInfo,
    onSubmitGeneral,
    coachFormContent,
    domainSubTabs,
    initialRecognitions,
    onSubmitRecognitions,
    initialMarketingInfo,
    onSubmitMarketingInfo,
    onSubmitGoals,
    isSubmitting,
    selectedSpecialties
  ]);

  const filteredTabs = useMemo(() => 
    allTabs.filter((tab: ProfileTab) => {
      if (!tab.requiredCapabilities && !tab.requiredSpecialties && !tab.requiredConfirmedSpecialties) {
        return true;
      }

      if (tab.requiredCapabilities && tab.requiredCapabilities.some(cap => userCapabilities.includes(cap))) {
        if (!tab.requiredConfirmedSpecialties) {
          return true;
        }
      }

      if (tab.requiredConfirmedSpecialties && 
          tab.requiredConfirmedSpecialties.some((spec: string) => confirmedSpecialties.includes(spec))) {
        return true;
      }

      return false;
    })
  , [allTabs, userCapabilities, confirmedSpecialties]);

  // Update available tabs
  useEffect(() => {
    setAvailableTabs(filteredTabs);
  }, [filteredTabs]);

  // If active tab is no longer available, reset to general
  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.some(tab => tab.id === activeTab)) {
      setActiveTab(availableTabs[0].id);
    }
  }, [availableTabs, activeTab]);

  // Reset sub-tab when specialties change
  useEffect(() => {
    if (activeTab === "coach") {
      setActiveSubTab("basic-info");
      // Log the reset to basic-info tab
      // console.log("[PROFILE_TABS_MANAGER] Specialties changed, resetting to basic-info tab", {
      //   confirmedSpecialties,
      //   timestamp: new Date().toISOString()
      // });
    }
  }, [confirmedSpecialties, activeTab]);

  // Function to handle tab selection from dropdown
  const handleTabSelect = (tabId: string) => {
    setActiveTab(tabId);
    setShowTabsDropdown(false);
    
    // Reset sub-tab to first one when changing main tab
    const selectedTab = availableTabs.find(tab => tab.id === tabId);
    if (selectedTab?.subTabs && selectedTab.subTabs.length > 0) {
      setActiveSubTab(selectedTab.subTabs[0].id);
    }
  };

  // Function to handle sub-tab selection
  const handleSubTabSelect = (subTabId: string) => {
    setActiveSubTab(subTabId);
    setShowSubTabsDropdown(false);
  };

  // Get the active tab object
  const activeTabObject = availableTabs.find(tab => tab.id === activeTab);
  
  // Get the active sub-tab content if applicable
  const getActiveContent = () => {
    if (activeTab === "coach" && activeTabObject?.subTabs) {
      const activeSubTabObject = activeTabObject.subTabs.find(subTab => subTab.id === activeSubTab);
      return activeSubTabObject?.content || activeTabObject.content;
    }
    return activeTabObject?.content;
  };

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

  console.log("[PROFILE_TABS_RENDER]", {
    activeTab,
    activeSubTab,
    availableTabsCount: availableTabs.length,
    hasSubTabs: (activeTabObject?.subTabs?.length ?? 0) > 0,
    confirmedSpecialtiesCount: confirmedSpecialties.length,
    timestamp: new Date().toISOString()
  });

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      {/* Mobile view: Dropdown for tabs */}
      <div className="md:hidden mb-6">
        <div className="relative">
          <button
            onClick={() => setShowTabsDropdown(!showTabsDropdown)}
            className="flex items-center justify-between w-full p-3 bg-background border rounded-md shadow-sm text-left"
          >
            <div className="flex items-center gap-2">
              {availableTabs.find(tab => tab.id === activeTab)?.icon}
              <span>{availableTabs.find(tab => tab.id === activeTab)?.label}</span>
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
              {availableTabs.map(tab => (
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
          {availableTabs.map(tab => (
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
          getActiveContent()
        ) : (
          // Render regular tab content for other tabs
          availableTabs.map(tab => (
            <TabsContent key={tab.id} value={tab.id} className="px-0">
              {tab.content}
            </TabsContent>
          ))
        )}
      </div>
    </Tabs>
  );
} 