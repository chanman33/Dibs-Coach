"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Form schema
const titleEscrowProfileSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  yearsExperience: z.number().min(0, "Years must be 0 or greater"),
  licenseNumber: z.string().optional(),
  servicesOffered: z.array(z.string()).default([]),
  serviceAreas: z.string().optional(),
  specializations: z.array(z.string()).default([]),
  description: z.string().optional(),
});

type TitleEscrowProfileFormValues = z.infer<typeof titleEscrowProfileSchema>;

interface TitleEscrowProfileFormProps {
  initialData?: Partial<TitleEscrowProfileFormValues>;
  onSubmit: (values: TitleEscrowProfileFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

export default function TitleEscrowProfileForm({
  initialData,
  onSubmit,
  isSubmitting = false,
}: TitleEscrowProfileFormProps) {
  // Form setup
  const form = useForm<TitleEscrowProfileFormValues>({
    resolver: zodResolver(titleEscrowProfileSchema),
    defaultValues: {
      companyName: initialData?.companyName || "",
      yearsExperience: initialData?.yearsExperience || 0,
      licenseNumber: initialData?.licenseNumber || "",
      servicesOffered: initialData?.servicesOffered || [],
      serviceAreas: initialData?.serviceAreas || "",
      specializations: initialData?.specializations || [],
      description: initialData?.description || "",
    },
  });

  // Handle form submission
  const handleSubmit = async (values: TitleEscrowProfileFormValues) => {
    try {
      await onSubmit(values);
    } catch (error) {
      console.error("[TITLE_ESCROW_FORM_ERROR]", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Title & Escrow Profile</CardTitle>
        <CardDescription>
          Provide information about your title and escrow services
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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

            <FormField
              control={form.control}
              name="serviceAreas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Areas (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Los Angeles, Orange County" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your title and escrow services"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Title & Escrow Profile"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
