"use client"

import { useEffect, useState } from "react"
import { useOrganization } from "@/utils/auth/OrganizationContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ContainerLoading } from "@/components/loading"
import { Building2, Award, Users, BookOpen } from "lucide-react"
import { useRouter } from "next/navigation"

export default function OrganizationBenefitsPage() {
  const { organizationName, organizationRole, isLoading } = useOrganization()
  const router = useRouter()
  const [benefits, setBenefits] = useState<any[]>([])
  const [isLoadingBenefits, setIsLoadingBenefits] = useState(true)

  useEffect(() => {
    // Redirect if not in an organization
    if (!isLoading && !organizationName) {
      router.push('/dashboard/mentee')
      return
    }

    // Mock fetching benefits - would be replaced with real API call
    if (organizationName) {
      // Simulate API call
      setTimeout(() => {
        setBenefits([
          {
            id: 1,
            title: 'Coaching Credits',
            description: 'Monthly coaching credits to use with any approved coach',
            icon: Award,
            value: '2 credits/month'
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
            title: 'Team Events',
            description: 'Access to exclusive team events and workshops',
            icon: Users,
            value: 'Monthly'
          }
        ])
        setIsLoadingBenefits(false)
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

  if (isLoadingBenefits) {
    return (
      <ContainerLoading
        message="Loading benefits..."
        spinnerSize="md"
        minHeight="h-full"
      />
    )
  }

  return (
    <div className="container py-10">
      <div className="flex items-center mb-8">
        <Building2 className="mr-2 h-6 w-6" />
        <h1 className="text-2xl font-bold">{organizationName} Benefits</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {benefits.map((benefit) => {
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
      
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>About Organization Membership</CardTitle>
            <CardDescription>
              As a member of {organizationName}, you have access to exclusive benefits and resources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your organization provides these benefits to help you grow professionally and achieve your career goals. 
              If you have any questions about your benefits or need assistance, please contact your organization administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 