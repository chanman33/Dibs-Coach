"use client"

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
import { Badge } from "@/components/ui/badge"
import { Database } from "lucide-react"

const listingSchema = z.object({
  propertyType: z.enum(["RESIDENTIAL", "COMMERCIAL", "LAND", "MULTI_FAMILY"], {
    required_error: "Please select a property type",
  }),
  listingStatus: z.enum(["ACTIVE", "PENDING", "SOLD", "WITHDRAWN"], {
    required_error: "Please select a listing status",
  }),
  price: z.string().min(1, "Price is required"),
  location: z.string().min(1, "Location is required"),
  description: z.string().min(1, "Description is required"),
  dateAdded: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
})

type ListingFormValues = z.infer<typeof listingSchema>

interface ListingsFormProps {
  onSubmit: (data: ListingFormValues) => void
}

export default function ListingsForm({ onSubmit }: ListingsFormProps) {
  const form = useForm<ListingFormValues>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      propertyType: undefined,
      listingStatus: undefined,
      price: "",
      location: "",
      description: "",
      dateAdded: new Date().toISOString().split('T')[0],
      notes: "",
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
        <div className="text-sm text-muted-foreground">
          Track your property listings and their current status.
        </div>
        <div className="relative inline-flex">
          <Button disabled className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Connect to MLS
          </Button>
          <Badge variant="secondary" className="absolute -top-2 -right-2 text-xs">
            Coming Soon
          </Badge>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="propertyType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Property Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select property type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="RESIDENTIAL">Residential</SelectItem>
                    <SelectItem value="COMMERCIAL">Commercial</SelectItem>
                    <SelectItem value="LAND">Land</SelectItem>
                    <SelectItem value="MULTI_FAMILY">Multi-Family</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="listingStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Listing Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select listing status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="SOLD">Sold</SelectItem>
                    <SelectItem value="WITHDRAWN">Withdrawn</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Listing Price</FormLabel>
                <FormControl>
                  <Input placeholder="Enter listing price" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder="Enter property location" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Property Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter property details..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dateAdded"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date Added</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Any additional notes about the listing..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit">Add Listing</Button>
        </form>
      </Form>
    </div>
  )
} 