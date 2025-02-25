"use client"

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

// Define the schema for the Investor profile form
const investorProfileSchema = z.object({
  yearsExperience: z.number().min(0, "Years must be 0 or greater"),
  investmentTypes: z.array(z.string()).min(1, "At least one investment type is required"),
  portfolioSize: z.number().min(0, "Portfolio size must be 0 or greater").optional(),
  marketingAreas: z.array(z.string()).min(1, "At least one marketing area is required"),
  specializations: z.array(z.string()),
  successStories: z.array(z.object({
    title: z.string(),
    description: z.string(),
    year: z.number(),
    isVisible: z.boolean().default(true),
  })).optional(),
});

// Type for the form values
type InvestorProfileFormValues = z.infer<typeof investorProfileSchema>;

// Type for the initial data
interface InvestorProfileInitialData {
  yearsExperience?: number;
  investmentTypes?: string[];
  portfolioSize?: number;
  marketingAreas?: string[];
  specializations?: string[];
  successStories?: Array<{
    title: string;
    description: string;
    year: number;
    isVisible: boolean;
  }>;
}

// Props for the component
interface InvestorProfileFormProps {
  initialData?: InvestorProfileInitialData;
  onSubmit: (values: InvestorProfileFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

export function InvestorProfileForm({
  initialData,
  onSubmit,
  isSubmitting = false,
}: InvestorProfileFormProps) {
  const form = useForm<InvestorProfileFormValues>({
    resolver: zodResolver(investorProfileSchema),
    defaultValues: {
      yearsExperience: initialData?.yearsExperience || 0,
      investmentTypes: initialData?.investmentTypes || [],
      portfolioSize: initialData?.portfolioSize || 0,
      marketingAreas: initialData?.marketingAreas || [],
      specializations: initialData?.specializations || [],
      successStories: initialData?.successStories || [],
    },
  });

  const handleSubmit = async (values: InvestorProfileFormValues) => {
    try {
      await onSubmit(values);
      toast.success("Investor profile updated successfully");
    } catch (error) {
      console.error("[INVESTOR_PROFILE_SUBMIT_ERROR]", error);
      toast.error("Failed to update investor profile");
    }
  };

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          <Card className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold">Investor Profile Information</h3>
              <p className="text-sm text-muted-foreground">
                This information will be displayed to potential clients looking for a real estate investment coach.
              </p>
            </div>

            <div className="space-y-8">
              {/* TODO: Add form fields for Investor profile */}
              <p className="text-amber-500">Form fields will be implemented here</p>
            </div>
          </Card>

          <div className="flex justify-end mt-8">
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Investor Profile"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
} 