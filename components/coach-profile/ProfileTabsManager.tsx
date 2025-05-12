"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Award, Building, User, Briefcase } from "lucide-react";
import { CoachProfileFormValues } from "@/components/profile/types";
import { ProfessionalRecognition } from "@/utils/types/recognition";
import { type ApiResponse } from "@/utils/types/api";
import { type GeneralFormData } from "@/utils/actions/user-profile-actions";

// Define the tab interface
export interface ProfileTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  requiredCapabilities?: string[];
}

interface ProfileTabsManagerProps {
  userCapabilities: string[];
  generalUserInfo?: {
    displayName?: string | null;
    bio?: string | null;
    totalYearsRE?: number;
    primaryMarket?: string;
    realEstateDomains?: string[];
    primaryDomain?: string | null;
  };
  onSubmitGeneral?: (data: GeneralFormData) => Promise<ApiResponse<GeneralFormData>>;
  onSubmitCoach?: (data: CoachProfileFormValues) => Promise<void>;
  generalFormContent?: React.ReactNode;
  coachFormContent: React.ReactNode;
  portfolioContent?: React.ReactNode;
  recognitionsContent?: React.ReactNode;
  initialRecognitions?: ProfessionalRecognition[];
  onSubmitRecognitions?: (recognitions: ProfessionalRecognition[]) => Promise<void>;
  isSubmitting?: boolean;
}

export const ProfileTabsManager: React.FC<ProfileTabsManagerProps> = ({
  userCapabilities,
  generalUserInfo,
  onSubmitGeneral,
  onSubmitCoach,
  generalFormContent,
  coachFormContent,
  portfolioContent,
  recognitionsContent,
  initialRecognitions = [],
  onSubmitRecognitions,
  isSubmitting = false,
}) => {
  // Memoize state to prevent unnecessary re-renders
  const [activeTab, setActiveTab] = useState("general");
  const [showTabsDropdown, setShowTabsDropdown] = useState(false);

  // Memoize all tabs to prevent unnecessary rebuilds
  const allTabs = useMemo<ProfileTab[]>(() => [
    {
      id: "general",
      label: "General Profile",
      icon: <User className="h-4 w-4" />,
      content: generalFormContent || (
        <div>
          <p>General form content will be injected here</p>
        </div>
      ),
    },
    {
      id: "coach",
      label: "Coach Profile",
      icon: <Briefcase className="h-4 w-4" />,
      content: coachFormContent,
      requiredCapabilities: ["COACH"],
    },
    {
      id: "portfolio",
      label: "Portfolio",
      icon: <Building className="h-4 w-4" />,
      content: portfolioContent || <div>Portfolio content will be displayed here</div>,
      requiredCapabilities: ["COACH"],
    },
    {
      id: "recognitions",
      label: "Recognitions",
      icon: <Award className="h-4 w-4" />,
      content: recognitionsContent || (
        <div>
          <p>Recognitions content will be injected here</p>
        </div>
      ),
      requiredCapabilities: ["COACH"],
    },
  ],
  [
    generalFormContent,
    coachFormContent,
    portfolioContent,
    recognitionsContent,
    initialRecognitions,
    onSubmitRecognitions,
    isSubmitting
  ]);

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
    return filteredTabs.find(tab => tab.id === activeTab);
  }, [filteredTabs, activeTab]);

  const handleTabSelect = useCallback((tabId: string) => {
    console.log("[PROFILE_TABS_TAB_SELECTED]", {
      previousTab: activeTab,
      newTab: tabId,
      timestamp: new Date().toISOString(),
      source: 'client'
    });
    setActiveTab(tabId);
    setShowTabsDropdown(false);
  }, [activeTab]);

  // At the start of the component
  useEffect(() => {
    console.log("[PROFILE_TABS_PROPS_RECEIVED]", {
      userCapabilities,
      timestamp: new Date().toISOString(),
      source: 'client',
      componentId: 'ProfileTabsManager'
    });
  }, [userCapabilities]);

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
      
      {/* Tab content */}
      <div className="mt-6">
        {filteredTabs.map(tab => (
          <TabsContent key={tab.id} value={tab.id} className="px-0">
            {tab.content}
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}; 