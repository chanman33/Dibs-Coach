"use client"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { submitContactSalesForm } from "@/utils/actions/contact-sales-actions"
import { contactSalesSchema, type ContactSalesFormData } from "@/utils/types/contact-sales"
import type { ZodError } from "zod"

// Helper function to normalize website URL
function normalizeUrl(url: string): string {
  if (!url) return ""
  
  // Remove whitespace
  url = url.trim()
  
  // If it's already a valid URL, return as is
  try {
    new URL(url)
    return url
  } catch {
    // Not a valid URL, let's fix it
    
    // Remove any protocol if present without //
    url = url.replace(/^[a-zA-Z]+:(?!\/)/, '')
    
    // Add https:// if no protocol is present
    if (!url.match(/^[a-zA-Z]+:\/\//)) {
      url = 'https://' + url
    }
    
    return url
  }
}

const formSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  website: z.string()
    .transform((val) => val.trim())
    .refine((val) => /^[a-zA-Z0-9][\w-]*(\.[a-zA-Z0-9][\w-]*)+$/.test(val) || /^https?:\/\//.test(val), {
      message: "Please enter a valid website (e.g., wedibs.com or https://wedibs.com)"
    })
    .transform((val) => normalizeUrl(val)),
  fullName: z.string().min(2, "Full name is required"),
  jobTitle: z.string().min(2, "Job title is required"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  teamSize: z.enum(["5-20", "20-50", "50-100", "100+"]),
  multipleOffices: z.enum(["yes", "no"]).transform(val => val === "yes")
})

type FormValues = Omit<ContactSalesFormData, 'multipleOffices'> & {
  multipleOffices: "yes" | "no"
}

interface ContactSalesFormProps {
  onSuccess?: () => void;
  className?: string;
}

export function ContactSalesForm({ onSuccess, className = "" }: ContactSalesFormProps) {
  const router = useRouter()
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      website: "",
      fullName: "",
      jobTitle: "",
      email: "",
      phone: "",
      teamSize: "5-20",
      multipleOffices: "no"
    }
  })

  async function onSubmit(values: FormValues) {
    try {
      const formData: ContactSalesFormData = {
        ...values,
        multipleOffices: values.multipleOffices === "yes"
      }

      const result = await submitContactSalesForm(formData)

      if (result.error) {
        if (result.error.code === 'VALIDATION_ERROR' && result.error.details) {
          Object.entries(result.error.details.fieldErrors).forEach(([field, errors]) => {
            if (errors?.[0]) {
              form.setError(field as keyof FormValues, { message: errors[0] })
            }
          })
          return
        }
        
        throw new Error(result.error.message)
      }

      toast.success("Form submitted successfully! Please check your email for next steps.")
      onSuccess?.()
      form.reset()
    } catch (error) {
      console.error("[CONTACT_SALES_SUBMIT_ERROR]", error)
      toast.error("Failed to submit form. Please try again.")
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={`space-y-6 ${className}`}>
        <FormField
          control={form.control}
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter your company name" {...field} />
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
                <Input placeholder="https://example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your full name" {...field} />
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
                  <Input placeholder="Enter your job title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your email" type="email" {...field} />
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
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your phone number" type="tel" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="teamSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Team Size</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team size" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="5-20">5-20 team members</SelectItem>
                    <SelectItem value="20-50">20-50 team members</SelectItem>
                    <SelectItem value="50-100">50-100 team members</SelectItem>
                    <SelectItem value="100+">100+ team members</SelectItem>
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
              <FormItem>
                <FormLabel>Multiple Offices Support?</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select yes or no" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full">Submit</Button>
      </form>
    </Form>
  )
} 