"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Spinner, InlineLoading, ContainerLoading, FullPageLoading } from "@/components/loading"

/**
 * Example of how to use the InlineLoading component in a button
 */
export function SubmitButtonExample() {
  const [isLoading, setIsLoading] = useState(false)
  
  const handleSubmit = async () => {
    setIsLoading(true)
    // Simulating an API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsLoading(false)
  }
  
  return (
    <Button 
      onClick={handleSubmit} 
      disabled={isLoading}
    >
      {isLoading ? (
        <InlineLoading text="Submitting..." spinnerColor="inherit" />
      ) : (
        "Submit"
      )}
    </Button>
  )
}

/**
 * Example of how to use the Spinner component directly
 */
export function CustomSpinnerExample() {
  return (
    <div className="flex items-center gap-2">
      <Spinner size="xs" color="primary" />
      <Spinner size="sm" color="secondary" />
      <Spinner size="md" color="muted" />
      <Spinner size="lg" color="default" />
      <Spinner size="xl" color="primary" />
    </div>
  )
}

/**
 * Example of how to use the ContainerLoading component in a card
 */
export function CardLoadingExample() {
  return (
    <div className="rounded-md border shadow-sm p-4">
      <h3 className="text-lg font-medium mb-4">Card Title</h3>
      <ContainerLoading 
        message="Loading card content..."
        minHeight="min-h-[100px]"
        spinnerSize="sm"
      />
    </div>
  )
}

/**
 * Example of component with conditional loading state
 */
export function ConditionalLoadingExample({ isLoading = false, data = null }) {
  if (isLoading) {
    return <ContainerLoading message="Fetching data..." />
  }
  
  if (!data) {
    return <div>No data available</div>
  }
  
  return <div>Data loaded successfully</div>
} 