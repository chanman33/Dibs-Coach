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

// Define the schema for the Property Manager profile form
const propertyManagerProfileSchema = z.object({
  yearsExperience: z.number().min(0, "Years must be 0 or greater"),
  companyName: z.string().min(1, "Company name is required"),
  licenseNumber: z.string().min(1, "License number is required"),
  licenseState: z.string().min(1, "License state is required"),
  propertyTypes: z.array(z.string()).min(1, "At least one property type is required"),
  serviceAreas: z.array(z.string()).min(1, "At least one service area is required"),
  specializations: z.array(z.string()),
  unitsManaged: z.number().min(0, "Units managed must be 0 or greater").optional(),
  propertiesManaged: z.number().min(0, "Properties managed must be 0 or greater").optional(),
});

// Type for the form values
type PropertyManagerProfileFormValues = z.infer<typeof propertyManagerProfileSchema>;

// Type for the initial data
interface PropertyManagerProfileInitialData {
  yearsExperience?: number;
  companyName?: string;
  licenseNumber?: string;
  licenseState?: string;
  propertyTypes?: string[];
  serviceAreas?: string[];
  specializations?: string[];
  unitsManaged?: number;
  propertiesManaged?: number;
}

// Props for the component
interface PropertyManagerProfileFormProps {
  initialData?: PropertyManagerProfileInitialData;
  onSubmit: (values: PropertyManagerProfileFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

export function PropertyManagerProfileForm({
  initialData,
  onSubmit,
  isSubmitting = false,
}: PropertyManagerProfileFormProps) {
  const form = useForm<PropertyManagerProfileFormValues>({
    resolver: zodResolver(propertyManagerProfileSchema),
    defaultValues: {
      yearsExperience: initialData?.yearsExperience || 0,
      companyName: initialData?.companyName || "",
      licenseNumber: initialData?.licenseNumber || "",
      licenseState: initialData?.licenseState || "",
      propertyTypes: initialData?.propertyTypes || [],
      serviceAreas: initialData?.serviceAreas || [],
      specializations: initialData?.specializations || [],
      unitsManaged: initialData?.unitsManaged || 0,
      propertiesManaged: initialData?.propertiesManaged || 0,
    },
  });

  const handleSubmit = async (values: PropertyManagerProfileFormValues) => {
    try {
      await onSubmit(values);
      toast.success("Property Manager profile updated successfully");
    } catch (error) {
      console.error("[PROPERTY_MANAGER_PROFILE_SUBMIT_ERROR]", error);
      toast.error("Failed to update property manager profile");
    }
  };

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          <Card className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold">Property Manager Profile</h3>
              <p className="text-sm text-muted-foreground">
                This information will be displayed to potential clients looking for a property management coach.
              </p>
            </div>

            <div className="space-y-8">
              <FormSectionHeader
                title="Professional Information"
                description="Your property management details and experience"
              />
              
              {/* TODO: Add form fields for Property Manager profile */}
              <p className="text-amber-500">Form fields will be implemented here</p>
            </div>
          </Card>

          <div className="flex justify-end mt-8">
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Property Manager Profile"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
} 