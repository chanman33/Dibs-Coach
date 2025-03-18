"use client"

import { useEffect, useState } from "react"
import { useOrganization } from "@/utils/auth/OrganizationContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { ContainerLoading } from "@/components/loading"
import { Building2, Award, Users, BookOpen, CreditCard, Clock, FileText, Video, ArrowRight, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface Benefit {
  id: number
  title: string
  description: string
  icon: any
  value: string
}

interface Credits {
  totalSessions: number
  upcomingSessions: number
  totalCreditsEarned: number
  nextSession: string
}

interface Resource {
  id: string
  title: string
  type: string
  description: string
  duration: string
  link: string
  downloadable?: boolean
}

interface OverviewData {
  benefits: Benefit[]
  credits: Credits
  resources: Resource[]
}

export default function CoachOrganizationOverviewPage() {
  const { organizationName, organizationRole, isLoading } = useOrganization()
  const router = useRouter()
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [overviewData, setOverviewData] = useState<OverviewData>({
    benefits: [],
    credits: {
      totalSessions: 0,
      upcomingSessions: 0,
      totalCreditsEarned: 0,
      nextSession: ""
    },
    resources: []
  })

  useEffect(() => {
    // Redirect if not in an organization
    if (!isLoading && !organizationName) {
      router.push('/dashboard/coach')
      return
    }

    // Mock fetching data - would be replaced with real API call
    if (organizationName) {
      // Simulate API call
      setTimeout(() => {
        setOverviewData({
          benefits: [
            {
              id: 1,
              title: 'Featured Coach Status',
              description: 'Priority listing in the organization\'s coach directory',
              icon: Award,
              value: 'Enhanced visibility'
            },
            {
              id: 2,
              title: 'Pre-Paid Sessions',
              description: 'Organization members can book you using their allocated budget',
              icon: CreditCard,
              value: 'Automatic payment'
            },
            {
              id: 3,
              title: 'Professional Development',
              description: 'Specialized training and certification opportunities',
              icon: Users,
              value: 'Quarterly'
            }
          ],
          credits: {
            totalSessions: 5,
            upcomingSessions: 1,
            totalCreditsEarned: 700,
            nextSession: "May 15, 2024 • 10:00 AM"
          },
          resources: [
            {
              id: "res-001",
              title: "Coach Onboarding Materials",
              type: "document",
              description: "Complete onboarding guide for coaches partnering with our organization.",
              duration: "15 min read",
              link: "/dashboard/resource-library/document/coach-onboarding",
              downloadable: true
            },
            {
              id: "res-002",
              title: "Client Engagement Best Practices",
              type: "training",
              description: "Specialized training on how to engage with our organization's members effectively.",
              duration: "3 modules",
              link: "/dashboard/resource-library/training/client-engagement"
            }
          ]
        })
        
        setIsLoadingData(false)
      }, 1000)
    }
  }, [organizationName, isLoading, router])

  if (isLoading) {
    return (
      <ContainerLoading
        message="Loading organization..."
        spinnerSize="md"
        minHeight="h-full"
      />
    )
  }

  if (isLoadingData) {
    return (
      <ContainerLoading
        message="Loading organization data..."
        spinnerSize="md"
        minHeight="h-full"
      />
    )
  }

  return (
    <div className="container py-10">
      <div className="flex items-center mb-8">
        <Building2 className="mr-2 h-6 w-6" />
        <h1 className="text-2xl font-bold">{organizationName}</h1>
      </div>

      {/* Welcome Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Welcome to Your Organization Portal</CardTitle>
          <CardDescription>
            As a member of {organizationName}, you have access to exclusive benefits and resources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Your organization provides these benefits to help you grow professionally and achieve your career goals. 
            Use the tabs below to explore available benefits, coaching budget, and resources.
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="benefits" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="benefits">Benefits</TabsTrigger>
          <TabsTrigger value="sessions">Paid Sessions</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>
        
        {/* Benefits Tab */}
        <TabsContent value="benefits">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {overviewData.benefits.map((benefit) => {
              const Icon = benefit.icon
              return (
                <Card key={benefit.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{benefit.title}</CardTitle>
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <CardDescription>{benefit.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm font-medium">
                      Benefit: <span className="text-blue-600 dark:text-blue-400">{benefit.value}</span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
        
        {/* Sessions Tab */}
        <TabsContent value="sessions">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Sessions</CardTitle>
                <CardDescription>All sessions booked through organization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{overviewData.credits.totalSessions}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  Total sessions from {organizationName} members
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Upcoming Sessions</CardTitle>
                <CardDescription>Sessions scheduled but not yet completed</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
                <div>
                  <div className="font-medium">{overviewData.credits.upcomingSessions} upcoming</div>
                  <p className="text-xs text-muted-foreground">
                    Sessions to be delivered
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Revenue</CardTitle>
                <CardDescription>Revenue from organization-paid sessions</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-muted-foreground" />
                <div>
                  <div className="font-medium">${overviewData.credits.totalCreditsEarned}</div>
                  <p className="text-xs text-muted-foreground">
                    From pre-paid sessions
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {overviewData.credits.upcomingSessions > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Next Scheduled Session</CardTitle>
                <CardDescription>Your upcoming session with a member of {organizationName}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-muted-foreground" />
                <div className="font-medium">{overviewData.credits.nextSession}</div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/dashboard/coach/calendar">
                    View Calendar <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
        
        {/* Resources Tab */}
        <TabsContent value="resources">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {overviewData.resources.map((resource) => {
              const TypeIcon = 
                resource.type === "document" ? FileText : 
                resource.type === "video" ? Video : 
                BookOpen
              
              return (
                <Link href={resource.link} key={resource.id}>
                  <Card className="h-full hover:border-blue-200 transition-all cursor-pointer">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <TypeIcon className="h-4 w-4 text-blue-500" />
                          <Badge variant="outline" className="capitalize">
                            {resource.type}
                          </Badge>
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          {resource.duration}
                        </div>
                      </div>
                      <CardTitle className="text-lg mt-2">{resource.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="line-clamp-2">
                        {resource.description}
                      </CardDescription>
                    </CardContent>
                    {resource.downloadable && (
                      <CardFooter className="pt-0">
                        <Button variant="ghost" size="sm" className="text-xs flex items-center gap-1">
                          Download
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                </Link>
              )
            })}
          </div>
          <div className="mt-4">
            <Button variant="outline" asChild className="w-full">
              <Link href="/dashboard/coach/library">
                Browse Full Library <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 