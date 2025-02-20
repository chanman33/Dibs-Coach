import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { z } from "zod"

// Validation schema matching database types
const generalFormSchema = z.object({
  // User fields
  displayName: z.string().min(1, "Display name is required"),
  bio: z.string().optional().nullable(),
  
  // RealtorProfile fields
  yearsExperience: z.number().min(0, "Years of experience must be a positive number"),
  primaryMarket: z.string().min(1, "Primary market is required"),
})

type GeneralFormData = z.infer<typeof generalFormSchema>

interface GeneralFormProps {
  onSubmit: (data: GeneralFormData) => void
  initialData?: {
    // User data
    displayName?: string | null
    bio?: string | null
    // RealtorProfile data
    yearsExperience?: number | null
    primaryMarket?: string | null
  }
  isSubmitting?: boolean
}

export default function GeneralForm({ 
  onSubmit, 
  initialData,
  isSubmitting = false
}: GeneralFormProps) {
  const [formData, setFormData] = useState<GeneralFormData>({
    displayName: "",
    bio: null,
    yearsExperience: 0,
    primaryMarket: "",
  })

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        displayName: initialData.displayName || "",
        bio: initialData.bio || null,
        yearsExperience: typeof initialData.yearsExperience === 'string' 
          ? parseInt(initialData.yearsExperience, 10) 
          : initialData.yearsExperience || 0,
        primaryMarket: initialData.primaryMarket || "",
      }))
    }
  }, [initialData])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'yearsExperience' ? parseInt(value) || 0 : value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Validate form data
      const validatedData = generalFormSchema.parse(formData)
      onSubmit(validatedData)
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('[VALIDATION_ERROR]', {
          error,
          formData,
          timestamp: new Date().toISOString()
        })
      }
      // Handle validation errors here if needed
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="displayName">Profile Display Name</Label>
        <Input 
          id="displayName" 
          name="displayName" 
          value={formData.displayName} 
          onChange={handleChange} 
          required 
          placeholder="Enter your preferred display name"
          disabled={isSubmitting}
        />
        <p className="text-sm text-muted-foreground mt-1">
          This is how your name will appear publicly on your profile.
        </p>
      </div>

      <div>
        <Label htmlFor="bio">Professional Bio</Label>
        <Textarea 
          id="bio" 
          name="bio" 
          value={formData.bio || ''}
          onChange={handleChange}
          disabled={isSubmitting}
          placeholder="Write a comprehensive description of your professional background and expertise. This will appear on your profile page."
          rows={6}
        />
      </div>

      <div>
        <Label htmlFor="yearsExperience">Years of Experience</Label>
        <Input
          id="yearsExperience"
          name="yearsExperience"
          type="number"
          value={formData.yearsExperience}
          onChange={handleChange}
          required
          disabled={isSubmitting}
          min="0"
          max="100"
        />
      </div>

      <div>
        <Label htmlFor="primaryMarket">Primary Market</Label>
        <Input
          id="primaryMarket"
          name="primaryMarket"
          value={formData.primaryMarket}
          onChange={handleChange}
          placeholder="e.g. Greater Los Angeles Area"
          required
          disabled={isSubmitting}
        />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save General Information"}
      </Button>
    </form>
  )
}

