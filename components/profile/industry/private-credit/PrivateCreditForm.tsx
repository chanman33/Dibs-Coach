"use client";

import { useForm, Controller } from "react-hook-form";
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

const LOAN_TYPES = [
  "Bridge",
  "Construction",
  "Value-Add",
  "Acquisition",
  "Refinance",
  "Mezzanine",
  "Preferred Equity",
  "Other"
] as const;

const privateCreditFormSchema = z.object({
  companyName: z.string().optional(),
  licenseNumber: z.string().optional(),
  yearsExperience: z.number().min(0).optional(),
  specializations: z.array(z.string()),
  certifications: z.array(z.string()),
  languages: z.array(z.string()),
  minLoanAmount: z.number().optional(),
  maxLoanAmount: z.number().optional(),
  typicalTermLength: z.number().optional(),
  interestRateRange: z.object({
    min: z.number(),
    max: z.number()
  }).optional(),
  loanTypes: z.array(z.enum(LOAN_TYPES)),
  totalLoanVolume: z.number().optional(),
  activeLoans: z.number().min(0).optional(),
  primaryMarket: z.string().optional(),
  licensedStates: z.array(z.string()),
});

type PrivateCreditFormValues = z.infer<typeof privateCreditFormSchema>;

interface PrivateCreditFormProps {
  initialData?: Partial<PrivateCreditFormValues>;
  onSubmit: (data: PrivateCreditFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

export default function PrivateCreditForm({ initialData, onSubmit, isSubmitting = false }: PrivateCreditFormProps) {
  const form = useForm<PrivateCreditFormValues>({
    resolver: zodResolver(privateCreditFormSchema),
    defaultValues: {
      companyName: initialData?.companyName || "",
      licenseNumber: initialData?.licenseNumber || "",
      yearsExperience: initialData?.yearsExperience || 0,
      specializations: initialData?.specializations || [],
      certifications: initialData?.certifications || [],
      languages: initialData?.languages || [],
      minLoanAmount: initialData?.minLoanAmount || 0,
      maxLoanAmount: initialData?.maxLoanAmount || 0,
      typicalTermLength: initialData?.typicalTermLength || 0,
      interestRateRange: initialData?.interestRateRange || { min: 0, max: 0 },
      loanTypes: initialData?.loanTypes || [],
      totalLoanVolume: initialData?.totalLoanVolume || 0,
      activeLoans: initialData?.activeLoans || 0,
      primaryMarket: initialData?.primaryMarket || "",
      licensedStates: initialData?.licensedStates || [],
    },
  });

  const handleSubmit = async (data: PrivateCreditFormValues) => {
    try {
      await onSubmit(data);
      toast.success("Private credit profile updated successfully");
    } catch (error) {
      console.error("[PRIVATE_CREDIT_FORM_ERROR]", {
        error,
        timestamp: new Date().toISOString()
      });
      toast.error("Failed to update private credit profile");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Private Credit Profile</CardTitle>
            <CardDescription>
              Manage your private credit lending professional information
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

            {/* Lending Parameters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField label="Minimum Loan Amount ($)">
                <Input
                  type="number"
                  {...form.register("minLoanAmount", { valueAsNumber: true })}
                  placeholder="Enter minimum loan amount"
                />
              </FormField>
              <FormField label="Maximum Loan Amount ($)">
                <Input
                  type="number"
                  {...form.register("maxLoanAmount", { valueAsNumber: true })}
                  placeholder="Enter maximum loan amount"
                />
              </FormField>
              <FormField label="Typical Term Length (months)">
                <Input
                  type="number"
                  {...form.register("typicalTermLength", { valueAsNumber: true })}
                  placeholder="Enter typical term length"
                />
              </FormField>
            </div>

            {/* Interest Rate Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Minimum Interest Rate (%)">
                <Input
                  type="number"
                  step="0.01"
                  {...form.register("interestRateRange.min", { valueAsNumber: true })}
                  placeholder="Enter minimum rate"
                />
              </FormField>
              <FormField label="Maximum Interest Rate (%)">
                <Input
                  type="number"
                  step="0.01"
                  {...form.register("interestRateRange.max", { valueAsNumber: true })}
                  placeholder="Enter maximum rate"
                />
              </FormField>
            </div>

            {/* Loan Types */}
            <div className="grid grid-cols-1 gap-6">
              <FormField label="Loan Types">
                <Controller
                  control={form.control}
                  name="loanTypes"
                  render={({ field }) => (
                    <MultiSelect
                      options={LOAN_TYPES.map(type => ({ label: type, value: type }))}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select loan types"
                    />
                  )}
                />
              </FormField>
            </div>

            {/* Portfolio Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField label="Total Loan Volume ($)">
                <Input
                  type="number"
                  {...form.register("totalLoanVolume", { valueAsNumber: true })}
                  placeholder="Enter total volume"
                />
              </FormField>
              <FormField label="Active Loans">
                <Input
                  type="number"
                  {...form.register("activeLoans", { valueAsNumber: true })}
                  placeholder="Enter number of active loans"
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
              <FormField label="Licensed States">
                <Controller
                  control={form.control}
                  name="licensedStates"
                  render={({ field }) => (
                    <MultiSelect
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Add licensed states"
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