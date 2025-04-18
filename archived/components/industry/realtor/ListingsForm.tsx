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
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Database, ImagePlus, Trophy, DollarSign, Calendar, Home, Pencil, Search, Filter, Check, MoreVertical } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  createListingSchema, 
  type CreateListing, 
  getValidSubTypes, 
  PropertyTypeEnum, 
  ListingStatusEnum,
  type ListingWithRealtor 
} from "@/utils/types/listing"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Label } from "@/components/ui/label"

interface ListingsFormProps {
  onSubmit: (data: CreateListing) => Promise<{ data?: ListingWithRealtor | null; error?: string | null } | void>
  onUpdate?: (ulid: string, data: CreateListing) => Promise<{ data?: ListingWithRealtor | null; error?: string | null } | void>
  className?: string
  activeListings?: ListingWithRealtor[]
  successfulTransactions?: ListingWithRealtor[]
  isSubmitting?: boolean
}

export default function ListingsForm({
  onSubmit,
  onUpdate,
  className,
  activeListings = [],
  successfulTransactions = [],
  isSubmitting = false
}: ListingsFormProps) {
  const { toast } = useToast()
  const [editingListing, setEditingListing] = useState<ListingWithRealtor | null>(null)
  const [selectedListings, setSelectedListings] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"date" | "price" | "status">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [showDraftsOnly, setShowDraftsOnly] = useState(false)
  const form = useForm<CreateListing>({
    resolver: zodResolver(createListingSchema),
    defaultValues: {
      listingKey: "",
      mlsId: "",
      mlsSource: null,
      status: ListingStatusEnum.enum.ACTIVE,

      // Location Information
      streetNumber: "",
      streetName: "",
      unitNumber: "",
      city: "",
      stateOrProvince: "",
      postalCode: "",

      // Price Information
      listPrice: 0,
      originalListPrice: null,
      closePrice: null,

      // Dates
      listingContractDate: new Date(),
      closeDate: null,

      // Physical Characteristics
      propertyType: PropertyTypeEnum.enum.SINGLE_FAMILY,
      propertySubType: null,
      bedroomsTotal: 0,
      bathroomsTotal: 0,
      livingArea: null,
      yearBuilt: null,

      // Marketing Information
      publicRemarks: "",
      isFeatured: false,
      mlsLink: null,
      publicListingUrl: null,

      // Source Information
      source: "MANUAL" as const,
    },
  })

  useEffect(() => {
    console.log('[LISTINGS_FORM_MOUNT]', 'Form component mounted');
    return () => {
      console.log('[LISTINGS_FORM_UNMOUNT]', 'Form component unmounting');
    };
  }, []);

  // Reset form when editingListing changes
  useEffect(() => {
    if (editingListing) {
      // Map the listing data to match the form schema
      const formData: CreateListing = {
        listingKey: editingListing.listingKey || "",
        mlsSource: editingListing.mlsSource as CreateListing['mlsSource'],
        mlsId: editingListing.mlsId || null,
        parcelNumber: editingListing.parcelNumber || "",
        taxLot: editingListing.taxLot || "",
        taxBlock: editingListing.taxBlock || "",
        taxMapNumber: editingListing.taxMapNumber || "",
        taxLegalDescription: editingListing.taxLegalDescription || "",
        propertyType: editingListing.propertyType as CreateListing['propertyType'],
        propertySubType: editingListing.propertySubType as CreateListing['propertySubType'],
        status: editingListing.status as CreateListing['status'],
        streetNumber: editingListing.streetNumber || "",
        streetName: editingListing.streetName || "",
        unitNumber: editingListing.unitNumber || null,
        city: editingListing.city || "",
        stateOrProvince: editingListing.stateOrProvince || "",
        postalCode: editingListing.postalCode || "",
        listPrice: editingListing.listPrice || 0,
        originalListPrice: editingListing.originalListPrice || null,
        closePrice: editingListing.closePrice || null,
        listingContractDate: editingListing.listingContractDate ? new Date(editingListing.listingContractDate) : null,
        closeDate: editingListing.closeDate ? new Date(editingListing.closeDate) : null,
        bedroomsTotal: editingListing.bedroomsTotal || 0,
        bathroomsTotal: editingListing.bathroomsTotal || 0,
        livingArea: editingListing.livingArea || null,
        yearBuilt: editingListing.yearBuilt || null,
        publicRemarks: editingListing.publicRemarks || "",
        isFeatured: editingListing.isFeatured || false,
        mlsLink: editingListing.mlsLink || null,
        publicListingUrl: editingListing.publicListingUrl || null,
        source: "MANUAL",
        // Property Amenities with defaults
        isWaterfront: editingListing.isWaterfront || false,
        hasFireplace: editingListing.hasFireplace || false,
        hasPatio: editingListing.hasPatio || false,
        hasDeck: editingListing.hasDeck || false,
        hasPorch: editingListing.hasPorch || false,
        // Utilities with defaults
        electricityAvailable: editingListing.electricityAvailable || true,
        gasAvailable: editingListing.gasAvailable || true,
        sewerAvailable: editingListing.sewerAvailable || true,
        waterAvailable: editingListing.waterAvailable || true,
      };
      form.reset(formData);
    } else {
      form.reset({
        listingKey: "",
        mlsId: "",
        mlsSource: null,
        status: ListingStatusEnum.enum.ACTIVE,

        // Location Information
        streetNumber: "",
        streetName: "",
        unitNumber: "",
        city: "",
        stateOrProvince: "",
        postalCode: "",

        // Price Information
        listPrice: 0,
        originalListPrice: null,
        closePrice: null,

        // Dates
        listingContractDate: new Date(),
        closeDate: null,

        // Physical Characteristics
        propertyType: PropertyTypeEnum.enum.SINGLE_FAMILY,
        propertySubType: null,
        bedroomsTotal: 0,
        bathroomsTotal: 0,
        livingArea: null,
        yearBuilt: null,

        // Marketing Information
        publicRemarks: "",
        isFeatured: false,
        mlsLink: null,
        publicListingUrl: null,

        // Source Information
        source: "MANUAL" as const,
        
        // Property Features
        isWaterfront: false,
        hasFireplace: false,
        hasPatio: false,
        hasDeck: false,
        hasPorch: false,
        
        // Utilities
        electricityAvailable: true,
        gasAvailable: true,
        sewerAvailable: true,
        waterAvailable: true,
      });
    }
  }, [editingListing, form]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-green-100 text-green-800"
      case "Pending": return "bg-yellow-100 text-yellow-800"
      case "Closed": return "bg-blue-100 text-blue-800"
      case "Expired": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const filteredListings = (listings: ListingWithRealtor[]) => {
    return listings
      .filter(listing => {
        if (showDraftsOnly && listing.status !== ListingStatusEnum.enum.DRAFT) return false
        if (!searchQuery) return true
        return (
          listing.streetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          listing.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
          listing.listingKey.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })
      .sort((a, b) => {
        if (sortBy === "date") {
          const dateA = a.listingContractDate ? new Date(a.listingContractDate) : new Date(0)
          const dateB = b.listingContractDate ? new Date(b.listingContractDate) : new Date(0)
          return sortOrder === "desc" 
            ? dateB.getTime() - dateA.getTime()
            : dateA.getTime() - dateB.getTime()
        }
        if (sortBy === "price") {
          return sortOrder === "desc" 
            ? (b.listPrice || 0) - (a.listPrice || 0)
            : (a.listPrice || 0) - (b.listPrice || 0)
        }
        return 0
      })
  }

  const renderSuccessMetrics = () => {
    const totalVolume = successfulTransactions.reduce((sum, listing) => sum + (listing.closePrice || 0), 0)
    const averagePrice = totalVolume / (successfulTransactions.length || 1)
    const thisYear = successfulTransactions.filter(l => l.closeDate && new Date(l.closeDate).getFullYear() === new Date().getFullYear())
    const averageDaysOnMarket = successfulTransactions.reduce((sum, listing) => {
      const listDate = listing.listingContractDate ? new Date(listing.listingContractDate) : new Date()
      const closeDate = listing.closeDate ? new Date(listing.closeDate) : new Date()
      return sum + Math.floor((closeDate.getTime() - listDate.getTime()) / (1000 * 60 * 60 * 24))
    }, 0) / (successfulTransactions.length || 1)
    
    const monthlyData = successfulTransactions.reduce((acc: any[], listing) => {
      const closeDate = listing.closeDate ? new Date(listing.closeDate) : new Date()
      const monthYear = closeDate.toLocaleString('default', { month: 'short', year: '2-digit' })
      const existingMonth = acc.find(item => item.month === monthYear)
      if (existingMonth) {
        existingMonth.volume += listing.closePrice || 0
        existingMonth.count += 1
      } else {
        acc.push({ month: monthYear, volume: listing.closePrice || 0, count: 1 })
      }
      return acc
    }, [])

    const formatPrice = (price: number) => {
      if (price >= 1000000) {
        return `$${(price / 1000000).toFixed(1)}M`
      }
      return `$${(price / 1000).toFixed(0)}K`
    }
    
    return (
      <div className="space-y-8 mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="relative overflow-hidden group hover:shadow-md transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-yellow-100/50 dark:bg-yellow-500/20 rounded-lg group-hover:scale-105 transition-transform duration-300">
                  <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Successful Transactions</p>
                  <p className="text-2xl font-bold tracking-tight text-yellow-600 dark:text-yellow-400">
                    {successfulTransactions.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group hover:shadow-md transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-100/50 dark:bg-emerald-500/20 rounded-lg group-hover:scale-105 transition-transform duration-300">
                  <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Total Volume</p>
                  <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                    ${(totalVolume / 1000000).toFixed(1)}M
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group hover:shadow-md transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100/50 dark:bg-blue-500/20 rounded-lg group-hover:scale-105 transition-transform duration-300">
                  <Home className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Average Price</p>
                  <p className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                    {formatPrice(averagePrice)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group hover:shadow-md transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-100/50 dark:bg-purple-500/20 rounded-lg group-hover:scale-105 transition-transform duration-300">
                  <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Avg. Days on Market</p>
                  <p className="text-2xl font-bold tracking-tight text-purple-600 dark:text-purple-400">
                    {Math.round(averageDaysOnMarket)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction Volume Trend - Temporarily disabled until MLS sync
        <Card className="p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle>Transaction Volume Trend</CardTitle>
          </CardHeader>
          <div className="h-[200px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `$${(value/1000000).toFixed(1)}M`} />
                <Tooltip 
                  formatter={(value: any) => [`$${(value/1000000).toFixed(2)}M`, 'Volume']}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Bar dataKey="volume" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        */}
      </div>
    )
  }

  const renderListingCard = (listing: ListingWithRealtor | CreateListing) => (
    <ContextMenu>
      <ContextMenuTrigger>
        <Card 
          key={listing.listingKey} 
          className={cn(
            "mb-4 relative overflow-hidden transition-all duration-300 group",
            listing.isFeatured && "border-2 border-primary shadow-md",
            selectedListings.has(listing.listingKey) && "ring-2 ring-primary"
          )}
        >
          <CardContent className="pt-6">
            <div className="absolute top-2 left-2">
              <Checkbox
                checked={selectedListings.has(listing.listingKey)}
                onCheckedChange={(checked) => {
                  const newSelected = new Set(selectedListings)
                  if (checked) {
                    newSelected.add(listing.listingKey)
                  } else {
                    newSelected.delete(listing.listingKey)
                  }
                  setSelectedListings(newSelected)
                }}
              />
            </div>

            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">
                    {listing.streetNumber} {listing.streetName} {listing.unitNumber && `#${listing.unitNumber}`}
                  </h3>
                  {listing.isFeatured && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                      Featured
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {listing.city}, {listing.stateOrProvince} {listing.postalCode}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={cn("transition-colors", getStatusColor(listing.status || ""))}>
                  {listing.status || "Unknown"}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditingListing(listing as ListingWithRealtor)}>
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem>Duplicate</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="aspect-video bg-muted rounded-lg mb-4 overflow-hidden group-hover:opacity-90 transition-opacity">
              <div className="h-full w-full flex items-center justify-center">
                <ImagePlus className="h-8 w-8 text-muted-foreground" />
              </div>
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
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => setEditingListing(listing as ListingWithRealtor)}>
          Edit
        </ContextMenuItem>
        <ContextMenuItem>Duplicate</ContextMenuItem>
        <ContextMenuItem className="text-destructive">
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )

  const handleEditSubmit = async (data: CreateListing) => {
    if (!editingListing || !onUpdate) return

    console.log("[LISTINGS_FORM_EDIT_START]", {
      listingUlid: editingListing.ulid,
      formData: data,
      formState: form.formState,
      errors: form.formState.errors
    })

    try {
      const validationResult = await createListingSchema.safeParseAsync(data)
      
      if (!validationResult.success) {
        console.error("[LISTINGS_FORM_VALIDATION_ERROR]", {
          formData: data,
          zodErrors: validationResult.error.errors,
          formErrors: form.formState.errors
        })
        toast({
          title: "Validation Error",
          description: "Please check all required fields",
          variant: "destructive",
        })
        return
      }

      const result = await onUpdate(editingListing.ulid, validationResult.data)
      
      if (result && 'error' in result && result.error) {
        console.error("[LISTINGS_FORM_ERROR]", result.error)
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      if (result && 'data' in result && result.data) {
        console.log("[LISTINGS_FORM_SUCCESS]", "Listing updated:", result.data)
        toast({
          title: "Success",
          description: "Listing updated successfully",
        })
        setEditingListing(null)
      }
    } catch (error) {
      console.error("[LISTINGS_FORM_ERROR]", "Update failed:", error)
      toast({
        title: "Error",
        description: "Failed to update listing. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (data: CreateListing) => {
    console.log("[LISTINGS_FORM_SUBMIT_START]", {
      formData: data,
      formState: form.formState,
      errors: form.formState.errors
    });

    try {
      const validationResult = await createListingSchema.safeParseAsync(data);
      
      if (!validationResult.success) {
        console.error("[LISTINGS_FORM_VALIDATION_ERROR]", {
          formData: data,
          zodErrors: validationResult.error.errors,
          formErrors: form.formState.errors
        });
        toast({
          title: "Validation Error",
          description: "Please check all required fields",
          variant: "destructive",
        });
        return;
      }

      const result = await onSubmit(validationResult.data);
      
      if (result && 'error' in result && result.error) {
        console.error("[LISTINGS_FORM_ERROR]", result.error);
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      if (result && 'data' in result && result.data) {
        console.log("[LISTINGS_FORM_SUCCESS]", "Listing created:", result.data);
        toast({
          title: "Success",
          description: "Listing created successfully",
        });
        form.reset();
      }
    } catch (error) {
      console.error("[LISTINGS_FORM_ERROR]", "Submission failed:", error);
      toast({
        title: "Error",
        description: "Failed to create listing. Please try again.",
        variant: "destructive",
      });
    }
  }

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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <TabsList>
                <TabsTrigger value="active">Active Listings ({activeListings.length})</TabsTrigger>
                <TabsTrigger value="successful">Successful Transactions ({successfulTransactions.length})</TabsTrigger>
                <TabsTrigger value="add">Add New Listing</TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search listings..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[200px]">
                    <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => setSortBy("date")}>
                      Date {sortBy === "date" && <Check className="h-4 w-4 ml-2" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("price")}>
                      Price {sortBy === "price" && <Check className="h-4 w-4 ml-2" />}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}>
                      {sortOrder === "asc" ? "Ascending" : "Descending"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowDraftsOnly(!showDraftsOnly)}>
                      {showDraftsOnly ? "Show All" : "Show Drafts Only"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <TabsContent value="active">
              <ScrollArea className="h-[600px] pr-6">
                <div className="space-y-4">
                  {selectedListings.size > 0 && (
                    <div className="flex items-center justify-between bg-muted/50 p-2 rounded-lg mb-4">
                      <span className="text-sm">{selectedListings.size} listings selected</span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Set Featured
                        </Button>
                        <Button variant="outline" size="sm" className="text-destructive">
                          Delete Selected
                        </Button>
                      </div>
                    </div>
                  )}
                  {filteredListings(activeListings).length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No active listings to display.</p>
                  ) : (
                    filteredListings(activeListings)
                      .sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0))
                      .map(renderListingCard)
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
                    [...successfulTransactions]
                      .sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0))
                      .map(renderListingCard)
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="add">
              <Form {...form}>
                <form 
                  onSubmit={form.handleSubmit(
                    handleSubmit,
                    (errors) => {
                      console.error("[LISTINGS_FORM_VALIDATION_ERROR]", {
                        formData: form.getValues(),
                        validationErrors: errors,
                        schema: createListingSchema
                      });
                      toast({
                        title: "Validation Error",
                        description: "Please check all required fields",
                        variant: "destructive",
                      });
                    }
                  )} 
                  className="space-y-8"
                >
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
                                <FormLabel>Street Number<span className="text-destructive ml-1">*</span></FormLabel>
                                <FormControl>
                                  <Input {...field} required />
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
                                <FormLabel>Street Name<span className="text-destructive ml-1">*</span></FormLabel>
                                <FormControl>
                                  <Input {...field} required />
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
                                <FormLabel>City<span className="text-destructive ml-1">*</span></FormLabel>
                                <FormControl>
                                  <Input {...field} required />
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
                                <FormLabel>State<span className="text-destructive ml-1">*</span></FormLabel>
                                <FormControl>
                                  <Input {...field} required />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="postalCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Postal Code<span className="text-destructive ml-1">*</span></FormLabel>
                                <FormControl>
                                  <Input {...field} required />
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
                                    onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
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
                                    onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="closeDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Close Date (if sold)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="date" 
                                    {...field}
                                    value={field.value ? (field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value.split('T')[0]) : ''}
                                    onChange={e => field.onChange(e.target.value ? new Date(e.target.value) : null)}
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
                                    <SelectGroup>
                                      <SelectLabel>Active Statuses</SelectLabel>
                                      <SelectItem value="Active">Active</SelectItem>
                                      <SelectItem value="ActiveUnderContract">Active Under Contract</SelectItem>
                                      <SelectItem value="ComingSoon">Coming Soon</SelectItem>
                                    </SelectGroup>
                                    
                                    <SelectGroup>
                                      <SelectLabel>Under Contract</SelectLabel>
                                      <SelectItem value="Pending">Pending</SelectItem>
                                      <SelectItem value="Hold">On Hold</SelectItem>
                                    </SelectGroup>

                                    <SelectGroup>
                                      <SelectLabel>Completed</SelectLabel>
                                      <SelectItem value="Closed">Closed</SelectItem>
                                    </SelectGroup>

                                    <SelectGroup>
                                      <SelectLabel>Inactive</SelectLabel>
                                      <SelectItem value="Canceled">Canceled</SelectItem>
                                      <SelectItem value="Expired">Expired</SelectItem>
                                      <SelectItem value="Withdrawn">Withdrawn</SelectItem>
                                    </SelectGroup>

                                    <SelectGroup>
                                      <SelectLabel>Other</SelectLabel>
                                      <SelectItem value="Incomplete">Incomplete</SelectItem>
                                      <SelectItem value="Delete">Delete</SelectItem>
                                    </SelectGroup>
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
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Residential">Residential</SelectItem>
                                    <SelectItem value="CommercialLease">Commercial (Lease)</SelectItem>
                                    <SelectItem value="CommercialSale">Commercial (Sale)</SelectItem>
                                    <SelectItem value="Farm">Farm</SelectItem>
                                    <SelectItem value="Land">Land</SelectItem>
                                    <SelectItem value="ManufacturedInPark">Manufactured In Park</SelectItem>
                                    <SelectItem value="BusinessOpportunity">Business Opportunity</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="propertySubType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Property Sub-Type</FormLabel>
                                <Select 
                                  onValueChange={field.onChange} 
                                  value={field.value || undefined}
                                  disabled={!form.watch("propertyType")}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select sub-type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {getValidSubTypes(form.watch("propertyType")).map((subType) => (
                                      <SelectItem key={subType} value={subType}>
                                        {subType.replace(/([A-Z])/g, ' $1').trim()}
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
                            name="livingArea"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Square Footage</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field}
                                    value={field.value || ''}
                                    onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="bedroomsTotal"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Bedrooms</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field}
                                    value={field.value || ''}
                                    onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="bathroomsTotal"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Bathrooms</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field}
                                    value={field.value || ''}
                                    step="0.5"
                                    onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
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
                            name="mlsLink"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>MLS Link</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field}
                                    type="url"
                                    value={field.value || ''}
                                    placeholder="Enter MLS listing URL"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="publicListingUrl"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Public Listing URL</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field}
                                    type="url"
                                    value={field.value || ''}
                                    placeholder="Enter Zillow, Redfin, or other public listing URL"
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
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => {
                        const formData = form.getValues();
                        formData.status = ListingStatusEnum.enum.DRAFT;
                        onSubmit(formData);
                        toast({
                          title: "Draft Saved",
                          description: "Your listing has been saved as a draft",
                        });
                      }}
                    >
                      Save as Draft
                    </Button>
                    <Button 
                      type="submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Publishing..." : "Publish Listing"}
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