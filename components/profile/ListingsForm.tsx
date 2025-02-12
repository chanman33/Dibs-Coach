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
import { Database, ImagePlus, Trophy, DollarSign, Calendar, Home } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { createListingSchema, type CreateListing, listingFormFields } from "@/utils/types/listing"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ListingsFormProps {
  onSubmit: (data: CreateListing) => void
  className?: string
  activeListings?: CreateListing[]
  successfulTransactions?: CreateListing[]
}

export default function ListingsForm({ onSubmit, className, activeListings = [], successfulTransactions = [] }: ListingsFormProps) {
  const form = useForm<CreateListing>({
    resolver: zodResolver(createListingSchema),
    defaultValues: {
      // Core Identification
      listingKey: "",
      mlsId: "",
      mlsSource: null,
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
      propertyType: undefined,
      bedroomsTotal: null,
      bathroomsTotal: null,
      livingArea: null,
      yearBuilt: null,

      // Marketing Information
      publicRemarks: "",
      isFeatured: false,

      // Source Information
      source: "MANUAL",
    },
  })

  const renderSuccessMetrics = () => {
    const totalVolume = successfulTransactions.reduce((sum, listing) => sum + (listing.closePrice || 0), 0)
    const averagePrice = totalVolume / (successfulTransactions.length || 1)
    const thisYear = successfulTransactions.filter(l => l.closeDate && new Date(l.closeDate).getFullYear() === new Date().getFullYear())
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Successful Transactions</p>
                <p className="text-2xl font-bold">{successfulTransactions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Total Volume</p>
                <p className="text-2xl font-bold">${(totalVolume / 1000000).toFixed(1)}M</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Home className="h-4 w-4 text-blue-500" />
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Average Price</p>
                <p className="text-2xl font-bold">${(averagePrice / 1000).toFixed(0)}K</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-purple-500" />
              <div className="space-y-0.5">
                <p className="text-sm font-medium">This Year</p>
                <p className="text-2xl font-bold">{thisYear.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderListingCard = (listing: CreateListing) => (
    <Card key={listing.listingKey} className="mb-4">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold">
              {listing.streetNumber} {listing.streetName} {listing.unitNumber && `#${listing.unitNumber}`}
            </h3>
            <p className="text-sm text-muted-foreground">
              {listing.city}, {listing.stateOrProvince} {listing.postalCode}
            </p>
          </div>
          <Badge variant={listing.status === "Active" ? "default" : "secondary"}>
            {listing.status}
          </Badge>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">List Price</p>
            <p className="font-medium">${listing.listPrice?.toLocaleString()}</p>
          </div>
          {listing.closePrice && (
            <div>
              <p className="text-muted-foreground">Sold Price</p>
              <p className="font-medium">${listing.closePrice.toLocaleString()}</p>
            </div>
          )}
          <div>
            <p className="text-muted-foreground">Property Type</p>
            <p className="font-medium">{listing.propertyType}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Size</p>
            <p className="font-medium">{listing.livingArea} sqft</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
            <div className="space-y-1">
              <h3 className="text-2xl font-semibold leading-none tracking-tight">My Listings & Transactions</h3>
              <p className="text-sm text-muted-foreground">
                Showcase your real estate success and active listings.
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

          {renderSuccessMetrics()}

          <Tabs defaultValue="active" className="w-full">
            <TabsList>
              <TabsTrigger value="active">Active Listings ({activeListings.length})</TabsTrigger>
              <TabsTrigger value="successful">Successful Transactions ({successfulTransactions.length})</TabsTrigger>
              <TabsTrigger value="add">Add New Listing</TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              <ScrollArea className="h-[600px] pr-6">
                <div className="space-y-4">
                  {activeListings.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No active listings to display.</p>
                  ) : (
                    activeListings.map(renderListingCard)
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="successful">
              <ScrollArea className="h-[600px] pr-6">
                <div className="space-y-4">
                  {successfulTransactions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No successful transactions to display.</p>
                  ) : (
                    successfulTransactions.map(renderListingCard)
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="add">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <ScrollArea className="h-[600px] pr-6">
                    <div className="space-y-8">
                      {/* MLS Information */}
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <h4 className="text-sm font-semibold">MLS Information</h4>
                          <Separator className="flex-1 ml-3" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="listingKey"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  MLS Key/ID
                                  <span className="text-destructive ml-1">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field}
                                    value={field.value || ''}
                                    placeholder="Enter MLS listing key/ID"
                                    required
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="mlsSource"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>MLS Source</FormLabel>
                                <Select 
                                  onValueChange={field.onChange} 
                                  value={field.value || undefined}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select MLS system" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {/* Major Regional MLS Systems */}
                                    <SelectItem value="BRIGHT_MLS">Bright MLS (Mid-Atlantic)</SelectItem>
                                    <SelectItem value="CRMLS">California Regional MLS</SelectItem>
                                    <SelectItem value="STELLAR_MLS">Stellar MLS (Florida)</SelectItem>
                                    <SelectItem value="NWMLS">Northwest MLS</SelectItem>
                                    <SelectItem value="GAMLS">Georgia MLS</SelectItem>
                                    <SelectItem value="HAR">Houston Association of REALTORS</SelectItem>
                                    <SelectItem value="MRED">Midwest Real Estate Data</SelectItem>
                                    <SelectItem value="ARMLS">Arizona Regional MLS</SelectItem>
                                    <SelectItem value="MRIS">Metropolitan Regional Information Systems</SelectItem>
                                    <SelectItem value="REALTRACS">RealTracs (Tennessee)</SelectItem>
                                    <SelectItem value="URE">UtahRealEstate.com (Utah)</SelectItem>
                                    <SelectItem value="WFRMLS">Wasatch Front Regional MLS (Utah)</SelectItem>
                                    
                                    {/* Additional Major Systems */}
                                    <SelectItem value="ACTRIS">Austin/Central Texas (ACTRIS)</SelectItem>
                                    <SelectItem value="CLAW">Combined LA/Westside (CLAW)</SelectItem>
                                    <SelectItem value="GLVAR">Greater Las Vegas (GLVAR)</SelectItem>
                                    <SelectItem value="MFRMLS">My Florida Regional (MFRMLS)</SelectItem>
                                    <SelectItem value="MIBOR">Metropolitan Indianapolis (MIBOR)</SelectItem>
                                    <SelectItem value="MLSPIN">MLS PIN (New England)</SelectItem>
                                    <SelectItem value="RMLS">Regional MLS (Portland)</SelectItem>
                                    <SelectItem value="SABOR">San Antonio Board of REALTORS</SelectItem>
                                    <SelectItem value="TREND">TREND MLS (Philadelphia)</SelectItem>
                                    
                                    {/* Generic Options */}
                                    <SelectItem value="OTHER_RESO">Other RESO-certified MLS</SelectItem>
                                    <SelectItem value="OTHER">Other MLS System</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Location Information */}
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <h4 className="text-sm font-semibold">Location</h4>
                          <Separator className="flex-1 ml-3" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="streetNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Street Number</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="streetName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Street Name</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>City</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="stateOrProvince"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>State</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Price Information */}
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <h4 className="text-sm font-semibold">Price & Status</h4>
                          <Separator className="flex-1 ml-3" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="listPrice"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>List Price</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field}
                                    value={field.value || ''}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="closePrice"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Close Price (if sold)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field}
                                    value={field.value || ''}
                                  />
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
                                <FormLabel>Status</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Active">Active</SelectItem>
                                    <SelectItem value="Closed">Closed</SelectItem>
                                    <SelectItem value="Pending">Pending</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Property Details */}
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <h4 className="text-sm font-semibold">Property Details</h4>
                          <Separator className="flex-1 ml-3" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="propertyType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Property Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Residential">Residential</SelectItem>
                                    <SelectItem value="Commercial">Commercial</SelectItem>
                                    <SelectItem value="Land">Land</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="livingArea"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Square Footage</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field}
                                    value={field.value || ''}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Marketing Information */}
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <h4 className="text-sm font-semibold">Marketing</h4>
                          <Separator className="flex-1 ml-3" />
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          <FormField
                            control={form.control}
                            name="publicRemarks"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Public Description</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    {...field}
                                    value={field.value || ''}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="isFeatured"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>
                                    Feature this listing
                                  </FormLabel>
                                  <p className="text-sm text-muted-foreground">
                                    Featured listings appear prominently on your profile
                                  </p>
                                </div>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

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
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  )
} 