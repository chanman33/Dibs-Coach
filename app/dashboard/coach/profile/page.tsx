"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import GeneralForm from "../../../../components/profile/GeneralForm"
import SpecializationPreferences from "../../../../components/profile/SpecializationPreferences"
import ListingsForm from "../../../../components/profile/ListingsForm"
import MarketingInformation from "../../../../components/profile/MarketingInfo"
import GoalsForm from "../../../../components/profile/GoalsForm"
import { CoachProfileForm } from "../../../../components/profile/CoachProfileForm"
import { updateGeneralProfile, fetchUserProfile, fetchCoachProfile, updateCoachProfile } from "@/utils/actions/profile-actions"

export default function CoachProfilePage() {
  const [generalInfo, setGeneralInfo] = useState({})
  const [coachingInfo, setCoachingInfo] = useState({})
  const [listings, setListings] = useState({})
  const [marketing, setMarketing] = useState({})
  const [goals, setGoals] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    async function loadProfile() {
      try {
        const [generalResult, coachResult] = await Promise.all([
          fetchUserProfile(),
          fetchCoachProfile()
        ]);

        if (generalResult.success && generalResult.data) {
          setGeneralInfo(generalResult.data);
        }

        if (coachResult.success && coachResult.data) {
          setCoachingInfo(coachResult.data);
        }

        if (!generalResult.success || !coachResult.success) {
          toast({
            title: "Error",
            description: "Failed to load profile data. Please refresh the page.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('[PROFILE_LOAD_ERROR]', error);
        toast({
          title: "Error",
          description: "Failed to load profile data. Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [toast]);

  const handleSubmit = async (formData: any, formType: string): Promise<void> => {
    setIsSubmitting(true);
    try {
      switch (formType) {
        case "general":
          const generalResult = await updateGeneralProfile(formData);
          if (!generalResult.success) {
            throw new Error('Failed to update general profile');
          }
          setGeneralInfo(formData);
          toast({
            title: "Success",
            description: "Your general profile has been updated",
          });
          break;

        case "coaching":
          const coachResult = await updateCoachProfile(formData);
          if (!coachResult.success) {
            throw new Error('Failed to update coach profile');
          }
          setCoachingInfo(formData);
          toast({
            title: "Success",
            description: "Your coaching profile has been updated",
          });
          break;


        case "listings":
          setListings(formData)
          break
        case "marketing":
          setMarketing(formData)
          break
        case "goals":
          setGoals(formData)
          break
      }
    } catch (error) {
      console.error(`[PROFILE_UPDATE_ERROR] ${formType}:`, error);
      toast({
        title: "Error",
        description: `Failed to update ${formType} profile. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Loading profile...</h1>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Real Estate Coach Profile Settings</h1>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="coaching">Coach Profile</TabsTrigger>
          <TabsTrigger value="listings">Property Listings</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
        </TabsList>


        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
            </CardHeader>
            <CardContent>
              <GeneralForm 
                onSubmit={(data) => handleSubmit(data, "general")} 
                isSubmitting={isSubmitting}
                initialData={generalInfo}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coaching">
          <Card>
            <CardHeader>
              <CardTitle>Coach Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <CoachProfileForm onSubmit={(data) => handleSubmit(data, "coaching")} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="listings">
          <Card>
            <CardHeader>
              <CardTitle>Property Listings</CardTitle>
            </CardHeader>
            <CardContent>
              <ListingsForm onSubmit={(data) => handleSubmit(data, "listings")} />

            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketing">
          <Card>
            <CardHeader>
              <CardTitle>Marketing Information</CardTitle>
            </CardHeader>
            <CardContent>
              <MarketingInformation onSubmit={(data) => handleSubmit(data, "marketing")} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals">
          <Card>
            <CardHeader>
              <CardTitle>Career Goals</CardTitle>
            </CardHeader>
            <CardContent>
              <GoalsForm onSubmit={(data) => handleSubmit(data, "goals")} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

