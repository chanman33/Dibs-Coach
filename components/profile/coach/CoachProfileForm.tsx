"use client"

import { useState, useEffect, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ProfileCompletion } from "./ProfileCompletion";
import { Card } from "@/components/ui/card";
import { ProfileStatus, REAL_ESTATE_DOMAINS } from "@/utils/types/coach";
import { z } from "zod";
import type { CoachProfileFormValues } from "../types";
import type { UserInfo } from "../types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormSectionHeader } from "../common/FormSectionHeader";
import { COACH_SPECIALTIES, SpecialtyCategory, Specialty } from "@/utils/types/coach";
import ReactSelect from 'react-select';
import { selectStyles } from "@/components/ui/select-styles";
import { GroupBase } from 'react-select';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Default image placeholder
const DEFAULT_IMAGE_URL = '/placeholder.svg';

// Utility function to handle Clerk profile image URLs
const getProfileImageUrl = (url: string | null | undefined): string => {
  // For missing URLs, use placeholder
  if (!url) return DEFAULT_IMAGE_URL;

  // For placeholder images, use our default placeholder
  if (url.includes('placeholder')) return DEFAULT_IMAGE_URL;

  // Handle Clerk OAuth URLs
  if (url.includes('oauth_google')) {
    // Try img.clerk.com domain first
    return url.replace('images.clerk.dev', 'img.clerk.com');
  }

  // Handle other Clerk URLs
  if (url.includes('clerk.dev') || url.includes('clerk.com')) {
    return url;
  }

  // For all other URLs, ensure HTTPS
  return url.startsWith('https://') ? url : `https://${url}`;
};

// Memoize the formatCategoryLabel function outside the component
const formatCategoryLabel = (category: string): string => {
  return category
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
};

const HOURLY_RATES = [
  { value: 100, label: "$100" },
  { value: 150, label: "$150" },
  { value: 200, label: "$200" },
  { value: 250, label: "$250" },
  { value: 300, label: "$300" },
  { value: 400, label: "$400" },
  { value: 500, label: "$500" },
  { value: 750, label: "$750" },
  { value: 1000, label: "$1,000" },
  { value: 1500, label: "$1,500" },
  { value: 2000, label: "$2,000" },
  { value: 2500, label: "$2,500" },
  { value: 3000, label: "$3,000" }
];

// Format real estate domains for display
const formatDomainLabel = (domain: string): string => {
  return domain
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
};

// Create domain options for select
const DOMAIN_OPTIONS = Object.entries(REAL_ESTATE_DOMAINS).map(([key, value]) => ({
  value,
  label: formatDomainLabel(key)
}));

// Add debugging to the coachBasicInfoSchema
const coachBasicInfoSchema = z.object({
  slogan: z.string().optional(),
  coachPrimaryDomain: z.string().nullable().optional(),
  coachRealEstateDomains: z.array(z.string()).optional().default([]),
  yearsCoaching: z.number().min(0, "Years of coaching must be 0 or greater")
    .transform((val) => {
      console.log("[SCHEMA_TRANSFORM_YEARS]", { rawValue: val, asNumber: Number(val) });
      return Number(val);
    }),
  hourlyRate: z.number().min(0, "Hourly rate must be 0 or greater")
    .transform((val) => {
      console.log("[SCHEMA_TRANSFORM_RATE]", { rawValue: val, asNumber: Number(val) });
      return Number(val);
    }),
  coachSkills: z.array(z.string()).default([]),
  profileSlug: z.string().optional().nullable(),
});

type CoachBasicInfoValues = z.infer<typeof coachBasicInfoSchema>;

// Add this type extension before the CoachProfileFormProps interface
type ExtendedCoachProfileFormValues = CoachProfileFormValues & {
  skipRevalidation?: boolean;
  displayName?: string;
  slogan?: string;
  coachPrimaryDomain?: string | null;
  coachRealEstateDomains?: string[];
  profileSlug?: string | null;
};

export interface CoachProfileFormProps {
  initialData?: {
    displayName?: string;
    slogan?: string;
    yearsCoaching?: number;
    hourlyRate?: number;
    coachSkills?: string[];
    coachPrimaryDomain?: string | null;
    coachRealEstateDomains?: string[];
    profileSlug?: string | null;
    [key: string]: any;
  };
  onSubmit: (data: ExtendedCoachProfileFormValues) => Promise<void>;
  isSubmitting?: boolean;
  profileStatus?: ProfileStatus;
  completionPercentage?: number;
  missingFields?: string[];
  missingRequiredFields?: string[];
  optionalMissingFields?: string[];
  validationMessages?: Record<string, string>;
  canPublish?: boolean;
  userInfo?: UserInfo;
  onSkillsChange?: (skills: string[]) => void;
  saveSkills: (selectedSkills: string[]) => Promise<boolean>;
  onSpecialtiesChange?: (specialties: string[]) => void;
  saveSpecialties?: (specialties: string[]) => Promise<void>;
  updateCompletionStatus: (data: any) => void;
}

export function CoachProfileForm({
  initialData,
  onSubmit,
  isSubmitting = false,
  profileStatus,
  completionPercentage = 0,
  missingFields = [],
  missingRequiredFields = [],
  optionalMissingFields = [],
  validationMessages = {},
  canPublish = false,
  userInfo,
  onSkillsChange,
  saveSkills,
  onSpecialtiesChange,
  saveSpecialties,
  updateCompletionStatus,
}: CoachProfileFormProps) {
  console.log("[COACH_FORM_INIT]", {
    initialDataProvided: {
      slogan: initialData?.slogan,
      coachPrimaryDomain: initialData?.coachPrimaryDomain,
      coachRealEstateDomains: initialData?.coachRealEstateDomains,
      yearsCoaching: initialData?.yearsCoaching,
      hourlyRate: initialData?.hourlyRate,
      coachSkills: initialData?.coachSkills,
      profileSlug: initialData?.profileSlug,
    },
    defaultValues: {
      slogan: initialData?.slogan || "",
      coachPrimaryDomain: initialData?.coachPrimaryDomain || null,
      coachRealEstateDomains: initialData?.coachRealEstateDomains || [],
      yearsCoaching: initialData?.yearsCoaching !== undefined ? initialData.yearsCoaching : 0,
      hourlyRate: initialData?.hourlyRate !== undefined ? initialData.hourlyRate : 100,
      coachSkills: initialData?.coachSkills || [],
      profileSlug: initialData?.profileSlug || null,
    },
    hasYearsCoaching: initialData?.yearsCoaching !== undefined,
    hasHourlyRate: initialData?.hourlyRate !== undefined,
    timestamp: new Date().toISOString()
  });
  
  // Add a debug function to log field values before they're sent
  function logFieldValue(name: string, value: any) {
    console.log(`[DEBUG_FIELD_${name.toUpperCase()}]`, {
      value,
      type: typeof value,
      asNumber: Number(value),
      typeOfNumber: typeof Number(value),
      isNaN: isNaN(Number(value)),
      timestamp: new Date().toISOString()
    });
    return value;
  }

  const form = useForm<CoachBasicInfoValues>({
    resolver: zodResolver(coachBasicInfoSchema),
    defaultValues: {
      slogan: initialData?.slogan || "",
      coachPrimaryDomain: initialData?.coachPrimaryDomain || null,
      coachRealEstateDomains: initialData?.coachRealEstateDomains || [],
      yearsCoaching: initialData?.yearsCoaching !== undefined ? Number(initialData.yearsCoaching) : 0,
      hourlyRate: initialData?.hourlyRate !== undefined ? Number(initialData.hourlyRate) : 100,
      coachSkills: initialData?.coachSkills || [],
      profileSlug: initialData?.profileSlug || null,
    },
    mode: "onChange",
  });

  // Memoize specialty options
  const specialtyOptions = useMemo(() =>
    Object.entries(COACH_SPECIALTIES).map(([category, specialties]) => ({
      label: formatCategoryLabel(category),
      options: specialties.map(specialty => ({
        value: specialty,
        label: specialty,
        category: category
      }))
    }))
    , []); // Empty dependency array since COACH_SPECIALTIES is constant

  // Update form values when initialData changes
  useEffect(() => {
    console.log("[COACH_FORM_RESET_EFFECT]", {
      initialData: {
        slogan: initialData?.slogan,
        coachPrimaryDomain: initialData?.coachPrimaryDomain,
        coachRealEstateDomains: initialData?.coachRealEstateDomains,
        yearsCoaching: initialData?.yearsCoaching,
        hourlyRate: initialData?.hourlyRate,
        coachSkills: initialData?.coachSkills,
        profileSlug: initialData?.profileSlug,
      },
      currentFormValues: {
        ...form.getValues(),
        yearsCoaching: form.getValues().yearsCoaching,
        hourlyRate: form.getValues().hourlyRate,
        profileSlug: form.getValues().profileSlug,
      },
      timestamp: new Date().toISOString()
    });
    
    if (initialData) {
      // Log the values we're about to reset to
      const resetValues = {
        slogan: initialData.slogan || "",
        coachPrimaryDomain: initialData.coachPrimaryDomain || null,
        coachRealEstateDomains: initialData.coachRealEstateDomains || [],
        yearsCoaching: initialData.yearsCoaching !== undefined ? initialData.yearsCoaching : 0,
        hourlyRate: initialData.hourlyRate !== undefined ? initialData.hourlyRate : 100,
        coachSkills: initialData.coachSkills || [],
        profileSlug: initialData.profileSlug || null,
      };
      
      console.log("[COACH_FORM_BEFORE_RESET]", {
        resetValues,
        yearsCoaching: resetValues.yearsCoaching,
        hourlyRate: resetValues.hourlyRate,
        profileSlug: resetValues.profileSlug,
        timestamp: new Date().toISOString()
      });
      
      // Reset the form with the values from initialData
      form.reset(resetValues);
      
      console.log("[COACH_FORM_AFTER_RESET]", {
        resetValues: form.getValues(),
        yearsCoaching: form.getValues().yearsCoaching,
        hourlyRate: form.getValues().hourlyRate,
        profileSlug: form.getValues().profileSlug,
        timestamp: new Date().toISOString()
      });
    }
  }, [initialData, form]);

  // Memoize the formatGroupLabel function
  const memoizedFormatGroupLabel = useCallback((group: GroupBase<any>) => {
    return (
      <div className="px-3 py-2 bg-slate-50 border-b border-slate-200">
        <span className="font-semibold text-sm text-slate-700">
          {group.label}
        </span>
      </div>
    );
  }, []);

  // Update effect to specifically watch numeric fields
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      console.log("[COACH_FORM_WATCH]", {
        changedField: name,
        newValue: value[name as keyof typeof value],
        allSkills: value.coachSkills,
        allDomains: value.coachRealEstateDomains,
        formState: {
          isDirty: form.formState.isDirty,
          isValid: form.formState.isValid
        },
        timestamp: new Date().toISOString()
      });

      // Add specific logging for numeric fields
      if (name === "yearsCoaching") {
        console.log("[YEARS_COACHING_WATCH]", {
          value: value.yearsCoaching,
          type: typeof value.yearsCoaching,
          asNumber: Number(value.yearsCoaching),
          timestamp: new Date().toISOString()
        });
      }
      
      if (name === "hourlyRate") {
        console.log("[HOURLY_RATE_WATCH]", {
          value: value.hourlyRate,
          type: typeof value.hourlyRate,
          asNumber: Number(value.hourlyRate),
          timestamp: new Date().toISOString()
        });
      }

      if (name === "coachSkills" && onSkillsChange) {
        const skills = (value.coachSkills || []).filter((s): s is string => typeof s === 'string');
        console.log("[SKILLS_CHANGE_TRIGGERED]", {
          skills,
          domains: value.coachRealEstateDomains, // Log domains to ensure they're not affected
          timestamp: new Date().toISOString()
        });
        
        // Only call onSkillsChange, don't modify domains
        onSkillsChange(skills);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, onSkillsChange]);

  // Log initial form state
  useEffect(() => {
    console.log("[COACH_BASIC_INFO_INITIAL_STATE]", {
      defaultValues: form.formState.defaultValues,
      timestamp: new Date().toISOString(),
      formState: {
        isDirty: form.formState.isDirty,
        isValid: form.formState.isValid,
        errors: form.formState.errors
      }
    });
  }, []);

  const handleSubmit = async (data: CoachBasicInfoValues) => {
    try {
      // Log all form values at submission time
      console.log("[COACH_FORM_VALUES_AT_SUBMIT]", form.getValues());
      
      console.log("[COACH_BASIC_INFO_SUBMIT_START]", {
        submittedData: {
          slogan: data.slogan,
          coachPrimaryDomain: data.coachPrimaryDomain,
          coachRealEstateDomains: data.coachRealEstateDomains,
          yearsCoaching: {
            value: data.yearsCoaching,
            type: typeof data.yearsCoaching
          },
          hourlyRate: {
            value: data.hourlyRate,
            type: typeof data.hourlyRate
          },
          coachSkills: data.coachSkills,
          profileSlug: data.profileSlug,
        },
        initialData: {
          coachSkills: initialData?.coachSkills,
          coachRealEstateDomains: initialData?.coachRealEstateDomains,
          profileSlug: initialData?.profileSlug,
          yearsCoaching: {
            value: initialData?.yearsCoaching,
            type: typeof initialData?.yearsCoaching
          },
          hourlyRate: {
            value: initialData?.hourlyRate,
            type: typeof initialData?.hourlyRate
          }
        },
        formState: {
          isDirty: form.formState.isDirty,
          dirtyFields: Object.keys(form.formState.dirtyFields || {}),
          isValid: form.formState.isValid,
          errors: form.formState.errors
        },
        timestamp: new Date().toISOString()
      });

      if (!form.formState.isValid) {
        console.log("[COACH_BASIC_INFO_VALIDATION_FAILED]", {
          errors: form.formState.errors,
          invalidFields: Object.keys(form.formState.errors),
          timestamp: new Date().toISOString()
        });
        toast.error("Please fix validation errors before submitting");
        return;
      }

      // Force numeric values to be properly typed when sending to the server
      // NOTE: Always use Number() to force conversion rather than relying on type casting
      const yearsCoaching = Number(data.yearsCoaching);
      const hourlyRate = Number(data.hourlyRate);
      
      // Validate numeric values - ensure they're not NaN
      if (isNaN(yearsCoaching)) {
        console.error("[COACH_BASIC_INFO_NAN_ERROR]", {
          field: "yearsCoaching",
          value: data.yearsCoaching,
          timestamp: new Date().toISOString()
        });
        toast.error("Years of coaching must be a valid number");
        return;
      }
      
      if (isNaN(hourlyRate)) {
        console.error("[COACH_BASIC_INFO_NAN_ERROR]", {
          field: "hourlyRate",
          value: data.hourlyRate,
          timestamp: new Date().toISOString()
        });
        toast.error("Hourly rate must be a valid number");
        return;
      }
      
      console.log("[NUMERIC_VALUES_AFTER_CONVERSION]", {
        yearsCoachingBefore: {
          value: data.yearsCoaching,
          type: typeof data.yearsCoaching
        },
        yearsCoachingAfter: {
          value: yearsCoaching,
          type: typeof yearsCoaching
        },
        hourlyRateBefore: {
          value: data.hourlyRate,
          type: typeof data.hourlyRate
        },
        hourlyRateAfter: {
          value: hourlyRate,
          type: typeof hourlyRate
        },
        timestamp: new Date().toISOString()
      });
      
      // Important: Create a NEW object with properly typed numeric fields
      // Do NOT use spreading that might lose types
      const mergedData: ExtendedCoachProfileFormValues = {
        displayName: initialData?.displayName,
        slogan: data.slogan,
        coachPrimaryDomain: data.coachPrimaryDomain,
        coachRealEstateDomains: initialData?.coachRealEstateDomains || [],
        yearsCoaching: yearsCoaching,
        hourlyRate: hourlyRate,
        coachSkills: data.coachSkills || [],
        profileSlug: data.profileSlug,
        skipRevalidation: true,
        // Add missing required properties
        allowCustomDuration: initialData?.allowCustomDuration || false,
        defaultDuration: initialData?.defaultDuration || 60,
        maximumDuration: initialData?.maximumDuration || 120,
        minimumDuration: initialData?.minimumDuration || 30,
        professionalRecognitions: initialData?.professionalRecognitions || [],
      };

      console.log("[COACH_BASIC_INFO_SUBMIT_MERGED]", {
        mergedData: {
          slogan: mergedData.slogan,
          coachPrimaryDomain: mergedData.coachPrimaryDomain,
          coachSkills: mergedData.coachSkills,
          coachRealEstateDomains: mergedData.coachRealEstateDomains,
          yearsCoaching: {
            value: mergedData.yearsCoaching,
            type: typeof mergedData.yearsCoaching
          },
          hourlyRate: {
            value: mergedData.hourlyRate,
            type: typeof mergedData.hourlyRate
          }
        },
        timestamp: new Date().toISOString()
      });

      console.log("[COACH_BASIC_INFO_BEFORE_SUBMIT]", {
        formValues: form.getValues(),
        timestamp: new Date().toISOString()
      });

      await onSubmit(mergedData);
      
      console.log("[COACH_BASIC_INFO_AFTER_SUBMIT]", {
        formValues: form.getValues(),
        timestamp: new Date().toISOString()
      });
      
      // Store the values we want to reset to
      const resetValues = {
        slogan: data.slogan,
        coachPrimaryDomain: data.coachPrimaryDomain,
        coachRealEstateDomains: data.coachRealEstateDomains || [],
        yearsCoaching: yearsCoaching,
        hourlyRate: hourlyRate,
        coachSkills: data.coachSkills || [],
        profileSlug: data.profileSlug,
      };
      
      console.log("[COACH_BASIC_INFO_BEFORE_RESET]", {
        resetValues: {
          ...resetValues,
          yearsCoaching: {
            value: resetValues.yearsCoaching,
            type: typeof resetValues.yearsCoaching
          },
          hourlyRate: {
            value: resetValues.hourlyRate,
            type: typeof resetValues.hourlyRate
          }
        },
        timestamp: new Date().toISOString()
      });
      
      form.reset(resetValues);
      
      console.log("[COACH_BASIC_INFO_AFTER_RESET]", {
        formValues: {
          ...form.getValues(),
          yearsCoaching: {
            value: form.getValues().yearsCoaching,
            type: typeof form.getValues().yearsCoaching
          },
          hourlyRate: {
            value: form.getValues().hourlyRate,
            type: typeof form.getValues().hourlyRate
          }
        },
        timestamp: new Date().toISOString()
      });

      toast.success("Profile information updated successfully");
    } catch (error) {
      console.error("[COACH_BASIC_INFO_SUBMIT_ERROR]", {
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack
        } : error,
        attemptedData: {
          slogan: data.slogan,
          coachPrimaryDomain: data.coachPrimaryDomain,
          coachRealEstateDomains: data.coachRealEstateDomains,
          yearsCoaching: data.yearsCoaching,
          hourlyRate: data.hourlyRate,
          coachSkills: data.coachSkills,
          profileSlug: data.profileSlug,
        },
        timestamp: new Date().toISOString()
      });
      toast.error("Failed to update profile information");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Form {...form}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            console.log("[COACH_BASIC_INFO_SUBMIT_EVENT]", {
              currentValues: form.getValues(),
              formState: {
                isDirty: form.formState.isDirty,
                dirtyFields: Object.keys(form.formState.dirtyFields || {}),
                isValid: form.formState.isValid,
                errors: form.formState.errors
              },
              timestamp: new Date().toISOString()
            });
            form.handleSubmit(handleSubmit)(e);
          }}
          className="space-y-4 sm:space-y-6"
        >
          <ProfileCompletion
            completionPercentage={completionPercentage}
            profileStatus={profileStatus || 'DRAFT'}
            canPublish={canPublish}
            missingFields={missingFields}
            missingRequiredFields={missingRequiredFields}
            optionalMissingFields={optionalMissingFields}
            validationMessages={validationMessages}
            updateCompletionStatus={updateCompletionStatus}
          />

          {/* Coach Profile Card */}
          <Card className="p-4 sm:p-6 border shadow-sm">
            <div className="space-y-4">
              <div className="space-y-2">
                <FormSectionHeader
                  title="Coach Profile"
                  required
                  tooltip="Your public profile information that clients will see."
                />
                <p className="text-xs sm:text-sm text-muted-foreground">
                  This information will be displayed on your public profile.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
                <div className="flex-shrink-0">
                  <Avatar className="h-24 w-24 border">
                    <AvatarImage 
                      src={getProfileImageUrl(userInfo?.profileImageUrl)} 
                      alt="Profile" 
                      onError={(e) => {
                        console.error("[PROFILE_IMAGE_ERROR]", {
                          originalUrl: userInfo?.profileImageUrl,
                          error: e
                        });
                        // Set to default image on error
                        (e.target as HTMLImageElement).src = DEFAULT_IMAGE_URL;
                      }}
                    />
                    <AvatarFallback>
                      {(userInfo?.firstName?.charAt(0) || "") + (userInfo?.lastName?.charAt(0) || "")}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                <div className="flex-1 space-y-4 w-full">
                  <div>
                    <h3 className="text-lg font-bold mb-1">
                      {initialData?.displayName || ((userInfo?.firstName && userInfo?.lastName) 
                        ? `${userInfo.firstName} ${userInfo.lastName}` 
                        : "Your Name")}
                    </h3>
                    {/* <p className="text-xs sm:text-sm text-muted-foreground">
                      Your display name can be updated in the General Information section.
                    </p> */}
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="slogan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Byline or Slogan</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="e.g., Turning Top Real Estate Professionals into Market Leaders"
                          />
                        </FormControl>
                        <FormDescription>
                          A short, catchy tagline that captures your unique value proposition
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="profileSlug"
                    render={({ field }) => {
                      // Calculate slug quality
                      const slugValue = field.value || '';
                      const slugLength = slugValue.length;
                      let slugQuality: 'poor' | 'good' | 'excellent' = 'poor';
                      let slugFeedback = '';
                      
                      if (slugLength === 0) {
                        slugQuality = 'poor';
                        slugFeedback = 'Required: Please create a custom URL for your profile';
                      } else if (slugLength < 3) {
                        slugQuality = 'poor';
                        slugFeedback = 'Too short: Your URL should be at least 3 characters';
                      } else if (slugLength > 30) {
                        slugQuality = 'poor';
                        slugFeedback = 'Too long: Shorter URLs are easier to remember';
                      } else if (slugLength <= 15) {
                        // Short, memorable URLs are excellent
                        slugQuality = 'excellent';
                        slugFeedback = 'Excellent: Short and memorable!';
                      } else {
                        // Medium length URLs are good
                        slugQuality = 'good';
                        slugFeedback = 'Good: Reasonably memorable length';
                      }
                      
                      // Check if slug contains the coach's expertise or relevant keywords
                      const expertiseKeywords = ['coach', 'realtor', 'investor', 'mortgage', 'property', 'real-estate'];
                      const hasExpertiseKeyword = expertiseKeywords.some(keyword => slugValue.includes(keyword));
                      
                      if (slugLength >= 3 && hasExpertiseKeyword && slugQuality !== 'poor') {
                        slugQuality = 'excellent';
                        slugFeedback = 'Excellent: Contains relevant keywords for better SEO!';
                      }
                      
                      // Quality indicator colors
                      const qualityColors = {
                        poor: 'text-red-500 bg-red-50',
                        good: 'text-amber-500 bg-amber-50',
                        excellent: 'text-green-500 bg-green-50'
                      };
                      
                      return (
                        <FormItem>
                          <FormLabel>
                            Custom Profile URL
                            <span className="text-red-500 ml-1">*</span>
                          </FormLabel>
                          <div className="flex items-center">
                            <span className="text-sm text-muted-foreground mr-2">dibs.coach/profile/</span>
                            <FormControl>
                              <Input 
                                {...field} 
                                value={field.value || ''}
                                onChange={(e) => {
                                  // Convert to lowercase and replace spaces with hyphens
                                  const value = e.target.value
                                    .toLowerCase()
                                    .replace(/\s+/g, '-')
                                    .replace(/[^a-z0-9-]/g, '');
                                  field.onChange(value);
                                }}
                                placeholder="your-custom-url"
                                className={slugLength === 0 ? "border-red-300 focus-visible:ring-red-500" : ""}
                              />
                            </FormControl>
                          </div>
                          
                          {/* Slug quality indicator */}
                          {slugLength > 0 && (
                            <div className={`mt-2 text-xs px-2 py-1 rounded-md inline-flex items-center ${qualityColors[slugQuality]}`}>
                              {slugQuality === 'excellent' && (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                              {slugFeedback}
                            </div>
                          )}
                          
                          <FormDescription>
                            Create a custom URL for your profile. Only lowercase letters, numbers, and hyphens are allowed.
                            <ul className="list-disc pl-5 mt-1 space-y-1">
                              <li>Keep it short and memorable (3-15 characters is ideal)</li>
                              <li>Include your name or expertise (e.g., "john-smith-realtor")</li>
                              <li>Avoid numbers unless they're part of your brand</li>
                              <li>A consistent URL helps improve your visibility and makes it easier for people to find you</li>
                            </ul>
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-4">
                <FormField
                  control={form.control}
                  name="coachPrimaryDomain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Domain</FormLabel>
                      <div className="p-2 border rounded-md bg-muted/20">
                        {field.value ?
                          DOMAIN_OPTIONS.find(option => option.value === field.value)?.label || field.value
                          :
                          "None (Managed by admin)"}
                      </div>
                      <FormDescription>
                        Your main area of coaching expertise.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="coachRealEstateDomains"
                  render={({ field }) => {
                    // Find the domain labels for display
                    const domainLabels = DOMAIN_OPTIONS
                      .filter(option => field.value?.includes(option.value))
                      .map(option => option.label);

                    return (
                      <FormItem>
                        <FormLabel>Real Estate Domains</FormLabel>
                        <div className="p-2 border rounded-md bg-muted/20 min-h-[38px]">
                          {domainLabels.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {domainLabels.map((label, index) => (
                                <span key={index} className="bg-primary/10 text-primary px-2 py-1 rounded text-sm">
                                  {label}
                                </span>
                              ))}
                            </div>
                          ) : (
                            "None (Managed by admin)"
                          )}
                        </div>
                        <FormDescription>
                          Other areas of real estate you specialize in coaching.<br />
                          These fields are managed by administrators.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>
            </div>
          </Card>

          {/* Basic Coach Information Card */}
          <Card className="p-4 sm:p-6 border shadow-sm">
            <div className="space-y-4">
              <div className="space-y-2">
                <FormSectionHeader
                  title="Coaching Experience & Rates"
                  required
                  tooltip="Your experience level and pricing information helps set client expectations."
                />
                <p className="text-xs sm:text-sm text-muted-foreground">
                  This information will be displayed to potential clients looking for a coach.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <FormField
                  control={form.control}
                  name="yearsCoaching"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Years of Coaching Experience</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          {...field}
                          // Force a numeric value, defaulting to 0 if empty or NaN
                          value={isNaN(Number(field.value)) ? 0 : Number(field.value)}
                          onChange={(e) => {
                            const numValue = Number(e.target.value);
                            console.log("[YEARS_COACHING_CHANGE]", {
                              rawValue: e.target.value,
                              parsedValue: numValue,
                              isNaN: isNaN(numValue),
                              timestamp: new Date().toISOString()
                            });
                            field.onChange(isNaN(numValue) ? 0 : numValue);
                          }}
                          onBlur={() => {
                            // Ensure a valid number on blur
                            if (isNaN(Number(field.value)) || field.value === null || field.value === undefined) {
                              field.onChange(0);
                            }
                            logFieldValue("yearsCoaching", field.value);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        How many years have you been coaching professionally? This may include time spent in leadership roles, consulting, or other paid coaching experiences.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hourlyRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hourly Rate (USD)</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value?.toString() || "100"}
                          onValueChange={(value) => {
                            const numValue = parseInt(value, 10);
                            console.log("[HOURLY_RATE_CHANGE]", {
                              selectedValue: value,
                              parsedValue: numValue,
                              timestamp: new Date().toISOString()
                            });
                            const finalValue = isNaN(numValue) ? 100 : numValue;
                            field.onChange(finalValue);
                            logFieldValue("hourlyRate", finalValue);
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select hourly rate" />
                          </SelectTrigger>
                          <SelectContent>
                            {HOURLY_RATES.map((rate) => (
                              <SelectItem key={rate.value} value={rate.value.toString()}>
                                {rate.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>
                        Set your hourly coaching rate. This rate will be visible to potential clients.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </Card>

          {/* Coaching Skills Card */}
          <Card className="p-4 sm:p-6 border shadow-sm">
            <div className="space-y-4">
              <div className="space-y-2">
                <FormSectionHeader
                  title="Coaching Skills"
                  required
                  tooltip="Select the specific areas where you can provide expert coaching and guidance."
                />
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Choose skills that best represent your expertise and coaching focus areas.
                </p>
              </div>

              <FormField
                control={form.control}
                name="coachSkills"
                render={({ field: { onChange, value, ...field } }) => {
                  // Memoize the current value to prevent unnecessary re-renders
                  const currentValue = useMemo(() =>
                    specialtyOptions
                      .flatMap(group => group.options)
                      .filter(option => value?.includes(option.value))
                    , [value]);

                  // Memoize the onChange handler
                  const handleChange = useCallback((selected: any) => {
                    const newValues = selected ? selected.map((option: any) => option.value) : [];
                    onChange(newValues);
                  }, [onChange]);

                  return (
                    <FormItem>
                      <FormControl>
                        <ReactSelect
                          {...field}
                          isMulti
                          options={specialtyOptions}
                          styles={selectStyles}
                          value={currentValue}
                          onChange={handleChange}
                          placeholder="Select your coaching skills..."
                          className="w-full"
                          classNamePrefix="coach-skill-select"
                          formatGroupLabel={memoizedFormatGroupLabel}
                          noOptionsMessage={() => "No skills found"}
                          menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                          menuPosition="fixed"
                          menuPlacement="top"
                          isSearchable
                          isClearable
                          blurInputOnSelect={false}
                          closeMenuOnSelect={false}
                        />
                      </FormControl>
                      <FormDescription>
                        You can select multiple skills across different categories.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
} 