"use client"

import { Control } from "react-hook-form";
import { FormField, FormItem, FormDescription, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { FormSectionHeader } from "../common/FormSectionHeader";
import { CoachProfileFormValues, DOMAIN_SPECIALTIES } from "../types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DomainSpecialtiesSectionProps {
  control: Control<CoachProfileFormValues>;
  saveSpecialties?: (specialties: string[]) => Promise<boolean>;
  isSubmitting?: boolean;
}

export function DomainSpecialtiesSection({ 
  control, 
  saveSpecialties,
  isSubmitting = false
}: DomainSpecialtiesSectionProps) {
  return (
    <div className="space-y-4 mb-8">
      <div className="flex justify-between items-center">
        <FormSectionHeader
          title="Industry Specialties"
          required
          tooltip="Select the real estate industry segments where you specialize. This helps match you with clients in your field."
        />
      </div>
      
      <div className="mb-4">
        <p className="text-xs sm:text-sm text-muted-foreground">
          Define your coaching specialties and industry expertise to help clients find you.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Select the industries you specialize in. Once you save your selections, you'll unlock additional profile tabs specific to each industry (Realtor Profile, Investor Profile, etc.).
        </p>
      </div>
      
      <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4">
        <div className="flex">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500 h-5 w-5 mr-2 mt-0.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <div>
            <h4 className="text-sm font-medium text-amber-800">Important: Save to Activate Specialties</h4>
            <p className="text-xs text-amber-700 mt-1">
              After selecting your specialties, you must click "Save Coach Profile" at the bottom of this form to activate the corresponding profile tabs. Specialty tabs will only appear after your selections are saved.
            </p>
          </div>
        </div>
      </div>
      
      <FormField
        control={control}
        name="domainSpecialties"
        render={({ field }) => (
          <FormItem>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {DOMAIN_SPECIALTIES.map((specialty) => {
                const isChecked = field.value?.includes(specialty.value);
                return (
                <div 
                  key={specialty.value} 
                  className={`flex items-start space-x-2 p-3 border rounded-md hover:bg-muted/30 transition-colors ${
                    isChecked ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <Checkbox
                    id={`domain-specialty-${specialty.value}`}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      const currentValue = field.value || [];
                      if (checked) {
                        field.onChange([...currentValue, specialty.value]);
                      } else {
                        field.onChange(currentValue.filter(val => val !== specialty.value));
                      }
                    }}
                    className="mt-0.5"
                  />
                  <div className="flex flex-col">
                    <label
                      htmlFor={`domain-specialty-${specialty.value}`}
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      {specialty.label}
                    </label>
                  </div>
                </div>
              )})}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div >
  );
} 