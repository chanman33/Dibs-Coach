"use client"

import { Spinner } from "./spinner"
import { cn } from "@/utils/cn"

export interface ContainerLoadingProps {
  message?: string
  className?: string
  spinnerSize?: "xs" | "sm" | "md" | "lg"
  spinnerColor?: "default" | "primary" | "secondary" | "muted"
  minHeight?: string
  padding?: string
}

/**
 * A loading component for smaller containers like cards, sections, etc.
 */
export function ContainerLoading({
  message,
  className,
  spinnerSize = "md",
  spinnerColor = "primary",
  minHeight = "min-h-[200px]",
  padding = "p-4"
}: ContainerLoadingProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center",
      minHeight,
      padding,
      className
    )}>
      <div className="flex flex-col items-center gap-2">
        <Spinner size={spinnerSize} color={spinnerColor} />
        {message && (
          <p className="text-sm text-muted-foreground text-center">
            {message}
          </p>
        )}
      </div>
    </div>
  )
} 