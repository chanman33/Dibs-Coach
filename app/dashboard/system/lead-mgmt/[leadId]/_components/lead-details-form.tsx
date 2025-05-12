"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { LeadDetails, LEAD_STATUS, LEAD_PRIORITY, leadSchema } from "@/utils/types/leads"
import { updateLead } from "@/utils/actions/lead-actions"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { OrgIndustry } from "@prisma/client"

// Create a custom Zod schema for the form with modified date handling
const leadUpdateSchema = z.object({
  companyName: leadSchema.shape.companyName,
  website: leadSchema.shape.website,
  industry: leadSchema.shape.industry,
  fullName: leadSchema.shape.fullName,
  jobTitle: leadSchema.shape.jobTitle,
  email: leadSchema.shape.email,
  phone: leadSchema.shape.phone,
  teamSize: leadSchema.shape.teamSize,
  multipleOffices: leadSchema.shape.multipleOffices,
  status: leadSchema.shape.status,
  priority: leadSchema.shape.priority,
  assignedToUlid: z.string().optional().transform(val => {
    // If empty string or only whitespace, return empty string
    // This will be handled on the server side to convert to null
    return val ? val.trim() : "";
  }),
  // Custom handling for nextFollowUpDate to accept the HTML datetime-local format
  nextFollowUpDate: z.string().optional().transform(val => {
    // If empty string or undefined, return undefined
    if (!val || val === "") return undefined;
    
    // Try to parse the date and return ISO string
    try {
      const date = new Date(val);
      if (isNaN(date.getTime())) return undefined;
      return date.toISOString();
    } catch (e) {
      return undefined;
    }
  }),
});

type LeadUpdateFormValues = z.infer<typeof leadUpdateSchema>

interface LeadDetailsFormProps {
  lead: LeadDetails
}

// Helper function to format date for datetime-local input
const formatDateForInput = (dateString: string | undefined): string => {
  if (!dateString) return ""
  
  try {
    const date = new Date(dateString)
    // Check if date is valid
    if (isNaN(date.getTime())) return ""
    
    // Format as YYYY-MM-DDThh:mm
    return date.toISOString().slice(0, 16)
  } catch (error) {
    console.error("Date formatting error:", error)
    return ""
  }
}

export function LeadDetailsForm({ lead }: LeadDetailsFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  
  // Initialize form with lead data
  const form = useForm<LeadUpdateFormValues>({
    resolver: zodResolver(leadUpdateSchema),
    defaultValues: {
      companyName: lead.companyName,
      website: lead.website || "",
      industry: lead.industry,
      fullName: lead.fullName,
      jobTitle: lead.jobTitle,
      email: lead.email,
      phone: lead.phone,
      teamSize: lead.teamSize,
      multipleOffices: lead.multipleOffices,
      status: lead.status,
      priority: lead.priority,
      assignedToUlid: lead.assignedToUlid || "",
      nextFollowUpDate: lead.nextFollowUpDate || "",
    },
  })
  
  async function onSubmit(data: LeadUpdateFormValues) {
    setIsLoading(true)
    
    try {
      const result = await updateLead(lead.ulid, data)
      
      if (result.error) {
        throw new Error("Failed to update lead")
      }
      
      toast.success("Lead updated successfully")
      router.refresh()
    } catch (error) {
      console.error("[LEAD_UPDATE_ERROR]", error)
      toast.error("Failed to update lead")
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Company Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Company Information</h3>
            
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
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
                          {industry.replace(/_/g, " ")}
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
              name="teamSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Size</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select team size" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="5-20">5-20</SelectItem>
                      <SelectItem value="20-50">20-50</SelectItem>
                      <SelectItem value="50-100">50-100</SelectItem>
                      <SelectItem value="100+">100+</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="multipleOffices"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Multiple Offices</FormLabel>
                  </div>
                </FormItem>
              )}
            />
          </div>
          
          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Contact Information</h3>
            
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="jobTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        {/* Lead Status */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Lead Status</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
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
                      {Object.values(LEAD_STATUS).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0) + status.slice(1).toLowerCase().replace("_", " ")}
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
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(LEAD_PRIORITY).map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          {priority.charAt(0) + priority.slice(1).toLowerCase()}
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
              name="nextFollowUpDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Next Follow-up Date</FormLabel>
                  <FormControl>
                    <Input 
                      type="datetime-local" 
                      value={formatDateForInput(field.value)}
                      onChange={(e) => {
                        // If the field is cleared, set to empty string
                        if (!e.target.value) {
                          field.onChange("")
                        } else {
                          field.onChange(e.target.value)
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <Button type="submit" className="bg-[#4472C4] hover:bg-[#3a62ab]" disabled={isLoading}>
          {isLoading ? "Updating..." : "Update Lead"}
        </Button>
      </form>
    </Form>
  )
}
