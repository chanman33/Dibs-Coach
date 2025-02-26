"use client"

import { Control } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FormSectionHeader } from "../common/FormSectionHeader";
import { CoachProfileFormValues } from "../types";
import { RequiredFieldIndicator } from "../common/RequiredFieldIndicator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const HOURLY_RATES = [
  { value: 100, label: "$100" },
  { value: 150, label: "$150" },
  { value: 200, label: "$200" },
  { value: 250, label: "$250" },
  { value: 300, label: "$300" },
  { value: 400, label: "$400" },
  { value: 500, label: "$500" },
  { value: 750, label: "$750" },
  { value: 1000, label: "$1,000" },
  { value: 1500, label: "$1,500" },
  { value: 2000, label: "$2,000" },
  { value: 2500, label: "$2,500" },
  { value: 3000, label: "$3,000" }
];

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
                Hourly Rate <RequiredFieldIndicator />
              </FormLabel>
              <FormControl>
                <Select
                  value={field.value?.toString()}
                  onValueChange={(value) => field.onChange(parseInt(value, 10))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue defaultValue="" placeholder="Select hourly rate" />
                  </SelectTrigger>
                  <SelectContent>
                    {HOURLY_RATES.map((rate) => (
                      <SelectItem key={rate.value} value={rate.value.toString()}>
                        {rate.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormDescription>
                Set your hourly coaching rate. This rate will be visible to potential clients.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
} 