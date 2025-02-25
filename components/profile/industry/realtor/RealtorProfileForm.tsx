"use client"

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

// Define the schema for the Realtor profile form
const realtorProfileSchema = z.object({
  yearsExperience: z.number().min(0, "Years must be 0 or greater"),
  brokerageName: z.string().min(1, "Brokerage name is required"),
  licenseNumber: z.string().min(1, "License number is required"),
  licenseState: z.string().min(1, "License state is required"),
  marketingAreas: z.array(z.string()).min(1, "At least one marketing area is required"),
  specializations: z.array(z.string()),
  transactionVolume: z.number().min(0, "Transaction volume must be 0 or greater").optional(),
  transactionCount: z.number().min(0, "Transaction count must be 0 or greater").optional(),
});

// Type for the form values
type RealtorProfileFormValues = z.infer<typeof realtorProfileSchema>;

// Type for the initial data
interface RealtorProfileInitialData {
  yearsExperience?: number;
  brokerageName?: string;
  licenseNumber?: string;
  licenseState?: string;
  marketingAreas?: string[];
  specializations?: string[];
  transactionVolume?: number;
  transactionCount?: number;
}

// Props for the component
interface RealtorProfileFormProps {
  initialData?: RealtorProfileInitialData;
  onSubmit: (values: RealtorProfileFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

export function RealtorProfileForm({
  initialData,
  onSubmit,
  isSubmitting = false,
}: RealtorProfileFormProps) {
  const form = useForm<RealtorProfileFormValues>({
    resolver: zodResolver(realtorProfileSchema),
    defaultValues: {
      yearsExperience: initialData?.yearsExperience || 0,
      brokerageName: initialData?.brokerageName || "",
      licenseNumber: initialData?.licenseNumber || "",
      licenseState: initialData?.licenseState || "",
      marketingAreas: initialData?.marketingAreas || [],
      specializations: initialData?.specializations || [],
      transactionVolume: initialData?.transactionVolume || 0,
      transactionCount: initialData?.transactionCount || 0,
    },
  });

  const handleSubmit = async (values: RealtorProfileFormValues) => {
    try {
      await onSubmit(values);
      toast.success("Realtor profile updated successfully");
    } catch (error) {
      console.error("[REALTOR_PROFILE_SUBMIT_ERROR]", error);
      toast.error("Failed to update realtor profile");
    }
  };

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          <Card className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold">Realtor Profile Information</h3>
              <p className="text-sm text-muted-foreground">
                This information will be displayed to potential clients looking for a real estate coach.
              </p>
            </div>

            <div className="space-y-8">
              {/* TODO: Add form fields for Realtor profile */}
              <p className="text-amber-500">Form fields will be implemented here</p>
            </div>
          </Card>

          <div className="flex justify-end mt-8">
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Realtor Profile"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
} 