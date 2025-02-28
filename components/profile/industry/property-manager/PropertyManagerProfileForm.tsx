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
import { PropertyType } from "@prisma/client";
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import { selectStyles } from "@/components/ui/select-styles";
import { GroupBase } from 'react-select';
import { useMemo, useCallback } from "react";

// Define the schema for the Property Manager profile form
const propertyManagerProfileSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  licenseNumber: z.string().optional(),
  yearsExperience: z.number().min(0).max(100),
  propertyTypes: z.array(z.nativeEnum(PropertyType)),
  specializations: z.array(z.string()),
  serviceAreas: z.array(z.string()),
  licensedStates: z.array(z.string()),
  totalUnitsManaged: z.number().min(0),
  averageUnitSize: z.number().min(0),
  totalSquareFeetManaged: z.number().min(0),
  monthlyTransactions: z.number().min(0),
  totalPortfolioValue: z.number().min(0),
  averageOccupancyRate: z.number().min(0).max(100),
  certifications: z.array(z.string()),
  languages: z.array(z.string()),
  bio: z.string().max(1000),
});

// Type for the form values
type PropertyManagerProfileData = z.infer<typeof propertyManagerProfileSchema>;

// Type for the initial data
interface PropertyManagerProfileInitialData {
  yearsExperience?: number;
  companyName?: string;
  licenseNumber?: string;
  propertyTypes?: PropertyType[];
  specializations?: string[];
  serviceAreas?: string[];
  licensedStates?: string[];
  totalUnitsManaged?: number;
  averageUnitSize?: number;
  totalSquareFeetManaged?: number;
  monthlyTransactions?: number;
  totalPortfolioValue?: number;
  averageOccupancyRate?: number;
  certifications?: string[];
  languages?: string[];
  bio?: string;
}

// Props for the component
interface PropertyManagerProfileFormProps {
  initialData?: PropertyManagerProfileInitialData;
  onSubmit: (data: PropertyManagerProfileData) => Promise<void>;
  isSubmitting?: boolean;
}

export function PropertyManagerProfileForm({
  initialData,
  onSubmit,
  isSubmitting = false,
}: PropertyManagerProfileFormProps) {
  const form = useForm<PropertyManagerProfileData>({
    resolver: zodResolver(propertyManagerProfileSchema),
    defaultValues: {
      companyName: initialData?.companyName || "",
      licenseNumber: initialData?.licenseNumber || "",
      yearsExperience: initialData?.yearsExperience || 0,
      propertyTypes: initialData?.propertyTypes || [],
      specializations: initialData?.specializations || [],
      serviceAreas: initialData?.serviceAreas || [],
      licensedStates: initialData?.licensedStates || [],
      totalUnitsManaged: initialData?.totalUnitsManaged || 0,
      averageUnitSize: initialData?.averageUnitSize || 0,
      totalSquareFeetManaged: initialData?.totalSquareFeetManaged || 0,
      monthlyTransactions: initialData?.monthlyTransactions || 0,
      totalPortfolioValue: initialData?.totalPortfolioValue || 0,
      averageOccupancyRate: initialData?.averageOccupancyRate || 0,
      certifications: initialData?.certifications || [],
      languages: initialData?.languages || [],
      bio: initialData?.bio || "",
    },
  });

  const handleSubmit = async (data: PropertyManagerProfileData) => {
    try {
      await onSubmit(data);
      toast.success("Property Manager profile updated successfully");
    } catch (error) {
      console.error("[PROPERTY_MANAGER_PROFILE_SUBMIT_ERROR]", error);
      toast.error("Failed to update property manager profile");
    }
  };

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

  // Memoize property type options
  const propertyTypeOptions = useMemo(() => 
    Object.values(PropertyType).map(type => ({
      value: type,
      label: type.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')
    }))
  , []);

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
                      <FormLabel>License Number (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your license number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
              </div>

              <FormSectionHeader
                title="Property Management Information"
                description="Details about your property management services"
              />

              {/* Property Types */}
              <FormField
                control={form.control}
                name="propertyTypes"
                render={({ field: { onChange, value, ...field } }) => {
                  const currentValue = useMemo(() => 
                    propertyTypeOptions.filter(option => value?.includes(option.value))
                  , [value]);

                  return (
                    <FormItem>
                      <FormLabel>Property Types</FormLabel>
                      <FormDescription>
                        Enter the types of properties you manage (comma-separated)
                      </FormDescription>
                      <FormControl>
                        <Select
                          {...field}
                          isMulti
                          options={propertyTypeOptions}
                          styles={selectStyles}
                          value={currentValue}
                          onChange={(selected) => {
                            onChange(selected ? selected.map((option: any) => option.value) : []);
                          }}
                          placeholder="Select property types..."
                          className="w-full"
                          classNamePrefix="property-type-select"
                          formatGroupLabel={memoizedFormatGroupLabel}
                          menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                          menuPosition="fixed"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              {/* Service Areas */}
              <FormField
                control={form.control}
                name="serviceAreas"
                render={({ field: { onChange, value, ...field } }) => {
                  const currentValue = useMemo(() => 
                    value?.map(v => ({ value: v, label: v })) || []
                  , [value]);

                  return (
                    <FormItem>
                      <FormLabel>Service Areas</FormLabel>
                      <FormDescription>
                        Enter the geographic areas you serve (comma-separated)
                      </FormDescription>
                      <FormControl>
                        <CreatableSelect
                          {...field}
                          isMulti
                          options={currentValue}
                          styles={selectStyles}
                          value={currentValue}
                          onChange={(selected) => {
                            onChange(selected ? selected.map((option: any) => option.value) : []);
                          }}
                          placeholder="Enter service areas..."
                          className="w-full"
                          classNamePrefix="service-area-select"
                          formatGroupLabel={memoizedFormatGroupLabel}
                          menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                          menuPosition="fixed"
                          isClearable
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              {/* Specializations */}
              <FormField
                control={form.control}
                name="specializations"
                render={({ field: { onChange, value, ...field } }) => {
                  const currentValue = useMemo(() => 
                    value?.map(v => ({ value: v, label: v })) || []
                  , [value]);

                  return (
                    <FormItem>
                      <FormLabel>Specializations</FormLabel>
                      <FormDescription>
                        Enter your property management specializations (comma-separated)
                      </FormDescription>
                      <FormControl>
                        <CreatableSelect
                          {...field}
                          isMulti
                          options={currentValue}
                          styles={selectStyles}
                          value={currentValue}
                          onChange={(selected) => {
                            onChange(selected ? selected.map((option: any) => option.value) : []);
                          }}
                          placeholder="Enter specializations..."
                          className="w-full"
                          classNamePrefix="specialization-select"
                          formatGroupLabel={memoizedFormatGroupLabel}
                          menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                          menuPosition="fixed"
                          isClearable
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormSectionHeader
                title="Performance Metrics"
                description="Your property management business metrics"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Units Managed */}
                <FormField
                  control={form.control}
                  name="totalUnitsManaged"
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

                {/* Average Unit Size */}
                <FormField
                  control={form.control}
                  name="averageUnitSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Average Unit Size (sq ft)</FormLabel>
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

                {/* Total Square Feet Managed */}
                <FormField
                  control={form.control}
                  name="totalSquareFeetManaged"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Square Feet Managed</FormLabel>
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

                {/* Monthly Transactions */}
                <FormField
                  control={form.control}
                  name="monthlyTransactions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Transactions</FormLabel>
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

                {/* Total Portfolio Value */}
                <FormField
                  control={form.control}
                  name="totalPortfolioValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Portfolio Value</FormLabel>
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

                {/* Average Occupancy Rate */}
                <FormField
                  control={form.control}
                  name="averageOccupancyRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Average Occupancy Rate (%)</FormLabel>
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