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

                {/* NMLS ID */}
                <FormField
                  control={form.control}
                  name="nmlsId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NMLS ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your NMLS ID" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormSectionHeader
                title="Loan Information"
                description="Details about your mortgage lending services"
              />

              {/* Loan Types */}
              <FormField
                control={form.control}
                name="loanTypes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loan Types</FormLabel>
                    <FormDescription>
                      Enter the types of loans you specialize in (comma-separated)
                    </FormDescription>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Conventional, FHA, VA, Jumbo" 
                        value={field.value?.join(", ") || ""}
                        onChange={(e) => {
                          const loanTypes = e.target.value
                            .split(",")
                            .map(type => type.trim())
                            .filter(Boolean);
                          field.onChange(loanTypes);
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
                      Enter your mortgage specializations (comma-separated)
                    </FormDescription>
                    <FormControl>
                      <Input 
                        placeholder="e.g., First-time Homebuyers, Investment Properties, Refinancing" 
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
                description="Your mortgage business performance metrics"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Loan Volume */}
                <FormField
                  control={form.control}
                  name="loanVolume"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Annual Loan Volume ($)</FormLabel>
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

                {/* Loan Count */}
                <FormField
                  control={form.control}
                  name="loanCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Annual Loan Count</FormLabel>
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
              {isSubmitting ? "Saving..." : "Save Mortgage Profile"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
} 