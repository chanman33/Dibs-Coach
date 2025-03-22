"use client"

import { useEffect, useState } from "react"
import { useOrganization } from "@/utils/auth/OrganizationContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { ContainerLoading } from "@/components/loading"
import { Building2, Award, BookOpen, Clock, FileText, Video, ArrowRight, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
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

interface Resource {
  id: string
  title: string
  type: string
  description: string
  duration: string
  link: string
}

interface Credits {
  available: number
  total: number
  nextAllocation: string
  expires: string
}

interface OverviewData {
  benefits: Benefit[]
  resources: Resource[]
  credits: Credits
}

export function OrganizationPortal() {
  const { organizationName, organizationRole, isLoading } = useOrganization()
  const router = useRouter()
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [overviewData, setOverviewData] = useState<OverviewData>({
    benefits: [],
    resources: [],
    credits: {
      available: 0,
      total: 0,
      nextAllocation: "",
      expires: ""
    }
  })

  useEffect(() => {
    // Redirect if not in an organization
    if (!isLoading && !organizationName) {
      router.push('/dashboard')
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
              title: 'Coaching Budget',
              description: 'Monthly coaching budget to use with any approved coach',
              icon: Award,
              value: '$100-$250/month'
            },
            {
              id: 2,
              title: 'Premium Content Library',
              description: 'Access to organization-exclusive content',
              icon: BookOpen,
              value: 'Full Access'
            },
            {
              id: 3,
              title: 'Professional Development',
              description: 'Specialized training and certification opportunities',
              icon: Users,
              value: 'Quarterly'
            }
          ],
          resources: [
            {
              id: "res-001",
              title: "Team Productivity Strategies",
              type: "article",
              description: "Learn effective strategies for boosting team productivity.",
              duration: "10 min read",
              link: "/dashboard/resource-library/article/team-productivity"
            },
            {
              id: "res-002",
              title: "Leadership Development Series",
              type: "course",
              description: "A comprehensive course on developing leadership skills.",
              duration: "5 modules",
              link: "/dashboard/resource-library/course/leadership-development"
            }
          ],
          credits: {
            available: 150,
            total: 200,
            nextAllocation: "June 1, 2024",
            expires: "June 30, 2024"
          }
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
          <TabsTrigger value="credits">Coaching Budget</TabsTrigger>
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
                      Value: <span className="text-blue-600 dark:text-blue-400">{benefit.value}</span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
        
        {/* Credits Tab */}
        <TabsContent value="credits">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Available Budget</CardTitle>
                <CardDescription>Budget you can use for coaching</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${overviewData.credits.available}</div>
                <Progress 
                  className="mt-2" 
                  value={(overviewData.credits.available / overviewData.credits.total) * 100} 
                />
                <p className="text-xs text-muted-foreground mt-2">
                  ${overviewData.credits.available} of ${overviewData.credits.total} available
                </p>
              </CardContent>
              <CardFooter>
                <p className="text-xs text-muted-foreground">
                  Expires on {overviewData.credits.expires}
                </p>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Next Allocation</CardTitle>
                <CardDescription>When you'll receive more budget</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-muted-foreground" />
                <div>
                  <div className="font-medium">{overviewData.credits.nextAllocation}</div>
                  <p className="text-xs text-muted-foreground">
                    You will receive $200
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/dashboard/browse-coaches">
                    Browse Coaches <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        {/* Resources Tab */}
        <TabsContent value="resources">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {overviewData.resources.map((resource) => {
              const TypeIcon = resource.type === "article" ? FileText : Video
              
              return (
                <Link href={resource.link} key={resource.id}>
                  <Card className="h-full hover:border-blue-200 transition-all cursor-pointer">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{resource.title}</CardTitle>
                        <div className="flex items-center">
                          <TypeIcon className="h-4 w-4 text-muted-foreground mr-1" />
                          <Badge variant="outline" className="text-xs">
                            {resource.type}
                          </Badge>
                        </div>
                      </div>
                      <CardDescription>{resource.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground">{resource.duration}</div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>

          <div className="mt-8 text-center">
            <Button variant="outline" asChild>
              <Link href="/dashboard/organization/resources">
                Browse Full Library <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 