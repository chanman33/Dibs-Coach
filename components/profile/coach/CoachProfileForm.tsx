"use client"

import { useState, useEffect, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ProfileCompletion } from "./ProfileCompletion";
import { Card } from "@/components/ui/card";
import { ProfileStatus } from "@/utils/types/coach";
import { z } from "zod";
import type { CoachProfileFormValues } from "../types";
import type { UserInfo } from "../types";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormSectionHeader } from "../common/FormSectionHeader";
import { COACH_SPECIALTIES, SpecialtyCategory, Specialty } from "@/utils/types/coach";
import ReactSelect from 'react-select';
import { selectStyles } from "@/components/ui/select-styles";
import { GroupBase } from 'react-select';

// Memoize the formatCategoryLabel function outside the component
const formatCategoryLabel = (category: string): string => {
  return category
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
};

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

const coachBasicInfoSchema = z.object({
  yearsCoaching: z.number().min(0, "Years of coaching must be 0 or greater"),
  hourlyRate: z.number().min(0, "Hourly rate must be 0 or greater"),
  coachSkills: z.array(z.string()).default([]),
});

type CoachBasicInfoValues = z.infer<typeof coachBasicInfoSchema>;

export interface CoachProfileFormProps {
  initialData?: {
    yearsCoaching?: number;
    hourlyRate?: number;
    coachSkills?: string[];
    [key: string]: any;
  };
  onSubmit: (data: CoachProfileFormValues) => Promise<void>;
  isSubmitting?: boolean;
  profileStatus?: ProfileStatus;
  completionPercentage?: number;
  missingFields?: string[];
  missingRequiredFields?: string[];
  optionalMissingFields?: string[];
  validationMessages?: Record<string, string>;
  canPublish?: boolean;
  userInfo?: UserInfo;
  onSkillsChange?: (skills: string[]) => void;
  saveSkills: (selectedSkills: string[]) => Promise<boolean>;
  onSpecialtiesChange?: (specialties: string[]) => void;
  saveSpecialties?: (specialties: string[]) => Promise<void>;
}

export function CoachProfileForm({
  initialData,
  onSubmit,
  isSubmitting = false,
  profileStatus,
  completionPercentage = 0,
  missingFields = [],
  missingRequiredFields = [],
  optionalMissingFields = [],
  validationMessages = {},
  canPublish = false,
  userInfo,
  onSkillsChange,
  saveSkills,
  onSpecialtiesChange,
  saveSpecialties,
}: CoachProfileFormProps) {
  const form = useForm<CoachBasicInfoValues>({
    resolver: zodResolver(coachBasicInfoSchema),
    defaultValues: {
      yearsCoaching: initialData?.yearsCoaching || 0,
      hourlyRate: initialData?.hourlyRate || 100,
      coachSkills: initialData?.coachSkills || [],
    },
    mode: "onChange",
  });

  // Memoize specialty options
  const specialtyOptions = useMemo(() => 
    Object.entries(COACH_SPECIALTIES).map(([category, specialties]) => ({
      label: formatCategoryLabel(category),
      options: specialties.map(specialty => ({
        value: specialty,
        label: specialty,
        category: category
      }))
    }))
  , []); // Empty dependency array since COACH_SPECIALTIES is constant

  // Memoize the formatGroupLabel function
  const memoizedFormatGroupLabel = useCallback((group: GroupBase<any>) => {
    return (
      <div className="px-3 py-2 bg-slate-50 border-b border-slate-200">
        <span className="font-semibold text-sm text-slate-700">
          {group.label}
        </span>
      </div>
    );
  }, []);

  // Watch skills changes
  useEffect(() => {
    const subscription = form.watch(async (value, { name }) => {
      console.log("[COACH_FORM_WATCH]", {
        changedField: name,
        newValue: value[name as keyof typeof value],
        allSkills: value.coachSkills,
        formState: {
          isDirty: form.formState.isDirty,
          isValid: form.formState.isValid
        },
        timestamp: new Date().toISOString()
      });

      if (name === "coachSkills" && onSkillsChange) {
        const skills = (value.coachSkills || []).filter((s): s is string => typeof s === 'string');
        console.log("[SKILLS_CHANGE_TRIGGERED]", {
          skills,
          timestamp: new Date().toISOString()
        });
        onSkillsChange(skills);

        // Immediately save skills when they change
        if (saveSkills && skills.length > 0) {
          try {
            await saveSkills(skills);
          } catch (error) {
            console.error("[SAVE_SKILLS_ERROR]", {
              error,
              skills,
              timestamp: new Date().toISOString()
            });
          }
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, onSkillsChange, saveSkills]);

  // Log initial form state
  useEffect(() => {
    console.log("[COACH_BASIC_INFO_INITIAL_STATE]", {
      defaultValues: form.formState.defaultValues,
      timestamp: new Date().toISOString(),
      formState: {
        isDirty: form.formState.isDirty,
        isValid: form.formState.isValid,
        errors: form.formState.errors
      }
    });
  }, []);

  const handleSubmit = async (data: CoachBasicInfoValues) => {
    try {
      console.log("[COACH_BASIC_INFO_SUBMIT_START]", {
        submittedData: {
          yearsCoaching: data.yearsCoaching,
          hourlyRate: data.hourlyRate,
          coachSkills: data.coachSkills,
        },
        formState: {
          isDirty: form.formState.isDirty,
          dirtyFields: Object.keys(form.formState.dirtyFields || {}),
          isValid: form.formState.isValid,
          errors: form.formState.errors
        },
        timestamp: new Date().toISOString()
      });

      if (!form.formState.isValid) {
        console.log("[COACH_BASIC_INFO_VALIDATION_FAILED]", {
          errors: form.formState.errors,
          invalidFields: Object.keys(form.formState.errors),
          timestamp: new Date().toISOString()
        });
        toast.error("Please fix validation errors before submitting");
        return;
      }

      const mergedData: CoachProfileFormValues = {
        ...initialData as CoachProfileFormValues,
        yearsCoaching: data.yearsCoaching,
        hourlyRate: data.hourlyRate,
        coachSkills: data.coachSkills,
      };

      // First save skills if they've changed
      if (saveSkills && data.coachSkills) {
        console.log("[SAVING_SKILLS]", {
          skills: data.coachSkills,
          timestamp: new Date().toISOString()
        });
        await saveSkills(data.coachSkills);
      }

      await onSubmit(mergedData);
      form.reset(data);
      
      toast.success("Basic info updated successfully");
    } catch (error) {
      console.error("[COACH_BASIC_INFO_SUBMIT_ERROR]", {
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack
        } : error,
        attemptedData: {
          yearsCoaching: data.yearsCoaching,
          hourlyRate: data.hourlyRate,
          coachSkills: data.coachSkills,
        },
        timestamp: new Date().toISOString()
      });
      toast.error("Failed to update basic info");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Form {...form}>
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            console.log("[COACH_BASIC_INFO_SUBMIT_EVENT]", {
              currentValues: form.getValues(),
              formState: {
                isDirty: form.formState.isDirty,
                dirtyFields: Object.keys(form.formState.dirtyFields || {}),
                isValid: form.formState.isValid,
                errors: form.formState.errors
              },
              timestamp: new Date().toISOString()
            });
            form.handleSubmit(handleSubmit)(e);
          }} 
          className="space-y-4 sm:space-y-6"
        >
          <ProfileCompletion
            completionPercentage={completionPercentage}
            profileStatus={profileStatus || 'DRAFT'}
            canPublish={canPublish}
            missingFields={missingFields}
            missingRequiredFields={missingRequiredFields}
            optionalMissingFields={optionalMissingFields}
            validationMessages={validationMessages}
          />

          {/* Basic Coach Information Card */}
          <Card className="p-4 sm:p-6 border shadow-sm">
            <div className="space-y-4">
              <div className="space-y-2">
                <FormSectionHeader 
                  title="Coaching Experience & Rates" 
                  required 
                  tooltip="Your experience level and pricing information helps set client expectations."
                />
                <p className="text-xs sm:text-sm text-muted-foreground">
                  This information will be displayed to potential clients looking for a coach.
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <FormField
                  control={form.control}
                  name="yearsCoaching"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Years of Coaching Experience</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        How many years have you been coaching professionally?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="hourlyRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hourly Rate (USD)</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value?.toString()}
                          onValueChange={(value) => field.onChange(parseInt(value, 10))}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select hourly rate" />
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
          </Card>

          {/* Coaching Skills Card */}
          <Card className="p-4 sm:p-6 border shadow-sm">
            <div className="space-y-4">
              <div className="space-y-2">
                <FormSectionHeader 
                  title="Coaching Skills" 
                  required 
                  tooltip="Select the specific areas where you can provide expert coaching and guidance."
                />
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Choose skills that best represent your expertise and coaching focus areas.
                </p>
              </div>

              <FormField
                control={form.control}
                name="coachSkills"
                render={({ field: { onChange, value, ...field } }) => {
                  // Memoize the current value to prevent unnecessary re-renders
                  const currentValue = useMemo(() => 
                    specialtyOptions
                      .flatMap(group => group.options)
                      .filter(option => value?.includes(option.value))
                  , [value]);

                  // Memoize the onChange handler
                  const handleChange = useCallback((selected: any) => {
                    const newValues = selected ? selected.map((option: any) => option.value) : [];
                    onChange(newValues);
                  }, [onChange]);

                  return (
                    <FormItem>
                      <FormControl>
                        <ReactSelect
                          {...field}
                          isMulti
                          options={specialtyOptions}
                          styles={selectStyles}
                          value={currentValue}
                          onChange={handleChange}
                          placeholder="Select your coaching skills..."
                          className="w-full"
                          classNamePrefix="coach-skill-select"
                          formatGroupLabel={memoizedFormatGroupLabel}
                          noOptionsMessage={() => "No skills found"}
                          menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                          menuPosition="fixed"
                          isSearchable
                          isClearable
                          blurInputOnSelect={false}
                          closeMenuOnSelect={false}
                        />
                      </FormControl>
                      <FormDescription>
                        You can select multiple skills across different categories.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
} 