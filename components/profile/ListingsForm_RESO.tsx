"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
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
import { Database, ImagePlus } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { createListingSchema, type CreateListing, listingFormFields } from "@/utils/types/listing"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

interface ListingsFormProps {
  onSubmit: (data: CreateListing) => void
  className?: string
}

export default function ListingsForm({ onSubmit, className }: ListingsFormProps) {
  const form = useForm<CreateListing>({
    resolver: zodResolver(createListingSchema),
    defaultValues: {
      // Core Identification
      listingKey: null,
      parcelNumber: null,
      taxLot: null,
      taxBlock: null,
      taxMapNumber: null,
      taxLegalDescription: null,

      // Property Classification
      propertyType: undefined,
      propertySubType: null,
      status: "Active",

      // Location Information
      streetNumber: "",
      streetName: "",
      unitNumber: null,
      city: "",
      stateOrProvince: "",
      postalCode: "",

      // Price Information
      listPrice: null,
      originalListPrice: null,
      closePrice: null,

      // Dates
      listingContractDate: new Date(),
      closeDate: null,

      // Physical Characteristics
      bedroomsTotal: null,
      bathroomsTotal: null,
      livingArea: null,
      lotSize: null,
      yearBuilt: null,
      stories: null,

      // Property Features
      furnished: null,
      appliances: [],
      interiorFeatures: [],
      exteriorFeatures: [],
      heating: [],
      cooling: [],

      // Property Amenities
      isWaterfront: false,
      hasFireplace: false,
      hasPatio: false,
      hasDeck: false,
      hasPorch: false,

      // Source Information
      source: "MANUAL",
      isFeatured: false,
    },
  })

  const renderFormField = (field: typeof listingFormFields[number], formField: any) => {
    switch (field.type) {
      case "select":
        return (
          <Select
            onValueChange={formField.onChange}
            defaultValue={String(formField.value || "")}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      case "textarea":
        return (
          <Textarea
            placeholder={field.placeholder}
            value={String(formField.value || "")}
            onChange={(e) => formField.onChange(e.target.value)}
          />
        )
      case "checkbox":
        return (
          <Checkbox
            checked={Boolean(formField.value)}
            onCheckedChange={formField.onChange}
          />
        )
      case "date":
        return (
          <Input
            type="date"
            value={formField.value instanceof Date ? formField.value.toISOString().split('T')[0] : String(formField.value || "")}
            onChange={(e) => formField.onChange(new Date(e.target.value))}
          />
        )
      default:
        return (
          <Input
            type={field.type}
            placeholder={field.placeholder}
            value={String(formField.value || "")}
            onChange={(e) => formField.onChange(field.type === "number" ? Number(e.target.value) : e.target.value)}
          />
        )
    }
  }

  // Group form fields by section
  const renderFormSection = (title: string, fields: typeof listingFormFields) => (
    <div className="space-y-4">
      <div className="flex items-center">
        <h4 className="text-sm font-semibold">{title}</h4>
        <Separator className="flex-1 ml-3" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => (
          <FormField
            key={field.name}
            control={form.control}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem className={field.type === "textarea" ? "md:col-span-2" : undefined}>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  {renderFormField(field, formField)}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
      </div>
    </div>
  )

  // Filter fields by section
  const getFieldsBySection = (sectionName: string) => {
    return listingFormFields.filter(field => {
      switch (sectionName) {
        case "Core Identification":
          return ["listingKey", "parcelNumber", "taxLot", "taxBlock", "taxMapNumber", "taxLegalDescription"].includes(field.name);
        case "Property Classification":
          return ["propertyType", "propertySubType", "status"].includes(field.name);
        case "Location":
          return ["streetNumber", "streetName", "unitNumber", "city", "stateOrProvince", "postalCode"].includes(field.name);
        case "Price & Dates":
          return ["listPrice", "originalListPrice", "closePrice", "listingContractDate", "closeDate"].includes(field.name);
        case "Physical Characteristics":
          return ["bedroomsTotal", "bathroomsTotal", "livingArea", "lotSize", "yearBuilt", "stories"].includes(field.name);
        case "Property Features":
          return ["furnished", "appliances", "interiorFeatures", "exteriorFeatures", "heating", "cooling"].includes(field.name);
        case "Property Amenities":
          return ["isWaterfront", "hasFireplace", "hasPatio", "hasDeck", "hasPorch"].includes(field.name);
        case "Description":
          return ["publicRemarks", "privateRemarks"].includes(field.name);
        default:
          return false;
      }
    });
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">Add New Listing</h3>
              <p className="text-sm text-muted-foreground">
                Create a new property listing with RESO-compliant information.
              </p>
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <ScrollArea className="h-[600px] pr-6">
                <div className="space-y-8">
                  {renderFormSection("Core Identification", getFieldsBySection("Core Identification"))}
                  {renderFormSection("Property Classification", getFieldsBySection("Property Classification"))}
                  {renderFormSection("Location", getFieldsBySection("Location"))}
                  {renderFormSection("Price & Dates", getFieldsBySection("Price & Dates"))}
                  {renderFormSection("Physical Characteristics", getFieldsBySection("Physical Characteristics"))}
                  {renderFormSection("Property Features", getFieldsBySection("Property Features"))}
                  {renderFormSection("Property Amenities", getFieldsBySection("Property Amenities"))}
                  {renderFormSection("Description", getFieldsBySection("Description"))}

                  {/* Image Upload Section */}
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <h4 className="text-sm font-semibold">Property Photos</h4>
                      <Separator className="flex-1 ml-3" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-32 flex flex-col items-center justify-center gap-2"
                      >
                        <ImagePlus className="h-8 w-8" />
                        <span className="text-xs">Add Photo</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <div className="flex justify-end gap-4 pt-4 border-t">
                <Button type="button" variant="outline">
                  Save as Draft
                </Button>
                <Button type="submit">
                  Publish Listing
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </CardContent>
    </Card>
  )
} 