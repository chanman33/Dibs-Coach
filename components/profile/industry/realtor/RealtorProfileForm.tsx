   "use client"

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

// US States for dropdown
const US_STATES = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
  { value: "DC", label: "District of Columbia" },
];

// Realtor specializations
const REALTOR_SPECIALIZATIONS = [
  { id: "residential", label: "Residential" },
  { id: "commercial", label: "Commercial" },
  { id: "luxury", label: "Luxury" },
  { id: "investment", label: "Investment Properties" },
  { id: "first-time-buyers", label: "First-Time Buyers" },
  { id: "relocation", label: "Relocation" },
  { id: "short-sales", label: "Short Sales" },
  { id: "foreclosures", label: "Foreclosures" },
  { id: "vacation-homes", label: "Vacation Homes" },
  { id: "land", label: "Land" },
  { id: "property-management", label: "Property Management" },
  { id: "international", label: "International" },
];

// Define the schema for the Realtor profile form
const realtorProfileSchema = z.object({
  yearsExperience: z.coerce.number().min(0, "Years must be 0 or greater"),
  brokerageName: z.string().min(1, "Brokerage name is required"),
  licenseNumber: z.string().min(1, "License number is required"),
  licenseState: z.string().min(1, "License state is required"),
  marketingAreas: z.array(z.string()).min(1, "At least one marketing area is required"),
  specializations: z.array(z.string()),
  transactionVolume: z.coerce.number().min(0, "Transaction volume must be 0 or greater").optional(),
  transactionCount: z.coerce.number().min(0, "Transaction count must be 0 or greater").optional(),
});

// Type for the form values
type RealtorProfileFormValues = z.infer<typeof realtorProfileSchema>;

// Type for the initial data
interface RealtorProfileInitialData {
  yearsExperience?: number;
  brokerageName?: string;
  licenseNumber?: string;
  licenseState?: string;
  marketingAreas?: string[];
  specializations?: string[];
  transactionVolume?: number;
  transactionCount?: number;
}

// Props for the component
interface RealtorProfileFormProps {
  initialData?: RealtorProfileInitialData;
  onSubmit: (values: RealtorProfileFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

export function RealtorProfileForm({
  initialData,
  onSubmit,
  isSubmitting = false,
}: RealtorProfileFormProps) {
  const [newMarketingArea, setNewMarketingArea] = useState("");

  const form = useForm<RealtorProfileFormValues>({
    resolver: zodResolver(realtorProfileSchema),
    defaultValues: {
      yearsExperience: initialData?.yearsExperience || 0,
      brokerageName: initialData?.brokerageName || "",
      licenseNumber: initialData?.licenseNumber || "",
      licenseState: initialData?.licenseState || "",
      marketingAreas: initialData?.marketingAreas || [],
      specializations: initialData?.specializations || [],
      transactionVolume: initialData?.transactionVolume || 0,
      transactionCount: initialData?.transactionCount || 0,
    },
  });

  const handleSubmit = async (values: RealtorProfileFormValues) => {
    try {
      await onSubmit(values);
      toast.success("Realtor profile updated successfully");
    } catch (error) {
      console.error("[REALTOR_PROFILE_SUBMIT_ERROR]", error);
      toast.error("Failed to update realtor profile");
    }
  };

  const addMarketingArea = () => {
    if (!newMarketingArea.trim()) return;
    
    const currentAreas = form.getValues("marketingAreas") || [];
    if (!currentAreas.includes(newMarketingArea.trim())) {
      form.setValue("marketingAreas", [...currentAreas, newMarketingArea.trim()]);
      setNewMarketingArea("");
    }
  };

  const removeMarketingArea = (area: string) => {
    const currentAreas = form.getValues("marketingAreas") || [];
    form.setValue(
      "marketingAreas",
      currentAreas.filter((a) => a !== area)
    );
  };

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          <Card className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold">Realtor Profile Information</h3>
              <p className="text-sm text-muted-foreground">
                This information will be displayed to potential clients looking for a real estate coach.
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
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormDescription>
                        How many years have you been working as a real estate agent?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="brokerageName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brokerage Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        The name of your current brokerage
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Licensing Information */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="text-md font-medium">Licensing Information</h4>
                
                <FormField
                  control={form.control}
                  name="licenseNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        Your real estate license number
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="licenseState"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License State</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a state" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {US_STATES.map((state) => (
                            <SelectItem key={state.value} value={state.value}>
                              {state.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The state where your license is issued
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Market Information */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="text-md font-medium">Market Information</h4>
                
                <FormField
                  control={form.control}
                  name="marketingAreas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marketing Areas</FormLabel>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {field.value.map((area) => (
                          <Badge key={area} variant="secondary" className="flex items-center gap-1">
                            {area}
                            <button
                              type="button"
                              onClick={() => removeMarketingArea(area)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={newMarketingArea}
                          onChange={(e) => setNewMarketingArea(e.target.value)}
                          placeholder="Add a marketing area"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addMarketingArea();
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addMarketingArea}
                        >
                          Add
                        </Button>
                      </div>
                      <FormDescription>
                        Areas where you primarily work (cities, neighborhoods, etc.)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Specializations */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="text-md font-medium">Specializations</h4>
                
                <FormField
                  control={form.control}
                  name="specializations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Areas of Specialization</FormLabel>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {REALTOR_SPECIALIZATIONS.map((specialization) => (
                          <div key={specialization.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`specialization-${specialization.id}`}
                              checked={field.value?.includes(specialization.id)}
                              onCheckedChange={(checked) => {
                                const currentValues = field.value || [];
                                if (checked) {
                                  field.onChange([...currentValues, specialization.id]);
                                } else {
                                  field.onChange(
                                    currentValues.filter((value) => value !== specialization.id)
                                  );
                                }
                              }}
                            />
                            <label
                              htmlFor={`specialization-${specialization.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {specialization.label}
                            </label>
                          </div>
                        ))}
                      </div>
                      <FormDescription>
                        Select all areas where you specialize
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Performance Metrics */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="text-md font-medium">Performance Metrics</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="transactionVolume"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Annual Transaction Volume ($)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormDescription>
                          Your approximate annual sales volume
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="transactionCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Annual Transaction Count</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormDescription>
                          Number of transactions you complete annually
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          </Card>

          <div className="flex justify-end mt-8">
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="mr-2">Saving</span>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                </>
              ) : (
                "Save Realtor Profile"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
} 