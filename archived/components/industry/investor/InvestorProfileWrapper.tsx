"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { InvestorProfileForm } from "./InvestorProfileForm"
import { fetchInvestorProfile, updateInvestorProfile } from "@/utils/actions/investor-profile-actions"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export function InvestorProfileWrapper() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [profileData, setProfileData] = useState<any>(null)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const result = await fetchInvestorProfile()
        if (result.error) {
          toast.error(result.error.message)
          return
        }
        if (result.data) {
          setProfileData(result.data.profile)
        }
      } catch (error) {
        console.error("[LOAD_INVESTOR_PROFILE_ERROR]", error)
        toast.error("Failed to load investor profile")
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [])

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true)
    try {
      const result = await updateInvestorProfile(values)
      if (result.error) {
        toast.error(result.error.message)
        return
      }
      if (result.data) {
        setProfileData(result.data.profile)
        toast.success("Investor profile updated successfully")
      }
    } catch (error) {
      console.error("[UPDATE_INVESTOR_PROFILE_ERROR]", error)
      toast.error("Failed to update investor profile")
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
    <InvestorProfileForm
      initialData={profileData}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  )
} 