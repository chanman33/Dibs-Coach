"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { ConnectCalendly } from "@/components/calendly/ConnectCalendly"
import { X } from "lucide-react"

const coachProfileSchema = z.object({
  // Professional Information
  primarySpecialization: z.enum([
    "RESIDENTIAL",
    "COMMERCIAL",
    "LUXURY",
    "INVESTMENT",
    "NEW_CONSTRUCTION",
    "FORECLOSURES",
    "INTERNATIONAL",
  ], {
    required_error: "Please select a primary specialization",
  }),
  secondarySpecializations: z.string().min(1, "Please list your secondary specializations"),
  yearsExperience: z.string().min(1, "Years of experience is required"),
  certifications: z.string().optional(),
  languages: z.string().min(1, "Please list languages you speak"),
  marketExpertise: z.string().min(1, "Please describe your market expertise"),
  
  // Coaching Specific
  yearsCoaching: z.number().min(0, "Must be 0 or greater"),
  hourlyRate: z.number().min(0, "Must be 0 or greater"),
  
  // Session Configuration
  defaultDuration: z.number().min(15, "Minimum duration is 15 minutes"),
  minimumDuration: z.number().min(15, "Minimum duration is 15 minutes"),
  maximumDuration: z.number().min(15, "Minimum duration is 15 minutes"),
  allowCustomDuration: z.boolean(),
  calendlyUrl: z.string().optional(),
  eventTypeUrl: z.string().optional(),

  // Achievements & Awards
  achievements: z.array(z.object({
    title: z.string().min(1, "Achievement title is required"),
    year: z.string().min(1, "Year is required"),
    description: z.string().optional(),
  })),
  awards: z.array(z.object({
    name: z.string().min(1, "Award name is required"),
    year: z.string().min(1, "Year is required"),
    organization: z.string().min(1, "Organization is required"),
    description: z.string().optional(),
  })),
})

type CoachProfileFormValues = z.infer<typeof coachProfileSchema>

interface CoachProfileFormProps {
  initialData?: Partial<CoachProfileFormValues>;
  onSubmit: (data: CoachProfileFormValues) => Promise<void>;
}

export function CoachProfileForm({ initialData, onSubmit }: CoachProfileFormProps) {
  const form = useForm<CoachProfileFormValues>({
    resolver: zodResolver(coachProfileSchema),
    defaultValues: {
      // Professional Information
      primarySpecialization: initialData?.primarySpecialization,
      secondarySpecializations: initialData?.secondarySpecializations || "",
      yearsExperience: initialData?.yearsExperience || "",
      certifications: initialData?.certifications || "",
      languages: initialData?.languages || "",
      marketExpertise: initialData?.marketExpertise || "",
      
      // Coaching Specific
      yearsCoaching: initialData?.yearsCoaching || 0,
      hourlyRate: initialData?.hourlyRate || 0,
      
      // Session Configuration
      defaultDuration: initialData?.defaultDuration || 60,
      minimumDuration: initialData?.minimumDuration || 30,
      maximumDuration: initialData?.maximumDuration || 120,
      allowCustomDuration: initialData?.allowCustomDuration || false,
      calendlyUrl: initialData?.calendlyUrl || "",
      eventTypeUrl: initialData?.eventTypeUrl || "",

      // Achievements & Awards
      achievements: initialData?.achievements || [],
      awards: initialData?.awards || [],
    },
  })

  const addAchievement = () => {
    const currentAchievements = form.getValues("achievements")
    form.setValue("achievements", [
      ...currentAchievements,
      { title: "", year: "", description: "" },
    ])
  }

  const removeAchievement = (index: number) => {
    const currentAchievements = form.getValues("achievements")
    form.setValue("achievements", currentAchievements.filter((_, i) => i !== index))
  }

  const addAward = () => {
    const currentAwards = form.getValues("awards")
    form.setValue("awards", [
      ...currentAwards,
      { name: "", year: "", organization: "", description: "" },
    ])
  }

  const removeAward = (index: number) => {
    const currentAwards = form.getValues("awards")
    form.setValue("awards", currentAwards.filter((_, i) => i !== index))
  }

  async function handleSubmit(data: CoachProfileFormValues) {
    try {
      await onSubmit(data);
      toast.success("Coach profile updated successfully");
    } catch (error) {
      toast.error("Failed to update coach profile");
      console.error("[COACH_PROFILE_ERROR]", error);
    }
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          {/* Professional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Professional Information</h3>
            
            <FormField
              control={form.control}
              name="primarySpecialization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Specialization</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your primary focus" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="RESIDENTIAL">Residential</SelectItem>
                      <SelectItem value="COMMERCIAL">Commercial</SelectItem>
                      <SelectItem value="LUXURY">Luxury</SelectItem>
                      <SelectItem value="INVESTMENT">Investment</SelectItem>
                      <SelectItem value="NEW_CONSTRUCTION">New Construction</SelectItem>
                      <SelectItem value="FORECLOSURES">Foreclosures</SelectItem>
                      <SelectItem value="INTERNATIONAL">International</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="secondarySpecializations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Secondary Specializations</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., First-time buyers, Vacation homes" {...field} />
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
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="certifications"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Professional Certifications</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., CRS, ABR, GRI" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="languages"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Languages Spoken</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., English, Spanish" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="marketExpertise"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Market Expertise</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your specific market knowledge and areas of expertise..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          
          {/* Achievements */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Achievements</h3>
              <Button type="button" variant="outline" onClick={addAchievement}>
                Add Achievement
              </Button>
            </div>

            {form.watch("achievements").map((_, index) => (
              <div key={index} className="space-y-4 p-4 border rounded-lg relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 text-muted-foreground hover:text-destructive"
                  onClick={() => removeAchievement(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <FormField
                  control={form.control}
                  name={`achievements.${index}.title`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Achievement Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Top Producer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`achievements.${index}.year`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`achievements.${index}.description`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Details about the achievement..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ))}
          </div>

          <Separator />

          {/* Awards */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Awards</h3>
              <Button type="button" variant="outline" onClick={addAward}>
                Add Award
              </Button>
            </div>

            {form.watch("awards").map((_, index) => (
              <div key={index} className="space-y-4 p-4 border rounded-lg relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 text-muted-foreground hover:text-destructive"
                  onClick={() => removeAward(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <FormField
                  control={form.control}
                  name={`awards.${index}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Award Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Diamond Circle Award" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`awards.${index}.year`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`awards.${index}.organization`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., National Association of Realtors" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`awards.${index}.description`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Details about the award..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ))}
          </div>

          <Button type="submit" className="w-full">Save Changes</Button>
        </form>
      </Form>
    </div>
  )
} 