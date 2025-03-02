import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { z } from "zod"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import type { ApiResponse } from "@/utils/types/api"
import type { GeneralFormData } from "@/utils/actions/user-profile-actions"

// Validation schema matching database types
const generalFormSchema = z.object({
  // User fields
  displayName: z.string().min(1, "Display name is required"),
  bio: z.string()
    .min(50, "Bio must be at least 50 characters long")
    .nullable()
    .transform(val => val || null),
  totalYearsRE: z.number().min(0, "Years must be 0 or greater"),
  primaryMarket: z.string().min(1, "Primary market is required"),
  languages: z.array(z.string()).optional()
})

interface GeneralFormProps {
  onSubmit: (data: GeneralFormData) => Promise<ApiResponse<GeneralFormData>>
  initialData?: {
    // User data
    displayName?: string | null
    bio?: string | null
    totalYearsRE?: number
    primaryMarket?: string | null
    languages?: string[]
  }
  isSubmitting?: boolean
}

type FormErrors = {
  [K in keyof GeneralFormData]?: string;
}

export default function GeneralForm({ 
  onSubmit, 
  initialData,
  isSubmitting = false
}: GeneralFormProps) {
  const [formData, setFormData] = useState<GeneralFormData>({
    displayName: initialData?.displayName || "",
    bio: initialData?.bio || null,
    totalYearsRE: initialData?.totalYearsRE ?? 0,
    primaryMarket: initialData?.primaryMarket || "",
    languages: initialData?.languages || [],
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    if (initialData) {
      setFormData(prev => {
        const newData = {
          ...prev,
          displayName: initialData.displayName || prev.displayName || "",
          bio: initialData.bio || prev.bio || null,
          totalYearsRE: initialData.totalYearsRE ?? prev.totalYearsRE ?? 0,
          primaryMarket: initialData.primaryMarket || prev.primaryMarket || "",
          languages: initialData.languages || prev.languages || [],
        };
        return newData;
      })
    }
  }, [initialData])

  const validateField = (name: keyof GeneralFormData, value: any) => {
    try {
      const fieldSchema = generalFormSchema.shape[name];
      fieldSchema.parse(value);
      setErrors(prev => ({ ...prev, [name]: undefined }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        const message = error.errors[0]?.message;
        setErrors(prev => ({ ...prev, [name]: message }));
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    const newValue = name === "totalYearsRE" ? parseInt(value) || 0 : value
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue,
    }))

    validateField(name as keyof GeneralFormData, newValue)
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = e.target
    validateField(name as keyof GeneralFormData, formData[name as keyof GeneralFormData])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const validatedData = generalFormSchema.parse(formData)
      const result = await onSubmit(validatedData)

      if (result?.error) {
        toast.error(result.error.message || 'Failed to save changes')
        return
      }

      toast.success('Changes saved successfully')
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: FormErrors = {}
        error.errors.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0] as keyof GeneralFormData] = err.message
          }
        })
        
        setErrors(newErrors)
        
        // Show field-specific errors in the form
        Object.entries(newErrors).forEach(([field, message]) => {
          const element = document.getElementById(field)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        })
      } else {
        console.error('[FORM_SUBMIT_ERROR]', {
          error,
          formData,
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString()
        })
        toast.error("Failed to save changes. Please try again.")
      }
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
                onBlur={handleBlur}
                required 
                placeholder="Enter your preferred display name"
                disabled={isSubmitting}
                className={`mt-1 ${errors.displayName ? 'border-red-500' : ''}`}
              />
              {errors.displayName && (
                <p className="text-xs text-red-500 mt-1">{errors.displayName}</p>
              )}
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
                onBlur={handleBlur}
                disabled={isSubmitting}
                placeholder="Write a comprehensive description of your professional background and expertise. This will appear on your profile page."
                rows={6}
                className={`mt-1 ${errors.bio ? 'border-red-500' : ''}`}
              />
              <div className="flex justify-between items-center mt-1">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    A well-written bio helps potential clients understand your expertise and approach.
                  </p>
                  {errors.bio && (
                    <p className="text-xs text-red-500">{errors.bio}</p>
                  )}
                </div>
                <p className={`text-xs ${(formData.bio?.length || 0) < 50 ? 'text-red-500' : 'text-muted-foreground'}`}>
                  {(formData.bio?.length || 0)}/50 characters minimum
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="totalYearsRE" className="text-sm font-medium">Total Years in Real Estate</Label>
              <Input
                id="totalYearsRE"
                name="totalYearsRE"
                type="number"
                min="0"
                value={formData.totalYearsRE}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="0"
                required
                disabled={isSubmitting}
                className={`mt-1 ${errors.totalYearsRE ? 'border-red-500' : ''}`}
              />
              {errors.totalYearsRE && (
                <p className="text-xs text-red-500 mt-1">{errors.totalYearsRE}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Your total years of experience in real estate.
              </p>
            </div>

            <div>
              <Label htmlFor="primaryMarket" className="text-sm font-medium">Primary Market</Label>
              <Input
                id="primaryMarket"
                name="primaryMarket"
                value={formData.primaryMarket}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g. Greater Los Angeles Area"
                required
                disabled={isSubmitting}
                className={`mt-1 ${errors.primaryMarket ? 'border-red-500' : ''}`}
              />
              {errors.primaryMarket && (
                <p className="text-xs text-red-500 mt-1">{errors.primaryMarket}</p>
              )}
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

