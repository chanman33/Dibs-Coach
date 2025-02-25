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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { FormSectionHeader } from "../../common/FormSectionHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Define the insurance types based on the schema
const INSURANCE_TYPES = [
  { value: "PROPERTY_CASUALTY", label: "Property & Casualty" },
  { value: "TITLE_INSURANCE", label: "Title Insurance" },
  { value: "ERRORS_OMISSIONS", label: "Errors & Omissions" },
  { value: "LIABILITY", label: "Liability" },
  { value: "HOMEOWNERS", label: "Homeowners" },
  { value: "FLOOD", label: "Flood" },
  { value: "OTHER", label: "Other" },
];

// Define the schema for the Insurance profile form
const insuranceProfileSchema = z.object({
  yearsExperience: z.number().min(0, "Years must be 0 or greater"),
  companyName: z.string().min(1, "Company name is required"),
  licenseNumber: z.string().min(1, "License number is required"),
  insuranceTypes: z.array(z.string()).min(1, "At least one insurance type is required"),
  specializations: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
  policiesIssued: z.number().min(0, "Policies issued must be 0 or greater").optional(),
  totalPremiumVolume: z.number().min(0, "Premium volume must be 0 or greater").optional(),
  claimProcessingTime: z.number().min(0, "Claim processing time must be 0 or greater").optional(),
  primaryMarket: z.string().optional(),
  licensedStates: z.array(z.string()).min(1, "At least one licensed state is required"),
});

// Type for the form values
type InsuranceProfileFormValues = z.infer<typeof insuranceProfileSchema>;

// Type for the initial data
interface InsuranceProfileInitialData {
  yearsExperience?: number;
  companyName?: string;
  licenseNumber?: string;
  insuranceTypes?: string[];
  specializations?: string[];
  certifications?: string[];
  languages?: string[];
  policiesIssued?: number;
  totalPremiumVolume?: number;
  claimProcessingTime?: number;
  primaryMarket?: string;
  licensedStates?: string[];
}

// Props for the component
interface InsuranceProfileFormProps {
  initialData?: InsuranceProfileInitialData;
  onSubmit: (values: InsuranceProfileFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

export function InsuranceProfileForm({
  initialData,
  onSubmit,
  isSubmitting = false,
}: InsuranceProfileFormProps) {
  const form = useForm<InsuranceProfileFormValues>({
    resolver: zodResolver(insuranceProfileSchema),
    defaultValues: {
      yearsExperience: initialData?.yearsExperience || 0,
      companyName: initialData?.companyName || "",
      licenseNumber: initialData?.licenseNumber || "",
      insuranceTypes: initialData?.insuranceTypes || [],
      specializations: initialData?.specializations || [],
      certifications: initialData?.certifications || [],
      languages: initialData?.languages || [],
      policiesIssued: initialData?.policiesIssued || 0,
      totalPremiumVolume: initialData?.totalPremiumVolume || 0,
      claimProcessingTime: initialData?.claimProcessingTime || 0,
      primaryMarket: initialData?.primaryMarket || "",
      licensedStates: initialData?.licensedStates || [],
    },
  });

  const handleSubmit = async (values: InsuranceProfileFormValues) => {
    try {
      await onSubmit(values);
      toast.success("Insurance profile updated successfully");
    } catch (error) {
      console.error("[INSURANCE_PROFILE_SUBMIT_ERROR]", error);
      toast.error("Failed to update insurance profile");
    }
  };

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          <Card className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold">Insurance Professional Profile</h3>
              <p className="text-sm text-muted-foreground">
                This information will be displayed to potential clients looking for an insurance coach.
              </p>
            </div>

            <div className="space-y-8">
              <FormSectionHeader
                title="Professional Information"
                description="Your insurance professional details and experience"
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

                {/* Primary Market */}
                <FormField
                  control={form.control}
                  name="primaryMarket"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Market</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Los Angeles, CA" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Insurance Types */}
              <FormField
                control={form.control}
                name="insuranceTypes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Insurance Types</FormLabel>
                    <FormDescription>
                      Select the types of insurance you specialize in
                    </FormDescription>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                      {INSURANCE_TYPES.map((type) => (
                        <FormItem
                          key={type.value}
                          className="flex flex-row items-start space-x-3 space-y-0 p-3 border rounded-md"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(type.value)}
                              onCheckedChange={(checked) => {
                                const currentValue = field.value || [];
                                if (checked) {
                                  field.onChange([...currentValue, type.value]);
                                } else {
                                  field.onChange(currentValue.filter(val => val !== type.value));
                                }
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            {type.label}
                          </FormLabel>
                        </FormItem>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Licensed States */}
              <FormField
                control={form.control}
                name="licensedStates"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Licensed States</FormLabel>
                    <FormDescription>
                      Enter the states where you are licensed to sell insurance (comma-separated)
                    </FormDescription>
                    <FormControl>
                      <Input 
                        placeholder="e.g., CA, NY, TX" 
                        value={field.value?.join(", ") || ""}
                        onChange={(e) => {
                          const states = e.target.value
                            .split(",")
                            .map(state => state.trim())
                            .filter(Boolean);
                          field.onChange(states);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormSectionHeader
                title="Performance Metrics"
                description="Your insurance business performance metrics"
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Policies Issued */}
                <FormField
                  control={form.control}
                  name="policiesIssued"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Policies Issued (Annual)</FormLabel>
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

                {/* Total Premium Volume */}
                <FormField
                  control={form.control}
                  name="totalPremiumVolume"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Premium Volume ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Claim Processing Time */}
                <FormField
                  control={form.control}
                  name="claimProcessingTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Avg. Claim Processing Time (days)</FormLabel>
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

              <FormSectionHeader
                title="Additional Information"
                description="Other relevant professional details"
              />

              {/* Languages */}
              <FormField
                control={form.control}
                name="languages"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Languages</FormLabel>
                    <FormDescription>
                      Enter languages you speak (comma-separated)
                    </FormDescription>
                    <FormControl>
                      <Input 
                        placeholder="e.g., English, Spanish, French" 
                        value={field.value?.join(", ") || ""}
                        onChange={(e) => {
                          const languages = e.target.value
                            .split(",")
                            .map(lang => lang.trim())
                            .filter(Boolean);
                          field.onChange(languages);
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
                      Enter your insurance specializations (comma-separated)
                    </FormDescription>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Commercial Property, High-Value Homes, Flood Insurance" 
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

              {/* Certifications */}
              <FormField
                control={form.control}
                name="certifications"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Certifications</FormLabel>
                    <FormDescription>
                      Enter your professional certifications (comma-separated)
                    </FormDescription>
                    <FormControl>
                      <Input 
                        placeholder="e.g., CPCU, CIC, ARM" 
                        value={field.value?.join(", ") || ""}
                        onChange={(e) => {
                          const certifications = e.target.value
                            .split(",")
                            .map(cert => cert.trim())
                            .filter(Boolean);
                          field.onChange(certifications);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Card>

          <div className="flex justify-end mt-8">
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Insurance Profile"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
