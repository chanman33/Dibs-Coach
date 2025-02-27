"use client"

import { useState } from "react";
import { ProfessionalRecognition } from "@/utils/types/recognition";
import { RecognitionsTab } from "@/components/profile/coach/RecognitionsTab";
import { updateRecognitions } from "@/utils/actions/recognition-actions";
import { toast } from "sonner";
import { FormSectionHeader } from "../common/FormSectionHeader";

interface RecognitionsSectionProps {
  initialRecognitions?: ProfessionalRecognition[];
  selectedSpecialties?: string[];
  className?: string;
}

export function RecognitionsSection({ 
  initialRecognitions = [], 
  selectedSpecialties = [],
  className 
}: RecognitionsSectionProps) {
  const [recognitions, setRecognitions] = useState<ProfessionalRecognition[]>(initialRecognitions);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (updatedRecognitions: ProfessionalRecognition[]) => {
    setIsSubmitting(true);
    try {
      const result = await updateRecognitions(updatedRecognitions);
      if (result.error) {
        toast.error(result.error.message);
        return;
      }
      if (result.data) {
        setRecognitions(result.data.recognitions);
        toast.success("Professional recognitions updated successfully");
      }
    } catch (error) {
      console.error("[RECOGNITION_UPDATE_ERROR]", error);
      toast.error("Failed to update recognitions");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={className}>
      <FormSectionHeader 
        title="Professional Recognitions" 
        description="Add certifications, awards, or other professional achievements"
      />
      <RecognitionsTab
        initialRecognitions={recognitions}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        selectedSpecialties={selectedSpecialties}
      />
    </div>
  );
} 