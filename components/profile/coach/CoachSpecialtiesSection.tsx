"use client"

import { COACH_SPECIALTIES, SpecialtyCategory, Specialty } from "@/utils/types/coach";
import { Control } from "react-hook-form";
import { FormField, FormItem, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { FormSectionHeader } from "../common/FormSectionHeader";
import Select from 'react-select';
import { selectStyles } from "@/components/ui/select-styles";
import { CoachProfileFormValues } from "../types";
import { GroupBase } from 'react-select';

interface CoachSpecialtiesSectionProps {
  control: Control<{
    yearsCoaching: number;
    hourlyRate: number;
    specialties: string[];
  }>;
}

export function CoachSpecialtiesSection({ control }: CoachSpecialtiesSectionProps) {
  // Convert COACH_SPECIALTIES into options format for react-select
  const specialtyOptions = Object.entries(COACH_SPECIALTIES).map(([category, specialties]) => ({
    label: formatCategoryLabel(category),
    options: specialties.map(specialty => ({
      value: specialty,
      label: specialty,
      category: category
    }))
  }));

  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="specialties"
        render={({ field: { onChange, value, ...field } }) => (
          <FormItem>
            <FormControl>
              <Select
                {...field}
                isMulti
                options={specialtyOptions}
                styles={selectStyles}
                value={specialtyOptions
                  .flatMap(group => group.options)
                  .filter(option => value?.includes(option.value))
                }
                onChange={(selected) => {
                  onChange(selected ? selected.map(option => option.value) : []);
                }}
                placeholder="Select your coaching specialties..."
                className="w-full"
                classNamePrefix="coach-specialty-select"
                formatGroupLabel={formatGroupLabel}
                noOptionsMessage={() => "No specialties found"}
              />
            </FormControl>
            <FormDescription>
              Choose specialties that best represent your expertise and coaching focus areas.
              You can select multiple specialties across different categories.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

// Helper function to format category labels
function formatCategoryLabel(category: string): string {
  return category
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

// Custom group label component
function formatGroupLabel(group: GroupBase<any>) {
  return (
    <div className="px-3 py-2 bg-slate-50 border-b border-slate-200">
      <span className="font-semibold text-sm text-slate-700">
        {group.label}
      </span>
    </div>
  );
} 