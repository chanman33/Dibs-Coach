"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { WithOrganizationAuth } from "@/components/auth/with-organization-auth"
import { zodResolver } from "@hookform/resolvers/zod"
import { Building2, ImageIcon, Loader2, X } from "lucide-react"
import Image from "next/image"
import * as z from "zod"
import { useForm } from "react-hook-form"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkEmoji from 'remark-emoji'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

const propertyFormSchema = z.object({
  address: z.string().min(1, "Address is required"),
  propertyType: z.string().min(1, "Property type is required"),
  bedrooms: z.string().min(1, "Number of bedrooms is required"),
  bathrooms: z.string().min(1, "Number of bathrooms is required"),
  squareFootage: z.string().min(1, "Square footage is required"),
  price: z.string().min(1, "Price is required"),
  keyFeatures: z.string().min(1, "Key features are required"),
  targetAudience: z.string().min(1, "Target audience is required"),
  tone: z.string().min(1, "Tone is required"),
  frontImage: z.any().optional(),
  kitchenImage: z.any().optional(),
  mainRoomImage: z.any().optional(),
})

export default function AIListingGenerator() {
  const [generatedListing, setGeneratedListing] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [frontImagePreview, setFrontImagePreview] = useState<string | null>(null)
  const [kitchenImagePreview, setKitchenImagePreview] = useState<string | null>(null)
  const [mainRoomImagePreview, setMainRoomImagePreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [timeoutWarning, setTimeoutWarning] = useState(false)
  
  // Add timeout warning after 20 seconds
  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    if (isGenerating) {
      timeoutId = setTimeout(() => {
        setTimeoutWarning(true)
      }, 20000)
    }
    return () => {
      clearTimeout(timeoutId)
      setTimeoutWarning(false)
    }
  }, [isGenerating])

  const form = useForm<z.infer<typeof propertyFormSchema>>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      address: "",
      propertyType: "",
      bedrooms: "",
      bathrooms: "",
      squareFootage: "",
      price: "",
      keyFeatures: "",
      targetAudience: "",
      tone: "",
      frontImage: undefined,
      kitchenImage: undefined,
      mainRoomImage: undefined,
    },
  })

  const handleImageUpload = (file: File, setPreview: (url: string | null) => void) => {
    if (!file) return

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError("Invalid file type. Please upload a JPEG, PNG, or WebP image.")
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("File size too large. Maximum size is 5MB.")
      return
    }

    const url = URL.createObjectURL(file)
    setPreview(url)
    setError(null)
  }

  const clearImage = (
    fieldName: "frontImage" | "kitchenImage" | "mainRoomImage",
    setPreview: (url: string | null) => void
  ) => {
    form.setValue(fieldName, undefined)
    setPreview(null)
  }

  async function onSubmit(values: z.infer<typeof propertyFormSchema>) {
    setIsGenerating(true)
    setError(null)
    setTimeoutWarning(false)

    try {
      const formData = new FormData()
      
      // Add all text fields
      Object.entries(values).forEach(([key, value]) => {
        if (value instanceof File) {
          formData.append(key, value)
        } else if (value !== undefined && value !== null) {
          formData.append(key, String(value))
        }
      })

      const response = await fetch("/api/generate-listing", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || data.error?.details?.message || "Failed to generate listing")
      }

      if (!data.data?.listing) {
        throw new Error("No listing content received")
      }

      setGeneratedListing(data.data.listing)
    } catch (error) {
      console.error("Error generating listing:", error)
      setError(error instanceof Error ? error.message : "Failed to generate listing")
    } finally {
      setIsGenerating(false)
      setTimeoutWarning(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">AI Listing Generator</h1>
        <p className="text-muted-foreground">
          Generate professional property listings using AI. Fill in the details below and let AI create compelling content for your listings.
        </p>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-lg">
          {error}
        </div>
      )}

      {timeoutWarning && isGenerating && (
        <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg">
          This is taking longer than usual. Please wait while we process your images and generate the listing...
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Property Details</CardTitle>
            <CardDescription>
              Enter the property information to generate a listing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main Street, City, State" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          <SelectItem value="single-family">Single Family Home</SelectItem>
                          <SelectItem value="condo">Condominium</SelectItem>
                          <SelectItem value="townhouse">Townhouse</SelectItem>
                          <SelectItem value="multi-family">Multi-Family Home</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="bedrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bedrooms</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="3" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bathrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bathrooms</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="2" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="squareFootage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Square Footage</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="2000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="450000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="keyFeatures"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Key Features</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Updated kitchen, hardwood floors, large backyard..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="targetAudience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Audience</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select target audience" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="first-time">First-time Buyers</SelectItem>
                          <SelectItem value="luxury">Luxury Buyers</SelectItem>
                          <SelectItem value="investors">Investors</SelectItem>
                          <SelectItem value="families">Growing Families</SelectItem>
                          <SelectItem value="retirees">Retirees</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Listing Tone</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select tone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="luxury">Luxury & Sophisticated</SelectItem>
                          <SelectItem value="friendly">Warm & Friendly</SelectItem>
                          <SelectItem value="modern">Modern & Fresh</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="frontImage"
                    render={({ field: { onChange, value, ...field } }) => (
                      <FormItem>
                        <FormLabel>Front of House Image (Optional)</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <Input
                              type="file"
                              accept={ACCEPTED_IMAGE_TYPES.join(",")}
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  onChange(file)
                                  handleImageUpload(file, setFrontImagePreview)
                                }
                              }}
                              {...field}
                            />
                            {frontImagePreview && (
                              <div className="relative w-full h-48">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute top-2 right-2 z-10 bg-white rounded-full"
                                  onClick={() => clearImage("frontImage", setFrontImagePreview)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                                <Image
                                  src={frontImagePreview}
                                  alt="Front of house preview"
                                  className="rounded-lg object-cover"
                                  fill
                                />
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormDescription>
                          Upload an image of the front of the house (max 5MB)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="kitchenImage"
                    render={({ field: { onChange, value, ...field } }) => (
                      <FormItem>
                        <FormLabel>Kitchen Image (Optional)</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <Input
                              type="file"
                              accept={ACCEPTED_IMAGE_TYPES.join(",")}
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  onChange(file)
                                  handleImageUpload(file, setKitchenImagePreview)
                                }
                              }}
                              {...field}
                            />
                            {kitchenImagePreview && (
                              <div className="relative w-full h-48">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute top-2 right-2 z-10 bg-white rounded-full"
                                  onClick={() => clearImage("kitchenImage", setKitchenImagePreview)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                                <Image
                                  src={kitchenImagePreview}
                                  alt="Kitchen preview"
                                  className="rounded-lg object-cover"
                                  fill
                                />
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormDescription>
                          Upload an image of the kitchen (max 5MB)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mainRoomImage"
                    render={({ field: { onChange, value, ...field } }) => (
                      <FormItem>
                        <FormLabel>Main Room Image (Optional)</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <Input
                              type="file"
                              accept={ACCEPTED_IMAGE_TYPES.join(",")}
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  onChange(file)
                                  handleImageUpload(file, setMainRoomImagePreview)
                                }
                              }}
                              {...field}
                            />
                            {mainRoomImagePreview && (
                              <div className="relative w-full h-48">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute top-2 right-2 z-10 bg-white rounded-full"
                                  onClick={() => clearImage("mainRoomImage", setMainRoomImagePreview)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                                <Image
                                  src={mainRoomImagePreview}
                                  alt="Main room preview"
                                  className="rounded-lg object-cover"
                                  fill
                                />
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormDescription>
                          Upload an image of the main living area (max 5MB)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {timeoutWarning ? "Still generating..." : "Generating..."}
                    </>
                  ) : (
                    "Generate Listing"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generated Listing</CardTitle>
            <CardDescription>
              Your AI-generated property listing will appear here
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generatedListing ? (
              <div className="prose max-w-none dark:prose-invert">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm, remarkEmoji]}
                  components={{
                    strong: ({node, ...props}) => <span className="font-bold" {...props} />
                  }}
                >
                  {generatedListing}
                </ReactMarkdown>
                <Button 
                  className="mt-4"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedListing)
                  }}
                >
                  Copy to Clipboard
                </Button>
              </div>
            ) : (
              <div className="flex h-[400px] items-center justify-center text-center text-muted-foreground">
                <p>Fill out the form and click "Generate Listing" to create your AI-powered property description</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
