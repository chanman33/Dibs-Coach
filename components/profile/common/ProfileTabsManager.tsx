"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Award, Building, Home, ListChecks, User, Briefcase, Globe, Target } from "lucide-react";
import { ProfessionalRecognition } from "../types";
import GeneralForm from "./GeneralForm";
import { RecognitionsTab } from "../coach/RecognitionsSection";
import MarketingInfo from "../coach/MarketingInfo";
import { MarketingInfo as MarketingInfoType } from "@/utils/types/marketing";
import GoalsForm from "./GoalsForm";
import { Goal, GoalFormValues } from "@/utils/types/goals";

export const INDUSTRY_SPECIALTIES = {
  REALTOR: "REALTOR",
  INVESTOR: "INVESTOR",
  MORTGAGE: "MORTGAGE",
  PROPERTY_MANAGER: "PROPERTY_MANAGER",
  TITLE_ESCROW: "TITLE_ESCROW",
  INSURANCE: "INSURANCE",
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
}

interface ProfileTabsManagerProps {
  userCapabilities: string[];
  selectedSpecialties: string[];
  confirmedSpecialties: string[];
  generalUserInfo?: {
    displayName?: string | null;
    bio?: string | null;
    primaryMarket?: string | null;
  };
  onSubmitGeneral?: (data: any) => Promise<void>;
  coachFormContent: React.ReactNode;
  realtorFormContent?: React.ReactNode;
  investorFormContent?: React.ReactNode;
  mortgageFormContent?: React.ReactNode;
  propertyManagerFormContent?: React.ReactNode;
  titleEscrowFormContent?: React.ReactNode;
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
  coachFormContent,
  realtorFormContent,
  investorFormContent,
  mortgageFormContent,
  propertyManagerFormContent,
  titleEscrowFormContent,
  initialRecognitions = [],
  onSubmitRecognitions,
  initialMarketingInfo,
  onSubmitMarketingInfo,
  initialGoals = [],
  onSubmitGoals,
  isSubmitting = false,
}: ProfileTabsManagerProps) {
  const [activeTab, setActiveTab] = useState("general");
  const [availableTabs, setAvailableTabs] = useState<ProfileTab[]>([]);
  const [showTabsDropdown, setShowTabsDropdown] = useState(false);

  // Define all possible tabs
  useEffect(() => {
    const allTabs: ProfileTab[] = [
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
        // Everyone can see the general tab
      },
      {
        id: "coach",
        label: "Coach Profile",
        icon: <Briefcase className="h-4 w-4" />,
        content: coachFormContent,
        requiredCapabilities: ["COACH"],
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
                // Convert GoalFormValues to Goal array if needed
                // This is a simplified conversion - adjust based on your actual implementation
                await onSubmitGoals([]);
              }
            }}
          />
        ),
        requiredCapabilities: ["COACH"],
      },
      {
        id: "realtor",
        label: "Realtor Profile",
        icon: <Home className="h-4 w-4" />,
        content: realtorFormContent || null,
        requiredSpecialties: [INDUSTRY_SPECIALTIES.REALTOR],
        requiredConfirmedSpecialties: [INDUSTRY_SPECIALTIES.REALTOR],
      },
      {
        id: "investor",
        label: "Investor Profile",
        icon: <Building className="h-4 w-4" />,
        content: investorFormContent || null,
        requiredSpecialties: [INDUSTRY_SPECIALTIES.INVESTOR],
        requiredConfirmedSpecialties: [INDUSTRY_SPECIALTIES.INVESTOR],
      },
      {
        id: "mortgage",
        label: "Mortgage Profile",
        icon: <Building className="h-4 w-4" />,
        content: mortgageFormContent || null,
        requiredSpecialties: [INDUSTRY_SPECIALTIES.MORTGAGE],
        requiredConfirmedSpecialties: [INDUSTRY_SPECIALTIES.MORTGAGE],
      },
      {
        id: "property-manager",
        label: "Property Manager Profile",
        icon: <Building className="h-4 w-4" />,
        content: propertyManagerFormContent || null,
        requiredSpecialties: [INDUSTRY_SPECIALTIES.PROPERTY_MANAGER],
        requiredConfirmedSpecialties: [INDUSTRY_SPECIALTIES.PROPERTY_MANAGER],
      },
      {
        id: "title-escrow",
        label: "Title & Escrow Profile",
        icon: <Building className="h-4 w-4" />,
        content: titleEscrowFormContent || null,
        requiredSpecialties: [INDUSTRY_SPECIALTIES.TITLE_ESCROW],
        requiredConfirmedSpecialties: [INDUSTRY_SPECIALTIES.TITLE_ESCROW],
      },
    ];

    // Filter tabs based on user capabilities and specialties
    const filteredTabs = allTabs.filter(tab => {
      // If no required capabilities or specialties, show the tab
      if (!tab.requiredCapabilities && !tab.requiredSpecialties && !tab.requiredConfirmedSpecialties) {
        return true;
      }

      // Check if user has any of the required capabilities
      if (tab.requiredCapabilities && tab.requiredCapabilities.some(cap => userCapabilities.includes(cap))) {
        // For capability-based tabs (like general, coach, recognitions, etc.), no need to check confirmed specialties
        if (!tab.requiredConfirmedSpecialties) {
          return true;
        }
      }

      // For specialty tabs, check if the specialty is both selected AND confirmed
      if (tab.requiredConfirmedSpecialties && 
          tab.requiredConfirmedSpecialties.some(spec => confirmedSpecialties.includes(spec))) {
        return true;
      }

      return false;
    });

    setAvailableTabs(filteredTabs);
  }, [
    userCapabilities,
    selectedSpecialties,
    confirmedSpecialties,
    generalUserInfo,
    onSubmitGeneral,
    coachFormContent,
    realtorFormContent,
    investorFormContent,
    mortgageFormContent,
    propertyManagerFormContent,
    titleEscrowFormContent,
    initialRecognitions,
    onSubmitRecognitions,
    initialMarketingInfo,
    onSubmitMarketingInfo,
    initialGoals,
    onSubmitGoals,
    isSubmitting,
  ]);

  // If active tab is no longer available, reset to general
  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.some(tab => tab.id === activeTab)) {
      setActiveTab(availableTabs[0].id);
    }
  }, [availableTabs, activeTab]);

  // Function to handle tab selection from dropdown
  const handleTabSelect = (tabId: string) => {
    setActiveTab(tabId);
    setShowTabsDropdown(false);
  };

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
      
      {/* Tab content */}
      <div className="mt-6">
        {availableTabs.map(tab => (
          <TabsContent key={tab.id} value={tab.id} className="px-0">
            {tab.content}
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
} 