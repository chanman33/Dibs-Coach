"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { 
  Building2, 
  Calendar, 
  DollarSign, 
  ImagePlus, 
  MapPin, 
  MoreVertical,
  Plus, 
  Tag, 
  Trash2,
  Trophy,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PortfolioItem,
  PortfolioItemType,
  CreatePortfolioItem,
  UpdatePortfolioItem,
  createPortfolioItemSchema,
  updatePortfolioItemSchema,
  PORTFOLIO_ITEM_TYPE_LABELS,
  PORTFOLIO_ITEM_TYPE_COLORS,
  PortfolioItemTypeEnum,
} from "@/utils/types/portfolio";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ImageUpload } from "@/components/ui/image-upload";
import { uploadPortfolioImage } from "@/utils/actions/portfolio-actions";
import { useUser } from "@clerk/nextjs";
import {
  PropertyType,
  PropertySubType,
  CommercialPropertyType,
  InvestmentStrategy,
  LoanType,
  PropertyManagerType,
  InsuranceType,
  TitleEscrowType,
  CommercialDealType,
  PrivateCreditLoanType,
} from "@prisma/client";

// Mock currency formatter
const formatCurrency = (amount: number, currency = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
};

// Mock date formatter
const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

interface PortfolioFormProps {
  portfolioItems: PortfolioItem[];
  onAddItem: (data: CreatePortfolioItem) => Promise<{ data?: PortfolioItem | null; error?: string | null }>;
  onUpdateItem: (id: string, data: UpdatePortfolioItem) => Promise<{ data?: PortfolioItem | null; error?: string | null }>;
  onDeleteItem: (id: string) => Promise<{ error?: string | null }>;
  isSubmitting?: boolean;
}

// Define the possible actions for the image
type ImageAction = 'keep' | 'replace' | 'clear';

// Add type definitions for the enhanced metrics
interface PortfolioMetrics {
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  lotSize?: number;
  yearBuilt?: number;
  occupancyRate?: number;
  capRate?: number;
  noi?: number;
  purchasePrice?: number;
  salePrice?: number;
  appreciation?: number;
  roi?: number;
  loanAmount?: number;
  interestRate?: number;
  term?: number;
  ltv?: number;
  dscr?: number;
}

// Add helper function to get relevant fields based on portfolio type
const getRelevantFields = (type: PortfolioItemType) => {
  switch (type) {
    case "PROPERTY_SALE":
    case "PROPERTY_PURCHASE":
      return {
        showPropertyType: true,
        showPropertySubType: true,
        showMetrics: ["bedrooms", "bathrooms", "squareFeet", "lotSize", "yearBuilt"],
      };
    case "LOAN_ORIGINATION":
      return {
        showLoanType: true,
        showMetrics: ["loanAmount", "interestRate", "term", "ltv", "dscr"],
      };
    case "PROPERTY_MANAGEMENT":
      return {
        showPropertyManagerType: true,
        showMetrics: ["occupancyRate", "noi", "capRate"],
      };
    case "INSURANCE_POLICY":
      return {
        showInsuranceType: true,
        showMetrics: ["premium", "coverage"],
      };
    case "COMMERCIAL_DEAL":
      return {
        showCommercialPropertyType: true,
        showCommercialDealType: true,
        showMetrics: ["squareFeet", "capRate", "noi", "purchasePrice", "salePrice"],
      };
    case "PRIVATE_LENDING":
      return {
        showPrivateCreditLoanType: true,
        showMetrics: ["loanAmount", "interestRate", "term", "ltv", "dscr"],
      };
    case "TITLE_SERVICE":
      return {
        showTitleEscrowType: true,
        showMetrics: ["transactionAmount"],
      };
    default:
      return {
        showMetrics: [],
      };
  }
};

export function PortfolioForm({
  portfolioItems = [],
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  isSubmitting: parentIsSubmitting = false, // Renamed prop to avoid conflict
}: PortfolioFormProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [localIsSubmitting, setLocalIsSubmitting] = useState(false); // Local submitting state for image upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageAction, setImageAction] = useState<ImageAction>('keep');
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null); // For local file preview
  const [tagInputString, setTagInputString] = useState(''); 
  const { user } = useUser();
  
  const isFormSubmitting = parentIsSubmitting || localIsSubmitting; // Combined submitting state
  
  // Create form
  const form = useForm<CreatePortfolioItem>({
    resolver: zodResolver(editingItem ? updatePortfolioItemSchema : createPortfolioItemSchema),
    defaultValues: {
      type: "PROPERTY_SALE",
      title: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      imageUrls: [],
      tags: [],
      featured: false,
      isVisible: true,
    },
    mode: editingItem ? "onSubmit" : "onChange"
  });

  // Debug log for form state
  useEffect(() => {
    const formState = form.formState;
    console.log("[FORM_STATE]", {
      isDirty: formState.isDirty,
      isValid: formState.isValid,
      errors: Object.entries(formState.errors).reduce((acc, [key, value]) => {
        if (value) {
          acc[key] = {
            type: String(value.type || ''),
            message: String(value.message || '')
          };
        }
        return acc;
      }, {} as Record<string, { type: string; message: string }>),
      values: form.getValues(),
      timestamp: new Date().toISOString()
    });
  }, [form, form.formState]);

  // Also log when editing item changes
  useEffect(() => {
    if (editingItem) {
      console.log("[EDITING_ITEM_CHANGED]", {
        item: editingItem,
        timestamp: new Date().toISOString()
      });
    }
  }, [editingItem]);

  // Cleanup local object URL
  useEffect(() => {
    return () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
        console.log("[IMAGE_UPLOAD_CLEANUP]", { preview: localPreviewUrl, timestamp: new Date().toISOString() });
      }
    };
  }, [localPreviewUrl]);

  // Reset form and image state when editing item changes or dialog closes
  useEffect(() => {
    if (isAddDialogOpen) {
      if (editingItem) {
        const date = typeof editingItem.date === 'string' 
          ? new Date(editingItem.date).toISOString().split("T")[0]
          : new Date(editingItem.date).toISOString().split("T")[0];
        
        form.reset({
          ...editingItem,
          date,
          tags: Array.isArray(editingItem.tags) ? editingItem.tags : [], 
        });
        setImageAction('keep');
        setSelectedFile(null);
        setLocalPreviewUrl(null); // Clear local preview when starting edit
        setTagInputString(Array.isArray(editingItem.tags) ? editingItem.tags.join(', ') : '');
      } else {
        form.reset({
          type: "PROPERTY_SALE",
          title: "",
          description: "",
          date: new Date().toISOString().split("T")[0],
          imageUrls: [],
          tags: [], // Reset tags to empty array
          featured: false,
          isVisible: true,
        });
        setImageAction('keep'); // Or 'clear' if we want no image by default
        setSelectedFile(null);
        setLocalPreviewUrl(null);
        setTagInputString('');
      }
    } else {
      // Reset fully when dialog closes
      setEditingItem(null);
      setSelectedFile(null);
      setImageAction('keep');
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
      setLocalPreviewUrl(null);
      form.reset({ // Reset form to defaults
        type: "PROPERTY_SALE",
        title: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
        imageUrls: [],
        tags: [], // Reset tags to empty array
        featured: false,
        isVisible: true,
      });
      setTagInputString('');
    }
  }, [editingItem, form, isAddDialogOpen]);

  // Handle file selection from ImageUpload
  const handleFileSelected = (file: File | null) => {
    setSelectedFile(file);
    setImageAction(file ? 'replace' : 'clear'); // Set action based on file presence

    // Manage local preview URL
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl); // Clean up previous local preview
      setLocalPreviewUrl(null);
    }
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setLocalPreviewUrl(objectUrl);
    } else {
       // If file is null (cleared), ensure form value is also cleared
      form.setValue('imageUrls', []);
    }
  };

  // Handle clearing the image
  const handleClearImage = () => {
    setSelectedFile(null);
    setImageAction('clear');
    form.setValue('imageUrls', []); // Clear image URL in form state
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl); // Clean up local preview
    }
    setLocalPreviewUrl(null);
  };

  // Actual submission handler
  const handleFormSubmission = async (data: CreatePortfolioItem) => {
    console.log("[HANDLE_SUBMIT_CALLED] Form submission started.", { 
      // Log the data directly from RHF (tags should be string[] here)
      data: { ...data, tags: data.tags }, 
      timestamp: new Date().toISOString() 
    });

    if (!user?.id) {
      toast.error("Authentication error. Please log in again.");
      return;
    }

    // Log form validity state before submitting
    console.log("[FORM_SUBMIT_VALIDITY]", {
      isValid: form.formState.isValid,
      isDirty: form.formState.isDirty,
      errors: Object.entries(form.formState.errors).reduce((acc, [key, value]) => {
        if (value) {
          acc[key] = {
            type: String(value.type || ''),
            message: String(value.message || '')
          };
        }
        return acc;
      }, {} as Record<string, { type: string; message: string }>)
    });

    setLocalIsSubmitting(true); // Start submitting state

    try {
      let finalImageUrls: string[] = form.getValues('imageUrls') || []; // Default to current form value

      // --- Image Upload Logic ---
      if (imageAction === 'replace' && selectedFile) {
        console.log("[PORTFOLIO_FORM_UPLOAD_START] Uploading image before submit...", {
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          userId: user.id,
          timestamp: new Date().toISOString()
        });

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('userId', user.id); // Pass userId for storage path

        const uploadResult = await uploadPortfolioImage(formData);

        if (uploadResult.error || !uploadResult.data) {
          console.error("[PORTFOLIO_FORM_UPLOAD_ERROR]", {
            error: uploadResult.error,
            timestamp: new Date().toISOString()
          });
          toast.error(`Image upload failed: ${uploadResult.error?.message || 'Unknown error'}`);
          setLocalIsSubmitting(false); // Stop submitting on upload error
          return; // Stop submission
        }

        finalImageUrls = [uploadResult.data]; // Set the uploaded URL
        console.log("[PORTFOLIO_FORM_UPLOAD_SUCCESS]", {
          imageUrl: uploadResult.data,
          timestamp: new Date().toISOString()
        });
        
      } else if (imageAction === 'clear') {
        finalImageUrls = []; // Explicitly clear URLs
      }

      console.log("[PORTFOLIO_FORM_SUBMIT]", {
        // Log data *before* processing tags (tags should be string[] from RHF)
        formData: { ...data, imageUrls: finalImageUrls }, 
        imageAction,
        hasSelectedFile: !!selectedFile,
        timestamp: new Date().toISOString()
      });

      // --- Prepare Submission Data (Tags should already be correct array type) ---
      // RHF state is managed by the input's onChange, so data.tags is already string[]
      const submissionData = {
        ...data,
        // tags: Array.isArray(data.tags) ? data.tags : [], // No conversion needed
        imageUrls: finalImageUrls, 
      };

      console.log("[PORTFOLIO_FORM_PROCESSED]", {
        submissionData: {
          type: submissionData.type,
          title: submissionData.title,
          hasImageData: !!submissionData.imageUrls?.length,
          imageUrls: submissionData.imageUrls,
          tags: submissionData.tags // Log the tags being submitted
        },
        timestamp: new Date().toISOString()
      });

      // --- Call Add or Update Action ---
      if (editingItem) {
        const result = await onUpdateItem(editingItem.ulid, submissionData);
        if (result.error) {
          toast.error(`Failed to update: ${result.error}`);
        } else {
          toast.success("Portfolio item updated successfully");
          setIsAddDialogOpen(false); // Close dialog on success
        }
      } else {
        const result = await onAddItem(submissionData);
        if (result.error) {
          toast.error(`Failed to add: ${result.error}`);
        } else {
          toast.success("Portfolio item added successfully");
          setIsAddDialogOpen(false); // Close dialog on success
        }
      }
      
      // Reset image state *after* successful submission is handled
      // Dialog close useEffect will handle the rest of the reset
      setSelectedFile(null);
      setImageAction('keep');
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
      setLocalPreviewUrl(null);
      // Reset local tag input string
      setTagInputString(''); 

    } catch (error) {
      console.error("[PORTFOLIO_SUBMIT_ERROR]", error);
      toast.error("An unexpected error occurred while saving.");
    } finally {
      setLocalIsSubmitting(false); // End submitting state
    }
  };

  // Create a direct submission handler for edit mode
  const submitDirectly = () => {
    if (editingItem) {
      const formData = form.getValues(); // RHF values (tags should be string[])
      console.log("[DIRECT_SUBMISSION]", { 
        formData, 
        timestamp: new Date().toISOString() 
      });
      handleFormSubmission(formData);
    }
  };

  // Regular form submission handler (uses validation)
  const onSubmit = form.handleSubmit(handleFormSubmission);

  // Handle delete
  const handleDelete = async (item: PortfolioItem) => {
    // Consider adding loading state for delete
    if (confirm(`Are you sure you want to delete "${item.title}"?`)) {
      try {
        const result = await onDeleteItem(item.ulid);
        if (result.error) {
          toast.error(`Delete failed: ${result.error}`);
          return;
        }
        toast.success("Portfolio item deleted successfully");
        
        // Close dialog if deleting the current editing item
        if (editingItem?.ulid === item.ulid) {
          setIsAddDialogOpen(false);
          // State reset handled by useEffect watching isAddDialogOpen
        }
      } catch (error) {
        console.error("[PORTFOLIO_DELETE_ERROR]", error);
        toast.error("Failed to delete portfolio item");
      }
    }
  };

  // Get type color
  const getTypeColor = (type: PortfolioItemType) => {
    const colorMap: Record<string, string> = {
      blue: "bg-blue-100 text-blue-800 border-blue-200",
      green: "bg-green-100 text-green-800 border-green-200",
      amber: "bg-amber-100 text-amber-800 border-amber-200",
      violet: "bg-violet-100 text-violet-800 border-violet-200",
      cyan: "bg-cyan-100 text-cyan-800 border-cyan-200",
      indigo: "bg-indigo-100 text-indigo-800 border-indigo-200",
      orange: "bg-orange-100 text-orange-800 border-orange-200",
      red: "bg-red-100 text-red-800 border-red-200",
      gray: "bg-gray-100 text-gray-800 border-gray-200",
    };
    
    return colorMap[PORTFOLIO_ITEM_TYPE_COLORS[type]] || colorMap.gray;
  };

  // Determine the preview URL for ImageUpload
  const getPreviewUrl = () => {
    // If a local file is selected, show its preview
    if (localPreviewUrl) {
      return localPreviewUrl;
    }
    // If editing and image action is 'keep', show the existing image from form state
    if (editingItem && imageAction === 'keep') {
        const currentImageUrls = form.getValues('imageUrls');
      return Array.isArray(currentImageUrls) && currentImageUrls.length > 0 && typeof currentImageUrls[0] === 'string' 
        ? currentImageUrls[0] 
        : undefined;
    }
    // Otherwise, no preview
    return undefined;
  };

  // Add state for tracking the selected portfolio type
  const [selectedType, setSelectedType] = useState<PortfolioItemType>("PROPERTY_SALE");
  const relevantFields = getRelevantFields(selectedType);

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle className="text-xl">Portfolio</CardTitle>
            <CardDescription>
              Showcase your professional achievements and success stories
            </CardDescription>
          </div>
          <Button 
            onClick={() => {
              // Reset handled by useEffect watching isAddDialogOpen
              setEditingItem(null); 
              setIsAddDialogOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {portfolioItems.length === 0 ? (
          <div className="py-10 flex flex-col items-center justify-center text-center">
            <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No portfolio items found</h3>
            <p className="text-muted-foreground mt-1 mb-4">
              Add your first achievement to showcase your expertise.
            </p>
            <Button 
              onClick={() => {
                // Reset handled by useEffect watching isAddDialogOpen
                setEditingItem(null);
                setIsAddDialogOpen(true);
              }}
            >
              Add Portfolio Item
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolioItems.map((item) => (
              <Card key={item.ulid} className="overflow-hidden group hover:shadow-md transition-all">
                <div className="relative">
                  {/* Display Image: Use item.imageUrls directly from the fetched data */}
                  {Array.isArray(item.imageUrls) && item.imageUrls.length > 0 ? (
                    <div className="h-48 overflow-hidden bg-muted">
                      <img
                        src={item.imageUrls[0]} // Assuming first image is the primary one
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-muted flex items-center justify-center">
                      <Building2 className="h-16 w-16 text-muted-foreground/30" />
                    </div>
                  )}
                  {/* Actions Dropdown */}
                  <div className="absolute top-2 right-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full bg-black/20 hover:bg-black/30 text-white">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => {
                             // Reset handled by useEffect watching isAddDialogOpen
                            setEditingItem(item);
                            setIsAddDialogOpen(true);
                          }}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => handleDelete(item)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {/* Featured Badge */}
                  {item.featured && (
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">
                        Featured
                      </Badge>
                    </div>
                  )}
                </div>
                <CardContent className="p-6">
                   {/* Type Badge and Tags */}
                  <div className="mb-3 flex items-center gap-2 flex-wrap">
                    <Badge className={cn("", getTypeColor(item.type))}>
                      {PORTFOLIO_ITEM_TYPE_LABELS[item.type]}
                    </Badge>
                    {Array.isArray(item.tags) && item.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {item.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {item.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{item.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                   {/* Title and Description */}
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                    {item.description}
                  </p>
                   {/* Details: Amount, Location, Date */}
                  <div className="flex items-center gap-4 text-sm">
                    {item.financialDetails?.amount && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span>{formatCurrency(item.financialDetails.amount)}</span>
                      </div>
                    )}
                    {item.location?.city && item.location?.state && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-red-500" />
                        <span>{item.location.city}, {item.location.state}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 ml-auto">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <span>{formatDate(item.date)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Portfolio Item" : "Add Portfolio Item"}
            </DialogTitle>
            <DialogDescription>
              Showcase your professional achievements and success stories to build credibility.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form 
              onSubmit={(e) => {
                console.log("[FORM_SUBMIT_EVENT]", { timestamp: new Date().toISOString() });
                
                // If editing an existing item, we want to bypass validation
                if (editingItem) {
                  e.preventDefault();
                  submitDirectly();
                } else {
                  // Normal validation flow for new items
                  onSubmit(e);
                }
              }} 
              className="space-y-6"
            >
              {/* Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      // Use form state value, ensure it's a string for Select
                      value={String(field.value)} 
                    >
                      <FormControl>
                        <SelectTrigger>
                           {/* Use form state value here too */}
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(PORTFOLIO_ITEM_TYPE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the type of achievement or transaction
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Title and Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Luxury Home Sale in Beverly Hills" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                           // Consistent date handling based on form value type
                          value={typeof field.value === 'string' 
                            ? field.value.split('T')[0] // Handle potential ISO string from DB
                            : field.value instanceof Date 
                              ? field.value.toISOString().split('T')[0] 
                              : ''}
                          // Ensure onChange provides YYYY-MM-DD string
                          onChange={(e) => field.onChange(e.target.value)} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe this achievement or transaction..." 
                        className="min-h-[100px]"
                        {...field}
                        value={field.value || ""} // Handle potential null/undefined
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Location */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="location.city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="City" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location.state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input placeholder="State" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location.zip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Zip" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Financial Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="financialDetails.amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="Amount" 
                            type="number" 
                            className="pl-8" 
                            {...field}
                             // Ensure value passed to onChange is number or undefined
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            value={field.value || ""} // Handle potential undefined for controlled input
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tags Field */}
                <FormField
                  control={form.control}
                  name="tags" // RHF state is string[]
                  render={({ field }) => ( // field.value is string[], field.onChange expects string[]
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Tag className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="luxury, investment, record-sale" 
                            className="pl-8" 
                            // Use local state for the input value
                            value={tagInputString} 
                            // Update local state AND process+update RHF state on change
                            onChange={(e) => {
                              const currentInputString = e.target.value;
                              // 1. Update local state for immediate input feedback
                              setTagInputString(currentInputString); 
                              
                              // 2. Process string into array for RHF state
                              const tagsArray = currentInputString
                                .split(",")
                                .map(tag => tag.trim())
                                .filter(tag => tag !== ""); 
                                
                              // 3. Update RHF state with the processed array
                              field.onChange(tagsArray); 
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Separate tags with commas
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Image Upload - Simplified, no longer directly controlling form value */}
               {/* We control the File object and action separately */}
              <FormItem>
                <FormLabel>Image</FormLabel>
                <FormControl>
                  <div className="relative">
                    <ImageUpload
                      id="portfolio-image"
                      previewUrl={getPreviewUrl()} // Use the dynamic preview URL
                      onFileSelect={handleFileSelected} // Pass the handler for File object
                      onClear={handleClearImage} // Pass the handler for clearing
                    />
                    {/* Show loader only during the final submission phase if needed */}
                    {localIsSubmitting && imageAction === 'replace' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-md">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="ml-2 text-sm text-primary font-medium">Uploading...</span>
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormDescription>
                  Upload an image representing this achievement (Max 5MB).
                </FormDescription>
                {/* Display form-level validation errors if needed, separate from ImageUpload's internal errors */}
                <FormMessage />
              </FormItem>


              {/* Featured Flag */}
              <FormField
                control={form.control}
                name="featured"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Featured</FormLabel>
                      <FormDescription>
                        Mark this as a featured portfolio item
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {/* Add Property Type Selection */}
              {relevantFields.showPropertyType && (
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
                          {Object.values(PropertyType).map((type) => (
                            <SelectItem key={type} value={type}>
                              {type.replace(/([A-Z])/g, ' $1').trim()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Add Property Sub Type Selection */}
              {relevantFields.showPropertySubType && (
                <FormField
                  control={form.control}
                  name="propertySubType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Sub Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select property sub type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(PropertySubType).map((type) => (
                            <SelectItem key={type} value={type}>
                              {type.replace(/([A-Z])/g, ' $1').trim()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Add Commercial Property Type Selection */}
              {relevantFields.showCommercialPropertyType && (
                <FormField
                  control={form.control}
                  name="commercialPropertyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Commercial Property Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select commercial property type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(CommercialPropertyType).map((type) => (
                            <SelectItem key={type} value={type}>
                              {type.replace(/([A-Z])/g, ' $1').trim()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Add Metrics Fields */}
              {relevantFields.showMetrics.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Property Metrics</h3>
                  {relevantFields.showMetrics.map((metric) => (
                    <FormField
                      key={metric}
                      control={form.control}
                      name={`metrics.${metric}`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{metric.replace(/([A-Z])/g, ' $1').trim()}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              )}

              <DialogFooter className="gap-2 sm:gap-0">
                 {/* Delete Button */}
                {editingItem && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => handleDelete(editingItem)}
                    disabled={isFormSubmitting} // Disable during submission
                  >
                    {/* Consider adding a loading state for delete? */}
                    Delete
                  </Button>
                )}
                 {/* Cancel and Submit Buttons */}
                <div className="flex gap-2 ml-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddDialogOpen(false);
                       // State reset handled by useEffect watching isAddDialogOpen
                    }}
                     // Disable cancel button during submission as well
                    disabled={isFormSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={isFormSubmitting}
                    onClick={(e) => {
                      console.log("[SUBMIT_BUTTON_CLICKED]", { 
                        isEditing: !!editingItem,
                        action: editingItem ? "update" : "add",
                        formState: {
                          isDirty: form.formState.isDirty,
                          isValid: form.formState.isValid,
                          isSubmitting: form.formState.isSubmitting
                        },
                        timestamp: new Date().toISOString() 
                      });
                    }}
                  >
                     {/* Show loading indicator on submit button */}
                    {isFormSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingItem ? "Update" : "Add"} Achievement
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
} 