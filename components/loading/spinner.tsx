import { Loader2 } from "lucide-react"
import { cn } from "@/utils/cn"

export interface SpinnerProps {
  className?: string
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  color?: "default" | "primary" | "secondary" | "muted"
}

/**
 * A standardized spinner component with consistent sizing and styling
 */
export function Spinner({ 
  className, 
  size = "md", 
  color = "primary" 
}: SpinnerProps) {
  const sizeClasses = {
    xs: "h-4 w-4",
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
    xl: "h-12 w-12",
  }
  
  const colorClasses = {
    default: "text-foreground",
    primary: "text-primary",
    secondary: "text-secondary",
    muted: "text-muted-foreground",
  }
  
  return (
    <Loader2 
      className={cn(
        "animate-spin", 
        sizeClasses[size], 
        colorClasses[color], 
        className
      )} 
    />
  )
} 