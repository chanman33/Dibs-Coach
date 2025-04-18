"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { RealtorProfileForm } from "./RealtorProfileForm"
import { fetchRealtorProfile, updateRealtorProfile } from "@/utils/actions/realtor-profile-actions"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export function RealtorProfileWrapper() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [profileData, setProfileData] = useState<any>(null)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const result = await fetchRealtorProfile()
        if (result.error) {
          toast.error(result.error.message)
          return
        }
        if (result.data) {
          setProfileData(result.data.profile)
        }
      } catch (error) {
        console.error("[LOAD_REALTOR_PROFILE_ERROR]", error)
        toast.error("Failed to load realtor profile")
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [])

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true)
    try {
      const result = await updateRealtorProfile(values)
      if (result.error) {
        toast.error(result.error.message)
        return
      }
      if (result.data) {
        setProfileData(result.data.profile)
        toast.success("Realtor profile updated successfully")
      }
    } catch (error) {
      console.error("[UPDATE_REALTOR_PROFILE_ERROR]", error)
      toast.error("Failed to update realtor profile")
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
    <RealtorProfileForm
      initialData={profileData}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  )
} 