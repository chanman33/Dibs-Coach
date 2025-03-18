"use client"

import { useEffect, useState } from "react"
import { useOrganization } from "@/utils/auth/OrganizationContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { ContainerLoading } from "@/components/loading"
import { CreditCard, CalendarDays, BarChart4, ArrowRight, Clock, Building2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

interface CreditSession {
  id: string
  date: string
  clientName: string
  organizationName: string
  status: "upcoming" | "completed" | "cancelled"
  creditAmount: number
}

export default function CoachOrganizationCreditsPage() {
  const { organizationName, organizationRole, isLoading } = useOrganization()
  const router = useRouter()
  const [sessions, setSessions] = useState<CreditSession[]>([])
  const [stats, setStats] = useState<{ 
    totalSessions: number,
    upcomingSessions: number,
    totalCreditsEarned: number
  }>({ 
    totalSessions: 0, 
    upcomingSessions: 0, 
    totalCreditsEarned: 0
  })
  const [isLoadingData, setIsLoadingData] = useState(true)

  useEffect(() => {
    // Redirect if not in an organization
    if (!isLoading && !organizationName) {
      router.push('/dashboard/coach')
      return
    }

    // Mock fetching credits - would be replaced with real API call
    if (organizationName) {
      // Simulate API call
      setTimeout(() => {
        setSessions([
          {
            id: "sess-001",
            date: "May 15, 2024 • 10:00 AM",
            clientName: "John Smith",
            organizationName: organizationName || "Organization",
            status: "upcoming",
            creditAmount: 1
          },
          {
            id: "sess-002",
            date: "May 10, 2024 • 2:30 PM",
            clientName: "Emma Johnson",
            organizationName: organizationName || "Organization",
            status: "completed",
            creditAmount: 2
          },
          {
            id: "sess-003",
            date: "May 5, 2024 • 9:00 AM",
            clientName: "Michael Brown",
            organizationName: organizationName || "Organization",
            status: "completed",
            creditAmount: 1
          },
          {
            id: "sess-004",
            date: "April 28, 2024 • 11:30 AM",
            clientName: "Sarah Williams",
            organizationName: organizationName || "Organization",
            status: "completed",
            creditAmount: 1
          },
          {
            id: "sess-005",
            date: "April 20, 2024 • 3:00 PM",
            clientName: "David Miller",
            organizationName: organizationName || "Organization",
            status: "completed",
            creditAmount: 2
          }
        ])
        
        setStats({
          totalSessions: 5,
          upcomingSessions: 1,
          totalCreditsEarned: 7
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
        message="Loading credit data..."
        spinnerSize="md"
        minHeight="h-full"
      />
    )
  }

  const upcomingSessions = sessions.filter(s => s.status === "upcoming")
  const completedSessions = sessions.filter(s => s.status === "completed")

  return (
    <div className="container py-10">
      <div className="flex items-center mb-8">
        <CreditCard className="mr-2 h-6 w-6" />
        <h1 className="text-2xl font-bold">Organization Credit Sessions</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Sessions</CardTitle>
            <CardDescription>All sessions booked with organization credits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalSessions}</div>
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
            <CalendarDays className="h-5 w-5 mr-2 text-muted-foreground" />
            <div>
              <div className="font-medium">{stats.upcomingSessions} upcoming</div>
              <p className="text-xs text-muted-foreground">
                Sessions to be delivered
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Credits Value</CardTitle>
            <CardDescription>Total value of organization credits used</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center">
            <BarChart4 className="h-5 w-5 mr-2 text-muted-foreground" />
            <div>
              <div className="font-medium">{stats.totalCreditsEarned} credits</div>
              <p className="text-xs text-muted-foreground">
                Used for your sessions
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Upcoming Organization Sessions</CardTitle>
          <CardDescription>
            Sessions booked with organization credits that are scheduled in the future
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingSessions.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">No upcoming organization credit sessions</p>
          ) : (
            <div className="space-y-4">
              {upcomingSessions.map((session) => (
                <div key={session.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">{session.clientName}</div>
                      <div className="text-sm text-muted-foreground flex items-center mt-1">
                        <Clock className="h-3 w-3 mr-1" />
                        {session.date}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center mt-1">
                        <Building2 className="h-3 w-3 mr-1" />
                        {session.organizationName}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                        {session.creditAmount} {session.creditAmount === 1 ? 'credit' : 'credits'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Link href="/dashboard/coach/calendar" className="w-full">
            <Button variant="outline" className="w-full">
              View All Sessions
            </Button>
          </Link>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Completed Organization Sessions</CardTitle>
          <CardDescription>
            Sessions booked with organization credits that have been completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          {completedSessions.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">No completed organization credit sessions</p>
          ) : (
            <div className="space-y-4">
              {completedSessions.map((session) => (
                <div key={session.id}>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{session.clientName}</div>
                      <div className="text-sm text-muted-foreground flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {session.date}
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                      {session.creditAmount} {session.creditAmount === 1 ? 'credit' : 'credits'}
                    </Badge>
                  </div>
                  <Separator className="my-2" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 