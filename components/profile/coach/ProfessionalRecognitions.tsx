import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Eye, EyeOff } from "lucide-react";
import { cn } from "@/utils/cn";
import { ProfessionalRecognition, RecognitionType } from "@/utils/types/recognition";

interface ProfessionalRecognitionsProps {
  recognitions: ProfessionalRecognition[];
  onEdit?: (recognition: ProfessionalRecognition) => void;
  onToggleVisibility?: (recognition: ProfessionalRecognition) => void;
  editingId?: string | null;
  editForm?: React.ReactNode;
  showVisibilityControls?: boolean;
  className?: string;
}

export function ProfessionalRecognitions({ 
  recognitions, 
  onEdit,
  onToggleVisibility,
  editingId,
  editForm,
  showVisibilityControls = true,
  className
}: ProfessionalRecognitionsProps) {
  if (!recognitions?.length) {
    return (
      <div className={cn("text-center py-8 border rounded-lg bg-muted/10", className)}>
        <p className="text-muted-foreground">No professional recognitions added yet</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {recognitions.map((recognition) => {
        const key = recognition.ulid || `new-recognition-${recognition.title}`;
        
        // If this recognition is being edited, show the edit form instead
        if (recognition.ulid === editingId && editForm) {
          return (
            <div key={key} className="border rounded-lg p-4">
              {editForm}
            </div>
          );
        }

        // Otherwise show the recognition card
        return (
          <Card 
            key={key} 
            className={cn(
              "w-full transition-opacity duration-200",
              !recognition.isVisible && "opacity-60"
            )}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold">{recognition.title}</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    {recognition.organization ? (
                      <>{recognition.organization} • {recognition.year}</>
                    ) : (
                      <>{recognition.year}</>
                    )}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={recognition.type === RecognitionType.AWARD ? "default" : "secondary"}
                    className="capitalize"
                  >
                    {recognition.type.toLowerCase()}
                  </Badge>
                  {recognition.industryType && (
                    <Badge variant="outline" className="capitalize">
                      {recognition.industryType.toLowerCase()}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            
            {recognition.description && (
              <CardContent>
                <p className="text-sm text-muted-foreground">{recognition.description}</p>
              </CardContent>
            )}

            {(onEdit || onToggleVisibility) && (
              <CardFooter className="pt-2 border-t flex justify-end gap-2">
                {showVisibilityControls && onToggleVisibility && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onToggleVisibility(recognition)}
                    className="gap-2"
                  >
                    {recognition.isVisible ? (
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
                )}
                {onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(recognition)}
                    className="gap-2"
                  >
                    <Pencil className="h-4 w-4" />
                    <span>Edit</span>
                  </Button>
                )}
              </CardFooter>
            )}
          </Card>
        );
      })}
    </div>
  );
} 