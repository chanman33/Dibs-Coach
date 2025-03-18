"use client"

import { useEffect, useState } from "react"
import { useOrganization } from "@/utils/auth/OrganizationContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ContainerLoading } from "@/components/loading"
import { Building2, Award, Users, BookOpen, Briefcase, CreditCard } from "lucide-react"
import { useRouter } from "next/navigation"

export default function CoachOrganizationBenefitsPage() {
  const { organizationName, organizationRole, isLoading } = useOrganization()
  const router = useRouter()
  const [benefits, setBenefits] = useState<any[]>([])
  const [isLoadingBenefits, setIsLoadingBenefits] = useState(true)

  useEffect(() => {
    // Redirect if not in an organization
    if (!isLoading && !organizationName) {
      router.push('/dashboard/coach')
      return
    }

    // Mock fetching benefits - would be replaced with real API call
    if (organizationName) {
      // Simulate API call
      setTimeout(() => {
        setBenefits([
          {
            id: 1,
            title: 'Featured Coach Status',
            description: 'Priority listing in the organization\'s coach directory',
            icon: Award,
            value: 'Enhanced visibility'
          },
          {
            id: 2,
            title: 'Premium Content Access',
            description: 'Access to organization-exclusive content and training materials',
            icon: BookOpen,
            value: 'Full Access'
          },
          {
            id: 3,
            title: 'Bulk Session Bookings',
            description: 'Organization members can book you using their credits',
            icon: CreditCard,
            value: 'Automatic'
          },
          {
            id: 4,
            title: 'Organization Events',
            description: 'Invitations to lead or participate in organization events',
            icon: Users,
            value: 'Priority Access'
          },
          {
            id: 5,
            title: 'Professional Development',
            description: 'Specialized training and certification opportunities',
            icon: Briefcase,
            value: 'Quarterly'
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
                  Benefit: <span className="text-blue-600 dark:text-blue-400">{benefit.value}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
      
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>About Your Partnership</CardTitle>
            <CardDescription>
              As a coach affiliated with {organizationName}, you receive exclusive benefits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your partnership with {organizationName} provides you with unique benefits that help you expand your 
              coaching practice and reach more clients. Organization members can book sessions with you using their 
              coaching credits, providing you with a steady stream of pre-approved clients. You also gain access to 
              exclusive resources and professional development opportunities.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 