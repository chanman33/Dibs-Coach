"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { PropertyManagerProfileForm } from "./PropertyManagerProfileForm"
import { fetchPropertyManagerProfile, updatePropertyManagerProfile } from "@/utils/actions/property-manager-profile-actions"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export function PropertyManagerProfileWrapper() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [profileData, setProfileData] = useState<any>(null)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const result = await fetchPropertyManagerProfile()
        if (result.error) {
          toast.error(result.error.message)
          return
        }
        if (result.data) {
          setProfileData(result.data.profile)
        }
      } catch (error) {
        console.error("[LOAD_PROPERTY_MANAGER_PROFILE_ERROR]", error)
        toast.error("Failed to load property manager profile")
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [])

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true)
    try {
      const result = await updatePropertyManagerProfile(values)
      if (result.error) {
        toast.error(result.error.message)
        return
      }
      if (result.data) {
        setProfileData(result.data.profile)
        toast.success("Property manager profile updated successfully")
      }
    } catch (error) {
      console.error("[UPDATE_PROPERTY_MANAGER_PROFILE_ERROR]", error)
      toast.error("Failed to update property manager profile")
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
    <PropertyManagerProfileForm
      initialData={profileData}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  )
} 