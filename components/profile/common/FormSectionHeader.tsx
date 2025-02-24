"use client"

import { InfoIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RequiredFieldIndicator } from "./RequiredFieldIndicator";

interface FormSectionHeaderProps {
  title: string;
  description?: string;
  required?: boolean;
  tooltip?: string;
}

/**
 * Reusable form section header with optional tooltip and required indicator
 */
export function FormSectionHeader({
  title,
  description,
  required = false,
  tooltip,
}: FormSectionHeaderProps) {
  return (
    <div>
      <h3 className="text-lg font-medium flex items-center">
        {title}
        {required && <RequiredFieldIndicator />}
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-4 w-4 ml-2 text-muted-foreground cursor-pointer" />
              </TooltipTrigger>
              <TooltipContent className="max-w-80">
                <p>{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </h3>
      {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
    </div>
  );
} 