"use client"

import { Loader2 } from "lucide-react"
import Image from "next/image"

export default function DashboardLoading() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-background">
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
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">
          Preparing your dashboard...
        </p>
      </div>
    </div>
  )
}
