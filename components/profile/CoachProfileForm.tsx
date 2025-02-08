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
import {
  COACH_SPECIALTIES,
  COACH_CERTIFICATIONS,
  CoachProfileSchema
} from "@/utils/types/coach"
import type { CoachProfile } from "@/utils/types/coach"
import type { RealtorProfile } from "@/utils/types/realtor"

// Combined form schema for both coach and realtor profile data
const coachProfileFormSchema = z.object({
  // Coach Profile Specific Fields
  specialties: z.array(z.string()).min(1, "Select at least one specialty"),
  yearsCoaching: z.number().min(0, "Years must be 0 or greater"),
  hourlyRate: z.number().min(0, "Rate must be 0 or greater"),
  
  // Calendly Integration
  calendlyUrl: z.string().optional(),
  eventTypeUrl: z.string().optional(),
  
  // Session Configuration
  defaultDuration: z.number().min(30).max(120).default(60),
  minimumDuration: z.number().min(30).max(60).default(30),
  maximumDuration: z.number().min(60).max(120).default(120),
  allowCustomDuration: z.boolean().default(false),
  
  // Professional Information
  certifications: z.array(z.string()),
  languages: z.array(z.string()),
  marketExpertise: z.string().optional(),
  
  // Achievements and Awards
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

type CoachProfileFormValues = z.infer<typeof coachProfileFormSchema>

interface CoachProfileFormProps {
  initialData?: {
    coachProfile?: Partial<CoachProfile> & {
      languages?: string[];
      marketExpertise?: string;
    };
    realtorProfile?: Partial<RealtorProfile>
  }
  onSubmit: (data: CoachProfileFormValues) => Promise<void>
  isSubmitting?: boolean
}

export function CoachProfileForm({
  initialData,
  onSubmit,
  isSubmitting = false
}: CoachProfileFormProps) {
  const form = useForm<CoachProfileFormValues>({
    resolver: zodResolver(coachProfileFormSchema),
    defaultValues: {
      // Coach Profile defaults
      specialties: initialData?.coachProfile?.specialties || [],
      yearsCoaching: initialData?.coachProfile?.yearsCoaching || 0,
      hourlyRate: Number(initialData?.coachProfile?.hourlyRate) || 0,
      calendlyUrl: initialData?.coachProfile?.calendlyUrl || "",
      eventTypeUrl: initialData?.coachProfile?.eventTypeUrl || "",
      defaultDuration: initialData?.coachProfile?.defaultDuration || 60,
      minimumDuration: initialData?.coachProfile?.minimumDuration || 30,
      maximumDuration: initialData?.coachProfile?.maximumDuration || 120,
      allowCustomDuration: initialData?.coachProfile?.allowCustomDuration || false,
      
      // Realtor Profile defaults
      certifications: Array.isArray(initialData?.realtorProfile?.certifications) 
        ? initialData.realtorProfile.certifications 
        : [],
      languages: Array.isArray(initialData?.realtorProfile?.languages) 
        ? initialData.realtorProfile.languages 
        : [],
      marketExpertise: initialData?.realtorProfile?.bio || "",
      
      // Parse achievements and awards from the JSON data
      achievements: (initialData?.realtorProfile?.achievements as any[] || [])
        .filter(a => !a.type || a.type !== 'award')
        .map(a => ({
          title: a.title,
          year: a.year,
          description: a.description || ''
        })),
      awards: (initialData?.realtorProfile?.achievements as any[] || [])
        .filter(a => a.type === 'award')
        .map(a => ({
          name: a.title,
          year: a.year,
          organization: a.description?.split('-')[0]?.trim() || '',
          description: a.description?.split('-')[1]?.trim() || ''
        }))
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
      // Format achievements and awards for JSON storage
      const formattedData = {
        ...data,
        achievements: [
          ...data.achievements,
          ...data.awards.map(award => ({
            title: award.name,
            year: award.year,
            description: `${award.organization} - ${award.description || ''}`.trim(),
            type: 'award'
          }))
        ]
      };

      await onSubmit(formattedData);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("[COACH_PROFILE_ERROR]", error);
      toast.error("Failed to update profile");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {/* Coaching Specialties */}
        <FormField
          control={form.control}
          name="specialties"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Coaching Specialties</FormLabel>
              <FormControl>
                <Select
                  onValueChange={(value) => {
                    const currentSpecialties = field.value || []
                    if (!currentSpecialties.includes(value)) {
                      field.onChange([...currentSpecialties, value])
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select specialties" />
                  </SelectTrigger>
                  <SelectContent>
                    {COACH_SPECIALTIES.map((specialty) => (
                      <SelectItem key={specialty} value={specialty}>
                        {specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <div className="flex flex-wrap gap-2 mt-2">
                {field.value?.map((specialty, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1 bg-secondary p-1 rounded-md"
                  >
                    <span>{specialty}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newSpecialties = field.value?.filter((_, i) => i !== index)
                        field.onChange(newSpecialties)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Years Coaching */}
        <FormField
          control={form.control}
          name="yearsCoaching"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Years of Coaching Experience</FormLabel>
              <p className="text-sm text-muted-foreground">This can include consulting or leadership experience outside of Dibs</p>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={e => field.onChange(Number(e.target.value))}
                  min={0}
                />
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
              <p className="text-sm text-muted-foreground">Separate multiple certifications with commas</p>
              <FormControl>
                <Input 
                  placeholder="e.g., CRS, ABR, GRI" 
                  value={field.value?.join(", ") || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value ? value.split(",").map(item => item.trim()) : []);
                  }}
                />
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
              <p className="text-sm text-muted-foreground">Separate multiple languages with commas</p>
              <FormControl>
                <Input 
                  placeholder="e.g., English, Spanish" 
                  value={Array.isArray(field.value) ? field.value.join(", ") : ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    const languagesArray = value
                      ? value.split(",")
                          .map(item => item.trim())
                          .filter(item => item.length > 0)
                      : [];
                    console.log('[DEBUG] Setting languages to:', languagesArray);
                    field.onChange(languagesArray);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        {/* Achievements Section */}
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

        {/* Awards Section */}
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

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </Form >
  )
} 