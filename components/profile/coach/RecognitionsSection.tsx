"use client"

import { useState } from "react";
import { Control, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormDescription, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
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
import { FormSectionHeader } from "../common/FormSectionHeader";
import { CoachProfileFormValues, ProfessionalRecognition } from "../types";
import { Badge } from "@/components/ui/badge";
import { 
  CalendarIcon, 
  PlusCircle, 
  Edit, 
  Trash2, 
  Award, 
  Check, 
  EyeOff, 
  Eye 
} from "lucide-react";
import { toast } from "sonner";

// Original component for use within the CoachProfileForm
interface RecognitionsSectionProps {
  control: Control<CoachProfileFormValues>;
  setValue: UseFormSetValue<CoachProfileFormValues>;
  watch: UseFormWatch<CoachProfileFormValues>;
}

export function RecognitionsSection({ control, setValue, watch }: RecognitionsSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [recognitionValues, setRecognitionValues] = useState<ProfessionalRecognition>({
    title: "",
    type: "AWARD",
    year: new Date().getFullYear(),
    organization: null,
    description: null,
    isVisible: true,
    industryType: null
  });

  const recognitions = watch("professionalRecognitions") || [];

  const clearForm = () => {
    setRecognitionValues({
      title: "",
      type: "AWARD",
      year: new Date().getFullYear(),
      organization: null,
      description: null,
      isVisible: true,
      industryType: null
    });
    setEditIndex(null);
    setShowForm(false);
  };

  const handleSaveRecognition = () => {
    if (!recognitionValues.title.trim()) {
      toast.error("Title is required");
      return;
    }

    const newRecognitions = [...recognitions];

    if (editIndex !== null) {
      // Editing existing recognition
      newRecognitions[editIndex] = recognitionValues;
    } else {
      // Adding new recognition - ensure isVisible is set to true
      newRecognitions.push({
        ...recognitionValues,
        isVisible: true
      });
    }

    setValue("professionalRecognitions", newRecognitions);
    clearForm();
    toast.success(editIndex !== null ? "Recognition updated" : "Recognition added");
  };

  const handleEditRecognition = (index: number) => {
    const recognition = recognitions[index];
    setRecognitionValues({
      title: recognition.title,
      type: recognition.type,
      year: recognition.year,
      organization: recognition.organization || null,
      description: recognition.description || null,
      isVisible: recognition.isVisible,
      industryType: recognition.industryType || null,
      ulid: recognition.ulid
    });
    setEditIndex(index);
    setShowForm(true);
  };

  const handleDeleteRecognition = (index: number) => {
    const newRecognitions = [...recognitions];
    newRecognitions.splice(index, 1);
    setValue("professionalRecognitions", newRecognitions);
    clearForm();
    toast.success("Recognition removed");
  };

  const handleToggleVisibility = (index: number) => {
    const newRecognitions = [...recognitions];
    newRecognitions[index] = {
      ...newRecognitions[index],
      isVisible: !newRecognitions[index].isVisible
    };
    setValue("professionalRecognitions", newRecognitions);
    toast.success(
      newRecognitions[index].isVisible
        ? "Recognition is now visible on your profile"
        : "Recognition is now hidden from your profile"
    );
  };

  return (
    <div className="space-y-6">
      <FormSectionHeader 
        title="Professional Recognitions" 
        description="Add certifications, awards, or other professional achievements"
      />

      <div className="space-y-4">
        {recognitions.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {recognitions.map((recognition, index) => (
              <Card key={index} className={recognition.isVisible ? "" : "opacity-70"}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-primary" />
                      <CardTitle className="text-base">{recognition.title}</CardTitle>
                    </div>
                    <Badge variant={recognition.type === "AWARD" ? "default" : "outline"}>
                      {recognition.type === "AWARD" ? "Award" : "Achievement"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <div className="text-sm text-muted-foreground">
                      {recognition.organization && `${recognition.organization} • `}
                      {recognition.year}
                    </div>
                    <Badge variant={recognition.isVisible ? "outline" : "secondary"} className="text-xs">
                      {recognition.isVisible ? "Visible" : "Hidden"}
                    </Badge>
                  </div>
                </CardHeader>
                {recognition.description && (
                  <CardContent className="py-2">
                    <p className="text-sm text-muted-foreground">{recognition.description}</p>
                  </CardContent>
                )}
                <CardFooter className="pt-2 border-t flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleToggleVisibility(index)}
                  >
                    {recognition.isVisible ? (
                      <EyeOff className="h-4 w-4 mr-1" />
                    ) : (
                      <Eye className="h-4 w-4 mr-1" />
                    )}
                    {recognition.isVisible ? "Hide" : "Show"}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleEditRecognition(index)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDeleteRecognition(index)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border rounded-md bg-gray-50 text-muted-foreground">
            <Award className="h-10 w-10 mx-auto mb-2 opacity-20" />
            <p>No professional recognitions added yet</p>
            <p className="text-sm">Add your certifications, awards, and achievements</p>
          </div>
        )}

        {!showForm ? (
          <Button 
            variant="outline" 
            className="flex gap-1 mx-auto mt-4"
            onClick={() => setShowForm(true)}
          >
            <PlusCircle className="h-4 w-4" />
            Add Recognition
          </Button>
        ) : (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">
                {editIndex !== null ? "Edit Recognition" : "Add Recognition"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <FormLabel>Title</FormLabel>
                  <Input 
                    value={recognitionValues.title}
                    onChange={(e) => setRecognitionValues({
                      ...recognitionValues,
                      title: e.target.value
                    })}
                    placeholder="e.g., Certified Residential Specialist (CRS)"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FormLabel>Type</FormLabel>
                    <Select 
                      value={recognitionValues.type}
                      onValueChange={(value) => setRecognitionValues({
                        ...recognitionValues,
                        type: value as "AWARD" | "ACHIEVEMENT"
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AWARD">Award</SelectItem>
                        <SelectItem value="ACHIEVEMENT">Achievement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <FormLabel>Year</FormLabel>
                    <Input 
                      type="number"
                      min={1950}
                      max={new Date().getFullYear()}
                      value={recognitionValues.year}
                      onChange={(e) => setRecognitionValues({
                        ...recognitionValues,
                        year: parseInt(e.target.value) || new Date().getFullYear()
                      })}
                    />
                  </div>
                </div>

                <div>
                  <FormLabel>Organization</FormLabel>
                  <Input 
                    value={recognitionValues.organization || ""}
                    onChange={(e) => setRecognitionValues({
                      ...recognitionValues,
                      organization: e.target.value ? e.target.value : null
                    })}
                    placeholder="e.g., National Association of Realtors"
                  />
                </div>

                <div>
                  <FormLabel>Description</FormLabel>
                  <Textarea 
                    value={recognitionValues.description || ""}
                    onChange={(e) => setRecognitionValues({
                      ...recognitionValues,
                      description: e.target.value ? e.target.value : null
                    })}
                    placeholder="Describe this recognition and why it's relevant to your coaching"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <Button 
                variant="ghost" 
                onClick={clearForm}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveRecognition}
              >
                <Check className="h-4 w-4 mr-1" />
                {editIndex !== null ? "Update" : "Add"} Recognition
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}

// New standalone component for use as a separate tab
interface RecognitionsTabProps {
  initialRecognitions?: ProfessionalRecognition[];
  onSubmit: (recognitions: ProfessionalRecognition[]) => Promise<void>;
  isSubmitting?: boolean;
  selectedSpecialties?: string[];
}

export function RecognitionsTab({ 
  initialRecognitions = [], 
  onSubmit,
  isSubmitting = false,
  selectedSpecialties = []
}: RecognitionsTabProps) {
  const [recognitions, setRecognitions] = useState<ProfessionalRecognition[]>(initialRecognitions);
  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [industryFilter, setIndustryFilter] = useState<string | null>(null);
  const [recognitionValues, setRecognitionValues] = useState<ProfessionalRecognition>({
    title: "",
    type: "AWARD",
    year: new Date().getFullYear(),
    organization: null,
    description: null,
    isVisible: true,
    industryType: null
  });

  const clearForm = () => {
    setRecognitionValues({
      title: "",
      type: "AWARD",
      year: new Date().getFullYear(),
      organization: null,
      description: null,
      isVisible: true,
      industryType: null
    });
    setEditIndex(null);
    setShowForm(false);
  };

  const handleSaveRecognition = () => {
    if (!recognitionValues.title.trim()) {
      toast.error("Title is required");
      return;
    }

    const newRecognitions = [...recognitions];

    if (editIndex !== null) {
      // Editing existing recognition
      newRecognitions[editIndex] = recognitionValues;
    } else {
      // Adding new recognition - ensure isVisible is set to true
      newRecognitions.push({
        ...recognitionValues,
        isVisible: true
      });
    }

    setRecognitions(newRecognitions);
    clearForm();
    toast.success(editIndex !== null ? "Recognition updated" : "Recognition added");
  };

  const handleEditRecognition = (index: number) => {
    const recognition = recognitions[index];
    setRecognitionValues({
      title: recognition.title,
      type: recognition.type,
      year: recognition.year,
      organization: recognition.organization || null,
      description: recognition.description || null,
      isVisible: recognition.isVisible,
      industryType: recognition.industryType || null,
      ulid: recognition.ulid
    });
    setEditIndex(index);
    setShowForm(true);
  };

  const handleDeleteRecognition = (index: number) => {
    const newRecognitions = [...recognitions];
    newRecognitions.splice(index, 1);
    setRecognitions(newRecognitions);
    clearForm();
    toast.success("Recognition removed");
  };

  const handleToggleVisibility = (index: number) => {
    const newRecognitions = [...recognitions];
    newRecognitions[index] = {
      ...newRecognitions[index],
      isVisible: !newRecognitions[index].isVisible
    };
    setRecognitions(newRecognitions);
    toast.success(
      newRecognitions[index].isVisible
        ? "Recognition is now visible on your profile"
        : "Recognition is now hidden from your profile"
    );
  };

  const handleSubmit = async () => {
    try {
      await onSubmit(recognitions);
      toast.success("Professional recognitions saved successfully");
    } catch (error) {
      console.error("[RECOGNITIONS_SUBMIT_ERROR]", error);
      toast.error("Failed to save recognitions");
    }
  };

  const filteredRecognitions = industryFilter 
    ? recognitions.filter(r => r.industryType === industryFilter)
    : recognitions;

  const industryTypes = Array.from(new Set(recognitions
    .map(r => r.industryType)
    .filter(Boolean) as string[]));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Professional Recognitions</h2>
        <Button 
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : "Save Recognitions"}
        </Button>
      </div>
      
      <p className="text-muted-foreground">
        Add your certifications, awards, and other professional achievements to showcase your expertise.
      </p>

      {industryTypes.length > 0 && (
        <div className="flex items-center space-x-4">
          <div className="text-sm font-medium">Filter by industry:</div>
          <Select
            value={industryFilter || ""}
            onValueChange={(value) => setIndustryFilter(value === "" ? null : value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All industries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All industries</SelectItem>
              {industryTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-4">
        {filteredRecognitions.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredRecognitions.map((recognition, index) => {
              const originalIndex = recognitions.findIndex(r => 
                r === recognition || (r.ulid && r.ulid === recognition.ulid)
              );
              
              return (
                <Card key={index} className={recognition.isVisible ? "" : "opacity-70"}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-primary" />
                        <CardTitle className="text-base">{recognition.title}</CardTitle>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={recognition.type === "AWARD" ? "default" : "outline"}>
                          {recognition.type === "AWARD" ? "Award" : "Achievement"}
                        </Badge>
                        {recognition.industryType && (
                          <Badge variant="secondary" className="text-xs">
                            {recognition.industryType}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <div className="text-sm text-muted-foreground">
                        {recognition.organization && `${recognition.organization} • `}
                        {recognition.year}
                      </div>
                      <Badge variant={recognition.isVisible ? "outline" : "secondary"} className="text-xs">
                        {recognition.isVisible ? "Visible" : "Hidden"}
                      </Badge>
                    </div>
                  </CardHeader>
                  {recognition.description && (
                    <CardContent className="py-2">
                      <p className="text-sm text-muted-foreground">{recognition.description}</p>
                    </CardContent>
                  )}
                  <CardFooter className="pt-2 border-t flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleToggleVisibility(originalIndex)}
                    >
                      {recognition.isVisible ? (
                        <EyeOff className="h-4 w-4 mr-1" />
                      ) : (
                        <Eye className="h-4 w-4 mr-1" />
                      )}
                      {recognition.isVisible ? "Hide" : "Show"}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEditRecognition(originalIndex)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDeleteRecognition(originalIndex)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 border rounded-md bg-gray-50 text-muted-foreground">
            <Award className="h-10 w-10 mx-auto mb-2 opacity-20" />
            <p>No professional recognitions added yet</p>
            <p className="text-sm">Add your certifications, awards, and achievements</p>
          </div>
        )}

        <div className="flex justify-center mt-4">
          <Button 
            variant="outline" 
            onClick={() => setShowForm(!showForm)}
            className="gap-1"
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

        {showForm && (
          <Card className="mt-4 border-primary">
            <CardHeader>
              <CardTitle className="text-lg">
                {editIndex !== null ? "Edit Recognition" : "Add New Recognition"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <FormLabel>Title</FormLabel>
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FormLabel>Type</FormLabel>
                    <Select 
                      value={recognitionValues.type}
                      onValueChange={(value) => setRecognitionValues({
                        ...recognitionValues,
                        type: value as "AWARD" | "ACHIEVEMENT"
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AWARD">Award</SelectItem>
                        <SelectItem value="ACHIEVEMENT">Achievement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <FormLabel>Year</FormLabel>
                    <Input 
                      type="number"
                      min={1950}
                      max={new Date().getFullYear()}
                      value={recognitionValues.year}
                      onChange={(e) => setRecognitionValues({
                        ...recognitionValues,
                        year: parseInt(e.target.value) || new Date().getFullYear()
                      })}
                    />
                  </div>
                </div>

                <div>
                  <FormLabel>Organization</FormLabel>
                  <Input 
                    value={recognitionValues.organization || ""}
                    onChange={(e) => setRecognitionValues({
                      ...recognitionValues,
                      organization: e.target.value ? e.target.value : null
                    })}
                    placeholder="e.g., National Association of Realtors"
                  />
                </div>

                <div>
                  <FormLabel>Industry Type</FormLabel>
                  <Select
                    value={recognitionValues.industryType || ""}
                    onValueChange={(value) => setRecognitionValues({
                      ...recognitionValues,
                      industryType: value === "" ? null : value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None (General)</SelectItem>
                      {selectedSpecialties.map((specialty) => (
                        <SelectItem key={specialty} value={specialty}>
                          {specialty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-xs mt-1">
                    Categorize this recognition by industry to help organize your profile.
                  </FormDescription>
                </div>

                <div>
                  <FormLabel>Description</FormLabel>
                  <Textarea 
                    value={recognitionValues.description || ""}
                    onChange={(e) => setRecognitionValues({
                      ...recognitionValues,
                      description: e.target.value ? e.target.value : null
                    })}
                    placeholder="Briefly describe this recognition and what it represents (optional)"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4 flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={clearForm}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveRecognition}
              >
                {editIndex !== null ? "Update" : "Add"} Recognition
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
} 