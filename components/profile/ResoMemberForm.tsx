"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useResoMember, ResoMemberSchema, type ResoMemberData } from "@/utils/hooks/useResoMember";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { MultiSelect } from "@/components/ui/multi-select";
import { toast } from "sonner";

const DESIGNATION_OPTIONS = [
  { label: "CRS (Certified Residential Specialist)", value: "CRS" },
  { label: "GRI (Graduate, REALTOR® Institute)", value: "GRI" },
  { label: "ABR (Accredited Buyer's Representative)", value: "ABR" },
  { label: "SRS (Seller Representative Specialist)", value: "SRS" },
  { label: "SRES (Seniors Real Estate Specialist)", value: "SRES" },
  { label: "Other", value: "OTHER" },
];

const STATUS_OPTIONS = [
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
  { label: "Pending", value: "PENDING" },
  { label: "Suspended", value: "SUSPENDED" },
];

export function ResoMemberForm() {
  const { data, loading, error, fetchResoMember, updateResoMember } = useResoMember();
  
  const form = useForm<ResoMemberData>({
    resolver: zodResolver(ResoMemberSchema),
    defaultValues: {
      memberKey: "",
      memberStatus: "ACTIVE",
      designations: [],
      licenseNumber: "",
      companyName: "",
      phoneNumber: "",
    },
  });

  useEffect(() => {
    fetchResoMember();
  }, []);

  useEffect(() => {
    if (data) {
      form.reset(data);
    }
  }, [data, form]);

  const onSubmit = async (values: ResoMemberData) => {
    try {
      await updateResoMember(values);
      toast.success("RESO member information updated successfully");
    } catch (err) {
      toast.error("Failed to update RESO member information");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="memberKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>MLS ID (Member Key)</FormLabel>
              <FormControl>
                <Input placeholder="Enter your MLS ID" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="memberStatus"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Member Status</FormLabel>
              <FormControl>
                <select
                  className="w-full p-2 border rounded"
                  {...field}
                >
                  {STATUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="designations"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Designations</FormLabel>
              <FormControl>
                <MultiSelect
                  options={DESIGNATION_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select your designations"
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
              <FormLabel>License Number</FormLabel>
              <FormControl>
                <Input placeholder="Enter your license number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="Enter your phone number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </Form>
  );
} 