"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { TitleEscrowProfileForm } from "./TitleEscrowProfileForm"
import { fetchTitleEscrowProfile, updateTitleEscrowProfile } from "@/utils/actions/title-escrow-profile-actions"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export function TitleEscrowProfileWrapper() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [profileData, setProfileData] = useState<any>(null)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const result = await fetchTitleEscrowProfile()
        if (result.error) {
          toast.error(result.error.message)
          return
        }
        if (result.data) {
          setProfileData(result.data.profile)
        }
      } catch (error) {
        console.error("[LOAD_TITLE_ESCROW_PROFILE_ERROR]", error)
        toast.error("Failed to load title escrow profile")
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [])

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true)
    try {
      const result = await updateTitleEscrowProfile(values)
      if (result.error) {
        toast.error(result.error.message)
        return
      }
      if (result.data) {
        setProfileData(result.data.profile)
        toast.success("Title escrow profile updated successfully")
      }
    } catch (error) {
      console.error("[UPDATE_TITLE_ESCROW_PROFILE_ERROR]", error)
      toast.error("Failed to update title escrow profile")
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
    <TitleEscrowProfileForm
      initialData={profileData}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  )
} 