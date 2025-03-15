"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from "react";
import { CoachProfileFormValues, CoachProfileInitialData } from "../types";
import { ProfileStatus } from "@/utils/types/coach";
import { ProfessionalRecognition } from "@/utils/types/recognition";
import { toast } from "sonner";
import { updateRecognitions } from "@/utils/actions/recognition-actions";
import { 
  fetchUserCapabilities,
  updateUserProfile,
  updateUserLanguages,
  fetchUserProfile,
  type GeneralFormData,
  UserCapabilitiesResponse,
  UserProfileResponse
} from "@/utils/actions/user-profile-actions";
import {
  fetchCoachProfile,
  saveCoachSkills,
  updateCoachProfile,
  type CoachProfileFormData
} from "@/utils/actions/coach-profile-actions";
import { type ApiResponse } from "@/utils/types/api";
import { type RealEstateDomain } from "@/utils/types/coach";
import { type ListingWithRealtor, type CreateListing } from "@/utils/types/listing";
import { useUser } from "@clerk/nextjs";
import config from "@/config";

// Define the shape of the general data
interface GeneralData {
  displayName: string;
  bio: string | null;
  primaryMarket: string;
  totalYearsRE: number;
  languages: string[];
  realEstateDomains: string[];
  primaryDomain: string | null;
}

interface ProfileContextType {
  // General profile data
  generalData: {
    displayName: string;
    bio: string | null;
    primaryMarket: string;
    totalYearsRE: number;
    languages: string[];
    realEstateDomains: string[];
    primaryDomain: string | null;
  };
  
  // Coach profile data
  coachData: CoachProfileInitialData & {
    coachRealEstateDomains?: string[];
    coachPrimaryDomain?: string | null;
    coachSkills?: string[];
    profileSlug?: string | null;
  };
  
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
  realEstateDomains: RealEstateDomain[];
  
  // Listings data
  activeListings: ListingWithRealtor[];
  successfulTransactions: ListingWithRealtor[];
  
  // Update functions
  updateGeneralData: (data: GeneralFormData) => Promise<ApiResponse<GeneralFormData>>;
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
  
  // Listings handlers
  onSubmitListing: (data: CreateListing) => Promise<{ data?: ListingWithRealtor | null; error?: string | null }>;
  onUpdateListing: (ulid: string, data: CreateListing) => Promise<{ data?: ListingWithRealtor | null; error?: string | null }>;
  
  // Clerk user data
  clerkUser: any | null;
  isClerkLoaded: boolean;
}

// Create the context with a default value
const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

// Provider component
export function ProfileProvider({ children }: { children: ReactNode }) {
  // Get Clerk user data for profile image
  const { user: clerkUser, isLoaded: isClerkLoaded } = config.auth.enabled 
    ? useUser()
    : { user: null, isLoaded: true };
    
  // General profile data state
  const [generalData, setGeneralData] = useState<GeneralData>({
    displayName: "",
    bio: null,
    primaryMarket: "",
    totalYearsRE: 0,
    languages: [],
    realEstateDomains: [],
    primaryDomain: null
  });
  
  // Coach profile data state
  const [coachData, setCoachData] = useState<CoachProfileInitialData & {
    coachRealEstateDomains?: string[];
    coachPrimaryDomain?: string | null;
    coachSkills?: string[];
    profileSlug?: string | null;
  }>({});
  
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
  const [realEstateDomains, setRealEstateDomains] = useState<RealEstateDomain[]>([]);

  // Add debounce ref
  const fetchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastFetchTimeRef = useRef<number>(0);
  const FETCH_DEBOUNCE_MS = 1000; // 1 second debounce

  // Add these after the existing state declarations
  const [fetchError, setFetchError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  const abortControllerRef = useRef<AbortController | null>(null);

  // Listings state
  const [activeListings, setActiveListings] = useState<ListingWithRealtor[]>([]);
  const [successfulTransactions, setSuccessfulTransactions] = useState<ListingWithRealtor[]>([]);

  // Fetch all profile data
  const fetchData = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setFetchError(null);
    
    try {
      console.log("[PROFILE_FETCH_START]", {
        timestamp: new Date().toISOString()
      });
      
      // Fetch user capabilities
      const capabilitiesResult: ApiResponse<UserCapabilitiesResponse> = await fetchUserCapabilities();
      if (capabilitiesResult.error) {
        throw new Error(capabilitiesResult.error.message);
      }
      
      // Extract capabilities from the response
      const capabilities = capabilitiesResult.data?.capabilities || [];
      setUserCapabilities(capabilities);
      
      console.log("[PROFILE_CAPABILITIES_LOADED]", {
        capabilities,
        timestamp: new Date().toISOString()
      });
      
      // Fetch user profile data
      const userProfileResult: ApiResponse<UserProfileResponse> = await fetchUserProfile();
      if (userProfileResult.error) {
        throw new Error(userProfileResult.error.message);
      }
      
      // Extract user data from the response
      const userData = userProfileResult.data || {
        displayName: '',
        bio: null,
        primaryMarket: '',
        totalYearsRE: 0,
        languages: [],
        realEstateDomains: [],
        primaryDomain: null,
        capabilities: [],
        coachProfile: null
      };
      
      // Set general data
      setGeneralData({
        displayName: userData.displayName || '',
        bio: userData.bio || null,
        primaryMarket: userData.primaryMarket || '',
        totalYearsRE: userData.totalYearsRE || 0,
        languages: userData.languages || [],
        realEstateDomains: userData.realEstateDomains || [],
        primaryDomain: userData.primaryDomain || null
      });
      
      // If user is a coach, fetch coach profile
      if (capabilities.includes('COACH')) {
        console.log("[PROFILE_FETCH_COACH_START]", {
          timestamp: new Date().toISOString()
        });
        
        const coachProfileResult: ApiResponse<any> = await fetchCoachProfile();
        if (coachProfileResult.error) {
          console.error('[FETCH_COACH_PROFILE_ERROR]', coachProfileResult.error);
        } else if (coachProfileResult.data) {
          const coachProfileData = coachProfileResult.data as any & { 
            coachSkills?: string[],
            coachRealEstateDomains?: string[],
            slogan?: string,
            coachPrimaryDomain?: string | null,
            profileSlug?: string | null
          };
          
          console.log("[PROFILE_FETCH_COACH_DATA]", {
            coachSkills: coachProfileData.coachSkills,
            coachRealEstateDomains: coachProfileData.coachRealEstateDomains,
            slogan: coachProfileData.slogan,
            coachPrimaryDomain: coachProfileData.coachPrimaryDomain,
            profileSlug: coachProfileData.profileSlug,
            timestamp: new Date().toISOString()
          });
          
          // Set coach data using the data we have
          setCoachData({
            ...coachProfileData,
            firstName: userData.displayName?.split(' ')[0] || '',
            lastName: userData.displayName?.split(' ').slice(1).join(' ') || '',
            bio: userData.bio,
            profileImageUrl: clerkUser?.imageUrl || null, // Use Clerk profile image URL
            coachRealEstateDomains: coachProfileData.coachRealEstateDomains || [],
            coachPrimaryDomain: coachProfileData.coachPrimaryDomain || null,
            coachSkills: coachProfileData.coachSkills || coachProfileData.coachingSpecialties || [],
            slogan: coachProfileData.slogan,
            profileSlug: coachProfileData.profileSlug
          });
          
          // Set profile status and completion info
          setProfileStatus(coachProfileData.profileStatus);
          setCompletionPercentage(coachProfileData.completionPercentage);
          setMissingFields(coachProfileData.missingFields);
          setMissingRequiredFields(coachProfileData.missingRequiredFields);
          setOptionalMissingFields(coachProfileData.optionalMissingFields);
          setValidationMessages(coachProfileData.validationMessages);
          setCanPublish(coachProfileData.canPublish);
          
          // Set selected skills
          setSelectedSkills(coachProfileData.coachSkills || coachProfileData.coachingSpecialties || []);
          
          // Set real estate domains from coach-specific domains
          setRealEstateDomains(coachProfileData.coachRealEstateDomains as RealEstateDomain[] || []);
          
          console.log("[PROFILE_FETCH_COACH_STATE_UPDATED]", {
            selectedSkills: coachProfileData.coachSkills || coachProfileData.coachingSpecialties,
            realEstateDomains: coachProfileData.coachRealEstateDomains,
            slogan: coachProfileData.slogan,
            coachPrimaryDomain: coachProfileData.coachPrimaryDomain,
            profileSlug: coachProfileData.profileSlug,
            timestamp: new Date().toISOString()
          });
          
          // Set professional recognitions
          setRecognitionsData(coachProfileData.professionalRecognitions);
        }
      }

      // Update lastFetchTimeRef correctly
      lastFetchTimeRef.current = Date.now();
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("[PROFILE_FETCH_ERROR]", {
        error,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      setFetchError(error instanceof Error ? error : new Error('Failed to fetch profile data'));
      setIsLoading(false);
      return false;
    }
  }, []);

  // Initial fetch only
  useEffect(() => {
    fetchData();
  }, []); // Empty dependency array for initial fetch only

  // Handle skills changes
  const onSkillsChange = (skills: string[]) => {
    console.log("[SKILLS_CHANGE]", {
      previousSkills: selectedSkills,
      newSkills: skills,
      realEstateDomains,
      timestamp: new Date().toISOString()
    });
    
    // Log the current state of coachData before updating
    console.log("[SKILLS_CHANGE_COACH_DATA_BEFORE]", {
      yearsCoaching: coachData.yearsCoaching,
      hourlyRate: coachData.hourlyRate,
      coachSkills: coachData.coachSkills,
      timestamp: new Date().toISOString()
    });
    
    // Update the selected skills state
    setSelectedSkills(skills);
    
    // IMPORTANT: Update coachData with the new skills while preserving other properties
    // Create an updated data object to hold the new state
    const updatedData = {
      ...coachData,
      coachSkills: skills
    };
    
    // Update the coach data state with the new skills
    setCoachData(updatedData);
    
    // Log the updated state of coachData after updating
    console.log("[SKILLS_CHANGE_COACH_DATA_AFTER]", {
      yearsCoaching: updatedData.yearsCoaching,
      hourlyRate: updatedData.hourlyRate,
      coachSkills: updatedData.coachSkills,
      timestamp: new Date().toISOString()
    });
  };

  // Save skills to the server
  // Note: coachSkills are separate from coachRealEstateDomains
  // coachSkills are coaching specialties like "Lead Generation Strategy"
  // coachRealEstateDomains are real estate sectors like "REALTOR", "INVESTOR"
  const saveSkills = async (skills: string[]): Promise<boolean> => {
    try {
      console.log("[SAVE_SKILLS_START]", {
        skills,
        currentSelectedSkills: selectedSkills,
        currentRealEstateDomains: realEstateDomains,
        timestamp: new Date().toISOString()
      });
      
      setIsSubmitting(true);
      const result = await saveCoachSkills({ skills });
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      // Update local state immediately
      setSelectedSkills(skills);
      
      // Force a complete refresh of all profile data
      const refreshResult = await fetchData();
      
      console.log("[SAVE_SKILLS_COMPLETE]", {
        skills,
        updatedSelectedSkills: selectedSkills,
        updatedRealEstateDomains: realEstateDomains,
        fetchResult: refreshResult ? "success" : "no data returned",
        timestamp: new Date().toISOString()
      });
      
      toast.success("Skills saved successfully");
      return true;
    } catch (error) {
      console.error("[SAVE_SKILLS_ERROR]", {
        error,
        skills,
        currentState: {
          selectedSkills,
          realEstateDomains
        },
        timestamp: new Date().toISOString()
      });
      toast.error("Failed to save skills");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update functions
  const updateGeneralData = async (data: GeneralFormData): Promise<ApiResponse<GeneralFormData>> => {
    setIsSubmitting(true);
    try {
      const result = await updateUserProfile(data);
      if (result.data) {
        setGeneralData(prevData => ({
          ...prevData,
          ...result.data as GeneralFormData,
          languages: (result.data as GeneralFormData).languages || []
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
      return result;
    } catch (error) {
      console.error("[UPDATE_GENERAL_ERROR]", error);
      toast.error("Failed to update general profile");
      return { data: null, error: { code: 'INTERNAL_ERROR', message: 'Failed to update general profile' } };
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
    try {
      setIsSubmitting(true);
      
      console.log("[UPDATE_COACH_DATA_START]", {
        formData: data,
        currentState: {
          yearsCoaching: coachData.yearsCoaching,
          hourlyRate: coachData.hourlyRate,
          coachSkills: coachData.coachSkills,
          profileSlug: coachData.profileSlug
        },
        timestamp: new Date().toISOString()
      });
      
      // Process professional recognitions to convert string dates to Date objects
      const processedRecognitions = data.professionalRecognitions ? 
        data.professionalRecognitions.map(rec => ({
          ...rec,
          issueDate: typeof rec.issueDate === 'string' ? new Date(rec.issueDate) : rec.issueDate,
          expiryDate: rec.expiryDate ? (typeof rec.expiryDate === 'string' ? new Date(rec.expiryDate) : rec.expiryDate) : null,
          isVisible: rec.isVisible !== undefined ? rec.isVisible : true
        })) : [];
      
      // Create the API data object with the correct type casting
      // Use type assertion to avoid TypeScript errors
      const apiData = {
        coachSkills: data.coachSkills || [],
        yearsCoaching: data.yearsCoaching || 0,
        hourlyRate: data.hourlyRate || 100,
        defaultDuration: data.defaultDuration || 60,
        minimumDuration: data.minimumDuration || 30,
        maximumDuration: data.maximumDuration || 120,
        allowCustomDuration: data.allowCustomDuration || false,
        professionalRecognitions: processedRecognitions,
        coachRealEstateDomains: data.coachRealEstateDomains || [],
        coachPrimaryDomain: data.coachPrimaryDomain || null,
        slogan: data.slogan || "",
        profileSlug: data.profileSlug || null
      } as any; // Use type assertion to avoid TypeScript errors
      
      
      // Call the API to update the coach profile
      const result = await updateCoachProfile(apiData);
      
      if (result.data) {
        // Add type assertion to include coachSkills, coachRealEstateDomains, slogan, and coachPrimaryDomain
        const profileData = result.data as CoachProfileInitialData & { 
          coachSkills?: string[],
          coachRealEstateDomains?: string[],
          slogan?: string,
          coachPrimaryDomain?: string | null,
          profileSlug?: string | null
        };
        
        // Log the response data for debugging
        console.log("[UPDATE_COACH_DATA_RESPONSE]", {
          coachSkills: profileData.coachSkills || profileData.coachingSpecialties,
          coachRealEstateDomains: profileData.coachRealEstateDomains,
          slogan: profileData.slogan,
          coachPrimaryDomain: profileData.coachPrimaryDomain,
          profileSlug: profileData.profileSlug,
          yearsCoaching: profileData.yearsCoaching,
          hourlyRate: profileData.hourlyRate,
          timestamp: new Date().toISOString()
        });
        
        // If values are missing in the response but were in the form data,
        // use the form data values to ensure they're not lost
        const domains = profileData.coachRealEstateDomains || data.coachRealEstateDomains || [];
        const skills = profileData.coachSkills || profileData.coachingSpecialties || data.coachSkills || [];
        const slogan = profileData.slogan !== undefined ? profileData.slogan : data.slogan;
        const primaryDomain = profileData.coachPrimaryDomain !== undefined ? profileData.coachPrimaryDomain : data.coachPrimaryDomain;
        const profileSlug = profileData.profileSlug !== undefined ? profileData.profileSlug : data.profileSlug;
        
        // IMPORTANT: Explicitly preserve yearsCoaching and hourlyRate from form data if not in response
        const yearsCoaching = profileData.yearsCoaching !== undefined ? profileData.yearsCoaching : data.yearsCoaching || 0;
        const hourlyRate = profileData.hourlyRate !== undefined ? profileData.hourlyRate : data.hourlyRate || 100;
        
        console.log("[UPDATE_COACH_DATA_PRESERVED_VALUES]", {
          formYearsCoaching: data.yearsCoaching,
          formHourlyRate: data.hourlyRate,
          formProfileSlug: data.profileSlug,
          responseYearsCoaching: profileData.yearsCoaching,
          responseHourlyRate: profileData.hourlyRate,
          responseProfileSlug: profileData.profileSlug,
          finalYearsCoaching: yearsCoaching,
          finalHourlyRate: hourlyRate,
          finalProfileSlug: profileSlug,
          timestamp: new Date().toISOString()
        });
        
        // Update coach data with the response, preserving important values
        setCoachData({
          ...profileData,
          coachRealEstateDomains: domains,
          coachPrimaryDomain: primaryDomain,
          coachSkills: skills,
          slogan: slogan,
          profileSlug: profileSlug,
          yearsCoaching: yearsCoaching,
          hourlyRate: hourlyRate
        });
        
        // Update selected skills state
        setSelectedSkills(skills);
        
        // Update real estate domains from coach-specific domains
        setRealEstateDomains(domains as RealEstateDomain[]);
        
        console.log("[UPDATE_COACH_DATA_STATE_UPDATED]", {
          selectedSkills: skills,
          realEstateDomains: domains,
          slogan: slogan,
          coachPrimaryDomain: primaryDomain,
          yearsCoaching: yearsCoaching,
          hourlyRate: hourlyRate,
          profileSlug: profileSlug,
          timestamp: new Date().toISOString()
        });
        
        // Update completion status
        updateCompletionStatus(profileData);
      }
    } catch (error) {
      console.error("[UPDATE_COACH_DATA_ERROR]", {
        error: error instanceof Error ? error.message : error,
        timestamp: new Date().toISOString()
      });
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
      console.log("[PROFILE_CONTEXT_UPDATE_RECOGNITIONS]", {
        recognitionsCount: data.length,
        recognitions: JSON.stringify(data, (key, value) => {
          // Handle Date objects for logging
          if (value instanceof Date) {
            return value.toISOString();
          }
          return value;
        }, 2),
        timestamp: new Date().toISOString()
      });
      
      // Call the server action to update recognitions
      const result = await updateRecognitions(data);
      
      console.log("[PROFILE_CONTEXT_RECOGNITION_RESULT]", {
        success: !result.error,
        error: result.error,
        data: result.data ? {
          recognitionsCount: result.data.recognitions.length
        } : null,
        timestamp: new Date().toISOString()
      });
      
      if (result.error) {
        console.error("[UPDATE_RECOGNITIONS_ERROR]", {
          error: result.error,
          message: result.error.message,
          details: result.error.details,
          timestamp: new Date().toISOString()
        });
        toast.error(result.error.message || "Failed to update professional recognitions");
        return;
      }
      
      if (result.data) {
        setRecognitionsData(result.data.recognitions);
        toast.success("Professional recognitions updated successfully");
        
        // Fetch updated coach profile to get new completion status
        console.log("[PROFILE_CONTEXT_FETCHING_COACH_PROFILE]", {
          timestamp: new Date().toISOString()
        });
        
        const coachProfileResult = await fetchCoachProfile();
        
        console.log("[PROFILE_CONTEXT_COACH_PROFILE_RESULT]", {
          success: !coachProfileResult.error,
          error: coachProfileResult.error,
          hasData: !!coachProfileResult.data,
          timestamp: new Date().toISOString()
        });
        
        if (coachProfileResult.data) {
          updateCompletionStatus(coachProfileResult.data);
        }
      }
    } catch (error) {
      console.error("[UPDATE_RECOGNITIONS_ERROR]", {
        error,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
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
      await fetchData(); // Force fetch after updating skills to get updated profile data
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
      await fetchData(); // Force fetch after saving specialties to get updated profile data
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
      await fetchData();
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

  // Listings handlers
  const onSubmitListing = useCallback(async (data: CreateListing) => {
    try {
      setIsSubmitting(true);
      // TODO: Implement listing submission
      console.log("[SUBMIT_LISTING]", {
        data,
        timestamp: new Date().toISOString()
      });
      return { data: null, error: null };
    } catch (error) {
      console.error("[SUBMIT_LISTING_ERROR]", error);
      toast.error("Failed to submit listing");
      return { data: null, error: "Failed to submit listing" };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const onUpdateListing = useCallback(async (ulid: string, data: CreateListing) => {
    try {
      setIsSubmitting(true);
      // TODO: Implement listing update
      console.log("[UPDATE_LISTING]", {
        ulid,
        data,
        timestamp: new Date().toISOString()
      });
      return { data: null, error: null };
    } catch (error) {
      console.error("[UPDATE_LISTING_ERROR]", error);
      toast.error("Failed to update listing");
      return { data: null, error: "Failed to update listing" };
    } finally {
      setIsSubmitting(false);
    }
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
    retryCount,
    activeListings,
    successfulTransactions,
    onSubmitListing,
    onUpdateListing,
    clerkUser: clerkUser || null,
    isClerkLoaded
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