"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { addLeadNote } from "@/utils/actions/lead-actions"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

// Schema for the interaction form
const interactionSchema = z.object({
  content: z.string().min(1, "Interaction content is required"),
  type: z.enum(["NOTE", "EMAIL", "CALL", "MEETING"], {
    required_error: "Please select an interaction type",
  }),
})

type InteractionFormValues = z.infer<typeof interactionSchema>

interface LeadInteractionFormProps {
  leadId: string
}

export function LeadInteractionForm({ leadId }: LeadInteractionFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  
  // Initialize form
  const form = useForm<InteractionFormValues>({
    resolver: zodResolver(interactionSchema),
    defaultValues: {
      content: "",
      type: "NOTE",
    },
  })
  
  async function onSubmit(data: InteractionFormValues) {
    setIsLoading(true)
    
    try {
      // Get current user info (in a real app, this would come from auth)
      const currentUser = "System User" // Replace with actual user name
      
      const result = await addLeadNote(leadId, {
        content: data.content,
        type: data.type,
        createdBy: currentUser,
      })
      
      if (result.error) {
        throw new Error("Failed to add interaction")
      }
      
      toast.success("Interaction added successfully")
      form.reset()
      router.refresh()
    } catch (error) {
      console.error("[LEAD_INTERACTION_ERROR]", error)
      toast.error("Failed to add interaction")
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Interaction Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select interaction type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="NOTE">Note</SelectItem>
                  <SelectItem value="EMAIL">Email</SelectItem>
                  <SelectItem value="CALL">Phone Call</SelectItem>
                  <SelectItem value="MEETING">Meeting</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Interaction Details</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter details about the interaction..."
                  className="min-h-[200px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="bg-[#4472C4] hover:bg-[#3a62ab]" disabled={isLoading}>
          {isLoading ? "Adding..." : "Add Interaction"}
        </Button>
      </form>
    </Form>
  )
}
