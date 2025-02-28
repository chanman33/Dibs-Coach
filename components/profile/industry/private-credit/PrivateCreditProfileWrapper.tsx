"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { PrivateCreditProfileForm } from "./PrivateCreditProfileForm"
import { fetchPrivateCreditProfile, updatePrivateCreditProfile } from "@/utils/actions/private-credit-profile-actions"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export function PrivateCreditProfileWrapper() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [profileData, setProfileData] = useState<any>(null)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const result = await fetchPrivateCreditProfile()
        if (result.error) {
          toast.error(result.error.message)
          return
        }
        if (result.data) {
          setProfileData(result.data.profile)
        }
      } catch (error) {
        console.error("[LOAD_PRIVATE_CREDIT_PROFILE_ERROR]", error)
        toast.error("Failed to load private credit profile")
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [])

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true)
    try {
      const result = await updatePrivateCreditProfile(values)
      if (result.error) {
        toast.error(result.error.message)
        return
      }
      if (result.data) {
        setProfileData(result.data.profile)
        toast.success("Private credit profile updated successfully")
      }
    } catch (error) {
      console.error("[UPDATE_PRIVATE_CREDIT_PROFILE_ERROR]", error)
      toast.error("Failed to update private credit profile")
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
    <PrivateCreditProfileForm
      initialData={profileData}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  )
} 