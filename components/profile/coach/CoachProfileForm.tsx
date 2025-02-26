"use client"

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CoachSpecialtiesSection } from "./CoachSpecialtiesSection";
import { CoachRateInfoSection } from "./CoachRateInfoSection";
import { LanguagesSection } from "./LanguagesSection";
import { RecognitionsSection } from "./RecognitionsSection";
import { coachProfileFormSchema, CoachProfileFormValues, CoachProfileInitialData, UserInfo } from "../types";
import { Card } from "@/components/ui/card";
import { ProfileStatus } from "@/utils/types/coach";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { INDUSTRY_SPECIALTIES } from "@/components/profile/common/ProfileTabsManager";
import { ProfileCompletion } from "./ProfileCompletion";
import { COMMON_LANGUAGES } from "@/lib/constants";

export type Language = {
  code: string;
  name: string;
  nativeName?: string;
};

export interface CoachProfileFormProps {
  initialData?: CoachProfileInitialData;
  onSubmit: (values: CoachProfileFormValues) => void;
  isSubmitting?: boolean;
  profileStatus?: ProfileStatus;
  completionPercentage?: number;
  missingFields?: string[];
  missingRequiredFields?: string[];
  optionalMissingFields?: string[];
  validationMessages?: Record<string, string>;
  canPublish?: boolean;
  userInfo?: UserInfo;
  onSpecialtiesChange: (specialties: string[]) => void;
  saveSpecialties: (selectedSpecialties: string[]) => Promise<boolean | void>;
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
  onSpecialtiesChange,
  saveSpecialties,
}: CoachProfileFormProps) {
  // Log initial data for debugging
  useEffect(() => {
    console.log("[COACH_PROFILE_FORM_INITIAL_DATA]", {
      initialData,
      domainSpecialties: initialData?.domainSpecialties,
      timestamp: new Date().toISOString()
    });
  }, [initialData]);

  const [selectedDomainSpecialties, setSelectedDomainSpecialties] = useState<string[]>(
    initialData?.domainSpecialties || []
  );

  const form = useForm<CoachProfileFormValues>({
    resolver: zodResolver(coachProfileFormSchema),
    defaultValues: {
      specialties: initialData?.specialties || [],
      yearsCoaching: initialData?.yearsCoaching || 0,
      hourlyRate: initialData?.hourlyRate || 0,
      calendlyUrl: initialData?.calendlyUrl || "",
      eventTypeUrl: initialData?.eventTypeUrl || "",
      defaultDuration: initialData?.defaultDuration || 60,
      minimumDuration: initialData?.minimumDuration || 30,
      maximumDuration: initialData?.maximumDuration || 120,
      allowCustomDuration: initialData?.allowCustomDuration || false,
      languages: initialData?.languages || [],
      marketExpertise: initialData?.marketExpertise || "",
      professionalRecognitions: initialData?.professionalRecognitions || [],
    },
    mode: "onSubmit"
  });

  // Add form state change listener
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      console.log("[FORM_FIELD_CHANGE]", {
        field: name,
        type,
        value,
        timestamp: new Date().toISOString()
      });
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Add form state debug logging
  useEffect(() => {
    console.log("[FORM_STATE]", {
      isDirty: form.formState.isDirty,
      isValid: form.formState.isValid,
      errors: form.formState.errors,
      touchedFields: form.formState.touchedFields,
      timestamp: new Date().toISOString()
    });
  }, [form.formState]);

  // Reset form values when initialData changes
  useEffect(() => {
    if (initialData) {
      console.log("[RESETTING_FORM_VALUES]", {
        domainSpecialties: initialData.domainSpecialties,
        timestamp: new Date().toISOString()
      });
      
      form.reset({
        specialties: initialData.specialties || [],
        yearsCoaching: initialData.yearsCoaching || 0,
        hourlyRate: initialData.hourlyRate || 0,
        calendlyUrl: initialData.calendlyUrl || "",
        eventTypeUrl: initialData.eventTypeUrl || "",
        defaultDuration: initialData.defaultDuration || 60,
        minimumDuration: initialData.minimumDuration || 30,
        maximumDuration: initialData.maximumDuration || 120,
        allowCustomDuration: initialData.allowCustomDuration || false,
        languages: initialData.languages || [],
        marketExpertise: initialData.marketExpertise || "",
        professionalRecognitions: initialData.professionalRecognitions || [],
      });

      // Update local state for display only
      setSelectedDomainSpecialties(initialData.domainSpecialties || []);
    }
  }, [initialData, form]);

  // Function to check if form values have changed from initial data
  const checkFormChanges = (values: CoachProfileFormValues) => {
    const changes: Record<string, { previous: any; current: any }> = {};
    
    // Check other fields
    if (initialData?.hourlyRate !== values.hourlyRate) {
      changes.hourlyRate = {
        previous: initialData?.hourlyRate,
        current: values.hourlyRate
      };
    }
    
    if (JSON.stringify(initialData?.languages || []) !== JSON.stringify(values.languages)) {
      changes.languages = {
        previous: initialData?.languages || [],
        current: values.languages
      };
    }
    
    return {
      hasChanges: Object.keys(changes).length > 0,
      changes
    };
  };

  const handleSubmit = async (values: CoachProfileFormValues) => {
    try {
      // Log form state before validation
      console.log("[PRE_VALIDATION_FORM_STATE]", {
        values,
        formState: {
          isDirty: form.formState.isDirty,
          isValid: form.formState.isValid,
          errors: form.formState.errors
        },
        timestamp: new Date().toISOString()
      });

      // Check for changes
      const { hasChanges, changes } = checkFormChanges(values);
      
      // Log the form values for debugging
      console.log("[COACH_PROFILE_SUBMISSION]", {
        formValues: values,
        hasChanges,
        changes,
        timestamp: new Date().toISOString()
      });
      
      if (!hasChanges) {
        console.log("[NO_CHANGES_DETECTED]", {
          values,
          initialData,
          timestamp: new Date().toISOString()
        });
        toast.info("No changes detected in the form");
        return;
      }
      
      // Show confirmation toast
      toast.info("Submitting coach profile...");

      await onSubmit(values);
      
      // Log successful submission
      console.log("[SUBMISSION_SUCCESS]", {
        values,
        timestamp: new Date().toISOString()
      });
      
      toast.success("Coach profile saved successfully!");
      
    } catch (error) {
      console.error("[COACH_PROFILE_SUBMIT_ERROR]", {
        error,
        formState: {
          isDirty: form.formState.isDirty,
          isValid: form.formState.isValid,
          errors: form.formState.errors
        },
        timestamp: new Date().toISOString()
      });
      toast.error("Failed to save coach profile");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 sm:space-y-6">
          {/* Profile Completion Status */}
          <ProfileCompletion
            completionPercentage={completionPercentage}
            profileStatus={profileStatus || 'DRAFT'}
            canPublish={canPublish}
            missingFields={missingFields}
            missingRequiredFields={missingRequiredFields}
            optionalMissingFields={optionalMissingFields}
            validationMessages={validationMessages}
          />

          <Card className="p-4 sm:p-6 border shadow-sm">
            <div className="mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold">Basic Coach Information</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                This information will be displayed to potential clients looking for a coach.
              </p>
            </div>

            <div className="space-y-4 sm:space-y-8">
              {/* Hourly rate */}
              <CoachRateInfoSection control={form.control} />

              {/* Languages */}
              <LanguagesSection 
                initialLanguages={initialData?.languages || ['en']}
                onLanguagesUpdate={(languages) => {
                  form.setValue('languages', languages);
                }}
              />
            </div>
          </Card>

          {/* Read-only Industry Specialties */}
          <Card className="p-4 sm:p-6 border shadow-sm">
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-2">Industry Specialties</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Your approved coaching specialties are shown below. To request approval for additional specialties, please contact admin@dibs.coach.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(INDUSTRY_SPECIALTIES).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`specialty-${key}`}
                      checked={selectedDomainSpecialties.includes(value as string)}
                      disabled={true}
                      className="cursor-not-allowed"
                    />
                    <Label htmlFor={`specialty-${key}`} className="font-normal">
                      {key.replace(/_/g, ' ')}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <div className="flex justify-end mt-4 sm:mt-8 gap-2">
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="px-6"
              onClick={() => {
                // This will be triggered before form submission
                const values = form.getValues();
                const { hasChanges, changes } = checkFormChanges(values);
                
                console.log("[SAVE_BUTTON_CLICKED]", {
                  hasChanges,
                  changes,
                  formState: {
                    isDirty: form.formState.isDirty,
                    errors: Object.keys(form.formState.errors),
                    isValid: form.formState.isValid
                  },
                  timestamp: new Date().toISOString()
                });
              }}
            >
              {isSubmitting ? (
                <>
                  <span className="mr-2">Saving</span>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                </>
              ) : (
                "Save Coach Profile"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
} 