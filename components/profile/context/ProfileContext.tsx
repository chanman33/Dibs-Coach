"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { CoachProfileFormValues, CoachProfileInitialData, ProfessionalRecognition } from "../types";
import { ProfileStatus } from "@/utils/types/coach";
import { toast } from "sonner";
import { fetchUserProfile, updateUserProfile, saveCoachSpecialties, fetchUserCapabilities } from "@/utils/actions/profile-actions";

// Define the context shape
interface ProfileContextType {
  // General profile data
  generalData: {
    displayName: string;
    bio: string | null;
    primaryMarket: string;
    yearsExperience: number;
  };
  
  // Coach profile data
  coachData: CoachProfileInitialData;
  
  // Domain-specific data
  realtorData: any;
  investorData: any;
  mortgageData: any;
  propertyManagerData: any;
  
  // Professional recognitions
  recognitionsData: ProfessionalRecognition[];
  
  // Marketing info
  marketingData: any;
  
  // Goals data
  goalsData: any;
  
  // Status information
  profileStatus: ProfileStatus;
  completionPercentage: number;
  missingFields: string[];
  canPublish: boolean;
  
  // Loading states
  isLoading: boolean;
  isSubmitting: boolean;
  
  // User capabilities and specialties
  userCapabilities: string[];
  selectedSpecialties: string[];
  confirmedSpecialties: string[];
  
  // Update functions
  updateGeneralData: (data: any) => Promise<void>;
  updateCoachData: (data: CoachProfileFormValues) => Promise<void>;
  updateRealtorData: (data: any) => Promise<void>;
  updateInvestorData: (data: any) => Promise<void>;
  updateMortgageData: (data: any) => Promise<void>;
  updatePropertyManagerData: (data: any) => Promise<void>;
  updateRecognitionsData: (data: ProfessionalRecognition[]) => Promise<void>;
  updateMarketingData: (data: any) => Promise<void>;
  updateGoalsData: (data: any) => Promise<void>;
  
  // Specialty management
  updateSelectedSpecialties: (specialties: string[]) => void;
  saveSpecialties: (selectedSpecialties: string[]) => Promise<boolean>;
}

// Create the context with a default value
const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

// Provider component
export function ProfileProvider({ children }: { children: ReactNode }) {
  // General profile state
  const [generalData, setGeneralData] = useState({
    displayName: "",
    bio: null as string | null,
    primaryMarket: "",
    yearsExperience: 0
  });
  
  // Coach profile state
  const [coachData, setCoachData] = useState<CoachProfileInitialData>({});
  
  // Domain-specific states
  const [realtorData, setRealtorData] = useState<any>(null);
  const [investorData, setInvestorData] = useState<any>(null);
  const [mortgageData, setMortgageData] = useState<any>(null);
  const [propertyManagerData, setPropertyManagerData] = useState<any>(null);
  
  // Professional recognitions state
  const [recognitionsData, setRecognitionsData] = useState<ProfessionalRecognition[]>([]);
  
  // Marketing info state
  const [marketingData, setMarketingData] = useState<any>(null);
  
  // Goals data state
  const [goalsData, setGoalsData] = useState<any>(null);
  
  // Status information
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>("DRAFT");
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [canPublish, setCanPublish] = useState(false);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // User capabilities and specialties
  const [userCapabilities, setUserCapabilities] = useState<string[]>([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [confirmedSpecialties, setConfirmedSpecialties] = useState<string[]>([]);

  // Fetch user capabilities
  const fetchUserCapabilitiesData = async () => {
    try {
      // Call the server action to fetch user capabilities
      const response = await fetchUserCapabilities();
      
      if (response.error) {
        throw new Error(response.error.message || 'Failed to fetch user capabilities');
      }
      
      if (response.data) {
        // Set user capabilities
        setUserCapabilities(response.data.capabilities || []);
        
        // Set selected specialties from domain specialties
        if (response.data.domainSpecialties) {
          setSelectedSpecialties(response.data.domainSpecialties);
        }
        
        // Set confirmed specialties from active domains
        if (response.data.activeDomains) {
          setConfirmedSpecialties(response.data.activeDomains);
        }
        
        console.log("Fetched user capabilities:", response.data.capabilities);
      }
    } catch (error) {
      console.error("[FETCH_CAPABILITIES_ERROR]", error);
      toast.error("Failed to load user capabilities");
      
      // Set empty arrays as fallback
      setUserCapabilities([]);
      setSelectedSpecialties([]);
      setConfirmedSpecialties([]);
    }
  };

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        // Fetch user capabilities first
        await fetchUserCapabilitiesData();
        
        // Fetch general profile data
        const generalResult = await fetchUserProfile();
        if (generalResult.data) {
          setGeneralData(generalResult.data);
        }
        
        // TODO: Fetch other data (coach profile, domain profiles, etc.)
        
        // Calculate completion percentage and missing fields
        calculateCompletionStatus();
      } catch (error) {
        console.error("[PROFILE_CONTEXT_ERROR]", error);
        toast.error("Failed to load profile data");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInitialData();
  }, []);
  
  // Calculate completion status
  const calculateCompletionStatus = () => {
    // This is a placeholder implementation
    // In a real implementation, you would check all required fields across all forms
    const requiredFields = [
      "displayName",
      "primaryMarket",
      // Add other required fields here
    ];
    
    const missingFieldsList: string[] = [];
    
    if (!generalData.displayName) missingFieldsList.push("Display Name");
    if (!generalData.primaryMarket) missingFieldsList.push("Primary Market");
    // Check other required fields
    
    const completedFields = requiredFields.length - missingFieldsList.length;
    const percentage = Math.round((completedFields / requiredFields.length) * 100);
    
    setCompletionPercentage(percentage);
    setMissingFields(missingFieldsList);
    setCanPublish(missingFieldsList.length === 0);
  };
  
  // Update functions
  const updateGeneralData = async (data: any) => {
    setIsSubmitting(true);
    try {
      const result = await updateUserProfile(data);
      if (result.data) {
        setGeneralData(result.data);
        toast.success("General profile updated successfully");
        calculateCompletionStatus();
      } else if (result.error) {
        toast.error(result.error.message);
      }
    } catch (error) {
      console.error("[UPDATE_GENERAL_ERROR]", error);
      toast.error("Failed to update general profile");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const updateCoachData = async (data: CoachProfileFormValues) => {
    setIsSubmitting(true);
    try {
      // TODO: Implement coach profile update
      
      // Convert the professional recognitions to the correct type
      const professionalRecognitions = data.professionalRecognitions.map(recognition => ({
        ulid: recognition.ulid,
        title: recognition.title,
        type: recognition.type,
        year: recognition.year,
        organization: recognition.organization || null,
        description: recognition.description || null,
        isVisible: recognition.isVisible,
        industryType: recognition.industryType || null
      }));
      
      setCoachData({
        specialties: data.specialties,
        yearsCoaching: data.yearsCoaching,
        hourlyRate: data.hourlyRate,
        domainSpecialties: data.domainSpecialties,
        calendlyUrl: data.calendlyUrl,
        eventTypeUrl: data.eventTypeUrl,
        defaultDuration: data.defaultDuration,
        minimumDuration: data.minimumDuration,
        maximumDuration: data.maximumDuration,
        allowCustomDuration: data.allowCustomDuration,
        certifications: data.certifications,
        languages: data.languages,
        marketExpertise: data.marketExpertise,
        professionalRecognitions
      });
      
      // Update the selected specialties
      updateSelectedSpecialties(data.domainSpecialties);
      
      toast.success("Coach profile updated successfully");
      calculateCompletionStatus();
    } catch (error) {
      console.error("[UPDATE_COACH_ERROR]", error);
      toast.error("Failed to update coach profile");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const updateRealtorData = async (data: any) => {
    setIsSubmitting(true);
    try {
      // TODO: Implement realtor profile update
      setRealtorData(data);
      toast.success("Realtor profile updated successfully");
      calculateCompletionStatus();
    } catch (error) {
      console.error("[UPDATE_REALTOR_ERROR]", error);
      toast.error("Failed to update realtor profile");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const updateInvestorData = async (data: any) => {
    // Similar implementation as updateRealtorData
    setInvestorData(data);
  };
  
  const updateMortgageData = async (data: any) => {
    // Similar implementation as updateRealtorData
    setMortgageData(data);
  };
  
  const updatePropertyManagerData = async (data: any) => {
    // Similar implementation as updateRealtorData
    setPropertyManagerData(data);
  };
  
  const updateRecognitionsData = async (data: ProfessionalRecognition[]) => {
    setIsSubmitting(true);
    try {
      // TODO: Implement recognitions update
      setRecognitionsData(data);
      toast.success("Professional recognitions updated successfully");
      calculateCompletionStatus();
    } catch (error) {
      console.error("[UPDATE_RECOGNITIONS_ERROR]", error);
      toast.error("Failed to update professional recognitions");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const updateMarketingData = async (data: any) => {
    // Similar implementation as other update functions
    setMarketingData(data);
  };
  
  const updateGoalsData = async (data: any) => {
    // Similar implementation as other update functions
    setGoalsData(data);
  };
  
  // Specialty management
  const updateSelectedSpecialties = (specialties: string[]) => {
    setSelectedSpecialties(specialties);
  };
  
  const saveSpecialties = async (selectedSpecialties: string[]) => {
    try {
      setIsLoading(true);
      
      // Call the server action to update the coach profile specialties
      const response = await saveCoachSpecialties({ 
        specialties: selectedSpecialties 
      });
      
      // Check if the response was successful
      if (response.error) {
        toast.error(response.error.message || "Failed to save specialties");
        return false;
      }
      
      // Update the confirmed specialties state with the active domains from the response
      if (response.data) {
        setConfirmedSpecialties(response.data.activeDomains || []);
        toast.success("Specialties saved successfully");
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("[SAVE_SPECIALTIES_ERROR]", error);
      toast.error("An error occurred while saving specialties");
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Context value
  const contextValue: ProfileContextType = {
    generalData,
    coachData,
    realtorData,
    investorData,
    mortgageData,
    propertyManagerData,
    recognitionsData,
    marketingData,
    goalsData,
    profileStatus,
    completionPercentage,
    missingFields,
    canPublish,
    isLoading,
    isSubmitting,
    userCapabilities,
    selectedSpecialties,
    confirmedSpecialties,
    updateGeneralData,
    updateCoachData,
    updateRealtorData,
    updateInvestorData,
    updateMortgageData,
    updatePropertyManagerData,
    updateRecognitionsData,
    updateMarketingData,
    updateGoalsData,
    updateSelectedSpecialties,
    saveSpecialties
  };
  
  return (
    <ProfileContext.Provider value={contextValue}>
      {children}
    </ProfileContext.Provider>
  );
}

// Custom hook to use the profile context
export function useProfileContext() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error("useProfileContext must be used within a ProfileProvider");
  }
  return context;
} 