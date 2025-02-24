"use client"

import { useState } from "react";
import { Control } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { FormSectionHeader } from "../common/FormSectionHeader";
import { CoachProfileFormValues } from "../types";

interface LanguagesSectionProps {
  control: Control<CoachProfileFormValues>;
}

export function LanguagesSection({ control }: LanguagesSectionProps) {
  const [inputValue, setInputValue] = useState<string>("");

  return (
    <div className="space-y-4 mb-8">
      <FormSectionHeader 
        title="Languages" 
        tooltip="List all languages you're comfortable coaching in. English is assumed."
      />
      
      <FormField
        control={control}
        name="languages"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Languages You Speak</FormLabel>
            <FormControl>
              <div className="space-y-3">
                <Input
                  placeholder="Add a language (e.g., Spanish, French) and press Enter"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && inputValue.trim()) {
                      e.preventDefault();
                      const newValue = [...(field.value || []), inputValue.trim()];
                      field.onChange(newValue);
                      setInputValue("");
                    }
                  }}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {field.value?.map((language, index) => (
                    <Badge key={index} variant="secondary" className="py-1.5 px-3">
                      {language}
                      <button
                        type="button"
                        className="ml-2 text-gray-500 hover:text-gray-700"
                        onClick={() => {
                          const newValue = [...field.value];
                          newValue.splice(index, 1);
                          field.onChange(newValue);
                        }}
                      >
                        <X size={14} />
                      </button>
                    </Badge>
                  ))}
                  {!field.value?.length && (
                    <div className="text-sm text-gray-500 italic">
                      No languages added yet. English is assumed by default.
                    </div>
                  )}
                </div>
              </div>
            </FormControl>
            <FormDescription>
              Enter each language you speak fluently enough to coach in.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
} 