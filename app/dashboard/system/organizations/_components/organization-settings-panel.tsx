"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { 
  AlertCircle,
  Check,
  Save,
  Settings
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { OrgStatus, OrgTier, OrgType, OrgIndustry } from '@/utils/types/organization'
import { updateOrganization } from '@/utils/actions/organization-actions'

interface Organization {
  ulid: string
  name: string
  description?: string
  type: string
  industry?: string
  status: string
  tier: string
  level: string
  primaryDomain?: string
  domains?: string[]
  serviceAreas?: string[]
  specializations?: string[]
  createdAt: string
  updatedAt: string
  memberCount?: number
  metadata?: Record<string, any>
}

interface OrganizationSettingsPanelProps {
  organization: Organization
  onUpdate: (data: any) => void
}

export function OrganizationSettingsPanel({ organization, onUpdate }: OrganizationSettingsPanelProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDangerZone, setShowDangerZone] = useState(false)
  
  // Create form schema
  const formSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters').max(100),
    description: z.string().max(500).optional(),
    type: z.enum(Object.values(OrgType) as [string, ...string[]]),
    industry: z.enum(Object.values(OrgIndustry) as [string, ...string[]]).optional(),
    status: z.enum(Object.values(OrgStatus) as [string, ...string[]]),
    tier: z.enum(Object.values(OrgTier) as [string, ...string[]]),
    primaryDomain: z.string().optional().nullable(),
    featureSettings: z.record(z.boolean()).optional(),
  })
  
  type SettingsFormValues = z.infer<typeof formSchema>
  
  // Get feature settings from metadata
  const featureSettings = organization.metadata?.featureSettings || {
    enableAI: true,
    enableCoaching: true,
    enableAnalytics: true,
    enableBulkUpload: false,
    enableCustomization: false,
  }
  
  // Initialize form
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: organization.name,
      description: organization.description || '',
      type: organization.type as any,
      industry: organization.industry as any,
      status: organization.status as any,
      tier: organization.tier as any,
      primaryDomain: organization.primaryDomain || '',
      featureSettings,
    },
  })
  
  const onSubmit = async (values: SettingsFormValues) => {
    try {
      setIsSubmitting(true)
      
      // Prepare metadata
      const metadata = {
        ...organization.metadata,
        featureSettings: values.featureSettings,
      }
      
      const result = await updateOrganization({
        orgId: organization.ulid,
        name: values.name,
        description: values.description,
        type: values.type,
        industry: values.industry,
        status: values.status,
        tier: values.tier,
        primaryDomain: values.primaryDomain,
        metadata,
      })
      
      if (result.error) {
        toast({
          title: 'Error updating organization',
          description: result.error.message,
          variant: 'destructive',
        })
        return
      }
      
      toast({
        title: 'Organization updated',
        description: 'Settings have been saved successfully',
      })
      
      onUpdate(values)
    } catch (error) {
      console.error('[UPDATE_ORGANIZATION_ERROR]', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Organization Settings
          </CardTitle>
          <CardDescription>
            Configure organization details and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name*</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status*</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(OrgStatus).map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Organization description..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Brief description of the organization
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Type*</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(OrgType).map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(OrgIndustry).map((industry) => (
                            <SelectItem key={industry} value={industry}>
                              {industry.replace(/_/g, ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="tier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subscription Tier*</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select tier" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(OrgTier).map((tier) => (
                            <SelectItem key={tier} value={tier}>
                              {tier}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Determines available features and limits
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="primaryDomain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Real Estate Domain</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} />
                      </FormControl>
                      <FormDescription>
                        Main real estate focus (e.g., Residential, Commercial)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">Feature Access</h3>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="featureSettings.enableAI"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            AI Tools
                          </FormLabel>
                          <FormDescription>
                            Access to AI assistants and tools
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="featureSettings.enableCoaching"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Coaching
                          </FormLabel>
                          <FormDescription>
                            Access to coaching services
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="featureSettings.enableAnalytics"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Analytics
                          </FormLabel>
                          <FormDescription>
                            Advanced metrics and reporting
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="featureSettings.enableBulkUpload"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Bulk Upload
                          </FormLabel>
                          <FormDescription>
                            Batch data import tools
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="featureSettings.enableCustomization"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Customization
                          </FormLabel>
                          <FormDescription>
                            Custom branding and white labeling
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Settings
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Actions that may have serious consequences
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showDangerZone ? (
            <Button
              variant="outline"
              className="text-destructive"
              onClick={() => setShowDangerZone(true)}
            >
              Show Danger Zone Options
            </Button>
          ) : (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  These actions can cause data loss and disruption to organization members.
                </AlertDescription>
              </Alert>
              
              <div className="grid gap-4">
                <div className="flex items-center justify-between rounded-lg border border-destructive p-4">
                  <div>
                    <h4 className="font-semibold">Suspend Organization</h4>
                    <p className="text-sm text-muted-foreground">
                      Temporarily disable access for all members
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      // Handle suspend action
                      form.setValue('status', 'SUSPENDED')
                      form.handleSubmit(onSubmit)()
                    }}
                  >
                    Suspend
                  </Button>
                </div>
                
                <div className="flex items-center justify-between rounded-lg border border-destructive p-4">
                  <div>
                    <h4 className="font-semibold">Archive Organization</h4>
                    <p className="text-sm text-muted-foreground">
                      Move to archived state (recoverable)
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      // Handle archive action
                      form.setValue('status', 'ARCHIVED')
                      form.handleSubmit(onSubmit)()
                    }}
                  >
                    Archive
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 