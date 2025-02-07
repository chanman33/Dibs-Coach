"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import GeneralForm from "../../../../components/profile/GeneralForm"
import SpecializationPreferences from "../../../../components/profile/SpecializationPreferences"
import ListingsForm from "../../../../components/profile/ListingsForm"
import MarketingInformation from "../../../../components/profile/MarketingInfo"
import GoalsForm from "../../../../components/profile/GoalsForm"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function AgentProfilePage() {
  const router = useRouter()
  const [generalInfo, setGeneralInfo] = useState({})
  const [specializations, setSpecializations] = useState({})
  const [listings, setListings] = useState({})
  const [marketing, setMarketing] = useState({})
  const [goals, setGoals] = useState({})

  const handleSubmit = (formData: any, formType: string) => {
    switch (formType) {
      case "general":
        setGeneralInfo(formData)
        break
      case "specializations":
        setSpecializations(formData)
        break
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
    console.log(`${formType} form submitted:`, formData)
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Real Estate Agent Profile Settings</h1>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="specializations">Specializations & Achievements</TabsTrigger>
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
              <GeneralForm onSubmit={(data) => handleSubmit(data, "general")} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="specializations">
          <Card>
            <CardHeader>
              <CardTitle>Specializations, Expertise & Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              <SpecializationPreferences onSubmit={(data) => handleSubmit(data, "specializations")} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="listings">
          <Card>
            <CardHeader>
              <CardTitle>Property Listings History</CardTitle>
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
              <div className="mt-6 p-4 border rounded-lg bg-muted/50">
                <h3 className="text-lg font-semibold mb-2">Interested in Becoming a Coach?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Share your real estate expertise and help others succeed in their journey. Apply to become a coach today.
                </p>
                <Button
                  onClick={() => router.push('/apply-coach')}
                  variant="default"
                  className="w-full sm:w-auto"
                >
                  Apply to Become a Coach
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

