import { ReactNode } from 'react';

export interface ProfileTab {
  id: string;
  label: string;
  icon: ReactNode;
  content: ReactNode;
  requiredCapabilities?: string[];
  subTabs?: ProfileSubTab[];
}

export interface ProfileSubTab {
  id: string;
  label: string;
  icon: ReactNode;
  content: ReactNode;
}

export interface ProfileTabsManagerProps {
  userCapabilities: string[];
  selectedSpecialties: string[];
  confirmedSpecialties: string[];
  generalUserInfo?: any;
  onSubmitGeneral?: (data: any) => Promise<void>;
  onSubmitCoach?: (data: any) => Promise<void>;
  coachFormContent?: ReactNode;
  realtorFormContent?: ReactNode;
  investorFormContent?: ReactNode;
  investorListingsContent?: ReactNode;
  mortgageFormContent?: ReactNode;
  propertyManagerFormContent?: ReactNode;
  propertyManagerListingsContent?: ReactNode;
  titleEscrowFormContent?: ReactNode;
  insuranceFormContent?: ReactNode;
  commercialFormContent?: ReactNode;
  commercialListingsContent?: ReactNode;
  privateCreditFormContent?: ReactNode;
  initialRecognitions?: any[];
  onSubmitRecognitions?: (data: any) => Promise<void>;
  initialMarketingInfo?: any;
  onSubmitMarketingInfo?: (data: any) => Promise<void>;
  initialGoals?: any[];
  onSubmitGoals?: (data: any) => Promise<void>;
  isSubmitting?: boolean;
} 