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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Trophy, 
  Award, 
  Plus, 
  Trash2, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Building 
} from "lucide-react";
import { FormSectionHeader } from "../common/FormSectionHeader";
import { CoachProfileFormValues, ProfessionalRecognition } from "../types";
import { Badge } from "@/components/ui/badge";
import { RequiredFieldIndicator } from "../common/RequiredFieldIndicator";

interface RecognitionsSectionProps {
  control: Control<CoachProfileFormValues>;
  setValue: UseFormSetValue<CoachProfileFormValues>;
  watch: UseFormWatch<CoachProfileFormValues>;
}

export function RecognitionsSection({ control, setValue, watch }: RecognitionsSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [recognitionValues, setRecognitionValues] = useState<ProfessionalRecognition>({
    title: "",
    type: "AWARD",
    year: new Date().getFullYear(),
    organization: null,
    description: null,
    isVisible: true
  });

  const recognitions = watch("professionalRecognitions") || [];

  const clearForm = () => {
    setRecognitionValues({
      title: "",
      type: "AWARD",
      year: new Date().getFullYear(),
      organization: null,
      description: null,
      isVisible: true
    });
    setEditingIndex(null);
  };

  const handleSaveRecognition = () => {
    const newRecognitions = [...recognitions];
    
    if (editingIndex !== null) {
      // Update existing recognition
      newRecognitions[editingIndex] = {
        ...newRecognitions[editingIndex],
        ...recognitionValues
      };
    } else {
      // Add new recognition
      newRecognitions.push({
        ...recognitionValues,
        isVisible: true // Ensure isVisible is always defined as true
      });
    }
    
    setValue("professionalRecognitions", newRecognitions);
    setShowForm(false);
    clearForm();
  };

  const handleEditRecognition = (index: number) => {
    setEditingIndex(index);
    setRecognitionValues({
      ...recognitions[index],
      organization: recognitions[index].organization ?? null,
      description: recognitions[index].description ?? null,
      isVisible: recognitions[index].isVisible ?? true
    });
    setShowForm(true);
  };

  const handleDeleteRecognition = (index: number) => {
    const newRecognitions = [...recognitions];
    newRecognitions.splice(index, 1);
    setValue("professionalRecognitions", newRecognitions);
  };

  return (
    <div className="space-y-4 mb-8">
      <FormSectionHeader 
        title="Professional Recognitions" 
        tooltip="Add awards and achievements that showcase your expertise and credibility as a coach."
      />
      
      {/* List of Recognitions */}
      {recognitions.length > 0 && (
        <div className="space-y-4 mb-6">
          {recognitions.map((recognition, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    {recognition.type === "AWARD" ? (
                      <Trophy className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <Award className="h-5 w-5 text-blue-500" />
                    )}
                    <CardTitle className="text-base">{recognition.title}</CardTitle>
                    <Badge variant="outline" className="ml-2">
                      {recognition.year}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleEditRecognition(index)}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDeleteRecognition(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {recognition.organization && (
                <CardContent className="pb-2 pt-0">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Building className="h-4 w-4" />
                    <span>{recognition.organization}</span>
                  </div>
                </CardContent>
              )}
              {recognition.description && (
                <CardContent className="py-2">
                  <p className="text-sm text-gray-600">{recognition.description}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
      
      {/* Add/Edit Recognition Form */}
      {showForm ? (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-base">
                {editingIndex !== null ? "Edit Recognition" : "Add New Recognition"}
              </CardTitle>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => {
                  setShowForm(false);
                  clearForm();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <FormLabel>
                    Title <RequiredFieldIndicator />
                  </FormLabel>
                  <Input
                    value={recognitionValues.title}
                    onChange={(e) => setRecognitionValues({
                      ...recognitionValues,
                      title: e.target.value
                    })}
                    placeholder="e.g., Top Producer Award"
                  />
                </div>
                <div className="space-y-2">
                  <FormLabel>
                    Type <RequiredFieldIndicator />
                  </FormLabel>
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
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <FormLabel>
                    Year <RequiredFieldIndicator />
                  </FormLabel>
                  <Input
                    type="number"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={recognitionValues.year}
                    onChange={(e) => setRecognitionValues({
                      ...recognitionValues,
                      year: e.target.valueAsNumber || new Date().getFullYear()
                    })}
                    placeholder="e.g., 2022"
                  />
                </div>
                <div className="space-y-2">
                  <FormLabel>Organization</FormLabel>
                  <Input
                    value={recognitionValues.organization || ""}
                    onChange={(e) => setRecognitionValues({
                      ...recognitionValues,
                      organization: e.target.value || null
                    })}
                    placeholder="e.g., National Association of Realtors"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={recognitionValues.description || ""}
                  onChange={(e) => setRecognitionValues({
                    ...recognitionValues,
                    description: e.target.value || null
                  })}
                  placeholder="Briefly describe this recognition or achievement..."
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleSaveRecognition}
              disabled={!recognitionValues.title || !recognitionValues.year}
            >
              {editingIndex !== null ? "Update Recognition" : "Add Recognition"}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Button 
          variant="outline" 
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Professional Recognition
        </Button>
      )}
      
      {/* Hidden field for form validation */}
      <div className="hidden">
        <FormField
          control={control}
          name="professionalRecognitions"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <input type="hidden" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
} 