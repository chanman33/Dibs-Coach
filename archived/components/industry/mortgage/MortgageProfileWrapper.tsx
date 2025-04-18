"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { MortgageProfileForm } from "./MortgageProfileForm"
import { fetchMortgageProfile, updateMortgageProfile } from "@/utils/actions/mortgage-profile-actions"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export function MortgageProfileWrapper() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [profileData, setProfileData] = useState<any>(null)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const result = await fetchMortgageProfile()
        if (result.error) {
          toast.error(result.error.message)
          return
        }
        if (result.data) {
          setProfileData(result.data.profile)
        }
      } catch (error) {
        console.error("[LOAD_MORTGAGE_PROFILE_ERROR]", error)
        toast.error("Failed to load mortgage profile")
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [])

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true)
    try {
      const result = await updateMortgageProfile(values)
      if (result.error) {
        toast.error(result.error.message)
        return
      }
      if (result.data) {
        setProfileData(result.data.profile)
        toast.success("Mortgage profile updated successfully")
      }
    } catch (error) {
      console.error("[UPDATE_MORTGAGE_PROFILE_ERROR]", error)
      toast.error("Failed to update mortgage profile")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <MortgageProfileForm
      initialData={profileData}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  )
} 