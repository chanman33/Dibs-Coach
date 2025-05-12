"use client"

import { Loader2 } from "lucide-react"

export default function RoleApiLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">
          Verifying access...
        </p>
      </div>
    </div>
  )
}
