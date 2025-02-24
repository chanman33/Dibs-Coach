"use client"

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ProfileCompletionAlert } from "@/components/coaching/ProfileCompletionAlert";
import { CoachSpecialtiesSection } from "./sections/CoachSpecialtiesSection";
import { DomainSpecialtiesSection } from "./sections/DomainSpecialtiesSection";
import { CoachRateInfoSection } from "./sections/CoachRateInfoSection";
import { LanguagesSection } from "./sections/LanguagesSection";
import { RecognitionsSection } from "./sections/RecognitionsSection";
import { 
  CoachProfileFormProps, 
  CoachProfileFormValues, 
  coachProfileFormSchema 
} from "./types";

export function CoachProfileForm({
  initialData,
  onSubmit,
  isSubmitting = false,
  profileStatus,
  completionPercentage = 0,
  missingFields = [],
  canPublish = false,
  userInfo
}: CoachProfileFormProps) {
  // Initialize form with default values
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
      professionalRecognitions: initialData?.professionalRecognitions || []
    }
  });

  // Handle form submission
  const handleFormSubmit = (values: CoachProfileFormValues) => {
    try {
      onSubmit(values);
    } catch (error) {
      console.error("[COACH_PROFILE_FORM_ERROR]", error);
      toast.error("Failed to save profile changes");
    }
  };

  // Scroll to form section when clicking "Edit Profile" button
  const handleScrollToForm = () => {
    const formElement = document.getElementById("coach-profile-form");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile completion alert */}
      {profileStatus && (
        <ProfileCompletionAlert
          profileStatus={profileStatus}
          completionPercentage={completionPercentage}
          missingFields={missingFields}
          canPublish={canPublish}
          onEdit={handleScrollToForm}
        />
      )}

      {/* Coach profile form */}
      <Form {...form}>
        <form 
          id="coach-profile-form"
          onSubmit={form.handleSubmit(handleFormSubmit)} 
          className="space-y-8"
        >
          {/* Coaching Specialties */}
          <CoachSpecialtiesSection control={form.control} />
          
          {/* Industry Specialties */}
          <DomainSpecialtiesSection control={form.control} />
          
          {/* Coaching Experience & Rates */}
          <CoachRateInfoSection control={form.control} />
          
          {/* Languages */}
          <LanguagesSection control={form.control} />
          
          {/* Professional Recognitions */}
          <RecognitionsSection 
            control={form.control} 
            setValue={form.setValue} 
            watch={form.watch} 
          />
          
          {/* Form Actions */}
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="w-full md:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  Saving...
                </>
              ) : "Save Changes"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
} 