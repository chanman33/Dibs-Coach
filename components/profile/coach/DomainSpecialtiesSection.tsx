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
      <div className="mb-4">
        <p className="text-xs sm:text-sm text-muted-foreground">
          Define your coaching specialties and industry expertise to help clients find you.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Select the industries you specialize in. Once you save your selections, you'll unlock additional profile tabs specific to each industry (Realtor Profile, Investor Profile, etc.).
        </p>
      </div>
      <FormField
        control={control}
        name="domainSpecialties"
        render={({ field }) => (
          <FormItem>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {DOMAIN_SPECIALTIES.map((specialty) => (
                <div key={specialty.value} className="flex items-start space-x-2 p-3 border rounded-md hover:bg-muted/30 transition-colors">
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
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div >
  );
} 