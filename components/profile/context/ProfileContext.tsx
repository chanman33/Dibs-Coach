"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from "react";
import { CoachProfileFormValues, CoachProfileInitialData } from "../types";
import { ProfileStatus } from "@/utils/types/coach";
import { ProfessionalRecognition, SerializableProfessionalRecognition } from "@/utils/types/recognition";
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
import {
  PortfolioItem,
  CreatePortfolioItem,
  UpdatePortfolioItem
} from "@/utils/types/portfolio";
import { 
  fetchPortfolioItems,
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem
} from "@/utils/actions/portfolio-actions";
import type { MarketingInfo } from "@/utils/types/marketing";

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
    websiteUrl?: string | null;
    facebookUrl?: string | null;
    instagramUrl?: string | null;
    linkedinUrl?: string | null;
    youtubeUrl?: string | null;
    tiktokUrl?: string | null;
  };
  
  // Portfolio items
  portfolioItems: PortfolioItem[];
  
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
  marketingData: MarketingInfo | null;
  
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
  updateMarketingData: (data: MarketingInfo) => Promise<void>;
  updateGoalsData: (data: any) => Promise<void>;
  updateLanguages: (languages: string[]) => Promise<void>;
  
  // Portfolio functions
  addPortfolioItem: (data: CreatePortfolioItem) => Promise<{ data?: PortfolioItem | null; error?: string | null }>;
  updatePortfolioItem: (id: string, data: UpdatePortfolioItem) => Promise<{ data?: PortfolioItem | null; error?: string | null }>;
  deletePortfolioItem: (id: string) => Promise<{ error?: string | null }>;
  
  // Skills management
  onSkillsChange: (skills: string[]) => void;
  saveSkills: (skills: string[]) => Promise<boolean>;
  updateSkills: (skills: string[]) => Promise<void>;
  
  // Listings handlers
  onSubmitListing: (data: CreateListing) => Promise<{ data?: ListingWithRealtor | null; error?: string | null }>;
  onUpdateListing: (ulid: string, data: CreateListing) => Promise<{ data?: ListingWithRealtor | null; error?: string | null }>;
  
  // Function to update completion status locally
  updateCompletionStatus: (data: any) => void;
  
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
    websiteUrl?: string | null;
    facebookUrl?: string | null;
    instagramUrl?: string | null;
    linkedinUrl?: string | null;
    youtubeUrl?: string | null;
    tiktokUrl?: string | null;
  }>({});
  
  // Add portfolioItems state
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  
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
  const [marketingData, setMarketingData] = useState<MarketingInfo | null>(null);
  
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
      
      // Fetch portfolio items
      if (capabilities.includes('COACH')) {
        try {
          const portfolioResult = await fetchPortfolioItems();
          if (!portfolioResult.error && portfolioResult.data) {
            console.log("[PROFILE_PORTFOLIO_LOADED]", {
              itemCount: portfolioResult.data.length,
              timestamp: new Date().toISOString()
            });
            setPortfolioItems(portfolioResult.data);
          }
        } catch (error) {
          console.error('[FETCH_PORTFOLIO_ERROR]', error);
        }
      }
      
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
            profileSlug?: string | null,
            websiteUrl?: string | null;
            facebookUrl?: string | null;
            instagramUrl?: string | null;
            linkedinUrl?: string | null;
            youtubeUrl?: string | null;
            tiktokUrl?: string | null;
          };
          
          console.log("[PROFILE_FETCH_COACH_DATA_WITH_URLS]", { 
            ...coachProfileData,
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
            profileSlug: coachProfileData.profileSlug,
            websiteUrl: coachProfileData.websiteUrl,
            facebookUrl: coachProfileData.facebookUrl,
            instagramUrl: coachProfileData.instagramUrl,
            linkedinUrl: coachProfileData.linkedinUrl,
            youtubeUrl: coachProfileData.youtubeUrl,
            tiktokUrl: coachProfileData.tiktokUrl,
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
          
          // Log the status received and set in context
          console.log("[PROFILE_CONTEXT_STATUS_UPDATE]", {
            receivedStatus: coachProfileData.profileStatus,
            timestamp: new Date().toISOString()
          });
          // Ensure the status is set AFTER logging
          setProfileStatus(coachProfileData.profileStatus);
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
  }, [clerkUser?.imageUrl]);

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
      
      // Log incoming data including new URLs
      console.log("[UPDATE_COACH_DATA_CONTEXT_START]", { 
        data: {
           ...data, // Spread all incoming form data
           yearsCoaching: Number(data.yearsCoaching), // Ensure numbers are numbers
           hourlyRate: Number(data.hourlyRate),
        },
        timestamp: new Date().toISOString() 
      });

      // Prepare data for the server action (CoachProfileFormData needs update)
      const apiData = {
        ...data, // Spread all fields from the form
        yearsCoaching: Number(data.yearsCoaching),
        hourlyRate: Number(data.hourlyRate),
        // Convert nulls to undefined for type compatibility
        profileSlug: data.profileSlug ?? undefined,
        websiteUrl: data.websiteUrl ?? undefined,
        facebookUrl: data.facebookUrl ?? undefined,
        instagramUrl: data.instagramUrl ?? undefined,
        linkedinUrl: data.linkedinUrl ?? undefined,
        youtubeUrl: data.youtubeUrl ?? undefined,
        tiktokUrl: data.tiktokUrl ?? undefined,
        // ... other fields if needed ...
      };

      const result = await updateCoachProfile(apiData); // Pass all data

      if (result.data) {
        const profileData = result.data as any; // Adjust type assertion as needed

        // Log response
        console.log("[UPDATE_COACH_DATA_CONTEXT_RESPONSE]", { 
           profileData,
           timestamp: new Date().toISOString() 
        });

        // Update state, ensuring new URLs are included
        setCoachData(prev => ({
          ...prev,
          ...profileData, // Spread response data
          // Re-apply potentially unsent fields from form if necessary,
          // but response should ideally contain all updated fields
          websiteUrl: profileData.websiteUrl,
          facebookUrl: profileData.facebookUrl,
          instagramUrl: profileData.instagramUrl,
          linkedinUrl: profileData.linkedinUrl,
          youtubeUrl: profileData.youtubeUrl,
          tiktokUrl: profileData.tiktokUrl,
          // Ensure numbers are numbers from response
          yearsCoaching: Number(profileData.yearsCoaching ?? prev.yearsCoaching),
          hourlyRate: Number(profileData.hourlyRate ?? prev.hourlyRate),
        }));
        // ... update other related states (skills, domains, completion) ...
        toast.success("Coach profile updated successfully");
      } else if (result.error) {
        // ... error handling ...
        toast.error(result.error.message || "Failed to update coach profile");
      }
    } catch (error) { 
      // ... error handling ...
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
      // Convert dates to ISO strings for server action
      const serializableData: SerializableProfessionalRecognition[] = data.map(rec => ({
        ...rec,
        issueDate: rec.issueDate instanceof Date ? rec.issueDate.toISOString() : String(rec.issueDate),
        expiryDate: rec.expiryDate instanceof Date ? rec.expiryDate.toISOString() : 
                   (rec.expiryDate ? String(rec.expiryDate) : null),
        createdAt: rec.createdAt instanceof Date ? rec.createdAt.toISOString() : rec.createdAt,
        updatedAt: rec.updatedAt instanceof Date ? rec.updatedAt.toISOString() : rec.updatedAt
      }));
      
      console.log("[PROFILE_CONTEXT_UPDATE_RECOGNITIONS]", {
        recognitionsCount: serializableData.length,
        recognitions: JSON.stringify(serializableData),
        timestamp: new Date().toISOString()
      });
      
      // Call the server action to update recognitions
      const result = await updateRecognitions(serializableData);
      
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
  
  const updateMarketingData = async (data: MarketingInfo) => {
    setIsSubmitting(true);
    try {
      console.log("Updating marketing info...", data); // Log what's being passed
      // Replace the placeholder with the actual update logic if needed
      // For now, just log and update local state
      // const response = await updateMarketingInfo(data);
      // if (response.error) {
      //   throw new Error(response.error.message || 'Failed to update marketing info');
      // }
      setMarketingData(data); // Update local state
      toast.success("Marketing info saved locally (no backend update)");
    } catch (error: any) {
      console.error("Error updating marketing data:", error);
      toast.error("Failed to update marketing information");
    } finally {
      setIsSubmitting(false);
    }
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

  // Add portfolio item handlers
  const handleAddPortfolioItem = async (data: CreatePortfolioItem) => {
    setIsSubmitting(true);
    try {
      const result = await createPortfolioItem(data);
      if (result.error) {
        toast.error(result.error.message);
        return { error: result.error.message };
      }
      
      if (result.data) {
        setPortfolioItems(prevItems => [result.data!, ...prevItems]);
        toast.success("Portfolio item added successfully");
      }
      
      return { data: result.data };
    } catch (error) {
      console.error("[ADD_PORTFOLIO_ERROR]", error);
      toast.error("Failed to add portfolio item");
      return { error: "Failed to add portfolio item" };
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePortfolioItem = async (id: string, data: UpdatePortfolioItem) => {
    setIsSubmitting(true);
    try {
      const result = await updatePortfolioItem(id, data);
      if (result.error) {
        toast.error(result.error.message);
        return { error: result.error.message };
      }
      
      if (result.data) {
        setPortfolioItems(prevItems => 
          prevItems.map(item => item.ulid === id ? result.data! : item)
        );
        toast.success("Portfolio item updated successfully");
      }
      
      return { data: result.data };
    } catch (error) {
      console.error("[UPDATE_PORTFOLIO_ERROR]", error);
      toast.error("Failed to update portfolio item");
      return { error: "Failed to update portfolio item" };
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePortfolioItem = async (id: string) => {
    setIsSubmitting(true);
    try {
      const result = await deletePortfolioItem(id);
      if (result.error) {
        toast.error(result.error.message);
        return { error: result.error.message };
      }
      
      setPortfolioItems(prevItems => 
        prevItems.filter(item => item.ulid !== id)
      );
      toast.success("Portfolio item deleted successfully");
      
      return {};
    } catch (error) {
      console.error("[DELETE_PORTFOLIO_ERROR]", error);
      toast.error("Failed to delete portfolio item");
      return { error: "Failed to delete portfolio item" };
    } finally {
      setIsSubmitting(false);
    }
  };
  
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
    portfolioItems,
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
    isClerkLoaded,
    updateCompletionStatus,
    addPortfolioItem: handleAddPortfolioItem,
    updatePortfolioItem: handleUpdatePortfolioItem,
    deletePortfolioItem: handleDeletePortfolioItem
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