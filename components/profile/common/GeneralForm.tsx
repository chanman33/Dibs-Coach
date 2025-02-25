import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { z } from "zod"
import { Card } from "@/components/ui/card"

// Validation schema matching database types
const generalFormSchema = z.object({
  // User fields
  displayName: z.string().min(1, "Display name is required"),
  bio: z.string().nullable(),
  
  // RealtorProfile fields
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
    primaryMarket: "",
  })

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        displayName: initialData.displayName || "",
        bio: initialData.bio || null,
        primaryMarket: initialData.primaryMarket || "",
      }))
    }
  }, [initialData])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
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
    <div className="space-y-4 sm:space-y-6">
      <Card className="p-4 sm:p-6 border shadow-sm">
        <div className="mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold">General Profile Information</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            This information will be displayed on your public profile.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label htmlFor="displayName" className="text-sm font-medium">Profile Display Name</Label>
              <Input 
                id="displayName" 
                name="displayName" 
                value={formData.displayName} 
                onChange={handleChange} 
                required 
                placeholder="Enter your preferred display name"
                disabled={isSubmitting}
                className="mt-1"
              />
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                This is how your name will appear publicly on your profile.
              </p>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="bio" className="text-sm font-medium">Professional Bio</Label>
              <Textarea 
                id="bio" 
                name="bio" 
                value={formData.bio || ''}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="Write a comprehensive description of your professional background and expertise. This will appear on your profile page."
                rows={6}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                A well-written bio helps potential clients understand your expertise and approach.
              </p>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="primaryMarket" className="text-sm font-medium">Primary Market</Label>
              <Input
                id="primaryMarket"
                name="primaryMarket"
                value={formData.primaryMarket}
                onChange={handleChange}
                placeholder="e.g. Greater Los Angeles Area"
                required
                disabled={isSubmitting}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                The geographic area where you primarily operate.
              </p>
            </div>
          </div>

          <div className="flex justify-end mt-6 sm:mt-8">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="px-6"
            >
              {isSubmitting ? (
                <>
                  <span className="mr-2">Saving</span>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                </>
              ) : (
                "Save General Information"
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

