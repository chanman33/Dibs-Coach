"use client"

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { FormSectionHeader } from "./common/FormSectionHeader";

// Define the schema for the Mortgage profile form
const mortgageProfileSchema = z.object({
  yearsExperience: z.number().min(0, "Years must be 0 or greater"),
  companyName: z.string().min(1, "Company name is required"),
  licenseNumber: z.string().min(1, "License number is required"),
  licenseState: z.string().min(1, "License state is required"),
  nmlsId: z.string().min(1, "NMLS ID is required"),
  loanTypes: z.array(z.string()).min(1, "At least one loan type is required"),
  serviceAreas: z.array(z.string()).min(1, "At least one service area is required"),
  specializations: z.array(z.string()),
  loanVolume: z.number().min(0, "Loan volume must be 0 or greater").optional(),
  loanCount: z.number().min(0, "Loan count must be 0 or greater").optional(),
});

// Type for the form values
type MortgageProfileFormValues = z.infer<typeof mortgageProfileSchema>;

// Type for the initial data
interface MortgageProfileInitialData {
  yearsExperience?: number;
  companyName?: string;
  licenseNumber?: string;
  licenseState?: string;
  nmlsId?: string;
  loanTypes?: string[];
  serviceAreas?: string[];
  specializations?: string[];
  loanVolume?: number;
  loanCount?: number;
}

// Props for the component
interface MortgageProfileFormProps {
  initialData?: MortgageProfileInitialData;
  onSubmit: (values: MortgageProfileFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

export function MortgageProfileForm({
  initialData,
  onSubmit,
  isSubmitting = false,
}: MortgageProfileFormProps) {
  const form = useForm<MortgageProfileFormValues>({
    resolver: zodResolver(mortgageProfileSchema),
    defaultValues: {
      yearsExperience: initialData?.yearsExperience || 0,
      companyName: initialData?.companyName || "",
      licenseNumber: initialData?.licenseNumber || "",
      licenseState: initialData?.licenseState || "",
      nmlsId: initialData?.nmlsId || "",
      loanTypes: initialData?.loanTypes || [],
      serviceAreas: initialData?.serviceAreas || [],
      specializations: initialData?.specializations || [],
      loanVolume: initialData?.loanVolume || 0,
      loanCount: initialData?.loanCount || 0,
    },
  });

  const handleSubmit = async (values: MortgageProfileFormValues) => {
    try {
      await onSubmit(values);
      toast.success("Mortgage profile updated successfully");
    } catch (error) {
      console.error("[MORTGAGE_PROFILE_SUBMIT_ERROR]", error);
      toast.error("Failed to update mortgage profile");
    }
  };

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          <Card className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold">Mortgage Professional Profile</h3>
              <p className="text-sm text-muted-foreground">
                This information will be displayed to potential clients looking for a mortgage coach.
              </p>
            </div>

            <div className="space-y-8">
              <FormSectionHeader
                title="Professional Information"
                description="Your mortgage professional details and experience"
              />
              
              {/* TODO: Add form fields for Mortgage profile */}
              <p className="text-amber-500">Form fields will be implemented here</p>
            </div>
          </Card>

          <div className="flex justify-end mt-8">
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Mortgage Profile"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
} 