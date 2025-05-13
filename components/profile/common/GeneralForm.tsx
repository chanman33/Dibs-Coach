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
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { REAL_ESTATE_DOMAINS } from "@/utils/types/coach"
import { Home, Building, FileText, FileCheck, Shield, Wallet, Building2 } from "lucide-react"

// Validation schema matching database types
const generalFormSchema = z.object({
  // User fields
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  displayName: z.string().min(1, "Display name is required"),
  bio: z.string()
    .min(50, "Bio must be at least 50 characters long")
    .nullable()
    .transform(val => val || null),
  totalYearsRE: z.number().min(0, "Years must be 0 or greater"),
  primaryMarket: z.string().min(1, "Primary market is required"),
  languages: z.array(z.string()).optional(),
  realEstateDomains: z.array(z.string()),
  primaryDomain: z.string().nullable()
})

// Domain options with icons
const DOMAIN_OPTIONS = [
  {
    id: REAL_ESTATE_DOMAINS.REALTOR,
    label: "Real Estate Agent",
    icon: <Home className="h-4 w-4" />
  },
  {
    id: REAL_ESTATE_DOMAINS.INVESTOR,
    label: "Real Estate Investor",
    icon: <Wallet className="h-4 w-4" />
  },
  {
    id: REAL_ESTATE_DOMAINS.MORTGAGE,
    label: "Mortgage Professional",
    icon: <FileText className="h-4 w-4" />
  },
  {
    id: REAL_ESTATE_DOMAINS.PROPERTY_MANAGER,
    label: "Property Manager",
    icon: <Building className="h-4 w-4" />
  },
  {
    id: REAL_ESTATE_DOMAINS.TITLE_ESCROW,
    label: "Title & Escrow",
    icon: <FileCheck className="h-4 w-4" />
  },
  {
    id: REAL_ESTATE_DOMAINS.INSURANCE,
    label: "Insurance",
    icon: <Shield className="h-4 w-4" />
  },
  {
    id: REAL_ESTATE_DOMAINS.COMMERCIAL,
    label: "Commercial Real Estate",
    icon: <Building2 className="h-4 w-4" />
  },
  {
    id: REAL_ESTATE_DOMAINS.PRIVATE_CREDIT,
    label: "Private Credit",
    icon: <Wallet className="h-4 w-4" />
  }
];

interface GeneralFormProps {
  onSubmit: (data: GeneralFormData) => Promise<ApiResponse<GeneralFormData>>
  initialData?: {
    // User data
    firstName?: string | null
    lastName?: string | null
    displayName?: string | null
    bio?: string | null
    totalYearsRE?: number
    primaryMarket?: string | null
    languages?: string[]
    realEstateDomains?: string[]
    primaryDomain?: string | null
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
  // Ensure languages is always initialized as an array
  const [formData, setFormData] = useState<GeneralFormData>({
    firstName: initialData?.firstName || null,
    lastName: initialData?.lastName || null,
    displayName: initialData?.displayName || "",
    bio: initialData?.bio || null,
    totalYearsRE: initialData?.totalYearsRE ?? 0,
    primaryMarket: initialData?.primaryMarket || "",
    languages: Array.isArray(initialData?.languages) ? initialData.languages : [],
    realEstateDomains: Array.isArray(initialData?.realEstateDomains) 
      ? initialData.realEstateDomains 
      : [],
    primaryDomain: initialData?.primaryDomain || null,
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    if (initialData) {
      console.log("[GENERAL_FORM_INIT]", {
        initialRealEstateDomains: initialData.realEstateDomains,
        initialPrimaryDomain: initialData.primaryDomain,
        timestamp: new Date().toISOString()
      });
      
      setFormData(prev => ({
        ...prev,
        firstName: initialData.firstName || prev.firstName || null,
        lastName: initialData.lastName || prev.lastName || null,
        displayName: initialData.displayName || prev.displayName || "",
        bio: initialData.bio || prev.bio || null,
        totalYearsRE: initialData.totalYearsRE ?? prev.totalYearsRE ?? 0,
        primaryMarket: initialData.primaryMarket || prev.primaryMarket || "",
        languages: initialData.languages || prev.languages || [],
        realEstateDomains: Array.isArray(initialData.realEstateDomains)
          ? initialData.realEstateDomains
          : prev.realEstateDomains,
        primaryDomain: initialData.primaryDomain || prev.primaryDomain || null,
      }))
    }
  }, [initialData])

  useEffect(() => {
    console.log('[GENERAL_FORM_DATA_UPDATED]', {
      realEstateDomains: formData.realEstateDomains,
      primaryDomain: formData.primaryDomain,
      timestamp: new Date().toISOString()
    })
  }, [formData.realEstateDomains, formData.primaryDomain])

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

  const handleDomainChange = (domain: string, checked: boolean) => {
    console.log('[GENERAL_FORM_DOMAIN_CHANGE]', {
      domain,
      checked,
      currentRealEstateDomains: formData.realEstateDomains,
      currentPrimaryDomain: formData.primaryDomain,
      timestamp: new Date().toISOString()
    });
    
    setFormData(prev => {
      let newDomains = [...(prev.realEstateDomains || [])];
      
      if (checked) {
        // Add domain if it doesn't exist
        if (!newDomains.includes(domain)) {
          newDomains.push(domain);
        }
      } else {
        // Remove domain
        newDomains = newDomains.filter(d => d !== domain);
        
        // If removing the primary domain, reset it to the first available domain or null
        if (prev.primaryDomain === domain) {
          const newPrimaryDomain = newDomains.length > 0 ? newDomains[0] : null;
          
          console.log('[GENERAL_FORM_PRIMARY_DOMAIN_RESET]', {
            oldPrimaryDomain: prev.primaryDomain,
            newPrimaryDomain,
            newDomains,
            timestamp: new Date().toISOString()
          });
          
          return {
            ...prev,
            realEstateDomains: newDomains,
            primaryDomain: newPrimaryDomain
          };
        }
      }
      
      const result = {
        ...prev,
        realEstateDomains: newDomains
      };
      
      console.log('[GENERAL_FORM_DOMAIN_CHANGE_RESULT]', {
        newState: {
          realEstateDomains: result.realEstateDomains,
          primaryDomain: result.primaryDomain
        },
        timestamp: new Date().toISOString()
      });
      
      return result;
    });
  }

  const handlePrimaryDomainChange = (domain: string) => {
    console.log('[GENERAL_FORM_PRIMARY_DOMAIN_CHANGE]', {
      domain,
      currentRealEstateDomains: formData.realEstateDomains,
      currentPrimaryDomain: formData.primaryDomain,
      timestamp: new Date().toISOString()
    });
    
    // Ensure the domain is in the selected domains list
    setFormData(prev => {
      let newDomains = [...(prev.realEstateDomains || [])];
      
      if (!newDomains.includes(domain)) {
        newDomains.push(domain);
      }
      
      const result = {
        ...prev,
        realEstateDomains: newDomains,
        primaryDomain: domain
      };
      
      console.log('[GENERAL_FORM_PRIMARY_DOMAIN_CHANGE_RESULT]', {
        newState: {
          realEstateDomains: result.realEstateDomains,
          primaryDomain: result.primaryDomain
        },
        timestamp: new Date().toISOString()
      });
      
      return result;
    });
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = e.target
    validateField(name as keyof GeneralFormData, formData[name as keyof GeneralFormData])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('[GENERAL_FORM_SUBMIT_START]', {
      formData,
      timestamp: new Date().toISOString()
    });
    
    try {
      // Ensure languages is always an array
      const dataToSubmit = {
        ...formData,
        languages: formData.languages || []
      };
      
      // Handle case when realEstateDomains exists but primaryDomain doesn't
      if (dataToSubmit.realEstateDomains.length > 0 && !dataToSubmit.primaryDomain) {
        dataToSubmit.primaryDomain = dataToSubmit.realEstateDomains[0];
        console.log('[GENERAL_FORM_SUBMIT_FIX_PRIMARY_DOMAIN]', {
          realEstateDomains: dataToSubmit.realEstateDomains,
          primaryDomain: dataToSubmit.primaryDomain,
          timestamp: new Date().toISOString()
        });
      }
      
      const validatedData = generalFormSchema.parse(dataToSubmit)
      
      console.log('[GENERAL_FORM_SUBMITTING]', {
        validatedData,
        timestamp: new Date().toISOString()
      });
      
      const result = await onSubmit(validatedData)
      
      console.log('[GENERAL_FORM_SUBMIT_RESULT]', {
        success: !result?.error,
        error: result?.error,
        responseData: result?.data,
        timestamp: new Date().toISOString()
      });

      if (result?.error) {
        toast.error(result.error.message || 'Failed to save changes')
        return
      }

      // Update form data with the returned response to keep everything in sync
      if (result?.data) {
        setFormData(prevData => ({
          ...prevData,
          ...result.data,
          languages: result.data?.languages || prevData.languages || [],
          realEstateDomains: result.data?.realEstateDomains || prevData.realEstateDomains || [],
          primaryDomain: result.data?.primaryDomain || prevData.primaryDomain
        }));
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
            This information will be displayed on your public profile to coaches and your team if connected.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            <div>
              <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
              <Input 
                id="firstName" 
                name="firstName" 
                value={formData.firstName || ''} 
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter your first name"
                disabled={isSubmitting}
                className={`mt-1 ${errors.firstName ? 'border-red-500' : ''}`}
              />
              {errors.firstName && (
                <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>
              )}
            </div>

            <div>
              <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
              <Input 
                id="lastName" 
                name="lastName" 
                value={formData.lastName || ''} 
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter your last name"
                disabled={isSubmitting}
                className={`mt-1 ${errors.lastName ? 'border-red-500' : ''}`}
              />
              {errors.lastName && (
                <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>
              )}
            </div>

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

          {/* Real Estate Domains Section */}
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-2">Real Estate Domains</h4>
            <p className="text-xs text-muted-foreground mb-4">
              Select the real estate domains that apply to you. This helps us provide recommendations and resources.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {DOMAIN_OPTIONS.map((domain) => (
                <div 
                  key={domain.id}
                  className={`flex items-center space-x-3 p-3 rounded-lg border ${
                    (formData.realEstateDomains || []).includes(domain.id) 
                      ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' 
                      : 'bg-background border-input hover:bg-muted/50'
                  }`}
                >
                  <Checkbox
                    id={`domain-${domain.id}`}
                    checked={(formData.realEstateDomains || []).includes(domain.id)}
                    onCheckedChange={(checked) => handleDomainChange(domain.id, !!checked)}
                    disabled={isSubmitting}
                  />
                  <label
                    htmlFor={`domain-${domain.id}`}
                    className="flex items-center gap-2 text-sm font-medium leading-none cursor-pointer"
                  >
                    {domain.icon}
                    <span>{domain.label}</span>
                  </label>
                </div>
              ))}
            </div>
            
            {(formData.realEstateDomains || []).length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-2">Primary Domain</h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Select your primary real estate domain. This will be highlighted on your profile.
                </p>
                
                <RadioGroup 
                  value={formData.primaryDomain || ''} 
                  onValueChange={handlePrimaryDomainChange}
                  className="grid grid-cols-1 md:grid-cols-2 gap-3"
                  disabled={isSubmitting}
                >
                  {(formData.realEstateDomains || []).map((domainId) => {
                    const domain = DOMAIN_OPTIONS.find(d => d.id === domainId);
                    return domain ? (
                      <div 
                        key={domain.id}
                        className={`flex items-center space-x-3 p-3 rounded-lg border ${
                          formData.primaryDomain === domain.id 
                            ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' 
                            : 'bg-background border-input'
                        }`}
                      >
                        <RadioGroupItem value={domain.id} id={`primary-${domain.id}`} />
                        <label
                          htmlFor={`primary-${domain.id}`}
                          className="flex items-center gap-2 text-sm font-medium leading-none cursor-pointer"
                        >
                          {domain.icon}
                          <span>{domain.label}</span>
                        </label>
                      </div>
                    ) : null;
                  })}
                </RadioGroup>
              </div>
            )}
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

