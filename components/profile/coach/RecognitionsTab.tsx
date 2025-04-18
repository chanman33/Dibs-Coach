"use client"

import { useState } from "react";
import { 
  ProfessionalRecognition, 
  ProfessionalRecognitionSchema, 
  RecognitionType, 
  SerializableProfessionalRecognition, 
  type RecognitionTypeValues 
} from "@/utils/types/recognition";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  PlusCircle, 
  Edit, 
  Trash2, 
  Award, 
  EyeOff, 
  Eye,
  Calendar,
  Building,
  Trophy,
  BookOpen,
  Home,
  Wallet,
  FileText,
  FileCheck,
  Shield,
  Building2
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/utils/cn";
import { REAL_ESTATE_DOMAINS, type RealEstateDomain } from "@/utils/types/coach";

// Domain options with human-readable labels
const DOMAIN_OPTIONS = [
  {
    id: REAL_ESTATE_DOMAINS.REALTOR,
    label: "Real Estate Agent",
    icon: <Home className="h-4 w-4" />
  },
  {
    id: REAL_ESTATE_DOMAINS.INVESTOR,
    label: "Real Estate Investor",
    icon: <Wallet className="h-4 w-4" />
  },
  {
    id: REAL_ESTATE_DOMAINS.MORTGAGE,
    label: "Mortgage Professional",
    icon: <FileText className="h-4 w-4" />
  },
  {
    id: REAL_ESTATE_DOMAINS.PROPERTY_MANAGER,
    label: "Property Manager",
    icon: <Building className="h-4 w-4" />
  },
  {
    id: REAL_ESTATE_DOMAINS.TITLE_ESCROW,
    label: "Title & Escrow",
    icon: <FileCheck className="h-4 w-4" />
  },
  {
    id: REAL_ESTATE_DOMAINS.INSURANCE,
    label: "Insurance",
    icon: <Shield className="h-4 w-4" />
  },
  {
    id: REAL_ESTATE_DOMAINS.COMMERCIAL,
    label: "Commercial Real Estate",
    icon: <Building2 className="h-4 w-4" />
  },
  {
    id: REAL_ESTATE_DOMAINS.PRIVATE_CREDIT,
    label: "Private Credit",
    icon: <Wallet className="h-4 w-4" />
  }
];

// Helper function to get domain label from ID
const getDomainLabel = (domainId: string): string => {
  const domain = DOMAIN_OPTIONS.find(d => d.id === domainId);
  return domain ? domain.label : domainId;
};

interface RecognitionsTabProps {
  initialRecognitions: ProfessionalRecognition[];
  onSubmit: (recognitions: SerializableProfessionalRecognition[]) => Promise<void>;
  isSubmitting: boolean;
  selectedSkills?: string[];
}

// Helper function to format dates for input fields
const formatDateForInput = (date: Date | string | null): string => {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) return '';
  
  return dateObj.toISOString().split('T')[0];
};

// Helper to parse input date strings to Date objects
const parseInputDate = (dateString: string): Date => {
  return new Date(dateString);
};

// Helper to generate a ULID-like ID for new recognitions
const generateId = (): string => {
  // Generate a random string that's 26 characters long (ULID length)
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2);
  return (timestamp + randomPart).substring(0, 26).padEnd(26, '0');
};

// Helper function to get badge variant based on recognition type
const getBadgeVariant = (type: RecognitionTypeValues) => {
  switch(type) {
    case RecognitionType.AWARD:
      return "default";
    case RecognitionType.CERTIFICATION:
      return "secondary";
    case RecognitionType.LICENSE:
      return "destructive";
    default:
      return "outline";
  }
};

// Helper function to get badge class name based on recognition type
const getBadgeClassName = (type: RecognitionTypeValues) => {
  switch(type) {
    case RecognitionType.EDUCATION:
      return "bg-blue-100 text-blue-800 hover:bg-blue-200";
    case RecognitionType.MEMBERSHIP:
      return "bg-green-100 text-green-800 hover:bg-green-200";
    case RecognitionType.DESIGNATION:
      return "bg-purple-100 text-purple-800 hover:bg-purple-200";
    default:
      return "";
  }
};

// Helper function to get badge label based on recognition type
const getBadgeLabel = (type: RecognitionTypeValues) => {
  switch(type) {
    case RecognitionType.AWARD:
      return "Award";
    case RecognitionType.ACHIEVEMENT:
      return "Achievement";
    case RecognitionType.CERTIFICATION:
      return "Certification";
    case RecognitionType.DESIGNATION:
      return "Designation";
    case RecognitionType.LICENSE:
      return "License";
    case RecognitionType.EDUCATION:
      return "Education";
    case RecognitionType.MEMBERSHIP:
      return "Membership";
    default:
      return "Recognition";
  }
};

export const RecognitionsTab: React.FC<RecognitionsTabProps> = ({
  initialRecognitions,
  onSubmit,
  isSubmitting,
  selectedSkills
}) => {
  // Log the initial recognitions received from props
  console.log("[RECOGNITIONS_TAB_INIT]", {
    initialCount: initialRecognitions?.length || 0,
    initialRecognitions: JSON.stringify(initialRecognitions, (key, value) => {
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    }, 2),
    timestamp: new Date().toISOString()
  });

  const [recognitions, setRecognitions] = useState<ProfessionalRecognition[]>(initialRecognitions);
  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  // Track expanded descriptions
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});
  
  const toggleDescriptionExpand = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent card click from triggering
    setExpandedDescriptions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const [recognitionValues, setRecognitionValues] = useState<{
    ulid?: string;
    title: string;
    type: RecognitionTypeValues;
    issuer: string;
    issueDate: string;
    expiryDate: string | null;
    description: string | null;
    verificationUrl: string | null;
    isVisible: boolean;
    industryType: string | null;
    metadata: Record<string, any> | null;
  }>({
    title: "",
    type: RecognitionType.AWARD,
    issuer: "",
    issueDate: formatDateForInput(new Date()),
    expiryDate: null,
    description: null,
    verificationUrl: null,
    isVisible: true,
    industryType: null,
    metadata: {}
  });

  const clearForm = () => {
    setRecognitionValues({
      title: "",
      type: RecognitionType.AWARD,
      issuer: "",
      issueDate: formatDateForInput(new Date()),
      expiryDate: null,
      description: null,
      verificationUrl: null,
      isVisible: true,
      industryType: null,
      metadata: {}
    });
    setEditIndex(null);
    setShowForm(false);
  };

  const handleSaveRecognition = () => {
    if (!recognitionValues.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!recognitionValues.issuer || !recognitionValues.issuer.trim()) {
      toast.error("Issuer is required");
      return;
    }

    const newRecognitions = [...recognitions];
    
    // Generate a new ulid if needed
    const ulid = recognitionValues.ulid || generateId();
    
    // Convert string dates to Date objects for the data model
    // Ensure ulid is at the beginning of the object structure
    const formattedRecognition: ProfessionalRecognition = {
      ulid,
      title: recognitionValues.title,
      type: recognitionValues.type,
      issuer: recognitionValues.issuer || "",
      issueDate: parseInputDate(recognitionValues.issueDate),
      expiryDate: recognitionValues.expiryDate ? parseInputDate(recognitionValues.expiryDate) : null,
      description: recognitionValues.description || null,
      verificationUrl: recognitionValues.verificationUrl || null,
      isVisible: recognitionValues.isVisible,
      industryType: recognitionValues.industryType,
      metadata: recognitionValues.metadata
    };

    // Log the formatted recognition for debugging
    console.log("[ADD_RECOGNITION]", {
      action: editIndex !== null ? "update" : "add",
      recognition: JSON.stringify(formattedRecognition, (key, value) => {
        if (value instanceof Date) {
          return value.toISOString();
        }
        return value;
      }, 2),
      timestamp: new Date().toISOString()
    });

    // Check if visibility changed for better user feedback
    let visibilityChanged = false;
    if (editIndex !== null) {
      const oldVisibility = recognitions[editIndex].isVisible;
      visibilityChanged = oldVisibility !== formattedRecognition.isVisible;
      
      // Editing existing recognition
      newRecognitions[editIndex] = formattedRecognition;
    } else {
      // Adding new recognition
      newRecognitions.push(formattedRecognition);
    }

    setRecognitions(newRecognitions);
    clearForm();
    
    // Save to database immediately
    saveRecognitionsToDatabase(newRecognitions, visibilityChanged);
  };

  // Helper function to save recognitions to the database
  const saveRecognitionsToDatabase = async (recognitionsToSave: ProfessionalRecognition[], visibilityChanged = false) => {
    try {
      setIsSaving(true);
      
      // Create a deep clone of the recognitions and ensure they have the correct structure
      // Use the serializable type for server action compatibility
      const validatedRecognitions = recognitionsToSave.map(recognition => {
        // Generate a new ulid if needed
        const ulid = recognition.ulid || generateId();
        
        // Convert Date objects to ISO strings before passing to server action
        return {
          ulid,
          title: recognition.title,
          type: recognition.type,
          issuer: recognition.issuer || "",
          // Convert Date objects to ISO strings
          issueDate: recognition.issueDate instanceof Date 
            ? recognition.issueDate.toISOString() 
            : String(recognition.issueDate),
          expiryDate: recognition.expiryDate 
            ? (recognition.expiryDate instanceof Date 
                ? recognition.expiryDate.toISOString() 
                : String(recognition.expiryDate)) 
            : null,
          description: recognition.description || null,
          verificationUrl: recognition.verificationUrl || null,
          isVisible: recognition.isVisible !== false,
          industryType: recognition.industryType || null,
          metadata: recognition.metadata || {}
        };
      });
      
      // Submit the validated recognitions
      await onSubmit(validatedRecognitions);
      
      if (visibilityChanged) {
        toast.success("Recognition visibility updated and changes saved");
      } else {
        toast.success("Recognition saved successfully");
      }
    } catch (error) {
      console.error("[SAVE_RECOGNITION_ERROR]", {
        error,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      toast.error("Failed to save recognition");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditRecognition = (index: number) => {
    const recognition = recognitions[index];
    setRecognitionValues({
      ulid: recognition.ulid,
      title: recognition.title,
      type: recognition.type,
      issuer: recognition.issuer || "",
      issueDate: formatDateForInput(recognition.issueDate),
      expiryDate: recognition.expiryDate ? formatDateForInput(recognition.expiryDate) : null,
      description: recognition.description || null,
      verificationUrl: recognition.verificationUrl || null,
      isVisible: recognition.isVisible !== false,
      industryType: recognition.industryType || null,
      metadata: recognition.metadata || {}
    });
    setEditIndex(index);
    setShowForm(true);
  };

  const handleDeleteRecognition = (index: number) => {
    const newRecognitions = [...recognitions];
    newRecognitions.splice(index, 1);
    setRecognitions(newRecognitions);
    clearForm();
    
    // Save the updated recognitions to the database
    saveRecognitionsToDatabase(newRecognitions);
    
    toast.success("Recognition removed");
  };

  const handleToggleVisibility = (index: number) => {
    const newRecognitions = [...recognitions];
    const recognition = newRecognitions[index];
    
    // Toggle visibility
    newRecognitions[index] = {
      ...recognition,
      isVisible: !recognition.isVisible
    };
    
    setRecognitions(newRecognitions);
    
    // Save the updated recognitions to the database
    saveRecognitionsToDatabase(newRecognitions);
    
    toast.success(
      newRecognitions[index].isVisible
        ? "Recognition is now visible on your profile"
        : "Recognition is now hidden from your profile"
    );
  };

  // New function to toggle visibility in the form without saving to DB
  const handleToggleVisibilityInForm = () => {
    setRecognitionValues(prev => ({
      ...prev,
      isVisible: !prev.isVisible
    }));
  };

  // Use the proper real estate domains from the REAL_ESTATE_DOMAINS constant
  const domainOptions = Object.values(REAL_ESTATE_DOMAINS);

  const handleSubmit = async () => {
    try {
      // Log the current recognitions before validation
      console.log("[RECOGNITIONS_SUBMIT_START]", {
        recognitionsCount: recognitions.length,
        recognitions: JSON.stringify(recognitions, (key, value) => {
          // Handle Date objects for logging
          if (value instanceof Date) {
            return value.toISOString();
          }
          return value;
        }, 2),
        timestamp: new Date().toISOString()
      });
      
      // Use the helper function to save to database
      await saveRecognitionsToDatabase(recognitions);
    } catch (error) {
      console.error("[RECOGNITIONS_SUBMIT_ERROR]", {
        error,
        stack: error instanceof Error ? error.stack : undefined,
        recognitionsCount: recognitions.length,
        timestamp: new Date().toISOString()
      });
      toast.error("Failed to save recognitions");
    }
  };

  // Helper to format the year from a date
  const formatYear = (date: Date | string): string => {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.getFullYear().toString();
  };

  return (
    <div className="space-y-6">
      {/* Recognition Cards */}
      <Card>
        <CardHeader>
          <CardTitle>Professional Recognitions</CardTitle>
          <CardDescription>Your certifications, awards, and other professional achievements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recognitions.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {recognitions.map((recognition, index) => {
                  // Choose appropriate icon based on recognition type
                  let icon;
                  switch(recognition.type) {
                    case RecognitionType.AWARD:
                      icon = <Trophy className="h-4 w-4 text-primary" />;
                      break;
                    case RecognitionType.CERTIFICATION:
                    case RecognitionType.DESIGNATION:
                    case RecognitionType.LICENSE:
                      icon = <Award className="h-4 w-4 text-primary" />;
                      break;
                    case RecognitionType.EDUCATION:
                      icon = <BookOpen className="h-4 w-4 text-primary" />;
                      break;
                    case RecognitionType.MEMBERSHIP:
                      icon = <Building className="h-4 w-4 text-primary" />;
                      break;
                    case RecognitionType.ACHIEVEMENT:
                    default:
                      icon = <Trophy className="h-4 w-4 text-primary" />;
                  }
                  
                  const isVisible = recognition.isVisible !== false;
                  const industryType = recognition.industryType;
                  
                  return (
                    <Card 
                      key={index} 
                      className={cn(
                        "transition-all duration-200 hover:shadow-md",
                        !isVisible && "opacity-60"
                      )}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2 max-w-[80%]">
                            {icon}
                            <CardTitle className="text-base truncate">{recognition.title}</CardTitle>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={(e) => {
                              handleEditRecognition(index);
                            }}
                            className="h-8 w-8 p-0 rounded-full"
                            aria-label="Edit recognition"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center flex-wrap gap-2 mt-3">
                          <Badge 
                            variant={getBadgeVariant(recognition.type)}
                            className={getBadgeClassName(recognition.type)}
                          >
                            {getBadgeLabel(recognition.type)}
                          </Badge>
                          {industryType && (
                            <Badge variant="secondary" className="text-xs">
                              {getDomainLabel(industryType)}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex justify-between items-center mt-3">
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            {recognition.issuer && (
                              <>
                                <Building className="h-3.5 w-3.5" />
                                <span className="font-medium">{recognition.issuer}</span>
                                <span className="mx-1">•</span>
                              </>
                            )}
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{formatYear(recognition.issueDate)}</span>
                          </div>
                          <Badge variant={isVisible ? "outline" : "secondary"} className="text-xs">
                            {isVisible ? "Visible" : "Hidden"}
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      {recognition.description && (
                        <CardContent className="pt-0 pb-3">
                          <div className={cn(
                            "relative",
                            !expandedDescriptions[recognition.ulid || ''] && "line-clamp-2 max-h-[3rem] overflow-hidden"
                          )}>
                            <p className="text-sm text-muted-foreground">
                              {recognition.description}
                            </p>
                            {!expandedDescriptions[recognition.ulid || ''] && recognition.description.length > 120 && (
                              <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-background to-transparent"></div>
                            )}
                          </div>
                          {recognition.description && recognition.description.length > 120 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1 h-auto text-xs mt-1 text-primary hover:text-primary/80 hover:bg-primary/10 font-medium"
                              onClick={(e) => toggleDescriptionExpand(e, recognition.ulid || '')}
                            >
                              {expandedDescriptions[recognition.ulid || ''] ? "Show less" : "Show more"}
                            </Button>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 border rounded-lg bg-muted/10">
                <Award className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-lg font-medium">No professional recognitions found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add your certifications, awards, and achievements to showcase your expertise
                </p>
              </div>
            )}

            {/* Add Recognition Button */}
            <div className="flex justify-between items-center mt-6">
              <div className="flex gap-2">
                <Button 
                  variant={showForm ? "outline" : "default"}
                  onClick={() => setShowForm(!showForm)}
                  className="gap-2"
                  disabled={isSaving || isSubmitting}
                >
                  {showForm ? (
                    <>Cancel</>
                  ) : (
                    <>
                      <PlusCircle className="h-4 w-4" />
                      Add Recognition
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Form */}
      {showForm && (
        <Card className="mt-6 border-primary/20 shadow-sm">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-lg">
              {editIndex !== null ? "Edit Recognition" : "Add New Recognition"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Title
                </label>
                <Input 
                  value={recognitionValues.title}
                  onChange={(e) => setRecognitionValues({
                    ...recognitionValues,
                    title: e.target.value
                  })}
                  placeholder="e.g., Top Producer Award"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Type
                  </label>
                  <Select 
                    value={recognitionValues.type}
                    onValueChange={(value) => setRecognitionValues({
                      ...recognitionValues,
                      type: value as RecognitionTypeValues
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={RecognitionType.AWARD}>Award</SelectItem>
                      <SelectItem value={RecognitionType.ACHIEVEMENT}>Achievement</SelectItem>
                      <SelectItem value={RecognitionType.CERTIFICATION}>Certification</SelectItem>
                      <SelectItem value={RecognitionType.DESIGNATION}>Designation</SelectItem>
                      <SelectItem value={RecognitionType.LICENSE}>License</SelectItem>
                      <SelectItem value={RecognitionType.EDUCATION}>Education</SelectItem>
                      <SelectItem value={RecognitionType.MEMBERSHIP}>Membership</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Issuer
                  </label>
                  <Input 
                    value={recognitionValues.issuer}
                    onChange={(e) => setRecognitionValues({
                      ...recognitionValues,
                      issuer: e.target.value
                    })}
                    placeholder="e.g., National Association of Realtors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Issue Date
                  </label>
                  <Input 
                    type="date"
                    value={recognitionValues.issueDate}
                    onChange={(e) => setRecognitionValues({
                      ...recognitionValues,
                      issueDate: e.target.value
                    })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Expiry Date (Optional)
                  </label>
                  <Input 
                    type="date"
                    value={recognitionValues.expiryDate || ""}
                    onChange={(e) => setRecognitionValues({
                      ...recognitionValues,
                      expiryDate: e.target.value || null
                    })}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Industry Type
                </label>
                <Select
                  value={recognitionValues.industryType || "none_general"}
                  onValueChange={(value) => {
                    setRecognitionValues({
                      ...recognitionValues,
                      industryType: value === "none_general" ? null : value
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none_general">None (General)</SelectItem>
                    {domainOptions.map((domain) => (
                      <SelectItem key={domain} value={domain}>
                        {getDomainLabel(domain)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Categorize this recognition by industry to help organize your profile.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Description
                </label>
                <Textarea 
                  value={recognitionValues.description || ""}
                  onChange={(e) => setRecognitionValues({
                    ...recognitionValues,
                    description: e.target.value || null
                  })}
                  placeholder="Briefly describe this recognition and what it represents (optional)"
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-4 flex justify-between gap-3">
            <div className="flex gap-2">
              {editIndex !== null && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleToggleVisibilityInForm}
                    disabled={isSaving || isSubmitting}
                    className="gap-1"
                  >
                    {recognitionValues.isVisible ? (
                      <>
                        <EyeOff className="h-4 w-4" />
                        <span>Hide</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4" />
                        <span>Show</span>
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      if (editIndex !== null) {
                        handleDeleteRecognition(editIndex);
                      }
                    }}
                    disabled={isSaving || isSubmitting}
                    className="text-destructive gap-1"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </Button>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={clearForm}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveRecognition}
                disabled={isSaving || isSubmitting}
              >
                {isSaving || isSubmitting ? "Saving..." : (editIndex !== null ? "Save Changes" : "Save")}
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
} 