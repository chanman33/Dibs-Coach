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
  Trophy 
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
  PORTFOLIO_ITEM_TYPE_LABELS,
  PORTFOLIO_ITEM_TYPE_COLORS,
  PortfolioItemTypeEnum,
} from "@/utils/types/portfolio";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

export function PortfolioForm({
  portfolioItems = [],
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  isSubmitting = false,
}: PortfolioFormProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  
  // Create form
  const form = useForm<CreatePortfolioItem>({
    resolver: zodResolver(createPortfolioItemSchema),
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
  });

  // Reset form when editing item changes
  useEffect(() => {
    if (editingItem) {
      const date = typeof editingItem.date === 'string' 
        ? new Date(editingItem.date).toISOString().split("T")[0]
        : new Date(editingItem.date).toISOString().split("T")[0];
      
      form.reset({
        ...editingItem,
        date
      });
    } else {
      form.reset({
        type: "PROPERTY_SALE",
        title: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
        imageUrls: [],
        tags: [],
        featured: false,
        isVisible: true,
      });
    }
  }, [editingItem, form]);

  // Handle form submission
  const handleSubmit = async (data: CreatePortfolioItem) => {
    try {
      // Process tags as array
      let processedTags = data.tags;
      if (typeof data.tags === 'string') {
        processedTags = (data.tags as string).split(',').map(t => t.trim());
      }

      const submissionData = {
        ...data,
        tags: processedTags as string[],
      };

      if (editingItem) {
        const result = await onUpdateItem(editingItem.ulid, submissionData);
        if (result.error) {
          toast.error(result.error);
          return;
        }
        toast.success("Portfolio item updated successfully");
      } else {
        const result = await onAddItem(submissionData);
        if (result.error) {
          toast.error(result.error);
          return;
        }
        toast.success("Portfolio item added successfully");
      }

      setIsAddDialogOpen(false);
      setEditingItem(null);
    } catch (error) {
      console.error("[PORTFOLIO_SUBMIT_ERROR]", error);
      toast.error("Failed to save portfolio item");
    }
  };

  // Handle delete
  const handleDelete = async (item: PortfolioItem) => {
    if (confirm(`Are you sure you want to delete "${item.title}"?`)) {
      try {
        const result = await onDeleteItem(item.ulid);
        if (result.error) {
          toast.error(result.error);
          return;
        }
        toast.success("Portfolio item deleted successfully");
        
        // Close dialog if deleting the current editing item
        if (editingItem?.ulid === item.ulid) {
          setIsAddDialogOpen(false);
          setEditingItem(null);
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
              setEditingItem(null);
              setIsAddDialogOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Achievement
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
                  {item.imageUrls && item.imageUrls.length > 0 ? (
                    <div className="h-48 overflow-hidden bg-muted">
                      <img
                        src={Array.isArray(item.imageUrls) ? item.imageUrls[0] : ''}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-muted flex items-center justify-center">
                      <Building2 className="h-16 w-16 text-muted-foreground/30" />
                    </div>
                  )}
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
                  {item.featured && (
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">
                        Featured
                      </Badge>
                    </div>
                  )}
                </div>
                <CardContent className="p-6">
                  <div className="mb-3 flex items-center gap-2">
                    <Badge className={cn("", getTypeColor(item.type))}>
                      {PORTFOLIO_ITEM_TYPE_LABELS[item.type]}
                    </Badge>
                    {item.tags && item.tags.length > 0 && (
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
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                    {item.description}
                  </p>
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
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value as string}
                      value={field.value as string}
                    >
                      <FormControl>
                        <SelectTrigger>
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
                          value={typeof field.value === 'string' 
                            ? field.value 
                            : field.value instanceof Date 
                              ? field.value.toISOString().split('T')[0] 
                              : ''}
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
                        value={field.value || ""}
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
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            value={field.value || ""}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Tag className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="luxury, investment, record-sale" 
                            className="pl-8" 
                            {...field}
                            value={Array.isArray(field.value) ? field.value.join(", ") : field.value || ""}
                            onChange={(e) => {
                              const tags = e.target.value.split(",").map(tag => tag.trim());
                              field.onChange(tags);
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

              {/* Image URL */}
              <FormField
                control={form.control}
                name="imageUrls"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <ImagePlus className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="https://example.com/image.jpg" 
                          className="pl-8" 
                          value={Array.isArray(field.value) && field.value.length > 0 ? field.value[0] : ""}
                          onChange={(e) => {
                            if (e.target.value) {
                              field.onChange([e.target.value]);
                            } else {
                              field.onChange([]);
                            }
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      URL to an image representing this achievement
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

              <DialogFooter className="gap-2 sm:gap-0">
                {editingItem && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => handleDelete(editingItem)}
                    disabled={isSubmitting}
                  >
                    Delete
                  </Button>
                )}
                <div className="flex gap-2 ml-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      setEditingItem(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
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