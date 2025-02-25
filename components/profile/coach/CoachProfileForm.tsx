"use client"

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ProfileCompletionAlert } from "@/components/coaching/ProfileCompletionAlert";
import { toast } from "sonner";
import { CoachSpecialtiesSection } from "./CoachSpecialtiesSection";
import { CoachRateInfoSection } from "./CoachRateInfoSection";
import { DomainSpecialtiesSection } from "./DomainSpecialtiesSection";
import { LanguagesSection } from "./LanguagesSection";
import { RecognitionsSection } from "./RecognitionsSection";
import { coachProfileFormSchema, CoachProfileFormValues, CoachProfileInitialData, UserInfo } from "../types";
import { Card } from "@/components/ui/card";
import { ProfileStatus } from "@/utils/types/coach";

export interface CoachProfileFormProps {
  initialData?: CoachProfileInitialData;
  onSubmit: (values: CoachProfileFormValues) => void;
  isSubmitting?: boolean;
  profileStatus?: ProfileStatus;
  completionPercentage?: number;
  missingFields?: string[];
  canPublish?: boolean;
  userInfo?: UserInfo;
  onSpecialtiesChange?: (specialties: string[]) => void;
  saveSpecialties?: (specialties: string[]) => Promise<boolean>;
}

export function CoachProfileForm({
  initialData,
  onSubmit,
  isSubmitting = false,
  profileStatus,
  completionPercentage = 0,
  missingFields = [],
  canPublish = false,
  userInfo,
  onSpecialtiesChange,
  saveSpecialties
}: CoachProfileFormProps) {
  const [selectedDomainSpecialties, setSelectedDomainSpecialties] = useState<string[]>(
    initialData?.domainSpecialties || []
  );

  const form = useForm<CoachProfileFormValues>({
    resolver: zodResolver(coachProfileFormSchema),
    defaultValues: {
      specialties: initialData?.specialties || [],
      yearsCoaching: initialData?.yearsCoaching || 0,
      hourlyRate: initialData?.hourlyRate || 0,
      domainSpecialties: initialData?.domainSpecialties || [],
      calendlyUrl: initialData?.calendlyUrl || "",
      eventTypeUrl: initialData?.eventTypeUrl || "",
      defaultDuration: initialData?.defaultDuration || 60,
      minimumDuration: initialData?.minimumDuration || 30,
      maximumDuration: initialData?.maximumDuration || 120,
      allowCustomDuration: initialData?.allowCustomDuration || false,
      certifications: initialData?.certifications || [],
      languages: initialData?.languages || [],
      marketExpertise: initialData?.marketExpertise || "",
      professionalRecognitions: initialData?.professionalRecognitions || [],
    },
  });

  // Watch domain specialties for parent component notification
  const domainSpecialties = form.watch("domainSpecialties");

  useEffect(() => {
    setSelectedDomainSpecialties(domainSpecialties);
    if (onSpecialtiesChange) {
      onSpecialtiesChange(domainSpecialties);
    }
  }, [domainSpecialties, onSpecialtiesChange]);

  const handleSubmit = async (values: CoachProfileFormValues) => {
    // First save the coach profile data
    onSubmit(values);
    
    // Then save the specialties to update domain expertise
    if (saveSpecialties) {
      await saveSpecialties(values.domainSpecialties);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 sm:space-y-6">
          {/* Information alert about specialties */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-2">
            <div className="flex">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 h-5 w-5 mr-2 mt-0.5">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 16v-4"></path>
                <path d="M12 8h.01"></path>
              </svg>
              <div>
                <h4 className="text-sm font-medium text-blue-800">Profile Structure Based on Specialties</h4>
                <p className="text-xs text-blue-700 mt-1">
                  Your profile tabs will adapt based on your selected industry specialties. After saving your selections, you'll see additional tabs for each specialty (e.g., Realtor Profile, Investor Profile) where you can add industry-specific information.
                </p>
              </div>
            </div>
          </div>

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
              <LanguagesSection control={form.control} />
            </div>
          </Card>

          <Card className="p-4 sm:p-6 border shadow-sm">


            <div className="space-y-4 sm:space-y-8">
              {/* Industry specialties - Moved to the top */}
              <div>
                <DomainSpecialtiesSection control={form.control} />
              </div>

              {/* Coach type and experience */}
              {/* <div>
                <div className="mb-4">
                  <h4 className="text-sm font-medium">Coaching Specialties</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Select the types of coaching you offer and your experience level.
                  </p>
                </div>
                <CoachSpecialtiesSection control={form.control} />
              </div> */}
            </div>
          </Card>

          <div className="flex justify-end mt-4 sm:mt-8">
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="px-6"
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