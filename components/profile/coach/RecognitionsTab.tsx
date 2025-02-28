"use client"

import { useState } from "react";
import { ProfessionalRecognition } from "@/utils/types/recognition";
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
import { FormLabel, FormDescription } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { 
  PlusCircle, 
  Edit, 
  Trash2, 
  Award, 
  EyeOff, 
  Eye 
} from "lucide-react";
import { toast } from "sonner";

interface RecognitionsTabProps {
  initialRecognitions: ProfessionalRecognition[];
  onSubmit: (recognitions: ProfessionalRecognition[]) => Promise<void>;
  isSubmitting: boolean;
  selectedSkills: string[];
}

export const RecognitionsTab: React.FC<RecognitionsTabProps> = ({
  initialRecognitions,
  onSubmit,
  isSubmitting,
  selectedSkills
}) => {
  const [recognitions, setRecognitions] = useState<ProfessionalRecognition[]>(initialRecognitions);
  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [industryFilter, setIndustryFilter] = useState<string | null>(null);
  const [recognitionValues, setRecognitionValues] = useState<ProfessionalRecognition>({
    title: "",
    type: "AWARD",
    issuer: "",
    issueDate: new Date().toISOString(),
    expiryDate: null,
    description: null,
    verificationUrl: null,
    certificateUrl: null,
    status: "ACTIVE",
    isVisible: true,
    industryType: null,
    coachProfileUlid: null
  });

  const clearForm = () => {
    setRecognitionValues({
      title: "",
      type: "AWARD",
      issuer: "",
      issueDate: new Date().toISOString(),
      expiryDate: null,
      description: null,
      verificationUrl: null,
      certificateUrl: null,
      status: "ACTIVE",
      isVisible: true,
      industryType: null,
      coachProfileUlid: null
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
      issuer: recognition.issuer || "",
      issueDate: recognition.issueDate || new Date().toISOString(),
      expiryDate: recognition.expiryDate || null,
      description: recognition.description || null,
      verificationUrl: recognition.verificationUrl || null,
      certificateUrl: recognition.certificateUrl || null,
      status: recognition.status || "ACTIVE",
      isVisible: recognition.isVisible,
      industryType: recognition.industryType || null,
      coachProfileUlid: recognition.coachProfileUlid || null,
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
                        {recognition.issuer && `${recognition.issuer} • `}
                        {new Date(recognition.issueDate).getFullYear()}
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
                    <FormLabel>Issuer</FormLabel>
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FormLabel>Issue Date</FormLabel>
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
                    <FormLabel>Expiry Date</FormLabel>
                    <Input 
                      type="date"
                      value={recognitionValues.expiryDate || ""}
                      onChange={(e) => setRecognitionValues({
                        ...recognitionValues,
                        expiryDate: e.target.value ? e.target.value : null
                      })}
                    />
                  </div>
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
                      {selectedSkills.map((skill) => (
                        <SelectItem key={skill} value={skill}>
                          {skill}
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