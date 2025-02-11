import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ProfessionalRecognition } from "@/utils/types/realtor";

interface ProfessionalRecognitionsProps {
  recognitions: ProfessionalRecognition[];
  onEdit?: (recognition: ProfessionalRecognition) => void;
  editingId?: number | null;
  editForm?: React.ReactNode;
}

export function ProfessionalRecognitions({ 
  recognitions, 
  onEdit,
  editingId,
  editForm 
}: ProfessionalRecognitionsProps) {
  console.log('[DEBUG] ProfessionalRecognitions received:', recognitions);

  if (!recognitions || recognitions.length === 0) {
    console.log('[DEBUG] No recognitions to display');
    return null;
  }

  return (
    <div className="space-y-4">
      {recognitions.map((recognition, index) => {
        console.log('[DEBUG] Rendering recognition:', recognition);
        const key = recognition.id ? `recognition-${recognition.id}` : `recognition-new-${index}`;
        
        // If this recognition is being edited, show the edit form instead
        if (recognition.id === editingId && editForm) {
          return (
            <div key={key} className="border rounded-lg p-4">
              {editForm}
            </div>
          );
        }

        // Otherwise show the recognition card
        return (
          <Card key={key} className="w-full">
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
                  <Badge variant={recognition.type === "AWARD" ? "default" : "secondary"}>
                    {recognition.type}
                  </Badge>
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(recognition)}
                      className="h-8 w-8"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            {recognition.description && (
              <CardContent>
                <p className="text-sm text-muted-foreground">{recognition.description}</p>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
} 