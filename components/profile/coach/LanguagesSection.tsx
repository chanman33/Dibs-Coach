"use client"

import { useEffect, useState } from "react";
import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import Select from "react-select";
import { COMMON_LANGUAGES } from "@/lib/constants";
import { selectStyles } from "@/components/ui/select-styles";
import { updateUserLanguages, fetchUserLanguages } from "@/utils/actions/user-profile-actions";
import { toast } from "sonner";

interface LanguagesSectionProps {
  initialLanguages?: string[];
  onLanguagesUpdate?: (languages: string[]) => void;
}

export function LanguagesSection({ initialLanguages = ['en'], onLanguagesUpdate }: LanguagesSectionProps) {
  const [languages, setLanguages] = useState<string[]>(initialLanguages);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLanguages = async () => {
      try {
        const result = await fetchUserLanguages();
        
        if (result.error) {
          console.error("Failed to fetch languages:", result.error);
          return;
        }

        if (result.data) {
          setLanguages(result.data.languages);
        }
      } catch (error) {
        console.error("Failed to fetch languages:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLanguages();
  }, []);

  const handleLanguageChange = async (newValue: any) => {
    try {
      setIsUpdating(true);
      const selectedCodes = newValue ? newValue.map((item: any) => item.value) : ['en'];
      
      if (selectedCodes.length === 0) {
        selectedCodes.push('en');
      }

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
      console.error("Failed to update languages:", error);
      toast.error("Failed to update languages");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <FormItem>
        <FormLabel>Languages</FormLabel>
        <div className="h-10 animate-pulse bg-muted rounded-md" />
      </FormItem>
    );
  }

  return (
    <FormItem>
      <FormLabel>Languages</FormLabel>
      <Select
        isMulti
        isDisabled={isUpdating}
        placeholder="Select languages you speak (English is default)"
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