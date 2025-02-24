"use client"

import { Control } from "react-hook-form";
import { FormField, FormItem, FormDescription, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { FormSectionHeader } from "../common/FormSectionHeader";
import { CoachProfileFormValues, DOMAIN_SPECIALTIES } from "../types";
import { Badge } from "@/components/ui/badge";

interface DomainSpecialtiesSectionProps {
  control: Control<CoachProfileFormValues>;
}

export function DomainSpecialtiesSection({ control }: DomainSpecialtiesSectionProps) {
  return (
    <div className="space-y-4 mb-8">
      <FormSectionHeader 
        title="Industry Specialties" 
        required 
        tooltip="Select the real estate industry segments where you specialize. This helps match you with clients in your field."
      />
      
      <FormField
        control={control}
        name="domainSpecialties"
        render={({ field }) => (
          <FormItem>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {DOMAIN_SPECIALTIES.map((specialty) => (
                <div key={specialty.value} className="flex items-start space-x-2">
                  <Checkbox
                    id={`domain-specialty-${specialty.value}`}
                    checked={field.value?.includes(specialty.value)}
                    onCheckedChange={(checked) => {
                      const currentValue = field.value || [];
                      if (checked) {
                        field.onChange([...currentValue, specialty.value]);
                      } else {
                        field.onChange(currentValue.filter(val => val !== specialty.value));
                      }
                    }}
                  />
                  <div className="flex flex-col">
                    <label
                      htmlFor={`domain-specialty-${specialty.value}`}
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      {specialty.label}
                    </label>
                    {specialty.value === "REALTOR" && (
                      <Badge variant="outline" className="mt-1 text-xs">Most Popular</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <FormDescription className="mt-2">
              Select the real estate domains where you have expertise. This helps clients find coaches with relevant experience.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
} 