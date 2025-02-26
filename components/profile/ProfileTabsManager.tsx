"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Award, Building, Home, ListChecks, User, Briefcase, Globe, Target, Info, List, Shield } from "lucide-react";
import { ProfessionalRecognition } from "@/utils/types/recognition";
import { MarketingInfo as MarketingInfoType } from "@/utils/types/marketing";
import { Goal, GoalFormValues } from "@/utils/types/goals";

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

export default function ProfileTabsManager({
  userCapabilities,
  selectedSpecialties,
  confirmedSpecialties,
  generalUserInfo,
  onSubmitGeneral,
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
  initialRecognitions,
  onSubmitRecognitions,
  initialMarketingInfo,
  onSubmitMarketingInfo,
  initialGoals,
  onSubmitGoals,
  isSubmitting = false,
}: ProfileTabsManagerProps) {
  const [activeTab, setActiveTab] = useState("general");

  // Helper function to check if a specialty is selected and confirmed
  const isSpecialtyEnabled = (specialty: string) => {
    return selectedSpecialties.includes(specialty) && confirmedSpecialties.includes(specialty);
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
        <TabsTrigger value="general" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span>General</span>
        </TabsTrigger>

        {/* Coach Tab */}
        {userCapabilities.includes("COACH") && (
          <TabsTrigger value="coach" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            <span>Coach</span>
          </TabsTrigger>
        )}

        {/* Realtor Tab */}
        {isSpecialtyEnabled(INDUSTRY_SPECIALTIES.REALTOR) && (
          <TabsTrigger value="realtor" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            <span>Realtor</span>
          </TabsTrigger>
        )}

        {/* Investor Tab */}
        {isSpecialtyEnabled(INDUSTRY_SPECIALTIES.INVESTOR) && (
          <TabsTrigger value="investor" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <span>Investor</span>
          </TabsTrigger>
        )}

        {/* Mortgage Tab */}
        {isSpecialtyEnabled(INDUSTRY_SPECIALTIES.MORTGAGE) && (
          <TabsTrigger value="mortgage" className="flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            <span>Mortgage</span>
          </TabsTrigger>
        )}

        {/* Property Manager Tab */}
        {isSpecialtyEnabled(INDUSTRY_SPECIALTIES.PROPERTY_MANAGER) && (
          <TabsTrigger value="property-manager" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <span>Property Manager</span>
          </TabsTrigger>
        )}

        {/* Title & Escrow Tab */}
        {isSpecialtyEnabled(INDUSTRY_SPECIALTIES.TITLE_ESCROW) && (
          <TabsTrigger value="title-escrow" className="flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            <span>Title & Escrow</span>
          </TabsTrigger>
        )}

        {/* Insurance Tab */}
        {isSpecialtyEnabled(INDUSTRY_SPECIALTIES.INSURANCE) && (
          <TabsTrigger value="insurance" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Insurance</span>
          </TabsTrigger>
        )}

        {/* Commercial Tab */}
        {isSpecialtyEnabled(INDUSTRY_SPECIALTIES.COMMERCIAL) && (
          <TabsTrigger value="commercial" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <span>Commercial</span>
          </TabsTrigger>
        )}

        {/* Private Credit Tab */}
        {isSpecialtyEnabled(INDUSTRY_SPECIALTIES.PRIVATE_CREDIT) && (
          <TabsTrigger value="private-credit" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            <span>Private Credit</span>
          </TabsTrigger>
        )}
      </TabsList>

      <div className="mt-6 space-y-6">
        <TabsContent value="general">
          {/* General content */}
        </TabsContent>

        {userCapabilities.includes("COACH") && (
          <TabsContent value="coach">
            {coachFormContent}
          </TabsContent>
        )}

        {isSpecialtyEnabled(INDUSTRY_SPECIALTIES.REALTOR) && (
          <TabsContent value="realtor">
            {realtorFormContent}
          </TabsContent>
        )}

        {isSpecialtyEnabled(INDUSTRY_SPECIALTIES.INVESTOR) && (
          <TabsContent value="investor">
            <div className="space-y-6">
              {investorFormContent}
              {investorListingsContent}
            </div>
          </TabsContent>
        )}

        {isSpecialtyEnabled(INDUSTRY_SPECIALTIES.MORTGAGE) && (
          <TabsContent value="mortgage">
            {mortgageFormContent}
          </TabsContent>
        )}

        {isSpecialtyEnabled(INDUSTRY_SPECIALTIES.PROPERTY_MANAGER) && (
          <TabsContent value="property-manager">
            <div className="space-y-6">
              {propertyManagerFormContent}
              {propertyManagerListingsContent}
            </div>
          </TabsContent>
        )}

        {isSpecialtyEnabled(INDUSTRY_SPECIALTIES.TITLE_ESCROW) && (
          <TabsContent value="title-escrow">
            {titleEscrowFormContent}
          </TabsContent>
        )}

        {isSpecialtyEnabled(INDUSTRY_SPECIALTIES.INSURANCE) && (
          <TabsContent value="insurance">
            {insuranceFormContent}
          </TabsContent>
        )}

        {isSpecialtyEnabled(INDUSTRY_SPECIALTIES.COMMERCIAL) && (
          <TabsContent value="commercial">
            <div className="space-y-6">
              {commercialFormContent}
              {commercialListingsContent}
            </div>
          </TabsContent>
        )}

        {isSpecialtyEnabled(INDUSTRY_SPECIALTIES.PRIVATE_CREDIT) && (
          <TabsContent value="private-credit">
            {privateCreditFormContent}
          </TabsContent>
        )}
      </div>
    </Tabs>
  );
} 