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
  Loader2,
  Info,
  FileText,
  BarChart,
  ImageIcon,
  Star,
  Edit
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

// Helper function to format metric labels
const formatMetricLabel = (metric: string) => {
  return metric
    .replace(/([A-Z])/g, " $1") // Add space before capital letters
    .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
    .trim();
};

// Get the appropriate icon for each tab
const getTabIcon = (tabId: string) => {
  switch (tabId) {
    case "basic":
      return <FileText className="h-4 w-4 mr-2" />;
    case "location":
      return <MapPin className="h-4 w-4 mr-2" />;
    case "details":
      return <Building2 className="h-4 w-4 mr-2" />;
    case "metrics":
      return <BarChart className="h-4 w-4 mr-2" />;
    case "media":
      return <ImageIcon className="h-4 w-4 mr-2" />;
    default:
      return <Info className="h-4 w-4 mr-2" />;
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
  const [activeTab, setActiveTab] = useState("basic"); // Track the active tab
  const [selectedType, setSelectedType] = useState<PortfolioItemType>("PROPERTY_SALE");
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

  // Update selectedType when form type changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "type" && value.type) {
        setSelectedType(value.type as PortfolioItemType);
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

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
      // Reset to the first tab when opening dialog
      setActiveTab("basic");
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
          <div className="flex gap-6 overflow-x-auto pb-4 -mx-2 px-2 snap-x">
            {portfolioItems.map((item) => (
              <Card
                key={item.ulid}
                className={cn(
                  "relative rounded-xl bg-white shadow-md hover:shadow-lg transition-all overflow-hidden group border min-w-[315px] md:min-w-[405px] max-w-[405px] h-[340px] flex flex-col border-l-4 snap-start",
                  item.type === 'PROPERTY_SALE' ? 'border-l-blue-400' :
                  item.type === 'PROPERTY_PURCHASE' ? 'border-l-green-400' :
                  item.type === 'LOAN_ORIGINATION' ? 'border-l-amber-400' :
                  item.type === 'PROPERTY_MANAGEMENT' ? 'border-l-violet-400' :
                  item.type === 'INSURANCE_POLICY' ? 'border-l-cyan-400' :
                  item.type === 'COMMERCIAL_DEAL' ? 'border-l-indigo-400' :
                  item.type === 'PRIVATE_LENDING' ? 'border-l-orange-400' :
                  item.type === 'TITLE_SERVICE' ? 'border-l-red-400' :
                  'border-l-gray-300'
                )}
                tabIndex={0}
                aria-label={`Portfolio item: ${item.title}`}
              >
                {/* Image with reduced height */}
                <div className="relative w-full h-[160px] bg-muted overflow-hidden">
                  {Array.isArray(item.imageUrls) && item.imageUrls[0] ? (
                    <img
                      src={item.imageUrls[0]}
                      alt={item.title || 'Portfolio image'}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <Building2 className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                  )}
                  {/* Featured badge */}
                  {item.featured && (
                    <Badge className="absolute top-2 left-2 flex items-center gap-1 bg-yellow-500 text-white shadow">
                      <Star className="h-4 w-4 mr-1" /> Featured
                    </Badge>
                  )}
                  {/* Type badge */}
                  <Badge className={cn("absolute top-2 right-2", getTypeColor(item.type))}>
                    {PORTFOLIO_ITEM_TYPE_LABELS[item.type]}
                  </Badge>
                </div>
                <CardContent className="p-3 flex flex-col justify-between flex-1">
                  <div>
                    <div className="flex flex-wrap gap-1 mb-0.5">
                      {Array.isArray(item.tags) && item.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs px-2 py-0.5">
                          {tag}
                        </Badge>
                      ))}
                      {item.tags && item.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs px-2 py-0.5">
                          +{item.tags.length - 2} more
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-lg font-bold truncate mt-0.5" title={item.title}>{item.title}</h3>
                    {/* Description with Read More */}
                    <div className="mt-0.5">
                      <p
                        className="text-muted-foreground text-sm line-clamp-3"
                        title={item.description || ''}
                      >
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-1">
                    {item.financialDetails?.amount && (
                      <div className="flex items-center gap-1 text-green-700 font-semibold text-base">
                        <DollarSign className="h-4 w-4" />
                        <span>{formatCurrency(item.financialDetails.amount)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-0.5">
                      {item.location?.city && item.location?.state && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {item.location.city}, {item.location.state}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(item.date)}
                      </span>
                    </div>
                  </div>
                </CardContent>
                {/* Edit button in bottom right corner, outlined style */}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 p-0 rounded-full absolute bottom-3 right-3"
                  onClick={() => {
                    setEditingItem(item);
                    setIsAddDialogOpen(true);
                  }}
                  aria-label="Edit portfolio item"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
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
              {/* Tabbed Interface */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-5 mb-4">
                  <TabsTrigger value="basic" className="flex items-center">
                    {getTabIcon("basic")}
                    <span className="hidden sm:inline">Basic</span>
                  </TabsTrigger>
                  <TabsTrigger value="location" className="flex items-center">
                    {getTabIcon("location")}
                    <span className="hidden sm:inline">Location</span>
                  </TabsTrigger>
                  <TabsTrigger value="details" className="flex items-center">
                    {getTabIcon("details")}
                    <span className="hidden sm:inline">Details</span>
                  </TabsTrigger>
                  <TabsTrigger value="metrics" className="flex items-center">
                    {getTabIcon("metrics")}
                    <span className="hidden sm:inline">Metrics</span>
                  </TabsTrigger>
                  <TabsTrigger value="media" className="flex items-center">
                    {getTabIcon("media")}
                    <span className="hidden sm:inline">Media</span>
                  </TabsTrigger>
                </TabsList>

                {/* Basic Information Tab */}
                <TabsContent value="basic" className="space-y-4">
                  {/* Type */}
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedType(value as PortfolioItemType);
                          }}
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
                </TabsContent>

                {/* Location Tab */}
                <TabsContent value="location" className="space-y-4">
                  <div className="flex items-center mb-4">
                    <MapPin className="h-5 w-5 mr-2 text-muted-foreground" />
                    <h3 className="text-lg font-medium">Location Information</h3>
                  </div>

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

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Street address" 
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                {/* Details Tab */}
                <TabsContent value="details" className="space-y-4">
                  <div className="flex items-center mb-4">
                    <Building2 className="h-5 w-5 mr-2 text-muted-foreground" />
                    <h3 className="text-lg font-medium">Property Details</h3>
                  </div>

                  {/* Financial Details */}
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

                  {/* Property Type Selection */}
                  {relevantFields.showPropertyType && (
                    <FormField
                      control={form.control}
                      name="propertyType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Property Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || undefined}>
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

                  {/* Property Sub Type Selection */}
                  {relevantFields.showPropertySubType && (
                    <FormField
                      control={form.control}
                      name="propertySubType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Property Sub Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || undefined}>
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

                  {/* Commercial Property Type Selection */}
                  {relevantFields.showCommercialPropertyType && (
                    <FormField
                      control={form.control}
                      name="commercialPropertyType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Commercial Property Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || undefined}>
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

                  {/* Loan Type */}
                  {relevantFields.showLoanType && (
                    <FormField
                      control={form.control}
                      name="loanType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Loan Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select loan type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.values(LoanType).map((type) => (
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

                  {/* Property Manager Type */}
                  {relevantFields.showPropertyManagerType && (
                    <FormField
                      control={form.control}
                      name="propertyManagerType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Property Manager Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select property manager type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.values(PropertyManagerType).map((type) => (
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

                  {/* Insurance Type */}
                  {relevantFields.showInsuranceType && (
                    <FormField
                      control={form.control}
                      name="insuranceType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Insurance Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select insurance type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.values(InsuranceType).map((type) => (
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

                  {/* Title Escrow Type */}
                  {relevantFields.showTitleEscrowType && (
                    <FormField
                      control={form.control}
                      name="titleEscrowType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title/Escrow Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select title/escrow type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.values(TitleEscrowType).map((type) => (
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
                </TabsContent>

                {/* Metrics Tab */}
                <TabsContent value="metrics" className="space-y-4">
                  <div className="flex items-center mb-4">
                    <BarChart className="h-5 w-5 mr-2 text-muted-foreground" />
                    <h3 className="text-lg font-medium">Property Metrics</h3>
                  </div>

                  {relevantFields.showMetrics.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {relevantFields.showMetrics.map((metric) => (
                        <FormField
                          key={metric}
                          control={form.control}
                          name={`metrics.${metric}`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{formatMetricLabel(metric)}</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder={formatMetricLabel(metric)}
                                  {...field}
                                  value={field.value || ""}
                                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <p>No metrics available for the selected portfolio type.</p>
                    </div>
                  )}
                </TabsContent>

                {/* Media Tab */}
                <TabsContent value="media" className="space-y-4">
                  <div className="flex items-center mb-4">
                    <ImageIcon className="h-5 w-5 mr-2 text-muted-foreground" />
                    <h3 className="text-lg font-medium">Media & Attachments</h3>
                  </div>

                  {/* Image Upload */}
                  <FormItem>
                    <FormLabel>Featured Image</FormLabel>
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
                </TabsContent>
              </Tabs>

              {/* Form Navigation and Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
                {/* Tab Navigation */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const tabs = ["basic", "location", "details", "metrics", "media"];
                      const currentIndex = tabs.indexOf(activeTab);
                      if (currentIndex > 0) {
                        setActiveTab(tabs[currentIndex - 1]);
                      }
                    }}
                    disabled={activeTab === "basic"}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const tabs = ["basic", "location", "details", "metrics", "media"];
                      const currentIndex = tabs.indexOf(activeTab);
                      if (currentIndex < tabs.length - 1) {
                        setActiveTab(tabs[currentIndex + 1]);
                      }
                    }}
                    disabled={activeTab === "media"}
                  >
                    Next
                  </Button>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {/* Delete Button (only show in edit mode) */}
                  {editingItem && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => handleDelete(editingItem)}
                      disabled={isFormSubmitting} // Disable during submission
                      className="flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Delete
                    </Button>
                  )}
                  {/* Cancel and Submit Buttons */}
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
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
} 