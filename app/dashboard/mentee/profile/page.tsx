"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import GeneralForm from "../../../../components/profile/GeneralForm"
import GoalsForm from "../../../../components/profile/GoalsForm"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { getCoachApplication } from "@/utils/actions/coach-application"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import type { ApplicationData } from "@/utils/types/coach-application"
import type { GoalFormValues } from "@/utils/types/goals"

export default function AgentProfilePage() {
  const router = useRouter()
  const [generalInfo, setGeneralInfo] = useState({})
  const [goals, setGoals] = useState({})
  const [application, setApplication] = useState<ApplicationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const { data, error } = await getCoachApplication({})
        if (error) {
          console.error('[FETCH_APPLICATION_ERROR]', error)
          return
        }
        if (data) {
          setApplication(data as ApplicationData)
        }
      } catch (error) {
        console.error('[FETCH_APPLICATION_ERROR]', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchApplication()
  }, [])

  const handleGeneralSubmit = (formData: any) => {
    setGeneralInfo(formData)
    console.log('general form submitted:', formData)
  }

  const handleGoalsSubmit = async (formData: GoalFormValues): Promise<void> => {
    setGoals(formData)
    console.log('goals form submitted:', formData)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-500'
      case 'APPROVED':
        return 'bg-green-500'
      case 'REJECTED':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Your application is under review. We will notify you once a decision has been made.'
      case 'APPROVED':
        return 'Congratulations! Your application has been approved. You can now access the coaching dashboard.'
      case 'REJECTED':
        return 'Unfortunately, your application was not approved at this time. You may apply again in the future.'
      default:
        return ''
    }
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Real Estate Agent Profile Settings</h1>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
            </CardHeader>
            <CardContent>
              <GeneralForm onSubmit={handleGeneralSubmit} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals">
          <Card>
            <CardHeader>
              <CardTitle>Career Goals</CardTitle>
            </CardHeader>
            <CardContent>
              <GoalsForm open={true} onClose={() => {}} />
              <div className="mt-6 p-4 border rounded-lg bg-muted/50">
                <h3 className="text-lg font-semibold mb-2">Interested in Becoming a Coach?</h3>
                {isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : application ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Application Status:</span>
                      <Badge className={getStatusColor(application.status)}>
                        {application.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {getStatusMessage(application.status)}
                    </p>
                    {application.status === 'REJECTED' && (
                      <Button
                        onClick={() => router.push('/apply-coach')}
                        variant="default"
                        className="w-full sm:w-auto mt-2"
                      >
                        Apply Again
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

