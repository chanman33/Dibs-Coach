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
  updateUserLanguages
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
  updateInsuranceData: (data: any) => Promise<void>;
  updateCommercialData: (data: any) => Promise<void>;
  updatePrivateCreditData: (data: any) => Promise<void>;
  updateRecognitionsData: (data: ProfessionalRecognition[]) => Promise<void>;
  updateMarketingData: (data: any) => Promise<void>;
  updateGoalsData: (data: any) => Promise<void>;
  
  // Specialty management
  updateSelectedSpecialties: (specialties: string[]) => void;
  saveSpecialties: (selectedSpecialties: string[]) => Promise<boolean>;
  
  // Debug function
  debugServerAction: () => Promise<boolean>;
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
    totalYearsRE: 0
  });
  
  // Coach profile state
  const [coachData, setCoachData] = useState<CoachProfileInitialData>({});
  
  // Domain-specific states
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
  
  // Status information
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
        console.warn("[FETCH_CAPABILITIES_WARNING]", {
          message: "Error fetching capabilities, using fallback values",
          error: response.error
        });
        // Set default values even if there's an error
        setUserCapabilities(response.data?.capabilities || []);
        setSelectedSpecialties(response.data?.domainSpecialties || []);
        setConfirmedSpecialties(response.data?.activeDomains || []);
        return;
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
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch user capabilities first
        await fetchUserCapabilitiesData();
        
        // Fetch general profile data
        const generalResult = await fetchUserProfile();
        if (generalResult.data) {
          setGeneralData(generalResult.data);
        }
        
        // Fetch coach profile data
        const coachProfileResult = await fetchCoachProfile();
        if (coachProfileResult.data) {
          setCoachData(coachProfileResult.data);
          // Update completion status from coach profile data
          updateCompletionStatus(coachProfileResult.data);
        } else if (coachProfileResult.error) {
          console.error("[FETCH_COACH_ERROR]", coachProfileResult.error);
        }
        
        // Calculate completion percentage and missing fields
        // calculateCompletionStatus();
      } catch (error) {
        console.error("[FETCH_DATA_ERROR]", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Fetch coach profile data
  const fetchCoachProfileData = async () => {
    try {
      const { fetchCoachProfile } = await import('@/utils/actions/profile-actions');
      const result = await fetchCoachProfile();
      
      console.log("[FETCH_COACH_PROFILE_RESULT]", {
        success: !result.error,
        hasData: !!result.data,
        timestamp: new Date().toISOString()
      });
      
      if (result.error) {
        console.error("[FETCH_COACH_PROFILE_ERROR]", {
          error: result.error,
          timestamp: new Date().toISOString()
        });
        
        // Set default values even if there's an error
        const defaultCoachData = {
          yearsCoaching: 0,
          hourlyRate: 0,
          defaultDuration: 60,
          minimumDuration: 30,
          maximumDuration: 120,
          allowCustomDuration: false,
          domainSpecialties: [],
          confirmedSpecialties: []
        };
        
        setCoachData(defaultCoachData);
        
        // Try to fetch specialties separately if coach profile fetch failed
        await fetchUserCapabilitiesData();
        return;
      }
      
      if (result.data) {
        // Update coach data state
        setCoachData(result.data);
        
        // Update specialties from the fetched data
        if (Array.isArray(result.data.domainSpecialties)) {
          console.log("[SETTING_DOMAIN_SPECIALTIES]", {
            specialties: result.data.domainSpecialties,
            timestamp: new Date().toISOString()
          });
          setSelectedSpecialties(result.data.domainSpecialties);
        }
        
        // Update confirmed specialties if available
        if (Array.isArray(result.data.confirmedSpecialties)) {
          console.log("[SETTING_CONFIRMED_SPECIALTIES]", {
            specialties: result.data.confirmedSpecialties,
            timestamp: new Date().toISOString()
          });
          setConfirmedSpecialties(result.data.confirmedSpecialties);
        }
      } else {
        // Set default values if no data returned
        const defaultCoachData = {
          yearsCoaching: 0,
          hourlyRate: 0,
          defaultDuration: 60,
          minimumDuration: 30,
          maximumDuration: 120,
          allowCustomDuration: false,
          domainSpecialties: [],
          confirmedSpecialties: []
        };
        
        setCoachData(defaultCoachData);
      }
    } catch (error) {
      console.error("[FETCH_COACH_PROFILE_ERROR]", {
        error,
        timestamp: new Date().toISOString()
      });
      
      // Set default values in case of error
      const defaultCoachData = {
        yearsCoaching: 0,
        hourlyRate: 0,
        defaultDuration: 60,
        minimumDuration: 30,
        maximumDuration: 120,
        allowCustomDuration: false,
        domainSpecialties: [],
        confirmedSpecialties: []
      };
      
      setCoachData(defaultCoachData);
      
      // Try to fetch specialties separately if coach profile fetch failed
      await fetchUserCapabilitiesData();
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
  
  // Specialty management
  const updateSelectedSpecialties = (specialties: string[]) => {
    setSelectedSpecialties(specialties);
  };
  
  const saveSpecialties = async (selectedSpecialties: string[]) => {
    try {
      setIsLoading(true);
      
      console.log("[PROFILE_CONTEXT_SAVE_SPECIALTIES]", {
        selectedSpecialties,
        timestamp: new Date().toISOString()
      });
      
      // Validate input
      if (!Array.isArray(selectedSpecialties)) {
        console.error("[PROFILE_CONTEXT_SAVE_ERROR]", {
          error: "Invalid input: specialties must be an array",
          selectedSpecialties,
          timestamp: new Date().toISOString()
        });
        toast.error("Invalid specialties format");
        return false;
      }
      
      // Call the server action to update the coach profile specialties
      const response = await saveCoachSpecialties({ 
        specialties: selectedSpecialties 
      });
      
      // Check if the response was successful
      if (response.error) {
        console.error("[PROFILE_CONTEXT_SAVE_ERROR]", {
          error: response.error,
          selectedSpecialties,
          timestamp: new Date().toISOString()
        });
        toast.error(response.error.message || "Failed to save specialties");
        return false;
      }
      
      // Update the confirmed specialties state with the active domains from the response
      if (response.data) {
        console.log("[PROFILE_CONTEXT_SAVE_SUCCESS]", {
          activeDomains: response.data.activeDomains,
          selectedSpecialties,
          timestamp: new Date().toISOString()
        });
        
        setConfirmedSpecialties(response.data.activeDomains || []);
        toast.success("Specialties saved successfully");
        
        // Refresh user capabilities to ensure everything is in sync
        fetchUserCapabilitiesData();
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("[PROFILE_CONTEXT_SAVE_SPECIALTIES_ERROR]", {
        error,
        selectedSpecialties,
        timestamp: new Date().toISOString()
      });
      toast.error("An error occurred while saving specialties");
      return false;
    } finally {
      setIsLoading(false);
    }
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
      
      // Call the direct debug function with a test specialty
      const testSpecialties = ["REALTOR", "PROPERTY_MANAGER"];
      
      console.log("[DEBUG_SERVER_ACTION_CALLING]", {
        userUlid,
        testSpecialties,
        timestamp: new Date().toISOString()
      });
      
      const response = await debugDirectSpecialtiesUpdate(userUlid, testSpecialties);
      
      console.log("[DEBUG_SERVER_ACTION_RESPONSE]", {
        response,
        timestamp: new Date().toISOString()
      });
      
      if (response.success) {
        toast.success("Debug update successful!");
        // Update the confirmed specialties state
        setConfirmedSpecialties(testSpecialties);
        // Also update selected specialties to match
        setSelectedSpecialties(testSpecialties);
        // Refresh user capabilities
        fetchUserCapabilitiesData();
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
    selectedSpecialties,
    confirmedSpecialties,
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