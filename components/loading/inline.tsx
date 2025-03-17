"use client"

import { Spinner } from "./spinner"
import { cn } from "@/utils/cn"

export interface InlineLoadingProps {
  text?: string
  className?: string
  spinnerSize?: "xs" | "sm"
  spinnerColor?: "default" | "primary" | "secondary" | "muted" | "inherit"
  textClassName?: string
}

/**
 * An inline loading component for buttons and text elements
 */
export function InlineLoading({
  text,
  className,
  spinnerSize = "xs",
  spinnerColor = "inherit",
  textClassName
}: InlineLoadingProps) {
  const colorClasses = spinnerColor === "inherit" 
    ? "text-current" 
    : undefined;
    
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Spinner 
        size={spinnerSize} 
        color={spinnerColor === "inherit" ? "default" : spinnerColor} 
        className={colorClasses}
      />
      {text && (
        <span className={cn("text-sm", textClassName)}>
          {text}
        </span>
      )}
    </span>
  )
} 