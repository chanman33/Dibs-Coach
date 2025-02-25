"use client"

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";
import {
  InvestmentStrategy,
  PropertyType,
  InvestmentStrategyType,
  PropertyTypeValue,
  investorProfileSchema,
  InvestorProfileFormValues,
  InvestorProfileInitialData,
} from "@/utils/types/investor";

// Props for the component
interface InvestorProfileFormProps {
  initialData?: InvestorProfileInitialData;
  onSubmit: (values: InvestorProfileFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

export function InvestorProfileForm({
  initialData,
  onSubmit,
  isSubmitting = false,
}: InvestorProfileFormProps) {
  const form = useForm<InvestorProfileFormValues>({
    resolver: zodResolver(investorProfileSchema),
    defaultValues: {
      yearsExperience: initialData?.yearsExperience || 0,
      companyName: initialData?.companyName || "",
      investmentStrategies: initialData?.investmentStrategies || [],
      minInvestmentAmount: initialData?.minInvestmentAmount || 0,
      maxInvestmentAmount: initialData?.maxInvestmentAmount || 0,
      targetRoi: initialData?.targetRoi || 0,
      preferredPropertyTypes: initialData?.preferredPropertyTypes || [],
      propertiesOwned: initialData?.propertiesOwned || 0,
      totalPortfolioValue: initialData?.totalPortfolioValue || 0,
      completedDeals: initialData?.completedDeals || 0,
      primaryMarket: initialData?.primaryMarket || "",
      targetMarkets: initialData?.targetMarkets || [],
      certifications: initialData?.certifications || [],
      languages: initialData?.languages || [],
    },
  });

  const handleSubmit = async (values: InvestorProfileFormValues) => {
    try {
      await onSubmit(values);
      toast.success("Investor profile updated successfully");
    } catch (error) {
      console.error("[INVESTOR_PROFILE_SUBMIT_ERROR]", error);
      toast.error("Failed to update investor profile");
    }
  };

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          <Card className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold">Investor Profile Information</h3>
              <p className="text-sm text-muted-foreground">
                This information will be displayed to potential clients looking for a real estate investment coach.
              </p>
            </div>

            <div className="space-y-6">
              {/* Professional Experience */}
              <div className="space-y-4">
                <h4 className="text-md font-medium">Professional Experience</h4>
                
                <FormField
                  control={form.control}
                  name="yearsExperience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Years of Experience</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        How many years have you been investing in real estate?
                      </FormDescription>
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
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        Your investment company or business name
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Investment Strategies */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="text-md font-medium">Investment Strategies</h4>
                
                <FormField
                  control={form.control}
                  name="investmentStrategies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Investment Strategies</FormLabel>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {Object.entries(InvestmentStrategy).map(([key, value]) => (
                          <div key={key} className="flex items-center space-x-2">
                            <Checkbox
                              id={`strategy-${key}`}
                              checked={field.value?.includes(value)}
                              onCheckedChange={(checked) => {
                                const currentValues = field.value || [];
                                if (checked) {
                                  field.onChange([...currentValues, value]);
                                } else {
                                  field.onChange(
                                    currentValues.filter((v) => v !== value)
                                  );
                                }
                              }}
                            />
                            <label
                              htmlFor={`strategy-${key}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {value.replace(/_/g, ' ')}
                            </label>
                          </div>
                        ))}
                      </div>
                      <FormDescription>
                        Select all investment strategies you employ
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Investment Criteria */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="text-md font-medium">Investment Criteria</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="minInvestmentAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Investment Amount ($)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Minimum investment amount per deal
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxInvestmentAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Investment Amount ($)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum investment amount per deal
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="targetRoi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target ROI (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          step="0.01" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Your target return on investment percentage
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="preferredPropertyTypes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Property Types</FormLabel>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {Object.entries(PropertyType).map(([key, value]) => (
                          <div key={key} className="flex items-center space-x-2">
                            <Checkbox
                              id={`property-${key}`}
                              checked={field.value?.includes(value)}
                              onCheckedChange={(checked) => {
                                const currentValues = field.value || [];
                                if (checked) {
                                  field.onChange([...currentValues, value]);
                                } else {
                                  field.onChange(
                                    currentValues.filter((v) => v !== value)
                                  );
                                }
                              }}
                            />
                            <label
                              htmlFor={`property-${key}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {value}
                            </label>
                          </div>
                        ))}
                      </div>
                      <FormDescription>
                        Select all property types you invest in
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Portfolio Metrics */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="text-md font-medium">Portfolio Metrics</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="propertiesOwned"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Properties Owned</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Number of properties in your portfolio
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="totalPortfolioValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Portfolio Value ($)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Total value of your investment portfolio
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="completedDeals"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Completed Deals</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Number of deals completed to date
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Geographic Focus */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="text-md font-medium">Geographic Focus</h4>
                
                <FormField
                  control={form.control}
                  name="primaryMarket"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Market</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Greater Los Angeles Area" />
                      </FormControl>
                      <FormDescription>
                        Your primary market of operation
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="targetMarkets"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Markets</FormLabel>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {field.value?.map((market: string) => (
                          <Badge key={market} variant="secondary" className="flex items-center gap-1">
                            {market}
                            <button
                              type="button"
                              onClick={() => {
                                const currentMarkets = field.value || [];
                                field.onChange(currentMarkets.filter((m: string) => m !== market));
                              }}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a target market"
                          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const value = e.currentTarget.value.trim();
                              if (value && !field.value?.includes(value)) {
                                const currentMarkets = field.value || [];
                                field.onChange([...currentMarkets, value]);
                                e.currentTarget.value = "";
                              }
                            }
                          }}
                        />
                      </div>
                      <FormDescription>
                        Markets where you actively invest or are looking to invest
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Certifications and Languages */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="text-md font-medium">Additional Information</h4>
                
                <FormField
                  control={form.control}
                  name="certifications"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Certifications</FormLabel>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {field.value?.map((cert: string) => (
                          <Badge key={cert} variant="secondary" className="flex items-center gap-1">
                            {cert}
                            <button
                              type="button"
                              onClick={() => {
                                const currentCerts = field.value || [];
                                field.onChange(currentCerts.filter((c: string) => c !== cert));
                              }}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a certification"
                          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const value = e.currentTarget.value.trim();
                              if (value && !field.value?.includes(value)) {
                                const currentCerts = field.value || [];
                                field.onChange([...currentCerts, value]);
                                e.currentTarget.value = "";
                              }
                            }
                          }}
                        />
                      </div>
                      <FormDescription>
                        Professional certifications and credentials
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="languages"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Languages</FormLabel>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {field.value?.map((lang: string) => (
                          <Badge key={lang} variant="secondary" className="flex items-center gap-1">
                            {lang}
                            <button
                              type="button"
                              onClick={() => {
                                const currentLangs = field.value || [];
                                field.onChange(currentLangs.filter((l: string) => l !== lang));
                              }}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a language"
                          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const value = e.currentTarget.value.trim();
                              if (value && !field.value?.includes(value)) {
                                const currentLangs = field.value || [];
                                field.onChange([...currentLangs, value]);
                                e.currentTarget.value = "";
                              }
                            }
                          }}
                        />
                      </div>
                      <FormDescription>
                        Languages you are proficient in
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </Card>

          <div className="flex justify-end mt-8">
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Investor Profile"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
} 