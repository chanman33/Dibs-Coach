"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { CommercialProfileForm } from "./CommercialProfileForm"
import { fetchCommercialProfile, updateCommercialProfile } from "@/utils/actions/commercial-profile-actions"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export function CommercialProfileWrapper() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [profileData, setProfileData] = useState<any>(null)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const result = await fetchCommercialProfile()
        if (result.error) {
          toast.error(result.error.message)
          return
        }
        if (result.data) {
          setProfileData(result.data.profile)
        }
      } catch (error) {
        console.error("[LOAD_COMMERCIAL_PROFILE_ERROR]", error)
        toast.error("Failed to load commercial profile")
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [])

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true)
    try {
      const result = await updateCommercialProfile(values)
      if (result.error) {
        toast.error(result.error.message)
        return
      }
      if (result.data) {
        setProfileData(result.data.profile)
        toast.success("Commercial profile updated successfully")
      }
    } catch (error) {
      console.error("[UPDATE_COMMERCIAL_PROFILE_ERROR]", error)
      toast.error("Failed to update commercial profile")
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
    <CommercialProfileForm
      initialData={profileData}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  )
} 