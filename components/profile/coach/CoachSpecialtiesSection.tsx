"use client"

import { COACH_SPECIALTIES } from "@/utils/types/coach";
import { Control } from "react-hook-form";
import { FormField, FormItem, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormSectionHeader } from "../common/FormSectionHeader";
import { Checkbox } from "@/components/ui/checkbox";
import { CoachProfileFormValues } from "../types";

interface CoachSpecialtiesSectionProps {
  control: Control<CoachProfileFormValues>;
}

export function CoachSpecialtiesSection({ control }: CoachSpecialtiesSectionProps) {
  return (
    <div className="space-y-4 mb-8">
      <FormSectionHeader 
        title="Coaching Specialties" 
        required 
        tooltip="Describe your specific coaching areas in detail. This helps potential clients understand your expertise."
      />
      
      <FormField
        control={control}
        name="specialties"
        render={({ field }) => (
          <FormItem>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {COACH_SPECIALTIES.map((specialty) => (
                <div key={specialty} className="flex items-center space-x-2">
                  <Checkbox
                    id={`specialty-${specialty}`}
                    checked={field.value?.includes(specialty)}
                    onCheckedChange={(checked) => {
                      const currentValue = field.value || [];
                      if (checked) {
                        field.onChange([...currentValue, specialty]);
                      } else {
                        field.onChange(currentValue.filter(val => val !== specialty));
                      }
                    }}
                  />
                  <label
                    htmlFor={`specialty-${specialty}`}
                    className="text-sm font-medium leading-none"
                  >
                    {specialty}
                  </label>
                </div>
              ))}
            </div>
            <FormDescription>
              Select all coaching specialties that apply to your expertise.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
} 