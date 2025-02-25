"use client"

import { Control } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FormSectionHeader } from "../common/FormSectionHeader";
import { CoachProfileFormValues } from "../types";
import { RequiredFieldIndicator } from "../common/RequiredFieldIndicator";

interface CoachRateInfoSectionProps {
  control: Control<CoachProfileFormValues>;
}

export function CoachRateInfoSection({ control }: CoachRateInfoSectionProps) {
  return (
    <div className="space-y-4 mb-8">
      <FormSectionHeader 
        title="Coaching Experience & Rates" 
        required 
        tooltip="Your experience level and pricing information helps set client expectations."
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Years Coaching Field */}
        <FormField
          control={control}
          name="yearsCoaching"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Years of Coaching Experience <RequiredFieldIndicator />
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  {...field}
                  onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                  placeholder="e.g., 5"
                />
              </FormControl>
              <FormDescription>
                How many years have you been coaching professionally?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Hourly Rate Field */}
        <FormField
          control={control}
          name="hourlyRate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Hourly Rate (USD) <RequiredFieldIndicator />
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <span className="text-gray-500">$</span>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    className="pl-7"
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                    placeholder="e.g., 75"
                  />
                </div>
              </FormControl>
              <FormDescription>
                Your standard hourly rate in USD. This can be adjusted for specific sessions.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
} 