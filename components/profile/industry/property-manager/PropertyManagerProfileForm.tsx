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
import { FormSectionHeader } from "../../common/FormSectionHeader";

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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Years of Experience */}
                <FormField
                  control={form.control}
                  name="yearsExperience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Years of Experience</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Company Name */}
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your company name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* License Number */}
                <FormField
                  control={form.control}
                  name="licenseNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your license number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* License State */}
                <FormField
                  control={form.control}
                  name="licenseState"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License State</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., CA" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormSectionHeader
                title="Property Management Information"
                description="Details about your property management services"
              />

              {/* Property Types */}
              <FormField
                control={form.control}
                name="propertyTypes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Types</FormLabel>
                    <FormDescription>
                      Enter the types of properties you manage (comma-separated)
                    </FormDescription>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Residential, Commercial, Multi-family, Single-family" 
                        value={field.value?.join(", ") || ""}
                        onChange={(e) => {
                          const propertyTypes = e.target.value
                            .split(",")
                            .map(type => type.trim())
                            .filter(Boolean);
                          field.onChange(propertyTypes);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Service Areas */}
              <FormField
                control={form.control}
                name="serviceAreas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Areas</FormLabel>
                    <FormDescription>
                      Enter the geographic areas you serve (comma-separated)
                    </FormDescription>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Los Angeles County, Orange County" 
                        value={field.value?.join(", ") || ""}
                        onChange={(e) => {
                          const areas = e.target.value
                            .split(",")
                            .map(area => area.trim())
                            .filter(Boolean);
                          field.onChange(areas);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Specializations */}
              <FormField
                control={form.control}
                name="specializations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specializations</FormLabel>
                    <FormDescription>
                      Enter your property management specializations (comma-separated)
                    </FormDescription>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Luxury Properties, Vacation Rentals, HOA Management" 
                        value={field.value?.join(", ") || ""}
                        onChange={(e) => {
                          const specializations = e.target.value
                            .split(",")
                            .map(spec => spec.trim())
                            .filter(Boolean);
                          field.onChange(specializations);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormSectionHeader
                title="Performance Metrics"
                description="Your property management business metrics"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Units Managed */}
                <FormField
                  control={form.control}
                  name="unitsManaged"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Units Managed</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Properties Managed */}
                <FormField
                  control={form.control}
                  name="propertiesManaged"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Properties Managed</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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