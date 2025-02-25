"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelect } from "@/components/ui/multi-select";
import { toast } from "sonner";
import { FormField } from "@/components/ui/form-field";
import { Controller } from "react-hook-form";

const PROPERTY_TYPES = [
  "Office",
  "Retail",
  "Industrial",
  "Multifamily",
  "Mixed-Use",
  "Land",
  "Hotel",
  "Medical",
  "Self-Storage",
  "Other"
] as const;

const DEAL_TYPES = [
  "Sales",
  "Leasing",
  "Investment",
  "Development",
  "Property Management",
  "Consulting"
] as const;

const commercialFormSchema = z.object({
  companyName: z.string().optional(),
  licenseNumber: z.string().optional(),
  yearsExperience: z.number().min(0).optional(),
  specializations: z.array(z.string()),
  certifications: z.array(z.string()),
  languages: z.array(z.string()),
  propertyTypes: z.array(z.enum(PROPERTY_TYPES)),
  dealTypes: z.array(z.enum(DEAL_TYPES)),
  typicalDealSize: z.number().optional(),
  totalTransactionVolume: z.number().optional(),
  completedDeals: z.number().min(0).optional(),
  primaryMarket: z.string().optional(),
  serviceAreas: z.array(z.string()),
});

type CommercialFormValues = z.infer<typeof commercialFormSchema>;

interface CommercialFormProps {
  initialData?: Partial<CommercialFormValues>;
  onSubmit: (data: CommercialFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

export default function CommercialForm({ initialData, onSubmit, isSubmitting = false }: CommercialFormProps) {
  const form = useForm<CommercialFormValues>({
    resolver: zodResolver(commercialFormSchema),
    defaultValues: {
      companyName: initialData?.companyName || "",
      licenseNumber: initialData?.licenseNumber || "",
      yearsExperience: initialData?.yearsExperience || 0,
      specializations: initialData?.specializations || [],
      certifications: initialData?.certifications || [],
      languages: initialData?.languages || [],
      propertyTypes: initialData?.propertyTypes || [],
      dealTypes: initialData?.dealTypes || [],
      typicalDealSize: initialData?.typicalDealSize || 0,
      totalTransactionVolume: initialData?.totalTransactionVolume || 0,
      completedDeals: initialData?.completedDeals || 0,
      primaryMarket: initialData?.primaryMarket || "",
      serviceAreas: initialData?.serviceAreas || [],
    },
  });

  const handleSubmit = async (data: CommercialFormValues) => {
    try {
      await onSubmit(data);
      toast.success("Commercial profile updated successfully");
    } catch (error) {
      console.error("[COMMERCIAL_FORM_ERROR]", {
        error,
        timestamp: new Date().toISOString()
      });
      toast.error("Failed to update commercial profile");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Commercial Real Estate Profile</CardTitle>
            <CardDescription>
              Manage your commercial real estate professional information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Company Name">
                <Input
                  {...form.register("companyName")}
                  placeholder="Enter your company name"
                />
              </FormField>
              <FormField label="License Number">
                <Input
                  {...form.register("licenseNumber")}
                  placeholder="Enter your license number"
                />
              </FormField>
              <FormField label="Years of Experience">
                <Input
                  type="number"
                  {...form.register("yearsExperience", { valueAsNumber: true })}
                  placeholder="Enter years of experience"
                />
              </FormField>
            </div>

            {/* Property Types & Deal Types */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Property Types">
                <Controller
                  control={form.control}
                  name="propertyTypes"
                  render={({ field }) => (
                    <MultiSelect
                      options={PROPERTY_TYPES.map(type => ({ label: type, value: type }))}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select property types"
                    />
                  )}
                />
              </FormField>
              <FormField label="Deal Types">
                <Controller
                  control={form.control}
                  name="dealTypes"
                  render={({ field }) => (
                    <MultiSelect
                      options={DEAL_TYPES.map(type => ({ label: type, value: type }))}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select deal types"
                    />
                  )}
                />
              </FormField>
            </div>

            {/* Transaction History */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField label="Typical Deal Size ($)">
                <Input
                  type="number"
                  {...form.register("typicalDealSize", { valueAsNumber: true })}
                  placeholder="Enter typical deal size"
                />
              </FormField>
              <FormField label="Total Transaction Volume ($)">
                <Input
                  type="number"
                  {...form.register("totalTransactionVolume", { valueAsNumber: true })}
                  placeholder="Enter total volume"
                />
              </FormField>
              <FormField label="Completed Deals">
                <Input
                  type="number"
                  {...form.register("completedDeals", { valueAsNumber: true })}
                  placeholder="Enter number of deals"
                />
              </FormField>
            </div>

            {/* Geographic Focus */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Primary Market">
                <Input
                  {...form.register("primaryMarket")}
                  placeholder="Enter primary market"
                />
              </FormField>
              <FormField label="Service Areas">
                <Controller
                  control={form.control}
                  name="serviceAreas"
                  render={({ field }) => (
                    <MultiSelect
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Add service areas"
                      creatable
                    />
                  )}
                />
              </FormField>
            </div>

            {/* Professional Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField label="Specializations">
                <Controller
                  control={form.control}
                  name="specializations"
                  render={({ field }) => (
                    <MultiSelect
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Add specializations"
                      creatable
                    />
                  )}
                />
              </FormField>
              <FormField label="Certifications">
                <Controller
                  control={form.control}
                  name="certifications"
                  render={({ field }) => (
                    <MultiSelect
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Add certifications"
                      creatable
                    />
                  )}
                />
              </FormField>
              <FormField label="Languages">
                <Controller
                  control={form.control}
                  name="languages"
                  render={({ field }) => (
                    <MultiSelect
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Add languages"
                      creatable
                    />
                  )}
                />
              </FormField>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </Form>
  );
} 