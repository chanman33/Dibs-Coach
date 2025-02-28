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
  industrySpecialties: string[];
  selectedSpecialties: string[];
  onSpecialtiesChange: (specialties: string[]) => void;
  saveSpecialties: () => Promise<void>;
  isSubmitting: boolean;
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
} 