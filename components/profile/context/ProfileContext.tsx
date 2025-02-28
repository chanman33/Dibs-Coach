"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { CoachProfileFormValues, CoachProfileInitialData, ProfessionalRecognition } from "../types";
import { ProfileStatus } from "@/utils/types/coach";
import { toast } from "sonner";
import { 
  fetchUserProfile, 
  updateUserProfile, 
  saveCoachSpecialties, 
  fetchUserCapabilities, 
  debugDirectSpecialtiesUpdate,
  fetchCoachProfile,
  updateCoachProfile,
  updateUserLanguages,
  saveCoachSkills
} from "@/utils/actions/profile-actions";

// Define the context shape
interface ProfileContextType {
  // General profile data
  generalData: {
    displayName: string;
    bio: string | null;
    primaryMarket: string;
    totalYearsRE: number;
  };
  
  // Coach profile data
  coachData: CoachProfileInitialData;
  
  // Domain-specific data
  realtorData: any;
  investorData: any;
  mortgageData: any;
  propertyManagerData: any;
  insuranceData: any;
  commercialData: any;
  privateCreditData: any;
  
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
  missingRequiredFields: string[];
  optionalMissingFields: string[];
  validationMessages: Record<string, string>;
  canPublish: boolean;
  
  // Loading states
  isLoading: boolean;
  isSubmitting: boolean;
  
  // User capabilities and skills
  userCapabilities: string[];
  selectedSkills: string[];
  selectedSpecialties: string[];
  confirmedSpecialties: string[];
  
  // Update functions
  updateGeneralData: (data: any) => Promise<void>;
  updateCoachData: (data: CoachProfileFormValues) => Promise<void>;
  updateRealtorData: (data: any) => Promise<void>;
  updateInvestorData: (data: any) => Promise<void>;
  updateMortgageData: (data: any) => Promise<void>;
  updatePropertyManagerData: (data: any) => Promise<void>;
  updateInsuranceData: (data: any) => Promise<void>;
  updateCommercialData: (data: any) => Promise<void>;
  updatePrivateCreditData: (data: any) => Promise<void>;
  updateRecognitionsData: (data: ProfessionalRecognition[]) => Promise<void>;
  updateMarketingData: (data: any) => Promise<void>;
  updateGoalsData: (data: any) => Promise<void>;
  updateSelectedSpecialties: (specialties: string[]) => void;
  
  // Skills management
  onSkillsChange: (skills: string[]) => void;
  saveSkills: (selectedSkills: string[]) => Promise<boolean>;
  saveSpecialties: (specialties: string[]) => Promise<boolean>;
  
  // Debug function
  debugServerAction: () => Promise<boolean>;
}

// Create the context with a default value
const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

// Provider component
export function ProfileProvider({ children }: { children: ReactNode }) {
  // General profile data state
  const [generalData, setGeneralData] = useState<any>({
    displayName: "",
    bio: null,
    primaryMarket: "",
    totalYearsRE: 0
  });
  
  // Coach profile data state
  const [coachData, setCoachData] = useState<CoachProfileInitialData>({});
  
  // Domain-specific data states
  const [realtorData, setRealtorData] = useState<any>(null);
  const [investorData, setInvestorData] = useState<any>(null);
  const [mortgageData, setMortgageData] = useState<any>(null);
  const [propertyManagerData, setPropertyManagerData] = useState<any>(null);
  const [insuranceData, setInsuranceData] = useState<any>(null);
  const [commercialData, setCommercialData] = useState<any>(null);
  const [privateCreditData, setPrivateCreditData] = useState<any>(null);
  
  // Professional recognitions state
  const [recognitionsData, setRecognitionsData] = useState<ProfessionalRecognition[]>([]);
  
  // Marketing info state
  const [marketingData, setMarketingData] = useState<any>(null);
  
  // Goals data state
  const [goalsData, setGoalsData] = useState<any>(null);
  
  // Status information state
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>("DRAFT");
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [missingRequiredFields, setMissingRequiredFields] = useState<string[]>([]);
  const [optionalMissingFields, setOptionalMissingFields] = useState<string[]>([]);
  const [validationMessages, setValidationMessages] = useState<Record<string, string>>({});
  const [canPublish, setCanPublish] = useState(false);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // User capabilities and skills state
  const [userCapabilities, setUserCapabilities] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [confirmedSpecialties, setConfirmedSpecialties] = useState<string[]>([]);

  // Fetch initial profile data
  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch user capabilities
      const capabilities = await fetchUserCapabilities();
      if (capabilities.error) {
        throw new Error(capabilities.error.message);
      }
      setUserCapabilities(capabilities.data?.capabilities || []);
      
      // Fetch coach profile data
      const result = await fetchCoachProfile();
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      if (result.data) {
        // Update general data
        setGeneralData({
          displayName: result.data.displayName || "",
          bio: result.data.bio || null,
          primaryMarket: result.data.primaryMarket || "",
          totalYearsRE: result.data.totalYearsRE || 0
        });
        
        // Update coach data
        setCoachData(result.data);
        
        // Update skills
        setSelectedSkills(result.data.coachSkills || []);
        
        // Update status information
        setProfileStatus(result.data.profileStatus || "DRAFT");
        setCompletionPercentage(result.data.completionPercentage || 0);
        setMissingFields(result.data.missingFields || []);
        setMissingRequiredFields(result.data.missingRequiredFields || []);
        setOptionalMissingFields(result.data.optionalMissingFields || []);
        setValidationMessages(result.data.validationMessages || {});
        setCanPublish(result.data.canPublish || false);
      }
    } catch (error) {
      console.error("[PROFILE_FETCH_ERROR]", error);
      toast.error("Failed to load profile data");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle skills changes
  const onSkillsChange = (skills: string[]) => {
    setSelectedSkills(skills);
  };

  // Save skills to the server
  const saveSkills = async (skills: string[]): Promise<boolean> => {
    try {
      setIsSubmitting(true);
      const result = await saveCoachSkills({ skills });
      if (result.error) {
        throw new Error(result.error.message);
      }
      setSelectedSkills(skills);
      toast.success("Skills saved successfully");
      return true;
    } catch (error) {
      console.error("[SAVE_SKILLS_ERROR]", error);
      toast.error("Failed to save skills");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update functions
  const updateGeneralData = async (data: any) => {
    setIsSubmitting(true);
    try {
      const result = await updateUserProfile(data);
      if (result.data) {
        setGeneralData(result.data);
        toast.success("General profile updated successfully");
        
        // Fetch updated coach profile to get new completion status
        const coachProfileResult = await fetchCoachProfile();
        if (coachProfileResult.data) {
          updateCompletionStatus(coachProfileResult.data);
        }
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
  
  // Update completion status from server response
  const updateCompletionStatus = (data: any) => {
    if (data) {
      setCompletionPercentage(data.completionPercentage || 0);
      setMissingFields(data.missingFields || []);
      setMissingRequiredFields(data.missingRequiredFields || []);
      setOptionalMissingFields(data.optionalMissingFields || []);
      setValidationMessages(data.validationMessages || {});
      setCanPublish(data.canPublish || false);
      setProfileStatus(data.profileStatus || "DRAFT");
    }
  };
  
  const updateCoachData = async (data: CoachProfileFormValues) => {
    setIsSubmitting(true);
    try {
      // First update languages in User model if they've changed
      if (data.languages) {
        const languageUpdateResult = await updateUserLanguages({
          languages: data.languages
        });
        if (languageUpdateResult.error) {
          toast.error("Failed to update languages");
          return;
        }
      }

      // Remove languages from coach profile data since it's handled separately
      const { languages, ...coachProfileData } = data;
      
      // Update coach profile without languages
      const result = await updateCoachProfile(coachProfileData);
      if (result.data) {
        const profileData = result.data as CoachProfileInitialData;
        setCoachData(profileData);
        updateCompletionStatus(result.data);
        toast.success("Coach profile updated successfully");
      } else if (result.error) {
        toast.error(result.error.message);
      }
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
      
      // Fetch updated coach profile to get new completion status
      const coachProfileResult = await fetchCoachProfile();
      if (coachProfileResult.data) {
        updateCompletionStatus(coachProfileResult.data);
      }
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
    setIsSubmitting(true);
    try {
      // Import the action dynamically
      const { updateMortgageProfile } = await import('@/utils/actions/profile-actions');
      
      // Call the server action
      const result = await updateMortgageProfile(data);
      
      if (result.error) {
        console.error("[UPDATE_MORTGAGE_PROFILE_ERROR]", {
          error: result.error,
          timestamp: new Date().toISOString()
        });
        toast.error("Failed to update mortgage profile");
        return;
      }
      
      // Update the state
      setMortgageData(data);
      toast.success("Mortgage profile updated successfully");
      
      // Fetch updated coach profile to get new completion status
      const coachProfileResult = await fetchCoachProfile();
      if (coachProfileResult.data) {
        updateCompletionStatus(coachProfileResult.data);
      }
    } catch (error) {
      console.error("[UPDATE_MORTGAGE_ERROR]", {
        error,
        timestamp: new Date().toISOString()
      });
      toast.error("Failed to update mortgage profile");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const updatePropertyManagerData = async (data: any) => {
    setIsSubmitting(true);
    try {
      // Import the action dynamically
      const { updatePropertyManagerProfile } = await import('@/utils/actions/profile-actions');
      
      // Call the server action
      const result = await updatePropertyManagerProfile(data);
      
      if (result.error) {
        console.error("[UPDATE_PROPERTY_MANAGER_PROFILE_ERROR]", {
          error: result.error,
          timestamp: new Date().toISOString()
        });
        toast.error("Failed to update property manager profile");
        return;
      }
      
      // Update the state
      setPropertyManagerData(data);
      toast.success("Property manager profile updated successfully");
      
      // Fetch updated coach profile to get new completion status
      const coachProfileResult = await fetchCoachProfile();
      if (coachProfileResult.data) {
        updateCompletionStatus(coachProfileResult.data);
      }
    } catch (error) {
      console.error("[UPDATE_PROPERTY_MANAGER_ERROR]", {
        error,
        timestamp: new Date().toISOString()
      });
      toast.error("Failed to update property manager profile");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const updateInsuranceData = async (data: any) => {
    setIsSubmitting(true);
    try {
      // Import the action dynamically
      const { updateInsuranceProfile } = await import('@/utils/actions/profile-actions');
      
      // Call the server action
      const result = await updateInsuranceProfile(data);
      
      if (result.error) {
        console.error("[UPDATE_INSURANCE_PROFILE_ERROR]", {
          error: result.error,
          timestamp: new Date().toISOString()
        });
        toast.error("Failed to update insurance profile");
        return;
      }
      
      // Update the state
      setInsuranceData(data);
      toast.success("Insurance profile updated successfully");
      
      // Fetch updated coach profile to get new completion status
      const coachProfileResult = await fetchCoachProfile();
      if (coachProfileResult.data) {
        updateCompletionStatus(coachProfileResult.data);
      }
    } catch (error) {
      console.error("[UPDATE_INSURANCE_ERROR]", {
        error,
        timestamp: new Date().toISOString()
      });
      toast.error("Failed to update insurance profile");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const updateCommercialData = async (data: any) => {
    setIsSubmitting(true);
    try {
      // Import the action dynamically
      const { updateCommercialProfile } = await import('@/utils/actions/profile-actions');
      
      // Call the server action
      const result = await updateCommercialProfile(data);
      
      if (result.error) {
        console.error("[UPDATE_COMMERCIAL_PROFILE_ERROR]", {
          error: result.error,
          timestamp: new Date().toISOString()
        });
        toast.error("Failed to update commercial profile");
        return;
      }
      
      // Update the state
      setCommercialData(data);
      toast.success("Commercial profile updated successfully");
      
      // Fetch updated coach profile to get new completion status
      const coachProfileResult = await fetchCoachProfile();
      if (coachProfileResult.data) {
        updateCompletionStatus(coachProfileResult.data);
      }
    } catch (error) {
      console.error("[UPDATE_COMMERCIAL_ERROR]", {
        error,
        timestamp: new Date().toISOString()
      });
      toast.error("Failed to update commercial profile");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const updatePrivateCreditData = async (data: any) => {
    setIsSubmitting(true);
    try {
      // Import the action dynamically
      const { updatePrivateCreditProfile } = await import('@/utils/actions/profile-actions');
      
      // Call the server action
      const result = await updatePrivateCreditProfile(data);
      
      if (result.error) {
        console.error("[UPDATE_PRIVATE_CREDIT_PROFILE_ERROR]", {
          error: result.error,
          timestamp: new Date().toISOString()
        });
        toast.error("Failed to update private credit profile");
        return;
      }
      
      // Update the state
      setPrivateCreditData(data);
      toast.success("Private credit profile updated successfully");
      
      // Fetch updated coach profile to get new completion status
      const coachProfileResult = await fetchCoachProfile();
      if (coachProfileResult.data) {
        updateCompletionStatus(coachProfileResult.data);
      }
    } catch (error) {
      console.error("[UPDATE_PRIVATE_CREDIT_ERROR]", {
        error,
        timestamp: new Date().toISOString()
      });
      toast.error("Failed to update private credit profile");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const updateRecognitionsData = async (data: ProfessionalRecognition[]) => {
    setIsSubmitting(true);
    try {
      // TODO: Implement recognitions update
      setRecognitionsData(data);
      toast.success("Professional recognitions updated successfully");
      
      // Fetch updated coach profile to get new completion status
      const coachProfileResult = await fetchCoachProfile();
      if (coachProfileResult.data) {
        updateCompletionStatus(coachProfileResult.data);
      }
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
  
  const updateSelectedSpecialties = (specialties: string[]) => {
    setSelectedSpecialties(specialties);
  };
  
  // Debug function to check if server action is being called correctly
  const debugServerAction = async () => {
    try {
      console.log("[DEBUG_SERVER_ACTION_START]", {
        timestamp: new Date().toISOString()
      });
      
      // Get the current user ULID from the URL or fetch it
      let userUlid = '';
      
      try {
        // First try to get it from the URL
        const urlParts = window.location.pathname.split('/');
        userUlid = urlParts[urlParts.length - 2]; // Assuming URL pattern like /dashboard/coach/profile/[ulid]
        
        // If not found in URL, try to get it from localStorage
        if (!userUlid || userUlid === 'profile') {
          const storedUlid = localStorage.getItem('userUlid');
          if (storedUlid) {
            userUlid = storedUlid;
          }
        }
        
        console.log("[DEBUG_SERVER_ACTION_USER_ULID]", {
          userUlid,
          source: userUlid ? 'found' : 'not found',
          timestamp: new Date().toISOString()
        });
        
        if (!userUlid) {
          toast.error("Could not determine user ID for debug action");
          return false;
        }
      } catch (error) {
        console.error("[DEBUG_SERVER_ACTION_ULID_ERROR]", {
          error,
          timestamp: new Date().toISOString()
        });
        toast.error("Error getting user ID for debug action");
        return false;
      }
      
      // Call the direct debug function with a test skill
      const testSkills = ["REALTOR", "PROPERTY_MANAGER"];
      
      console.log("[DEBUG_SERVER_ACTION_CALLING]", {
        userUlid,
        testSkills,
        timestamp: new Date().toISOString()
      });
      
      const response = await debugDirectSpecialtiesUpdate(userUlid, testSkills);
      
      console.log("[DEBUG_SERVER_ACTION_RESPONSE]", {
        response,
        timestamp: new Date().toISOString()
      });
      
      if (response.success) {
        toast.success("Debug update successful!");
        // Update the selected skills state
        setSelectedSkills(testSkills);
        // Refresh user capabilities
        fetchProfileData();
        return true;
      } else {
        toast.error("Debug update failed: " + (response.error ? JSON.stringify(response.error) : "Unknown error"));
        return false;
      }
    } catch (error) {
      console.error("[DEBUG_SERVER_ACTION_ERROR]", {
        error,
        timestamp: new Date().toISOString()
      });
      toast.error("Debug action failed with an error!");
      return false;
    }
  };
  
  const saveSpecialties = async (specialties: string[]): Promise<boolean> => {
    try {
      setIsSubmitting(true);
      const result = await saveCoachSpecialties({ specialties });
      if (result.error) {
        throw new Error(result.error.message);
      }
      setSelectedSpecialties(specialties);
      toast.success("Specialties saved successfully");
      return true;
    } catch (error) {
      console.error("[SAVE_SPECIALTIES_ERROR]", error);
      toast.error("Failed to save specialties");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  // Context value
  const contextValue: ProfileContextType = {
    generalData,
    coachData,
    realtorData,
    investorData,
    mortgageData,
    propertyManagerData,
    insuranceData,
    commercialData,
    privateCreditData,
    recognitionsData,
    marketingData,
    goalsData,
    profileStatus,
    completionPercentage,
    missingFields,
    missingRequiredFields,
    optionalMissingFields,
    validationMessages,
    canPublish,
    isLoading,
    isSubmitting,
    userCapabilities,
    selectedSkills,
    selectedSpecialties,
    confirmedSpecialties,
    onSkillsChange,
    saveSkills,
    updateGeneralData,
    updateCoachData,
    updateRealtorData,
    updateInvestorData,
    updateMortgageData,
    updatePropertyManagerData,
    updateInsuranceData,
    updateCommercialData,
    updatePrivateCreditData,
    updateRecognitionsData,
    updateMarketingData,
    updateGoalsData,
    updateSelectedSpecialties,
    saveSpecialties,
    debugServerAction
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