"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Award, Building, Home, ListChecks, User, Briefcase, Globe, Target } from "lucide-react";
import { ProfessionalRecognition } from "../types";
import GeneralForm from "./GeneralForm";

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
}

interface ProfileTabsManagerProps {
  userCapabilities: string[];
  selectedSpecialties: string[];
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
  initialRecognitions?: ProfessionalRecognition[];
  onSubmitRecognitions: (recognitions: ProfessionalRecognition[]) => Promise<void>;
  isSubmitting?: boolean;
}

export function ProfileTabsManager({
  userCapabilities,
  selectedSpecialties,
  generalUserInfo,
  onSubmitGeneral,
  coachFormContent,
  realtorFormContent,
  investorFormContent,
  mortgageFormContent,
  propertyManagerFormContent,
  initialRecognitions = [],
  onSubmitRecognitions,
  isSubmitting = false,
}: ProfileTabsManagerProps) {
  const [activeTab, setActiveTab] = useState("general");
  const [availableTabs, setAvailableTabs] = useState<ProfileTab[]>([]);
  const [showTabsDropdown, setShowTabsDropdown] = useState(false);

  // Debug log to check capabilities and specialties
  useEffect(() => {
    console.log("User capabilities:", userCapabilities);
    console.log("Selected specialties:", selectedSpecialties);
  }, [userCapabilities, selectedSpecialties]);

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
          <div>
            {/* Replace with actual RecognitionsTab component */}
            <div>Professional Recognitions content will go here</div>
          </div>
        ),
        requiredCapabilities: ["COACH"],
      },
      {
        id: "marketing",
        label: "Marketing Info",
        icon: <Globe className="h-4 w-4" />,
        content: (
          <div>
            {/* Replace with actual MarketingInfo component */}
            <div>Marketing Info content will go here</div>
          </div>
        ),
        requiredCapabilities: ["COACH"],
      },
      {
        id: "goals",
        label: "Goals & Objectives",
        icon: <Target className="h-4 w-4" />,
        content: (
          <div>
            {/* Replace with actual GoalsForm component */}
            <div>Goals section will go here</div>
          </div>
        ),
        requiredCapabilities: ["COACH"],
      },
      {
        id: "realtor",
        label: "Realtor Profile",
        icon: <Home className="h-4 w-4" />,
        content: realtorFormContent || <div>Realtor profile form will go here</div>,
        requiredSpecialties: [INDUSTRY_SPECIALTIES.REALTOR],
      },
      {
        id: "investor",
        label: "Investor Profile",
        icon: <Building className="h-4 w-4" />,
        content: investorFormContent || <div>Investor profile form will go here</div>,
        requiredSpecialties: [INDUSTRY_SPECIALTIES.INVESTOR],
      },
      {
        id: "mortgage",
        label: "Mortgage Profile",
        icon: <Building className="h-4 w-4" />,
        content: mortgageFormContent || <div>Mortgage profile form will go here</div>,
        requiredSpecialties: [INDUSTRY_SPECIALTIES.MORTGAGE],
      },
      {
        id: "property-manager",
        label: "Property Manager Profile",
        icon: <Building className="h-4 w-4" />,
        content: propertyManagerFormContent || <div>Property Manager profile form will go here</div>,
        requiredSpecialties: [INDUSTRY_SPECIALTIES.PROPERTY_MANAGER],
      },
    ];

    // Filter tabs based on user capabilities and specialties
    const filteredTabs = allTabs.filter(tab => {
      // If no required capabilities or specialties, show the tab
      if (!tab.requiredCapabilities && !tab.requiredSpecialties) {
        return true;
      }

      // Check if user has any of the required capabilities
      if (tab.requiredCapabilities && tab.requiredCapabilities.some(cap => userCapabilities.includes(cap))) {
        return true;
      }

      // Check if user has selected any of the required specialties
      if (tab.requiredSpecialties && tab.requiredSpecialties.some(spec => selectedSpecialties.includes(spec))) {
        return true;
      }

      return false;
    });

    console.log("Filtered tabs:", filteredTabs.map(tab => tab.id));
    setAvailableTabs(filteredTabs);
  }, [
    userCapabilities,
    selectedSpecialties,
    generalUserInfo,
    onSubmitGeneral,
    coachFormContent,
    realtorFormContent,
    investorFormContent,
    mortgageFormContent,
    propertyManagerFormContent,
    initialRecognitions,
    onSubmitRecognitions,
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