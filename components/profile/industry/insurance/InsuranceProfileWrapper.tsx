"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { InsuranceProfileForm } from "./InsuranceProfileForm"
import { fetchInsuranceProfile, updateInsuranceProfile } from "@/utils/actions/insurance-profile-actions"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export function InsuranceProfileWrapper() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [profileData, setProfileData] = useState<any>(null)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const result = await fetchInsuranceProfile()
        if (result.error) {
          toast.error(result.error.message)
          return
        }
        if (result.data) {
          setProfileData(result.data.profile)
        }
      } catch (error) {
        console.error("[LOAD_INSURANCE_PROFILE_ERROR]", error)
        toast.error("Failed to load insurance profile")
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [])

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true)
    try {
      const result = await updateInsuranceProfile(values)
      if (result.error) {
        toast.error(result.error.message)
        return
      }
      if (result.data) {
        setProfileData(result.data.profile)
        toast.success("Insurance profile updated successfully")
      }
    } catch (error) {
      console.error("[UPDATE_INSURANCE_PROFILE_ERROR]", error)
      toast.error("Failed to update insurance profile")
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
    <InsuranceProfileForm
      initialData={profileData}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  )
} 