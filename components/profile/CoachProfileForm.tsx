"use client"

import { useState } from "react"
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
import { X, Pencil, Trash2 } from "lucide-react"
import {
  COACH_SPECIALTIES,
  COACH_CERTIFICATIONS,
  CoachProfileSchema
} from "@/utils/types/coach"
import type { CoachProfile } from "@/utils/types/coach"
import type { RealtorProfile } from "@/utils/types/realtor"
import { 
  ProfessionalRecognition, 
  ProfessionalRecognitionSchema 
} from "@/utils/types/realtor"

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
  
  // Professional Recognitions (formerly achievements/awards)
  professionalRecognitions: z.array(ProfessionalRecognitionSchema),
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
  const [editingRecognition, setEditingRecognition] = useState<number | null>(null);

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
      
      // Parse professional recognitions from the JSON data
      professionalRecognitions: (initialData?.realtorProfile?.professionalRecognitions || [])
        .map((recognition: ProfessionalRecognition) => ({
          id: recognition.id,
          title: recognition.title,
          type: recognition.type,
          year: Number(recognition.year),
          organization: recognition.organization,
          description: recognition.description,
        }))
    },
  })

  const addRecognition = () => {
    const currentRecognitions = form.getValues("professionalRecognitions")
    const newIndex = currentRecognitions.length
    form.setValue("professionalRecognitions", [
      ...currentRecognitions,
      { 
        title: "", 
        year: new Date().getFullYear(),
        organization: "", 
        description: "", 
        type: "ACHIEVEMENT" as const 
      },
    ])
    setEditingRecognition(newIndex)
  }

  const removeRecognition = (index: number) => {
    const currentRecognitions = form.getValues("professionalRecognitions")
    form.setValue("professionalRecognitions", currentRecognitions.filter((_, i) => i !== index))
    // Reset editing state if we're removing the item being edited
    if (editingRecognition === index) {
      setEditingRecognition(null)
    } else if (editingRecognition && editingRecognition > index) {
      // Adjust editing index if we're removing an item before the one being edited
      setEditingRecognition(editingRecognition - 1)
    }
  }

  async function handleSubmit(data: CoachProfileFormValues) {
    try {
      // Format the data to match the new schema
      const formattedData = {
        ...data,
        professionalRecognitions: data.professionalRecognitions.map(recognition => ({
          title: recognition.title,
          type: recognition.type,
          year: recognition.year,
          organization: recognition.organization,
          description: recognition.description,
        }))
      };

      await onSubmit(formattedData);
      setEditingRecognition(null);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("[COACH_PROFILE_ERROR]", error);
      toast.error("Failed to update profile");
    }
  }

  const renderRecognitionDisplay = (recognition: ProfessionalRecognition, index: number) => (
    <div key={index} className="p-4 border rounded-lg space-y-2">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-medium">{recognition.title}</h4>
          <p className="text-sm text-muted-foreground">
            {recognition.type} • {recognition.year}
            {recognition.organization && ` • ${recognition.organization}`}
          </p>
          {recognition.description && (
            <p className="text-sm mt-1">{recognition.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setEditingRecognition(index)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeRecognition(index)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
    </div>
  );

  const renderRecognitionForm = (index: number) => (
    <div key={index} className="space-y-4 p-4 border rounded-lg relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 text-muted-foreground hover:text-destructive"
        onClick={() => {
          if (editingRecognition === index) {
            setEditingRecognition(null);
          } else {
            removeRecognition(index);
          }
        }}
      >
        <X className="h-4 w-4" />
      </Button>
      <FormField
        control={form.control}
        name={`professionalRecognitions.${index}.title`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Recognition Title</FormLabel>
            <FormControl>
              <Input placeholder="e.g., Top Producer" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`professionalRecognitions.${index}.year`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Year</FormLabel>
            <FormControl>
              <Input 
                type="number"
                min={1900}
                max={new Date().getFullYear()}
                {...field}
                onChange={(e) => field.onChange(Number(e.target.value))}
                value={field.value || ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`professionalRecognitions.${index}.organization`}
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
        name={`professionalRecognitions.${index}.description`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea placeholder="Details about the recognition..." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

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

        {/* Professional Recognitions Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Professional Recognitions</h3>
            <Button 
              type="button" 
              variant="outline" 
              onClick={addRecognition}
            >
              Add Recognition
            </Button>
          </div>

          <div className="space-y-4">
            {form.watch("professionalRecognitions").map((recognition, index) => (
              editingRecognition === index 
                ? renderRecognitionForm(index)
                : renderRecognitionDisplay(recognition, index)
            ))}
          </div>
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </Form>
  )
} 