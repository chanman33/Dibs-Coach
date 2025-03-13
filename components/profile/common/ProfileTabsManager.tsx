"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Award, Building, Home, ListChecks, User, Briefcase, Globe, Target, Info, List, Building2 } from "lucide-react";
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
import { type ApiResponse } from "@/utils/types/api";
import { type GeneralFormData } from "@/utils/actions/user-profile-actions";
import { isEqual } from "lodash";
import { REAL_ESTATE_DOMAINS, type RealEstateDomain, ACTIVE_DOMAINS } from "@/utils/types/coach";
import { ComingSoon } from './ComingSoon';

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
  creditListingsContent?: React.ReactNode;
  isSubmitting: boolean;
}

interface ProfileTabsManagerProps {
  userCapabilities: string[];
  selectedSkills: string[];
  realEstateDomains: RealEstateDomain[];
  generalUserInfo?: {
    displayName?: string | null;
    bio?: string | null;
    totalYearsRE?: number;
    primaryMarket?: string;
  };
  onSubmitGeneral?: (data: GeneralFormData) => Promise<ApiResponse<GeneralFormData>>;
  onSubmitCoach?: (data: CoachProfileFormValues) => Promise<void>;
  coachFormContent: React.ReactNode;
  realtorFormContent?: React.ReactNode;
  realtorListingsContent?: React.ReactNode;
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
  creditListingsContent?: React.ReactNode;
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
  realEstateDomains,
  generalUserInfo,
  onSubmitGeneral,
  onSubmitCoach,
  coachFormContent,
  realtorFormContent,
  realtorListingsContent,
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
  creditListingsContent,
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
  const prevSpecialtiesRef = useRef<string>(JSON.stringify(realEstateDomains));

  const buildDomainSubTabs = useCallback((
    realEstateDomains: RealEstateDomain[],
    realtorListingsContent: React.ReactNode,
    realtorFormContent: React.ReactNode,
    propertyManagerFormContent: React.ReactNode,
    propertyManagerListingsContent: React.ReactNode,
    investorFormContent: React.ReactNode,
    investorListingsContent: React.ReactNode,
    mortgageFormContent: React.ReactNode,
    titleEscrowFormContent: React.ReactNode,
    insuranceFormContent: React.ReactNode,
    commercialFormContent: React.ReactNode,
    commercialListingsContent: React.ReactNode,
    privateCreditFormContent: React.ReactNode,
    creditListingsContent: React.ReactNode
  ): ProfileSubTab[] => {
    console.log("[BUILD_DOMAIN_SUBTABS_START]", {
      realEstateDomains,
      timestamp: new Date().toISOString(),
      source: 'client'
    });

    const subTabs: ProfileSubTab[] = [];

    // Log initial state
    console.log("[BUILD_DOMAIN_SUBTABS_STATE]", {
      hasRealEstateDomains: Boolean(realEstateDomains?.length),
      domains: realEstateDomains,
      timestamp: new Date().toISOString(),
      source: 'client'
    });

    // Add realtor tabs if user has realtor domain and it's active
    if (realEstateDomains?.includes(REAL_ESTATE_DOMAINS.REALTOR) && ACTIVE_DOMAINS[REAL_ESTATE_DOMAINS.REALTOR]) {
      console.log("[BUILD_DOMAIN_SUBTABS_ADDING_REALTOR]", {
        timestamp: new Date().toISOString(),
        source: 'client'
      });
      subTabs.push(
        {
          id: 'realtor-profile',
          label: 'Realtor Profile',
          icon: <User className="h-4 w-4" />,
          content: realtorFormContent
        },
        {
          id: 'realtor-listings',
          label: 'Residential Listings',
          icon: <Home className="h-4 w-4" />,
          content: realtorListingsContent
        }
      );
    }

    // For other domains, check if user has the domain and show either the content or coming soon
    if (realEstateDomains?.includes(REAL_ESTATE_DOMAINS.INVESTOR)) {
      subTabs.push(
        {
          id: 'investor-profile',
          label: 'Investor Profile',
          icon: <User className="h-4 w-4" />,
          content: ACTIVE_DOMAINS[REAL_ESTATE_DOMAINS.INVESTOR] 
            ? investorFormContent 
            : <ComingSoon 
                title="Investor Profile Coming Soon" 
                description="We're currently building out our investor coaching ecosystem. Your profile will be activated soon!" 
              />
        },
        {
          id: 'investor-listings',
          label: 'Investment Portfolio',
          icon: <Building2 className="h-4 w-4" />,
          content: ACTIVE_DOMAINS[REAL_ESTATE_DOMAINS.INVESTOR]
            ? investorListingsContent
            : <ComingSoon 
                title="Investment Portfolio Coming Soon"
                description="Investment property listings will be available when we launch our investor ecosystem."
              />
        }
      );
    }

    // Add other domains with similar pattern
    if (realEstateDomains?.includes(REAL_ESTATE_DOMAINS.MORTGAGE)) {
      subTabs.push({
        id: 'mortgage-profile',
        label: 'Mortgage Officer Profile',
        icon: <User className="h-4 w-4" />,
        content: ACTIVE_DOMAINS[REAL_ESTATE_DOMAINS.MORTGAGE]
          ? mortgageFormContent
          : <ComingSoon 
              title="Mortgage Officer Profile Coming Soon"
              description="We're expanding our platform to include mortgage professionals. Stay tuned!"
            />
      });
    }

    // Add remaining domains with coming soon placeholders
    const remainingDomains = [
      {
        domain: REAL_ESTATE_DOMAINS.PROPERTY_MANAGER,
        formContent: propertyManagerFormContent,
        listingsContent: propertyManagerListingsContent,
        title: "Property Manager",
        profileLabel: "Property Manager Profile",
        listingsLabel: "Property Portfolio",
      },
      {
        domain: REAL_ESTATE_DOMAINS.TITLE_ESCROW,
        formContent: titleEscrowFormContent,
        title: "Title & Escrow",
        profileLabel: "Title & Escrow Profile",
      },
      {
        domain: REAL_ESTATE_DOMAINS.INSURANCE,
        formContent: insuranceFormContent,
        title: "Insurance",
        profileLabel: "Insurance Agent Profile",
      },
      {
        domain: REAL_ESTATE_DOMAINS.COMMERCIAL,
        formContent: commercialFormContent,
        listingsContent: commercialListingsContent,
        title: "Commercial",
        profileLabel: "Commercial Broker Profile",
        listingsLabel: "Commercial Portfolio",
      },
      {
        domain: REAL_ESTATE_DOMAINS.PRIVATE_CREDIT,
        formContent: privateCreditFormContent,
        listingsContent: creditListingsContent,
        title: "Private Credit",
        profileLabel: "Private Lender Profile",
        listingsLabel: "Lending Portfolio",
      },
    ];

    remainingDomains.forEach(({ domain, formContent, listingsContent, title, profileLabel, listingsLabel }) => {
      if (realEstateDomains?.includes(domain)) {
        subTabs.push({
          id: `${domain.toLowerCase()}-profile`,
          label: profileLabel || `${title} Profile`,
          icon: <User className="h-4 w-4" />,
          content: ACTIVE_DOMAINS[domain]
            ? formContent
            : <ComingSoon 
                title={`${title} Profile Coming Soon`}
                description={`We're expanding our platform to include ${title.toLowerCase()} professionals. Stay tuned!`}
              />
        });

        if (listingsContent) {
          subTabs.push({
            id: `${domain.toLowerCase()}-listings`,
            label: listingsLabel || `${title} Portfolio`,
            icon: <Building2 className="h-4 w-4" />,
            content: ACTIVE_DOMAINS[domain]
              ? listingsContent
              : <ComingSoon 
                  title={`${title} Portfolio Coming Soon`}
                  description={`${title} listings will be available when we launch this ecosystem.`}
                />
          });
        }
      }
    });

    return subTabs;
  }, [
    realtorFormContent,
    realtorListingsContent,
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
    creditListingsContent,
    selectedSkills
  ]);

  // Memoize all tabs to prevent unnecessary rebuilds
  const allTabs = useMemo<ProfileTab[]>(() => [
    {
      id: "general",
      label: "General Profile",
      icon: <User className="h-4 w-4" />,
      content: (
        <GeneralForm
          initialData={generalUserInfo}
          onSubmit={onSubmitGeneral || (async () => ({ data: null, error: null }))}
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
      console.log("[PROFILE_TABS_SPECIALTIES_CHECK]", {
        previousSpecialties: JSON.parse(prevSpecialtiesRef.current || '[]'),
        currentSpecialties: realEstateDomains,
        hasChanged: !isEqual(JSON.parse(prevSpecialtiesRef.current || '[]'), realEstateDomains),
        timestamp: new Date().toISOString(),
        source: 'client'
      });

      const currentSpecialties = JSON.stringify(realEstateDomains);
      if (prevSpecialtiesRef.current !== currentSpecialties) {
        console.log("[PROFILE_TABS_RESETTING_SUBTAB]", {
          from: activeSubTab,
          to: "basic-info",
          previousSpecialties: JSON.parse(prevSpecialtiesRef.current || '[]'),
          newSpecialties: realEstateDomains,
          timestamp: new Date().toISOString(),
          source: 'client'
        });
        setActiveSubTab("basic-info");
        prevSpecialtiesRef.current = currentSpecialties;
      }
    }
  }, [activeTab, realEstateDomains, activeSubTab]);

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
    console.log("[PROFILE_TABS_BUILDING_ACTIVE_TAB]", {
      activeTab,
      hasRealEstateDomains: Boolean(realEstateDomains?.length),
      domains: realEstateDomains,
      timestamp: new Date().toISOString(),
      source: 'client'
    });

    const tab = filteredTabs.find(tab => tab.id === activeTab);
    if (tab?.id === 'coach') {
      console.log("[PROFILE_TABS_BUILDING_COACH_SUBTABS]", {
        timestamp: new Date().toISOString(),
        source: 'client'
      });
      return {
        ...tab,
        subTabs: [
          {
            id: "basic-info",
            label: "Basic Info",
            icon: <Info className="h-4 w-4" />,
            content: coachFormContent
          },
          ...buildDomainSubTabs(realEstateDomains, realtorListingsContent, realtorFormContent, propertyManagerFormContent, propertyManagerListingsContent, investorFormContent, investorListingsContent, mortgageFormContent, titleEscrowFormContent, insuranceFormContent, commercialFormContent, commercialListingsContent, privateCreditFormContent, creditListingsContent)
        ]
      };
    }
    return tab;
  }, [filteredTabs, activeTab, coachFormContent, realEstateDomains, realtorListingsContent, realtorFormContent, propertyManagerFormContent, propertyManagerListingsContent, investorFormContent, investorListingsContent, mortgageFormContent, titleEscrowFormContent, insuranceFormContent, commercialFormContent, commercialListingsContent, privateCreditFormContent, creditListingsContent, buildDomainSubTabs, selectedSkills]);

  // Get the active content based on current tab/subtab
  const activeContent = useMemo(() => {
    if (activeTab === "coach" && activeTabObject?.subTabs) {
      const activeSubTabObject = activeTabObject.subTabs.find(subTab => subTab.id === activeSubTab);
      return activeSubTabObject?.content || activeTabObject.content;
    }
    return activeTabObject?.content;
  }, [activeTab, activeTabObject, activeSubTab]);

  const handleTabSelect = useCallback((tabId: string) => {
    console.log("[PROFILE_TABS_TAB_SELECTED]", {
      previousTab: activeTab,
      newTab: tabId,
      hasRealEstateDomains: Boolean(realEstateDomains?.length),
      domains: realEstateDomains,
      timestamp: new Date().toISOString(),
      source: 'client'
    });
    setActiveTab(tabId);
    setShowTabsDropdown(false);
    
    // Reset sub-tab to first one when changing main tab
    const selectedTab = filteredTabs.find(tab => tab.id === tabId);
    if (selectedTab?.subTabs && selectedTab.subTabs.length > 0) {
      setActiveSubTab(selectedTab.subTabs[0].id);
    }
  }, [filteredTabs, realEstateDomains, activeTab]);

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

  // Add logging for tab state changes
  useEffect(() => {
    if (activeTab === "coach") {
      console.log("[PROFILE_TABS_SPECIALTIES_CHECK]", {
        previousSpecialties: JSON.parse(prevSpecialtiesRef.current || '[]'),
        currentSpecialties: realEstateDomains,
        hasChanged: !isEqual(JSON.parse(prevSpecialtiesRef.current || '[]'), realEstateDomains),
        timestamp: new Date().toISOString(),
        source: 'client'
      });

      const currentSpecialties = JSON.stringify(realEstateDomains);
      if (prevSpecialtiesRef.current !== currentSpecialties) {
        console.log("[PROFILE_TABS_RESETTING_SUBTAB]", {
          from: activeSubTab,
          to: "basic-info",
          previousSpecialties: JSON.parse(prevSpecialtiesRef.current || '[]'),
          newSpecialties: realEstateDomains,
          timestamp: new Date().toISOString(),
          source: 'client'
        });
        setActiveSubTab("basic-info");
        prevSpecialtiesRef.current = currentSpecialties;
      }
    }
  }, [activeTab, realEstateDomains, activeSubTab]);

  // Add logging for tab visibility
  useEffect(() => {
    console.log("[PROFILE_TABS_VISIBILITY_UPDATE]", {
      activeTab,
      activeSubTab,
      visibleTabs: allTabs.filter(tab => 
        !tab.requiredCapabilities || 
        tab.requiredCapabilities.every(cap => userCapabilities?.includes(cap))
      ).map(tab => tab.id),
      userCapabilities,
      timestamp: new Date().toISOString(),
      source: 'client'
    });
  }, [activeTab, activeSubTab, userCapabilities, allTabs]);

  // Add logging for realEstateDomains prop changes
  useEffect(() => {
    console.log("[PROFILE_TABS_DOMAINS_RECEIVED]", {
      domains: realEstateDomains,
      timestamp: new Date().toISOString(),
      source: 'client'
    });
  }, [realEstateDomains]);

  // At the start of the component
  useEffect(() => {
    console.log("[PROFILE_TABS_PROPS_RECEIVED]", {
      realEstateDomains,
      userCapabilities,
      timestamp: new Date().toISOString(),
      source: 'client',
      componentId: 'ProfileTabsManager'
    });
  }, [realEstateDomains, userCapabilities]);

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