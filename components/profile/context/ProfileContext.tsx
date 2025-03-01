"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from "react";
import { CoachProfileFormValues, CoachProfileInitialData } from "../types";
import { ProfileStatus } from "@/utils/types/coach";
import { ProfessionalRecognition } from "@/utils/types/recognition";
import { toast } from "sonner";
import { 
  fetchUserCapabilities,
  updateUserProfile,
  updateUserLanguages,
  fetchUserProfile,
  type GeneralFormData
} from "@/utils/actions/user-profile-actions";
import {
  fetchCoachProfile,
  saveCoachSkills,
  updateCoachProfile,
  type CoachProfileFormData
} from "@/utils/actions/coach-profile-actions";

// Define the shape of the general data
interface GeneralData {
  displayName: string;
  bio: string | null;
  primaryMarket: string;
  totalYearsRE: number;
  languages: string[];
}

interface ProfileContextType {
  // General profile data
  generalData: {
    displayName: string;
    bio: string | null;
    primaryMarket: string;
    totalYearsRE: number;
    languages: string[];
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
  titleEscrowData: any;
  
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
  
  // Error states
  fetchError: Error | null;
  retryCount: number;
  
  // User capabilities and skills
  userCapabilities: string[];
  selectedSkills: string[];
  realEstateDomains: string[];
  industrySpecialties: string[];
  
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
  updateTitleEscrowData: (data: any) => Promise<void>;
  updateRecognitionsData: (data: ProfessionalRecognition[]) => Promise<void>;
  updateMarketingData: (data: any) => Promise<void>;
  updateGoalsData: (data: any) => Promise<void>;
  updateLanguages: (languages: string[]) => Promise<void>;
  
  // Skills management
  onSkillsChange: (skills: string[]) => void;
  saveSkills: (skills: string[]) => Promise<boolean>;
  updateSkills: (skills: string[]) => Promise<void>;
}

// Create the context with a default value
const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

// Provider component
export function ProfileProvider({ children }: { children: ReactNode }) {
  // General profile data state
  const [generalData, setGeneralData] = useState<GeneralData>({
    displayName: "",
    bio: null,
    primaryMarket: "",
    totalYearsRE: 0,
    languages: []
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
  const [titleEscrowData, setTitleEscrowData] = useState<any>(null);
  
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
  const [realEstateDomains, setRealEstateDomains] = useState<string[]>([]);
  const [industrySpecialties, setIndustrySpecialties] = useState<string[]>([]);

  // Add debounce ref
  const fetchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastFetchTimeRef = useRef<number>(0);
  const FETCH_DEBOUNCE_MS = 1000; // 1 second debounce

  // Add these after the existing state declarations
  const [fetchError, setFetchError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch initial profile data with debouncing
  const fetchProfileData = useCallback(async (forceFetch = false) => {
    try {
      // If last fetch was too recent and not forcing, return early
      if (!forceFetch && lastFetchTimeRef.current && Date.now() - lastFetchTimeRef.current < 2000) {
        return;
      }

      setIsLoading(true);
      setFetchError(null);

      // 1. First fetch user capabilities and domains
      const capabilities = await fetchUserCapabilities();
      if (!capabilities.data) {
        console.error("[USER_CAPABILITIES_ERROR]", {
          error: capabilities.error,
          timestamp: new Date().toISOString()
        });
        throw capabilities.error;
      }

      const userCaps = capabilities.data.capabilities || [];
      const domains = capabilities.data.realEstateDomains || [];
      
      // Only update capabilities and domains if they've changed
      if (JSON.stringify(userCaps) !== JSON.stringify(userCapabilities)) {
        setUserCapabilities(userCaps);
      }
      if (JSON.stringify(domains) !== JSON.stringify(realEstateDomains)) {
        setRealEstateDomains(domains);
      }

      // 2. If user is not a coach, reset coach-related states and return early
      if (!userCaps.includes('COACH')) {
        setCoachData({});
        setProfileStatus('DRAFT');
        setCompletionPercentage(0);
        setMissingFields([]);
        setCanPublish(false);
        setSelectedSkills([]);
        setIndustrySpecialties([]);
        setRecognitionsData([]);
        setIsLoading(false);
        return;
      }

      // 3. Fetch general profile data
      const generalResult = await fetchUserProfile();
      if (generalResult.error) {
        console.error("[GENERAL_PROFILE_ERROR]", {
          error: generalResult.error,
          timestamp: new Date().toISOString()
        });
        throw generalResult.error;
      }

      if (generalResult.data) {
        setGeneralData({
          displayName: generalResult.data.displayName || "",
          bio: generalResult.data.bio || null,
          primaryMarket: generalResult.data.primaryMarket || "",
          totalYearsRE: generalResult.data.totalYearsRE || 0,
          languages: generalResult.data.languages || []
        });
      }

      // 4. Fetch coach profile data
      const coachResult = await fetchCoachProfile();
      if (coachResult.error && coachResult.error.message !== 'User is not a coach') {
        console.error("[COACH_PROFILE_ERROR]", {
          error: coachResult.error,
          timestamp: new Date().toISOString()
        });
        throw coachResult.error;
      }

      // 5. Update coach profile states
      if (coachResult.data) {
        console.log("[FETCH_PROFILE_DATA_RESPONSE]", {
          data: coachResult.data,
          timestamp: new Date().toISOString()
        });

        const {
          coachSkills = [],
          professionalRecognitions = [],
          profileStatus: status = 'DRAFT',
          completionPercentage = 0,
          missingFields = [],
          missingRequiredFields = [],
          optionalMissingFields = [],
          validationMessages = {},
          canPublish = false
        } = coachResult.data;

        // Update all states with validation data
        setCoachData(coachResult.data);
        setProfileStatus(status);
        setCompletionPercentage(completionPercentage);
        setMissingFields(missingFields);
        setMissingRequiredFields(missingRequiredFields);
        setOptionalMissingFields(optionalMissingFields);
        setValidationMessages(validationMessages);
        setCanPublish(canPublish);
        setSelectedSkills(coachSkills);
        setRecognitionsData(professionalRecognitions);

        console.log("[FETCH_PROFILE_DATA_STATE_UPDATE]", {
          status,
          completionPercentage,
          missingFields,
          missingRequiredFields,
          optionalMissingFields,
          validationMessages,
          canPublish,
          timestamp: new Date().toISOString()
        });
      } else {
        // Reset states if no coach data
        setCoachData({});
        setProfileStatus('DRAFT');
        setCompletionPercentage(0);
        setMissingFields([]);
        setMissingRequiredFields([]);
        setOptionalMissingFields([]);
        setValidationMessages({});
        setCanPublish(false);
        setSelectedSkills([]);
        setRecognitionsData([]);
      }

      // Update lastFetchTimeRef correctly
      lastFetchTimeRef.current = Date.now();
      setIsLoading(false);
    } catch (error) {
      console.error("[PROFILE_FETCH_ERROR]", {
        error,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      setFetchError(error instanceof Error ? error : new Error('Failed to fetch profile data'));
      setIsLoading(false);
    }
  }, [userCapabilities, realEstateDomains]);

  // Initial fetch only
  useEffect(() => {
    fetchProfileData(true);
  }, []); // Empty dependency array for initial fetch only

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
      await fetchProfileData(true); // Force fetch after saving skills
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
        setGeneralData(prevData => ({
          ...prevData,
          ...result.data as GeneralFormData,
          languages: (result.data as GeneralFormData).languages || prevData.languages
        }));
        toast.success("General profile updated successfully");
        
        // Fetch updated coach profile to get new completion status
        const coachProfileResult = await fetchCoachProfile();
        if (coachProfileResult.data) {
          updateCompletionStatus(coachProfileResult.data);
        }
      } else if (result.error) {
        toast.error(String(result.error));
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
      console.log("[UPDATE_COMPLETION_STATUS_START]", {
        currentState: {
          completionPercentage,
          missingFields,
          missingRequiredFields,
          validationMessages
        },
        newData: data,
        timestamp: new Date().toISOString()
      });
      
      // Ensure we're not losing data by checking for null/undefined
      const newCompletionPercentage = data.completionPercentage ?? completionPercentage;
      const newMissingFields = Array.isArray(data.missingFields) ? data.missingFields : missingFields;
      const newMissingRequiredFields = Array.isArray(data.missingRequiredFields) ? data.missingRequiredFields : missingRequiredFields;
      const newOptionalMissingFields = Array.isArray(data.optionalMissingFields) ? data.optionalMissingFields : optionalMissingFields;
      const newValidationMessages = typeof data.validationMessages === 'object' ? data.validationMessages : validationMessages;
      const newCanPublish = typeof data.canPublish === 'boolean' ? data.canPublish : canPublish;
      const newProfileStatus = data.profileStatus || profileStatus;
      
      // Update states with new values
      setCompletionPercentage(newCompletionPercentage);
      setMissingFields(newMissingFields);
      setMissingRequiredFields(newMissingRequiredFields);
      setOptionalMissingFields(newOptionalMissingFields);
      setValidationMessages(newValidationMessages);
      setCanPublish(newCanPublish);
      setProfileStatus(newProfileStatus);
      
      // Also update these fields in coachData to ensure consistency
      setCoachData(prevData => {
        const newData = {
          ...prevData,
          completionPercentage: newCompletionPercentage,
          missingFields: newMissingFields,
          missingRequiredFields: newMissingRequiredFields,
          optionalMissingFields: newOptionalMissingFields,
          validationMessages: newValidationMessages,
          canPublish: newCanPublish,
          status: newProfileStatus
        };
        
        console.log("[UPDATE_COMPLETION_STATUS_END]", {
          prevData,
          newData,
          timestamp: new Date().toISOString()
        });
        
        return newData;
      });
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
      
      // Ensure professional recognitions are properly typed
      const formattedData = {
        ...coachProfileData,
        professionalRecognitions: coachProfileData.professionalRecognitions?.map(rec => ({
          ...rec,
          issueDate: new Date(rec.issueDate),
          expiryDate: rec.expiryDate ? new Date(rec.expiryDate) : null,
          createdAt: rec.createdAt ? new Date(rec.createdAt) : undefined,
          updatedAt: rec.updatedAt ? new Date(rec.updatedAt) : undefined
        }))
      };
      
      // Update coach profile without languages
      const result = await updateCoachProfile(formattedData);
      if (result.data) {
        const profileData = result.data as CoachProfileInitialData;
        setCoachData(profileData);
        updateCompletionStatus(result.data);
        toast.success("Coach profile updated successfully");
      } else if (result.error) {
        toast.error(String(result.error));
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
      const { updateMortgageProfile } = await import('@/utils/actions/mortgage-profile-actions');
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
      const { updatePropertyManagerProfile } = await import('@/utils/actions/property-manager-profile-actions');
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
      const { updateInsuranceProfile } = await import('@/utils/actions/insurance-profile-actions');
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
      const { updateCommercialProfile } = await import('@/utils/actions/commercial-profile-actions');
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
      const { updatePrivateCreditProfile } = await import('@/utils/actions/private-credit-profile-actions');
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
  
  const updateTitleEscrowData = async (data: any) => {
    setIsSubmitting(true);
    try {
      // TODO: Implement title escrow data update
      setTitleEscrowData(data);
      toast.success("Title escrow data updated successfully");
      
      // Fetch updated coach profile to get new completion status
      const coachProfileResult = await fetchCoachProfile();
      if (coachProfileResult.data) {
        updateCompletionStatus(coachProfileResult.data);
      }
    } catch (error) {
      console.error("[UPDATE_TITLE_ESCROW_ERROR]", error);
      toast.error("Failed to update title escrow data");
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
  
  const updateLanguages = async (languages: string[]) => {
    setIsSubmitting(true);
    try {
      const result = await updateUserLanguages({ languages });
      if (result.error) {
        throw new Error(result.error.message);
      }
      setGeneralData((prevData: GeneralData) => ({
        ...prevData,
        languages
      }));
      toast.success("Languages updated successfully");
    } catch (error) {
      console.error("[UPDATE_LANGUAGES_ERROR]", error);
      toast.error("Failed to update languages");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const updateSkills = async (skills: string[]) => {
    setIsSubmitting(true);
    try {
      const result = await saveCoachSkills({ skills });
      if (result.error) {
        throw new Error(result.error.message);
      }
      setSelectedSkills(skills);
      await fetchProfileData(true); // Force fetch after updating skills
      toast.success("Skills updated successfully");
    } catch (error) {
      console.error("[UPDATE_SKILLS_ERROR]", error);
      toast.error("Failed to update skills");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Debug function to check if server action is being called correctly
  const debugServerAction = async () => {
    try {
      console.log("[DEBUG_SERVER_ACTION_START]", {
        timestamp: new Date().toISOString()
      });
      // Debug functionality removed for production
      return false;
    } catch (error) {
      console.error("[DEBUG_SERVER_ACTION_ERROR]", error);
      return false;
    }
  };
  
  // Save specialties to the server
  const saveSpecialties = async (specialties: string[]): Promise<boolean> => {
    try {
      setIsSubmitting(true);
      const result = await saveCoachSkills({ skills: specialties });
      if (result.error) {
        throw new Error(result.error.message);
      }
      setSelectedSkills(specialties);
      await fetchProfileData(true); // Force fetch after saving specialties
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

  const handleProfileUpdate = async () => {
    try {
      setIsLoading(true);
      // Force fetch after update
      await fetchProfileData(true);
    } catch (error) {
      console.error("[PROFILE_UPDATE_ERROR]", error);
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  // Add cleanup for abort controller
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
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
    titleEscrowData,
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
    realEstateDomains,
    industrySpecialties,
    onSkillsChange,
    saveSkills,
    updateSkills,
    updateGeneralData,
    updateCoachData,
    updateRealtorData,
    updateInvestorData,
    updateMortgageData,
    updatePropertyManagerData,
    updateInsuranceData,
    updateCommercialData,
    updatePrivateCreditData,
    updateTitleEscrowData,
    updateRecognitionsData,
    updateMarketingData,
    updateGoalsData,
    updateLanguages,
    fetchError,
    retryCount
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