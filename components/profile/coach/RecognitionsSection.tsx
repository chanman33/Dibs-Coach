"use client"

import { useState } from "react";
import { ProfessionalRecognition } from "@/utils/types/recognition";
import { RecognitionsTab } from "@/components/profile/coach/RecognitionsTab";
import { updateRecognitions, testDirectDatabaseAccess } from "@/utils/actions/recognition-actions";
import { toast } from "sonner";
import { FormSectionHeader } from "../common/FormSectionHeader";
import { Button } from "@/components/ui/button";



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
      console.log("[RECOGNITION_SECTION_SUBMIT]", {
        recognitionsCount: updatedRecognitions.length,
        recognitions: JSON.stringify(updatedRecognitions, (key, value) => {
          // Handle Date objects for logging
          if (value instanceof Date) {
            return value.toISOString();
          }
          return value;
        }, 2),
        timestamp: new Date().toISOString()
      });
      
      const result = await updateRecognitions(updatedRecognitions);
      
      console.log("[RECOGNITION_SECTION_RESULT]", {
        success: !result.error,
        error: result.error,
        data: result.data,
        timestamp: new Date().toISOString()
      });
      
      if (result.error) {
        toast.error(result.error.message);
        return;
      }
      if (result.data) {
        setRecognitions(result.data.recognitions);
        toast.success("Professional recognitions updated successfully");
      }
    } catch (error) {
      console.error("[RECOGNITION_UPDATE_ERROR]", {
        error,
        recognitionsCount: updatedRecognitions.length,
        timestamp: new Date().toISOString()
      });
      toast.error("Failed to update recognitions");
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-4">
        <FormSectionHeader 
          title="Professional Recognitions" 
          description="Add certifications, awards, or other professional achievements"
        />
        
      </div>
      <RecognitionsTab
        initialRecognitions={recognitions}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        selectedSkills={selectedSpecialties}
      />
    </div>
  );
} 