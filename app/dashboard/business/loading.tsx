"use client"

import { ContainerLoading } from "@/components/loading"

export default function Loading() {
  return (
    <div className="flex-1 p-6">
      <ContainerLoading 
        message="Loading business dashboard..."
        spinnerSize="md"
        minHeight="h-full" 
      />
    </div>
  )
} 