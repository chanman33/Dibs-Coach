"use client"

import { useState, useEffect } from "react";
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
import { CoachSpecialtiesSection } from "./CoachSpecialtiesSection";
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

// New focused schema for just the fields this component manages
const coachBasicInfoSchema = z.object({
  yearsCoaching: z.number().min(0, "Years of coaching must be 0 or greater"),
  hourlyRate: z.number().min(0, "Hourly rate must be 0 or greater"),
  specialties: z.array(z.string()).default([]),
});

type CoachBasicInfoValues = z.infer<typeof coachBasicInfoSchema>;

// Update the props interface to be more specific about what this component handles
export interface CoachProfileFormProps {
  initialData?: {
    yearsCoaching?: number;
    hourlyRate?: number;
    specialties?: string[];
    [key: string]: any; // Allow other fields to exist but we don't care about them here
  };
  onSubmit: (data: CoachProfileFormValues) => Promise<void>; // Keep original type for compatibility
  isSubmitting?: boolean;
  profileStatus?: ProfileStatus;
  completionPercentage?: number;
  missingFields?: string[];
  missingRequiredFields?: string[];
  optionalMissingFields?: string[];
  validationMessages?: Record<string, string>;
  canPublish?: boolean;
  userInfo?: UserInfo;
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
  onSpecialtiesChange,
  saveSpecialties,
}: CoachProfileFormProps) {
  const form = useForm<CoachBasicInfoValues>({
    resolver: zodResolver(coachBasicInfoSchema),
    defaultValues: {
      yearsCoaching: initialData?.yearsCoaching || 0,
      hourlyRate: initialData?.hourlyRate || 100,
      specialties: initialData?.specialties || [],
    },
    mode: "onChange",
  });

  // Watch specialties changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "specialties" && onSpecialtiesChange) {
        const specialties = value.specialties || [];
        onSpecialtiesChange(specialties.filter((s): s is string => s !== undefined));
      }
    });
    return () => subscription.unsubscribe();
  }, [form, onSpecialtiesChange]);

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
          specialties: data.specialties,
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

      console.log("[COACH_BASIC_INFO_CALLING_ONSUBMIT]", {
        onSubmitExists: !!onSubmit,
        timestamp: new Date().toISOString()
      });

      // Merge the new data with initialData to preserve other fields
      const mergedData: CoachProfileFormValues = {
        ...initialData as CoachProfileFormValues,
        yearsCoaching: data.yearsCoaching,
        hourlyRate: data.hourlyRate,
        specialties: data.specialties,
      };

      await onSubmit(mergedData);
      
      // Reset form state after successful submission
      form.reset(data);
      
      console.log("[COACH_BASIC_INFO_SUBMIT_SUCCESS]", {
        submittedData: {
          yearsCoaching: data.yearsCoaching,
          hourlyRate: data.hourlyRate,
          specialties: data.specialties,
        },
        timestamp: new Date().toISOString()
      });
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
          specialties: data.specialties,
        },
        timestamp: new Date().toISOString()
      });
      toast.error("Failed to update basic info");
    }
  };

  // Add logging to track form state changes
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      console.log("[COACH_BASIC_INFO_FIELD_CHANGE]", {
        field: name,
        type,
        newValue: value[name as keyof typeof value],
        allFormValues: value,
        formState: {
          isDirty: form.formState.isDirty,
          dirtyFields: Object.keys(form.formState.dirtyFields || {}),
          isValid: form.formState.isValid,
          errors: form.formState.errors
        },
        timestamp: new Date().toISOString()
      });
    });
    return () => subscription.unsubscribe();
  }, [form]);

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
          {/* Profile Completion Status */}
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

          {/* Add Coaching Specialties Card */}
          <Card className="p-4 sm:p-6 border shadow-sm">
            <div className="mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold">Coaching Specialties</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Select the specific areas where you can provide expert coaching and guidance.
              </p>
            </div>
            <CoachSpecialtiesSection control={form.control} />
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