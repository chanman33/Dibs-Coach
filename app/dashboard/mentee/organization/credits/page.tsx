"use client"

import { useEffect, useState } from "react"
import { useOrganization } from "@/utils/auth/OrganizationContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { ContainerLoading } from "@/components/loading"
import { CreditCard, Clock, BarChart4, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

interface CreditHistory {
  id: string
  date: string
  description: string
  amount: number
  balance: number
}

export default function OrganizationCreditsPage() {
  const { organizationName, organizationRole, isLoading } = useOrganization()
  const router = useRouter()
  const [credits, setCredits] = useState<{ available: number, total: number, expires: string }>({ 
    available: 0, 
    total: 0, 
    expires: "" 
  })
  const [history, setHistory] = useState<CreditHistory[]>([])
  const [isLoadingCredits, setIsLoadingCredits] = useState(true)

  useEffect(() => {
    // Redirect if not in an organization
    if (!isLoading && !organizationName) {
      router.push('/dashboard/mentee')
      return
    }

    // Mock fetching credits - would be replaced with real API call
    if (organizationName) {
      // Simulate API call
      setTimeout(() => {
        setCredits({
          available: 3,
          total: 4,
          expires: "June 30, 2024"
        })
        
        setHistory([
          {
            id: "crd-001",
            date: "May 1, 2024",
            description: "Monthly allocation",
            amount: 2,
            balance: 3
          },
          {
            id: "crd-002",
            date: "April 15, 2024",
            description: "Used for coaching session with Jane Smith",
            amount: -1,
            balance: 1
          },
          {
            id: "crd-003",
            date: "April 1, 2024",
            description: "Monthly allocation",
            amount: 2,
            balance: 2
          }
        ])
        
        setIsLoadingCredits(false)
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

  if (isLoadingCredits) {
    return (
      <ContainerLoading
        message="Loading credits..."
        spinnerSize="md"
        minHeight="h-full"
      />
    )
  }

  return (
    <div className="container py-10">
      <div className="flex items-center mb-8">
        <CreditCard className="mr-2 h-6 w-6" />
        <h1 className="text-2xl font-bold">Coaching Credits</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Available Credits</CardTitle>
            <CardDescription>Credits you can use for coaching</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{credits.available}</div>
            <Progress className="mt-2" value={(credits.available / credits.total) * 100} />
            <p className="text-xs text-muted-foreground mt-2">
              {credits.available} of {credits.total} credits available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Next Allocation</CardTitle>
            <CardDescription>When you'll receive more credits</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center">
            <Clock className="h-5 w-5 mr-2 text-muted-foreground" />
            <div>
              <div className="font-medium">June 1, 2024</div>
              <p className="text-xs text-muted-foreground">
                You will receive 2 credits
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Credits Usage</CardTitle>
            <CardDescription>How you've used your credits</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center">
            <BarChart4 className="h-5 w-5 mr-2 text-muted-foreground" />
            <div>
              <div className="font-medium">75% Utilization</div>
              <p className="text-xs text-muted-foreground">
                Year-to-date
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Credit History</CardTitle>
          <CardDescription>
            History of credits received and used
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {history.map((item) => (
              <div key={item.id}>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{item.description}</div>
                    <div className="text-sm text-muted-foreground">{item.date}</div>
                  </div>
                  <div className={`font-medium ${item.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.amount > 0 ? `+${item.amount}` : item.amount}
                  </div>
                </div>
                <Separator className="my-2" />
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            Credits expire on {credits.expires} if not used.
          </p>
        </CardFooter>
      </Card>

      <div className="mt-8">
        <Link href="/dashboard/mentee/browse-coaches">
          <Button className="w-full">
            Browse Coaches <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  )
} 