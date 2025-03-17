"use client"

import { FullPageLoading } from "@/components/loading"

export default function RootLoading() {
  return (
    <FullPageLoading 
      showLogo={true}
      message="Loading your dashboard..."
      spinnerSize="lg"
    />
  )
} 