"use client"

import { Spinner } from "./spinner"
import Image from "next/image"
import { cn } from "@/utils/cn"

export interface FullPageLoadingProps {
  message?: string
  className?: string
  showLogo?: boolean
  spinnerSize?: "sm" | "md" | "lg" | "xl"
  spinnerColor?: "default" | "primary" | "secondary" | "muted"
  minHeight?: string
}

/**
 * A full-page loading component that displays a centered spinner with optional logo and message
 */
export function FullPageLoading({
  message,
  className,
  showLogo = false,
  spinnerSize = "lg",
  spinnerColor = "primary",
  minHeight = "min-h-screen"
}: FullPageLoadingProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center bg-background",
      minHeight,
      className
    )}>
      {showLogo && (
        <div className="relative mb-8">
          {/* Light mode logo */}
          <Image
            src="https://utfs.io/f/vsxOYx8jne165wyeoiHgeTEz7hN19sBwDyrvKxioc2kQLnp3"
            alt="Logo"
            width={120}
            height={30}
            className="object-contain dark:hidden"
            priority
          />
          {/* Dark mode logo */}
          <Image
            src="https://utfs.io/f/vsxOYx8jne16qkQqNfjFkTQhZ97v4VpUzm85MASd0nWRBi3J"
            alt="Logo"
            width={120}
            height={30}
            className="object-contain hidden dark:block"
            priority
          />
        </div>
      )}
      <div className="flex flex-col items-center gap-2">
        <Spinner size={spinnerSize} color={spinnerColor} />
        {message && (
          <p className="text-sm text-muted-foreground animate-pulse">
            {message}
          </p>
        )}
      </div>
    </div>
  )
} 