"use client"

import { useState } from "react";
import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import Select from "react-select";
import { COMMON_LANGUAGES } from "@/lib/constants";
import { RequiredFieldIndicator } from "@/components/ui/required-field-indicator";
import { selectStyles } from "@/components/ui/select-styles";
import { updateUserLanguages } from "@/utils/actions/profile-actions";
import { toast } from "sonner";

interface LanguagesSectionProps {
  initialLanguages?: string[];
  onLanguagesUpdate?: (languages: string[]) => void;
}

export function LanguagesSection({ initialLanguages = ['en'], onLanguagesUpdate }: LanguagesSectionProps) {
  const [languages, setLanguages] = useState<string[]>(initialLanguages);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleLanguageChange = async (newValue: any) => {
    try {
      setIsUpdating(true);
      const selectedCodes = newValue ? newValue.map((item: any) => item.value) : ['en'];
      
      // Always include English
      if (!selectedCodes.includes('en')) {
        selectedCodes.unshift('en');
      }

      // Update languages in the database
      const result = await updateUserLanguages({ languages: selectedCodes });
      
      if (result.error) {
        toast.error("Failed to update languages");
        return;
      }

      setLanguages(selectedCodes);
      if (onLanguagesUpdate) {
        onLanguagesUpdate(selectedCodes);
      }
      toast.success("Languages updated successfully");
    } catch (error) {
      console.error("[LANGUAGE_UPDATE_ERROR]", error);
      toast.error("Failed to update languages");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <FormItem>
      <FormLabel>
        Languages <RequiredFieldIndicator />
      </FormLabel>
      <Select
        isMulti
        isDisabled={isUpdating}
        placeholder="Select languages you speak"
        options={COMMON_LANGUAGES.map(lang => ({
          value: lang.code,
          label: `${lang.name} (${lang.nativeName})`,
        }))}
        value={COMMON_LANGUAGES
          .filter(lang => languages.includes(lang.code))
          .map(lang => ({
            value: lang.code,
            label: `${lang.name} (${lang.nativeName})`
          }))}
        onChange={handleLanguageChange}
        classNamePrefix="react-select"
        className="react-select-container"
        styles={selectStyles}
      />
      <FormMessage />
    </FormItem>
  );
} 