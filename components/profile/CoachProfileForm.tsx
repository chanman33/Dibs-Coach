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
import { X, Pencil, Archive } from "lucide-react"
import {
  COACH_SPECIALTIES,
  COACH_CERTIFICATIONS,
  CoachProfileSchema
} from "@/utils/types/coach"
import type { CoachProfile } from "@/utils/types/coach"
import type { RealtorProfile } from "@/utils/types/realtor"
import { 
  ProfessionalRecognition, 
  ProfessionalRecognitionSchema,
  RecognitionFormSchema
} from "@/utils/types/realtor"
import { ProfessionalRecognitions } from "./ProfessionalRecognitions"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

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
  
  // Professional Recognitions
  professionalRecognitions: z.array(ProfessionalRecognitionSchema).default([]),
  newRecognition: RecognitionFormSchema.extend({
    organization: z.string().default(""),
    description: z.string().default("")
  }).default({
    title: "",
    type: "AWARD",
    year: new Date().getFullYear(),
    organization: "",
    description: ""
  })
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

interface ProfessionalRecognitionFormData {
  id?: number;
  title: string;
  type: "AWARD" | "ACHIEVEMENT";
  year: number;
  organization: string | null;
  description: string | null;
  realtorProfileId?: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export function CoachProfileForm({
  initialData,
  onSubmit,
  isSubmitting = false
}: CoachProfileFormProps) {
  const [showRecognitionForm, setShowRecognitionForm] = useState(false);
  const [isAddingRecognition, setIsAddingRecognition] = useState(false);
  const [editingRecognition, setEditingRecognition] = useState<ProfessionalRecognitionFormData | null>(null);

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
      professionalRecognitions: initialData?.realtorProfile?.professionalRecognitions 
        ? initialData.realtorProfile.professionalRecognitions.map((recognition: ProfessionalRecognition) => ({
            id: recognition.id,
            title: recognition.title,
            type: recognition.type,
            year: Number(recognition.year),
            organization: recognition.organization || undefined,
            description: recognition.description || undefined,
          }))
        : [],
      newRecognition: {
        title: "",
        type: "AWARD" as const,
        year: new Date().getFullYear(),
        organization: "",
        description: ""
      }
    },
  })

  const handleEditRecognition = (recognition: ProfessionalRecognition) => {
    const formData: ProfessionalRecognitionFormData = {
      id: recognition.id,
      title: recognition.title,
      type: recognition.type,
      year: recognition.year,
      organization: recognition.organization,
      description: recognition.description,
      realtorProfileId: recognition.realtorProfileId,
      createdAt: recognition.createdAt,
      updatedAt: recognition.updatedAt,
      deletedAt: recognition.deletedAt
    };
    setEditingRecognition(formData);
    form.setValue("newRecognition", {
      title: recognition.title,
      type: recognition.type,
      year: recognition.year,
      organization: recognition.organization ?? "",
      description: recognition.description ?? ""
    });
  };

  const handleCancelEdit = () => {
    setEditingRecognition(null);
    form.setValue("newRecognition", {
      title: "",
      type: "AWARD" as const,
      year: new Date().getFullYear(),
      organization: "",
      description: ""
    });
  };

  const handleSaveRecognition = async () => {
    const newRecognition = form.getValues("newRecognition");
    console.log('[DEBUG] Saving recognition:', newRecognition);

    if (newRecognition.title && newRecognition.type && newRecognition.year) {
      try {
        setIsAddingRecognition(true);
        const currentRecognitions = form.getValues("professionalRecognitions") || [];
        
        let updatedRecognitions;
        if (editingRecognition?.id) {
          // Update existing recognition
          updatedRecognitions = currentRecognitions.map((r: ProfessionalRecognition) => 
            r.id === editingRecognition.id ? {
              ...r,
              title: newRecognition.title,
              type: newRecognition.type,
              year: newRecognition.year,
              organization: newRecognition.organization || null,
              description: newRecognition.description || null
            } : r
          );
        } else {
          // Add new recognition
          const tempId = Math.max(0, ...currentRecognitions.map((r: ProfessionalRecognition) => r.id || 0)) + 1;
          const recognitionToAdd: ProfessionalRecognition = {
            id: tempId,
            title: newRecognition.title,
            type: newRecognition.type,
            year: newRecognition.year,
            organization: newRecognition.organization || null,
            description: newRecognition.description || null
          };
          updatedRecognitions = [...currentRecognitions, recognitionToAdd];
        }

        // Create a partial form data with just the updated recognitions
        const partialData = {
          ...form.getValues(),
          professionalRecognitions: updatedRecognitions
        };

        // Save to database
        await onSubmit(partialData);
        
        // Update form state after successful save
        form.setValue("professionalRecognitions", updatedRecognitions);
        
        // Reset the form
        form.setValue("newRecognition", {
          title: "",
          type: "AWARD" as const,
          year: new Date().getFullYear(),
          organization: "",
          description: ""
        });

        // Reset editing state
        setEditingRecognition(null);
        setShowRecognitionForm(false);

        toast.success(editingRecognition ? "Recognition updated successfully" : "Recognition added successfully");
      } catch (error) {
        console.error("[SAVE_RECOGNITION_ERROR]", error);
        toast.error(editingRecognition ? "Failed to update recognition" : "Failed to add recognition");
      } finally {
        setIsAddingRecognition(false);
      }
    }
  };

  const handleArchiveRecognition = async () => {
    if (!editingRecognition?.id) return;

    try {
      setIsAddingRecognition(true); // Reuse the loading state
      const currentRecognitions = form.getValues("professionalRecognitions") || [];
      
      // Filter out the recognition being archived
      const updatedRecognitions = currentRecognitions.filter(r => r.id !== editingRecognition.id);

      // Create a partial form data with just the updated recognitions
      const partialData = {
        ...form.getValues(),
        professionalRecognitions: updatedRecognitions,
        archivedRecognitionId: editingRecognition.id // Pass the ID to be marked as archived
      };

      // Save to database
      await onSubmit(partialData);
      
      // Update form state after successful save
      form.setValue("professionalRecognitions", updatedRecognitions);
      
      // Reset editing state
      setEditingRecognition(null);
      setShowRecognitionForm(false);

      toast.success("Recognition archived successfully");
    } catch (error) {
      console.error("[ARCHIVE_RECOGNITION_ERROR]", error);
      toast.error("Failed to archive recognition");
    } finally {
      setIsAddingRecognition(false);
    }
  };

  const renderEditForm = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          {editingRecognition ? "Edit Recognition" : "Add New Recognition"}
        </h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCancelEdit}
        >
          Cancel
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="newRecognition.title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Award or Achievement Title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="newRecognition.type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="AWARD">Award</SelectItem>
                  <SelectItem value="ACHIEVEMENT">Achievement</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="newRecognition.year"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Year</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="Year" 
                  {...field}
                  onChange={e => field.onChange(parseInt(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="newRecognition.organization"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organization (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Organization Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="md:col-span-2">
          <FormField
            control={form.control}
            name="newRecognition.description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Brief description of the recognition" 
                    className="resize-none" 
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <div className="flex justify-between items-center mt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={handleSaveRecognition}
          disabled={isAddingRecognition}
        >
          {isAddingRecognition ? 
            (editingRecognition ? "Saving..." : "Adding...") : 
            (editingRecognition ? "Save Recognition" : "Add Recognition")
          }
        </Button>

        {editingRecognition && (
          <Button
            type="button"
            variant="ghost"
            onClick={handleArchiveRecognition}
            disabled={isAddingRecognition}
            className="hover:bg-muted"
          >
            <Archive className="h-4 w-4 mr-2" />
            Archive
          </Button>
        )}
      </div>
    </div>
  );

  // Update the professionalRecognitionFields to handle inline editing
  const professionalRecognitionFields = (
    <div className="space-y-6">
      {/* Display existing recognitions */}
      <div className="space-y-4">
        {/* Debug logging */}
        {(() => {
          const recognitions = form.watch("professionalRecognitions");
          console.log('[DEBUG] Recognitions in form:', recognitions);
          return null;
        })()}
        
        <ProfessionalRecognitions 
          recognitions={form.watch("professionalRecognitions") || []} 
          onEdit={(recognition: ProfessionalRecognition) => handleEditRecognition(recognition)}
          editingId={editingRecognition?.id}
          editForm={editingRecognition ? renderEditForm() : undefined}
        />
      </div>

      {/* Add New Recognition Form */}
      {showRecognitionForm && !editingRecognition && (
        <div className="space-y-4 border rounded-lg p-4 mt-4">
          {renderEditForm()}
        </div>
      )}
    </div>
  );

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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle>Professional Recognitions</CardTitle>
              <CardDescription>
                Your awards, certifications, and other professional achievements
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowRecognitionForm(!showRecognitionForm)}
            >
              {showRecognitionForm ? "Cancel" : "Add Recognition"}
            </Button>
          </CardHeader>
          <CardContent>
            {professionalRecognitionFields}
          </CardContent>
        </Card>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </Form>
  )
} 